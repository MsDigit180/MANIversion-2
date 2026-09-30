import { Student, Tutor, StudentTutorAssignment } from '../types';

/**
 * Normalise le nom d'une matière pour les comparaisons insensibles à la casse et aux espaces
 */
export function normalizeSubjectName(subj: string): string {
  return (subj || '').trim().toLowerCase();
}

/**
 * Détecte si un élève relève du cycle Primaire
 */
export function isPrimaryStudent(student: Student): boolean {
  if (!student) return false;
  const streamLower = (student.stream || '').toLowerCase();
  const levelLower = (student.level || '').toLowerCase();
  return (
    streamLower === 'primaire' ||
    levelLower.includes('primaire') ||
    levelLower.startsWith('ci') ||
    levelLower.startsWith('cp') ||
    levelLower.startsWith('ce') ||
    levelLower.startsWith('cm') ||
    levelLower.includes('cfepd')
  );
}

/**
 * Récupère l'encadreur référent d'un élève du primaire
 */
export function getPrimaryTutorForStudent(
  student: Student,
  tutors: Tutor[],
  excludeTutorId?: string
): Tutor | null {
  if (!isPrimaryStudent(student)) return null;

  // 1. Recherche par tutorId dans l'élève
  if (student.tutorId && student.tutorId !== excludeTutorId) {
    const found = tutors.find((t) => t.id === student.tutorId);
    if (found) return found;
  }

  // 2. Recherche par tutorAssignments
  if (student.tutorAssignments && student.tutorAssignments.length > 0) {
    const assign = student.tutorAssignments.find((a) => a.tutorId !== excludeTutorId);
    if (assign) {
      const found = tutors.find((t) => t.id === assign.tutorId);
      if (found) return found;
    }
  }

  // 3. Recherche dans la liste des encadreurs dont l'élève fait partie des assignedStudentIds
  const found = tutors.find(
    (t) => t.id !== excludeTutorId && t.assignedStudentIds?.includes(student.id)
  );
  return found || null;
}

/**
 * Mappe toutes les matières déjà couvertes pour un élève avec l'encadreur responsable
 */
export function getAssignedSubjectsMapForStudent(
  student: Student,
  tutors: Tutor[],
  excludeTutorId?: string
): Map<string, { tutor: Tutor; subjectName: string }> {
  const map = new Map<string, { tutor: Tutor; subjectName: string }>();
  if (!student) return map;

  // Cas 1 : Élève du primaire -> tout le socle est couvert par l'encadreur unique
  if (isPrimaryStudent(student)) {
    const primaryTutor = getPrimaryTutorForStudent(student, tutors, excludeTutorId);
    if (primaryTutor) {
      student.subjects.forEach((subj) => {
        map.set(normalizeSubjectName(subj), {
          tutor: primaryTutor,
          subjectName: subj,
        });
      });
    }
    return map;
  }

  // Cas 2 : Collège et Lycée -> affectation par matière
  tutors
    .filter((t) => t.id !== excludeTutorId)
    .forEach((tutor) => {
      // 1. Vérification dans assignedStudentSubjects
      const subjectsTaughtToStudent = tutor.assignedStudentSubjects?.[student.id];
      if (Array.isArray(subjectsTaughtToStudent)) {
        subjectsTaughtToStudent.forEach((subj) => {
          map.set(normalizeSubjectName(subj), {
            tutor,
            subjectName: subj,
          });
        });
      } else if (tutor.assignedStudentIds?.includes(student.id)) {
        // Fallback si l'élève est assigné sans mapping détaillé : intersection des matières
        tutor.subjects.forEach((subj) => {
          if (
            student.subjects.some(
              (stuSubj) => normalizeSubjectName(stuSubj) === normalizeSubjectName(subj)
            )
          ) {
            map.set(normalizeSubjectName(subj), {
              tutor,
              subjectName: subj,
            });
          }
        });
      }
    });

  // 2. Vérification croisée dans student.tutorAssignments
  if (Array.isArray(student.tutorAssignments)) {
    student.tutorAssignments
      .filter((a) => a.tutorId !== excludeTutorId)
      .forEach((assignment) => {
        const tutor = tutors.find((t) => t.id === assignment.tutorId);
        if (tutor && Array.isArray(assignment.subjects)) {
          assignment.subjects.forEach((subj) => {
            map.set(normalizeSubjectName(subj), {
              tutor,
              subjectName: subj,
            });
          });
        }
      });
  }

  return map;
}

export interface AssignmentValidationResult {
  valid: boolean;
  error?: string;
  conflictingSubject?: string;
  conflictingTutor?: Tutor;
}

/**
 * Valide les règles strictes d'affectation :
 * 1. Primaire : 1 SEUL ET UNIQUE encadreur référent
 * 2. Collège & Lycée : Deux encadreurs ne peuvent PAS encadrer le même élève pour la MÊME MATIÈRE
 */
export function validateTutorAssignment(params: {
  student: Student;
  targetTutorId: string;
  targetSubjects?: string[];
  allTutors: Tutor[];
  currentEditingTutorId?: string;
}): AssignmentValidationResult {
  const { student, targetTutorId, targetSubjects, allTutors, currentEditingTutorId } = params;

  if (!student) {
    return { valid: false, error: 'Élève invalide ou non spécifié.' };
  }

  const effectiveExcludeId = currentEditingTutorId || targetTutorId;

  // 1. RÈGLE STRICTE - NIVEAU PRIMAIRE
  if (isPrimaryStudent(student)) {
    const existingTutor = getPrimaryTutorForStudent(student, allTutors, effectiveExcludeId);
    if (existingTutor) {
      return {
        valid: false,
        error:
          "Erreur : Un élève du primaire ne peut pas avoir plus d'un encadreur. Veuillez d'abord retirer l'encadreur actuel.",
        conflictingTutor: existingTutor,
      };
    }
    return { valid: true };
  }

  // 2. RÈGLE STRICTE - NIVEAU COLLÈGE & LYCÉE (Par Matière)
  if (targetSubjects && targetSubjects.length > 0) {
    const coveredMap = getAssignedSubjectsMapForStudent(student, allTutors, effectiveExcludeId);

    for (const subj of targetSubjects) {
      const normalized = normalizeSubjectName(subj);
      const conflict = coveredMap.get(normalized);
      if (conflict && conflict.tutor.id !== effectiveExcludeId) {
        return {
          valid: false,
          error: `Erreur : Cet élève a déjà un encadreur attribué pour la matière [${conflict.subjectName || subj}].`,
          conflictingSubject: conflict.subjectName || subj,
          conflictingTutor: conflict.tutor,
        };
      }
    }
  }

  return { valid: true };
}

export interface SubjectPedagogicalCoverage {
  subject: string;
  isAssigned: boolean;
  tutor: Tutor | null;
  tutorName?: string;
  tutorAvatar?: string;
  tutorPhone?: string;
  tutorMatricule?: string;
}

/**
 * Calcule pour un élève l'état complet de couverture matière par matière
 */
export function getStudentPedagogicalCoverage(
  student: Student,
  tutors: Tutor[]
): SubjectPedagogicalCoverage[] {
  if (!student) return [];

  const isPrimary = isPrimaryStudent(student);
  if (isPrimary) {
    const primaryTutor = getPrimaryTutorForStudent(student, tutors);
    return student.subjects.map((subj) => ({
      subject: subj,
      isAssigned: !!primaryTutor,
      tutor: primaryTutor,
      tutorName: primaryTutor?.fullName,
      tutorAvatar: primaryTutor?.avatar,
      tutorPhone: primaryTutor?.phone,
      tutorMatricule: primaryTutor?.matricule,
    }));
  }

  const coveredMap = getAssignedSubjectsMapForStudent(student, tutors);

  return student.subjects.map((subj) => {
    const entry = coveredMap.get(normalizeSubjectName(subj));
    return {
      subject: subj,
      isAssigned: !!entry,
      tutor: entry?.tutor || null,
      tutorName: entry?.tutor.fullName,
      tutorAvatar: entry?.tutor.avatar,
      tutorPhone: entry?.tutor.phone,
      tutorMatricule: entry?.tutor.matricule,
    };
  });
}
