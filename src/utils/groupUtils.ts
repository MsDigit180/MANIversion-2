import { Student, Tutor, TutoringGroup } from '../types';

/**
 * Normalise un identifiant de groupe pour les comparaisons.
 */
export function normalizeGroupId(id?: string): string {
  if (!id) return '';
  return id.trim().toUpperCase();
}

/**
 * Extrait et agrège tous les groupes d'encadrement collectif à partir de la liste des élèves et des encadreurs.
 * Regroupe selon le `groupId` explicite ou la mutualisation collective.
 */
export function extractTutoringGroups(students: Student[], tutors: Tutor[]): TutoringGroup[] {
  const groupsMap = new Map<string, {
    id: string;
    name: string;
    level: string;
    stream: string;
    subjects: Set<string>;
    timeSlot?: string;
    sessionsPerWeek: number;
    tutorIds: Set<string>;
    students: Student[];
  }>();

  for (const s of students) {
    if (!s.groupId || !s.groupId.trim()) continue;

    const gId = s.groupId.trim();
    if (!groupsMap.has(gId)) {
      groupsMap.set(gId, {
        id: gId,
        name: s.groupName || `Groupe ${gId}`,
        level: s.level,
        stream: s.stream,
        subjects: new Set<string>(s.subjects || []),
        timeSlot: s.timeSlot,
        sessionsPerWeek: s.sessionsPerWeek || 3,
        tutorIds: new Set<string>(),
        students: [],
      });
    }

    const groupRecord = groupsMap.get(gId)!;
    groupRecord.students.push(s);

    // Collect subjects
    if (s.subjects) {
      s.subjects.forEach((subj) => groupRecord.subjects.add(subj));
    }

    // Collect tutors
    if (s.tutorId) {
      groupRecord.tutorIds.add(s.tutorId);
    }
    if (s.tutorIds) {
      s.tutorIds.forEach((tid) => groupRecord.tutorIds.add(tid));
    }
    if (s.tutorAssignments) {
      s.tutorAssignments.forEach((ta) => groupRecord.tutorIds.add(ta.tutorId));
    }

    // Keep highest sessions count or representative slot
    if (s.sessionsPerWeek && s.sessionsPerWeek > groupRecord.sessionsPerWeek) {
      groupRecord.sessionsPerWeek = s.sessionsPerWeek;
    }
    if (s.timeSlot && !groupRecord.timeSlot) {
      groupRecord.timeSlot = s.timeSlot;
    }
    if (s.groupName && groupRecord.name === `Groupe ${gId}`) {
      groupRecord.name = s.groupName;
    }
  }

  // Convert map to TutoringGroup array with rich statistics
  const result: TutoringGroup[] = [];

  groupsMap.forEach((g) => {
    // Resolve tutor entities
    const groupTutors = Array.from(g.tutorIds).map((tid) => {
      const tutorEntity = tutors.find((t) => t.id === tid);
      if (tutorEntity) {
        return {
          id: tutorEntity.id,
          name: tutorEntity.fullName,
          phone: tutorEntity.phone,
          avatar: tutorEntity.avatar,
          subjects: tutorEntity.subjects,
        };
      }
      return {
        id: tid,
        name: 'Encadreur Référent',
        subjects: Array.from(g.subjects),
      };
    });

    const totalMonthlyFee = g.students.reduce((sum, st) => sum + (st.monthlyFee || 0), 0);
    const totalPaid = g.students.reduce((sum, st) => sum + (st.paidAmount || 0), 0);
    const totalBalance = Math.max(0, totalMonthlyFee - totalPaid);
    const activeCount = g.students.filter((st) => st.tutoringStatus === 'Actif').length;
    const stoppedCount = g.students.length - activeCount;

    result.push({
      id: g.id,
      name: g.name,
      level: g.level,
      stream: g.stream,
      subjects: Array.from(g.subjects),
      timeSlot: g.timeSlot || 'Créneau hebdomadaire mutualisé',
      sessionsPerWeek: g.sessionsPerWeek,
      tutors: groupTutors,
      studentIds: g.students.map((st) => st.id),
      students: g.students,
      totalMonthlyFee,
      totalPaid,
      totalBalance,
      activeCount,
      stoppedCount,
    });
  });

  // Sort groups by active students count descending
  return result.sort((a, b) => b.students.length - a.students.length);
}

/**
 * Récupère le groupe d'un élève donné.
 */
export function getStudentGroup(
  student: Student,
  allStudents: Student[],
  tutors: Tutor[]
): TutoringGroup | null {
  if (!student.groupId) return null;
  const groups = extractTutoringGroups(allStudents, tutors);
  return groups.find((g) => g.id.toLowerCase() === student.groupId?.toLowerCase()) || null;
}

/**
 * Récupère la liste des camarades d'un élève dans le même groupe (excluant l'élève lui-même).
 */
export function getStudentsInSameGroup(
  student: Student,
  allStudents: Student[]
): Student[] {
  if (!student.groupId) return [];
  const gId = normalizeGroupId(student.groupId);
  return allStudents.filter(
    (s) => s.id !== student.id && normalizeGroupId(s.groupId) === gId
  );
}
