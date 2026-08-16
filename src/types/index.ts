import type { Timestamp } from 'firebase/firestore'

export type SubjectKind = 'theory' | 'practical'
export type AttendanceStatus = 'attended' | 'absent' | 'notHeld'
export type AvatarStyle = 'boy' | 'girl'

/** ISO weekday: Monday = 1 … Sunday = 7. The routine only uses 1-5. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

// ---------------------------------------------------------------------------
// Static routine config (src/data) - versioned in git, never in Firestore.
// ---------------------------------------------------------------------------

export interface Subject {
  id: string
  /** Official university code, e.g. "PCC-CS501". */
  code: string
  name: string
  /** Compact label for tight spaces, e.g. "OOP LAB". */
  short: string
  kind: SubjectKind
}

export interface Slot {
  /**
   * Stable identifier, e.g. "mon-1000". Attendance records reference this, so
   * NEVER renumber a slot id - change the subject it points at instead.
   */
  id: string
  day: Weekday
  /** 24h "HH:MM" local. */
  start: string
  end: string
  subjectId: string
  /**
   * Only students in this batch attend. Undefined means everyone does.
   * Used where a section splits across parallel lab rooms.
   */
  batch?: string
}

export interface College {
  id: string
  /** Normalized display name, e.g. "ABC College of Something". */
  name: string
  /** Punctuation-free lowercase key used to spot duplicates. */
  nameKey: string
  /** True for the college shipped with the app; false for student-contributed. */
  builtIn: boolean
}

export interface Section {
  id: string
  collegeId: string
  year: number
  semester: number
  /** Display label, e.g. "CSE-A". */
  label: string
  /**
   * The papers this section is taught. Carried on the section rather than a
   * global catalogue, because every college has its own syllabus.
   */
  subjects: Subject[]
  /** 'soon' sections are listed in the picker but cannot be selected. */
  status: 'available' | 'soon'
  /** The student who contributed it. Absent on the bundled routines, which nobody may edit. */
  createdBy?: string
  /**
   * Present when the section splits for labs. Students pick one during setup
   * and only ever see slots tagged with it (plus every untagged slot).
   */
  batches?: string[]
  slots: Slot[]
}

// ---------------------------------------------------------------------------
// Firestore documents
// ---------------------------------------------------------------------------

/** users/{uid} */
export interface UserProfile {
  id: string
  name: string
  email: string
  photoURL?: string | null
  /** Undefined until the student picks one during setup. */
  avatarStyle?: AvatarStyle
  /** Defaults to the built-in college for accounts created before colleges existed. */
  collegeId?: string
  year: number
  semester: number
  sectionId: string
  /** Set only for sections that split into lab batches. */
  batch?: string
  /** ms since epoch at local midnight of the first day of the semester. */
  semesterStartDate: number
  setupCompleted: boolean
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

/**
 * colleges/{collegeId}/members/{uid}
 *
 * The public projection of one student's standing, so a leaderboard can be built
 * without opening up `users/{uid}`. Each student writes only their own.
 */
export interface Standing {
  uid: string
  name: string
  photoURL?: string | null
  avatarStyle?: AvatarStyle
  sectionLabel: string
  /** 0-100, their overall attendance. */
  percent: number
  attended: number
  held: number
  updatedAt: Timestamp | null
}

/** users/{uid}/attendance/{dateKey}__{slotId} */
export interface AttendanceRecord {
  id: string
  /** "YYYY-MM-DD" in local time. */
  dateKey: string
  /** ms since epoch at local midnight of `dateKey` - used for ordering. */
  date: number
  slotId: string
  subjectId: string
  status: AttendanceStatus
  /**
   * A substitution or extra class that the routine never scheduled. These carry
   * their own occurrence, so the record itself is what makes the class count.
   */
  extra?: boolean
  /** Only stored for extra classes, which have no slot to read a time from. */
  start?: string
  end?: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}
