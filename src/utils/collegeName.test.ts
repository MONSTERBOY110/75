import { describe, it, expect } from 'vitest'
import { normalizeCollegeName, collegeNameKey } from './collegeName'

describe('normalizeCollegeName', () => {
  it('title cases a lowercase name and uppercases the acronym', () => {
    expect(normalizeCollegeName('abc college of something')).toBe('ABC College of Something')
  })

  it('keeps joining words lowercase in the middle', () => {
    expect(normalizeCollegeName('techno bengal institute of technology')).toBe(
      'Techno Bengal Institute of Technology',
    )
    expect(normalizeCollegeName('school of engineering and technology')).toBe(
      'School of Engineering and Technology',
    )
  })

  it('capitalises a joining word when it lands first or last', () => {
    expect(normalizeCollegeName('the institute')).toBe('The Institute')
    expect(normalizeCollegeName('institute of')).toBe('Institute Of')
  })

  it('respects real short English words instead of shouting them', () => {
    expect(normalizeCollegeName('new town college')).toBe('New Town College')
    expect(normalizeCollegeName('sri ram college of commerce')).toBe('Sri Ram College of Commerce')
    expect(normalizeCollegeName('st xavier university')).toBe('St Xavier University')
  })

  it('uppercases well-known institute acronyms whatever the case', () => {
    expect(normalizeCollegeName('iit kharagpur')).toBe('IIT Kharagpur')
    expect(normalizeCollegeName('jadavpur university')).toBe('Jadavpur University')
    expect(normalizeCollegeName('makaut west bengal')).toBe('MAKAUT West Bengal')
  })

  it('preserves acronyms the user typed in capitals', () => {
    expect(normalizeCollegeName('XYZ Institute')).toBe('XYZ Institute')
    expect(normalizeCollegeName('RCC Institute of Information Technology')).toBe(
      'RCC Institute of Information Technology',
    )
  })

  it('fixes shouted names back to sentence case', () => {
    expect(normalizeCollegeName('TECHNO BENGAL INSTITUTE OF TECHNOLOGY')).toBe(
      'Techno Bengal Institute of Technology',
    )
  })

  it('collapses stray whitespace', () => {
    expect(normalizeCollegeName('  abc   college  ')).toBe('ABC College')
  })

  it('keeps hyphenated and dotted parts readable', () => {
    expect(normalizeCollegeName('b.p. poddar institute')).toBe('B.P. Poddar Institute')
    expect(normalizeCollegeName('meghnad saha institute of technology')).toBe(
      'Meghnad Saha Institute of Technology',
    )
  })

  it('returns an empty string for blank input', () => {
    expect(normalizeCollegeName('   ')).toBe('')
    expect(normalizeCollegeName('')).toBe('')
  })
})

describe('collegeNameKey', () => {
  it('matches names that differ only by case or spacing', () => {
    expect(collegeNameKey('ABC College')).toBe(collegeNameKey('  abc   college '))
  })

  it('ignores punctuation so duplicates collapse', () => {
    expect(collegeNameKey('B.P. Poddar Institute')).toBe(collegeNameKey('BP Poddar Institute'))
  })

  it('separates genuinely different colleges', () => {
    expect(collegeNameKey('ABC College')).not.toBe(collegeNameKey('XYZ College'))
  })
})
