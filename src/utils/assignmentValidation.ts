import { Student, Tutor, StudentTutorAssignment } from '../types';

export interface AssignmentValidationResult {
  isValid: boolean;
  errorMessage?: string;
  conflictingTutor?: Tutor;
  conflictingSubject?: string;
}

export interface StudentSubjectCoverage {
  subject: string;
  isAssigned: boolean;
  tutorId?: string;
  tutorName?: string;
  tutorAvatar?: string;
  tutorPhone?: string;
}

/**
 * RÈGLE 1 - NIVEAU PRIMAIRE :
 * Un élève inscrit au niveau "Primaire" ne peut avoir qu'UN SEUL ET UNIQUE encadreur référent.
 * Si l'élève possède DÉJÀ un encadreur attribué (différent de candidateTutorId),
 * bloque avec l'erreur :
 * "Erreur : Un élève du primaire ne peut pas avoir plus d'un encadreur. Veuillez d'abord retirer l'encadreur actuel."
 */
export function validatePrimaryAssignment(
  student: Student,
  candidateTutorId: string,
  tutors: Tutor[]
): AssignmentValidationResult {
  if (student.stream !== 'Primaire') {
    return { isValid: true };
  }

  // Find if any other tutor is currently assigned to this student
  const existingTutor = tutors.find(
    (t) => t.id !== candidateTutorId && t.assignedStudentIds?.includes(student.id)
  );

  if (existingTutor) {
    return {
      isValid: false,
      errorMessage: `Erreur : Un élève du primaire ne peut pas avoir plus d'un encadreur. Veuillez d'abord retirer l'encadreur actuel (${existingTutor.fullName}).`,
      conflictingTutor: existingTutor,
    };
  }

  return { isValid: true };
}

/**
 * RÈGLE 2 - NIVEAU COLLÈGE & LYCÉE (Par Matière) :
 * Deux encadreurs différents ne peuvent PAS encadrer le même élève pour la MÊME MATIÈRE.
 * Un élève de collège/lycée peut avoir plusieurs encadreurs, mais uniquement pour des matières distinctes.
 * Bloque la validation si la matière choisie est déjà couverte par un encadreur existant avec l'erreur :
 * "Erreur : Cet élève a déjà un encadreur attribué pour la matière [Matière]."
 */
export function validateSubjectAssignment(
  student: Student,
  subject: string,
  candidateTutorId: string,
  tutors: Tutor[]
): AssignmentValidationResult {
  if (!student) return { isValid: true };
  const safeTutors = Array.isArray(tutors) ? tutors : [];

  // If primary school, enforce primary single-tutor rule
  if (student.stream === 'Primaire') {
    return validatePrimaryAssignment(student, candidateTutorId, safeTutors);
  }

  // Normalize subject comparison
  const normalizedTarget = (subject ?? '').trim().toLowerCase();

  // Find if another tutor covers this subject for this student
  for (const t of safeTutors) {
    if (!t || t.id === candidateTutorId) continue;
    if (!t.assignedStudentIds?.includes(student.id)) continue;

    // Check tutor's assignedStudentSubjects map first
    const specificSubjects = t.assignedStudentSubjects?.[student.id];
    if (specificSubjects && specificSubjects.length > 0) {
      const match = specificSubjects.find((s) => (s ?? '').trim().toLowerCase() === normalizedTarget);
      if (match) {
        return {
          isValid: false,
          errorMessage: `Erreur : Cet élève a déjà un encadreur attribué pour la matière ${subject} (${t.fullName || 'Encadreur'}).`,
          conflictingTutor: t,
          conflictingSubject: subject,
        };
      }
    } else {
      // Fallback: Check if student has tutorAssignments or if tutor's global subjects overlap
      const assignmentRecord = student.tutorAssignments?.find((a) => a?.tutorId === t.id);
      if (assignmentRecord?.subjects?.some((s) => (s ?? '').trim().toLowerCase() === normalizedTarget)) {
        return {
          isValid: false,
          errorMessage: `Erreur : Cet élève a déjà un encadreur attribué pour la matière ${subject} (${t.fullName || 'Encadreur'}).`,
          conflictingTutor: t,
          conflictingSubject: subject,
        };
      } else if (!assignmentRecord && t.subjects?.some((s) => (s ?? '').trim().toLowerCase() === normalizedTarget)) {
        return {
          isValid: false,
          errorMessage: `Erreur : Cet élève a déjà un encadreur attribué pour la matière ${subject} (${t.fullName || 'Encadreur'}).`,
          conflictingTutor: t,
          conflictingSubject: subject,
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Returns coverage details for all subjects of a student:
 * which tutor is assigned to which subject, and if any subject is not yet assigned.
 */
export function getStudentSubjectsCoverage(
  student: Student,
  tutors: Tutor[]
): StudentSubjectCoverage[] {
  if (!student) return [];
  const safeTutors = Array.isArray(tutors) ? tutors : [];
  const subjects = Array.isArray(student.subjects) ? student.subjects : [];

  return subjects.map((subject) => {
    const normalized = (subject ?? '').trim().toLowerCase();

    // Check primary school direct tutor
    if (student.stream === 'Primaire') {
      const tutor = safeTutors.find((t) => t && t.assignedStudentIds?.includes(student.id));
      if (tutor) {
        return {
          subject,
          isAssigned: true,
          tutorId: tutor.id,
          tutorName: tutor.fullName,
          tutorAvatar: tutor.avatar,
          tutorPhone: tutor.phone,
        };
      }
    }

    // Check college / lycée tutors
    for (const t of safeTutors) {
      if (!t || !t.assignedStudentIds?.includes(student.id)) continue;

      const specificSubjects = t.assignedStudentSubjects?.[student.id];
      if (specificSubjects && specificSubjects.length > 0) {
        if (specificSubjects.some((s) => (s ?? '').trim().toLowerCase() === normalized)) {
          return {
            subject,
            isAssigned: true,
            tutorId: t.id,
            tutorName: t.fullName,
            tutorAvatar: t.avatar,
            tutorPhone: t.phone,
          };
        }
      } else {
        const assignmentRecord = student.tutorAssignments?.find((a) => a?.tutorId === t.id);
        if (assignmentRecord?.subjects?.some((s) => (s ?? '').trim().toLowerCase() === normalized)) {
          return {
            subject,
            isAssigned: true,
            tutorId: t.id,
            tutorName: t.fullName,
            tutorAvatar: t.avatar,
            tutorPhone: t.phone,
          };
        } else if (t.subjects?.some((s) => (s ?? '').trim().toLowerCase() === normalized)) {
          return {
            subject,
            isAssigned: true,
            tutorId: t.id,
            tutorName: t.fullName,
            tutorAvatar: t.avatar,
            tutorPhone: t.phone,
          };
        }
      }
    }

    return {
      subject,
      isAssigned: false,
    };
  });
}

/**
 * Returns student's subjects with their availability status for a candidate tutor:
 * - isAvailable: false if already assigned to ANOTHER tutor (with assignedTutorName).
 * This is used to dynamically disable assigned subjects in the dropdown selection!
 */
export function getAvailableSubjectsForTutorAndStudent(
  student: Student,
  candidateTutorId: string,
  tutors: Tutor[]
): {
  subject: string;
  isAvailable: boolean;
  assignedTutorName?: string;
  assignedTutorAvatar?: string;
  isCurrentlyAssignedToThisTutor: boolean;
}[] {
  const subjects = student.subjects || [];

  return subjects.map((subj) => {
    const val = validateSubjectAssignment(student, subj, candidateTutorId, tutors);
    const isCurrentlyAssignedToCandidate = !!tutors
      .find((t) => t.id === candidateTutorId)
      ?.assignedStudentSubjects?.[student.id]?.includes(subj);

    return {
      subject: subj,
      isAvailable: val.isValid,
      assignedTutorName: val.conflictingTutor?.fullName,
      assignedTutorAvatar: val.conflictingTutor?.avatar,
      isCurrentlyAssignedToThisTutor: isCurrentlyAssignedToCandidate,
    };
  });
}
