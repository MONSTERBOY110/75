import { Trophy } from 'lucide-react'
import { Podium } from '../components/leaderboard/Podium'
import { StandingRow } from '../components/leaderboard/StandingRow'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { BUILT_IN_COLLEGE } from '../data/routines'
import { useColleges } from '../hooks/useColleges'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { ordinal } from '../lib/leaderboard'

export default function LeaderboardPage() {
  const { user, profile } = useAuth()
  const { colleges } = useColleges()
  const { board, loading } = useLeaderboard()

  const college = colleges.find((c) => c.id === (profile?.collegeId ?? BUILT_IN_COLLEGE.id))

  return (
    <div className="app-shell px-margin pb-10 pt-3">
      <ScreenHeader title="Leaderboard" />

      <p className="mt-3 text-body-lg leading-snug text-on-surface">
        {college?.name ?? 'Your college'}
      </p>
      <p className="mt-1 font-pixel text-[8px] uppercase tracking-wider text-on-surface-variant">
        {board.total} {board.total === 1 ? 'student' : 'students'}
        {board.me ? ` · you are ${ordinal(board.me.rank)}` : ''}
      </p>

      {loading ? (
        <div className="mt-16 flex justify-center">
          <Spinner />
        </div>
      ) : board.total === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 border-2 border-dashed border-outline-variant py-12 text-center">
          <Trophy className="h-8 w-8 text-on-surface-variant" />
          <p className="px-6 text-body-sm text-on-surface-variant">
            Nobody here yet. Mark a class and you will be the first.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8">
            <Podium podium={board.podium} myUid={user?.uid} />
          </div>

          {board.rest.length > 0 && (
            <div className="mt-8 flex flex-col gap-2">
              {board.rest.map((standing) => (
                <StandingRow
                  key={standing.uid}
                  standing={standing}
                  isMe={standing.uid === user?.uid}
                />
              ))}
            </div>
          )}

          {/* Ranked below the last visible row: still show where they stand. */}
          {board.meBelowBoard && board.me && (
            <div className="mt-4">
              <p className="mb-2 text-center font-pixel text-[8px] uppercase tracking-wider text-on-surface-variant">
                · · ·
              </p>
              <StandingRow standing={board.me} isMe />
            </div>
          )}

          {board.total === 1 && (
            <p className="mt-6 text-center text-body-sm text-on-surface-variant">
              Your college-mates appear here as they start using the app.
            </p>
          )}
        </>
      )}
    </div>
  )
}
