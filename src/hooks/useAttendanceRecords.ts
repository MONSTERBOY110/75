import { useEffect, useState } from 'react'
import { onSnapshot, orderBy, query } from 'firebase/firestore'
import { useUid } from '../context/AuthContext'
import { attendanceCollection } from '../services/user'
import type { AttendanceRecord } from '../types'

/**
 * One live listener over the student's entire attendance subcollection.
 *
 * A semester is a few hundred documents, so pulling the lot is cheaper than a
 * listener per subject - and it means Home, Subjects and a subject's detail
 * screen all move together the instant a class is marked.
 */
export function useAttendanceRecords(): { records: AttendanceRecord[]; loading: boolean } {
  const uid = useUid()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(attendanceCollection(uid), orderBy('date', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRecords(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) })),
        )
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [uid])

  return { records, loading }
}
