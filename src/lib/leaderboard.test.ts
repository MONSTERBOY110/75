import { describe, it, expect } from 'vitest'
import { BOARD_SIZE, ordinal, rankStandings } from './leaderboard'
import type { Standing } from '../types'

function standing(uid: string, percent: number, held = 40, name = uid): Standing {
  return {
    uid,
    name,
    photoURL: null,
    sectionLabel: 'CSE-A',
    percent,
    attended: Math.round((percent / 100) * held),
    held,
    updatedAt: null,
  }
}

/** n students on descending percentages, so ranks are unambiguous. */
function crowd(n: number): Standing[] {
  return Array.from({ length: n }, (_, i) => standing(`u${i + 1}`, 99 - i))
}

describe('rankStandings', () => {
  it('puts the highest percentage first', () => {
    const board = rankStandings([standing('a', 70), standing('b', 92), standing('c', 81)])
    expect(board.podium.map((s) => s.uid)).toEqual(['b', 'c', 'a'])
    expect(board.podium.map((s) => s.rank)).toEqual([1, 2, 3])
  })

  it('ranks more classes above a lucky perfect score', () => {
    const board = rankStandings([standing('lucky', 100, 1), standing('steady', 100, 60)])
    expect(board.podium.map((s) => s.uid)).toEqual(['steady', 'lucky'])
  })

  it('breaks a full tie by name so the order never jitters', () => {
    const board = rankStandings([standing('z', 80, 40, 'Zara'), standing('a', 80, 40, 'Amit')])
    expect(board.podium.map((s) => s.name)).toEqual(['Amit', 'Zara'])
  })

  it('shares a rank between genuinely level students', () => {
    const board = rankStandings([
      standing('a', 90, 40, 'Amit'),
      standing('b', 90, 40, 'Bina'),
      standing('c', 70),
    ])
    expect(board.podium.map((s) => s.rank)).toEqual([1, 1, 3])
  })

  it('shows three on the podium and twelve below it', () => {
    const board = rankStandings(crowd(30))
    expect(board.podium).toHaveLength(3)
    expect(board.rest).toHaveLength(12)
    expect(board.total).toBe(30)
    expect(board.rest[0].rank).toBe(4)
    expect(board.rest[11].rank).toBe(BOARD_SIZE)
  })

  it('finds the signed-in student inside the board', () => {
    const board = rankStandings(crowd(30), 'u5')
    expect(board.me).toMatchObject({ uid: 'u5', rank: 5 })
    expect(board.meBelowBoard).toBe(false)
  })

  it('still reports the rank of a student below the board', () => {
    const board = rankStandings(crowd(30), 'u23')
    expect(board.me).toMatchObject({ uid: 'u23', rank: 23 })
    expect(board.meBelowBoard).toBe(true)
  })

  it('handles a college with nobody, one student, or fewer than three', () => {
    const empty = rankStandings([])
    expect(empty.podium).toEqual([])
    expect(empty.total).toBe(0)
    expect(empty.me).toBeNull()

    const alone = rankStandings([standing('solo', 88)], 'solo')
    expect(alone.podium).toHaveLength(1)
    expect(alone.rest).toEqual([])
    expect(alone.me).toMatchObject({ rank: 1 })

    expect(rankStandings(crowd(2)).podium).toHaveLength(2)
  })

  it('returns no me when the student has not published yet', () => {
    expect(rankStandings(crowd(5), 'stranger').me).toBeNull()
  })

  it('does not mutate the array it was given', () => {
    const input = [standing('a', 10), standing('b', 90)]
    rankStandings(input)
    expect(input.map((s) => s.uid)).toEqual(['a', 'b'])
  })
})

describe('ordinal', () => {
  it('suffixes normally', () => {
    expect([1, 2, 3, 4, 21, 22, 23].map(ordinal)).toEqual([
      '1st',
      '2nd',
      '3rd',
      '4th',
      '21st',
      '22nd',
      '23rd',
    ])
  })

  it('gets the teens right', () => {
    expect([11, 12, 13, 111, 112].map(ordinal)).toEqual(['11th', '12th', '13th', '111th', '112th'])
  })
})
