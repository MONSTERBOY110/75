/**
 * College name normalisation, so "abc college of something" and
 * "ABC COLLEGE OF SOMETHING" both land in the database as
 * "ABC College of Something".
 */

/** Joining words that stay lowercase unless they open or close the name. */
const SMALL_WORDS = new Set([
  'of', 'the', 'and', 'for', 'in', 'at', 'on', 'to', 'a', 'an', 'by', 'with',
  'from', 'de', 'la', 'le', 'du', 'da', 'van', 'von',
])

/**
 * Short words that are real English (or common Indian name) words, so a 3-letter
 * word is only shouted when it is NOT in here. This is what lets "abc" become
 * "ABC" while "new town college" stays "New Town College".
 */
const REAL_SHORT_WORDS = new Set([
  'new', 'old', 'sri', 'shri', 'shree', 'st', 'dr', 'mr', 'mrs', 'sir', 'lord',
  'ram', 'dev', 'raj', 'rao', 'roy', 'sen', 'das', 'jain', 'guru', 'baba',
  'san', 'don', 'los', 'las', 'ben', 'bin', 'abu', 'ali', 'lal', 'nath',
  'sun', 'sky', 'air', 'sea', 'bay', 'oak', 'elm', 'red', 'big', 'top', 'mid',
  'all', 'our', 'one', 'two', 'six', 'ten', 'art', 'law', 'war', 'god', 'man',
  'boy', 'day', 'key', 'way', 'city', 'town', 'east', 'west', 'north', 'south',
  'holy', 'high', 'home', 'hill', 'lake', 'park', 'rose', 'star', 'sant',
])

/** Acronyms worth shouting even though they read like words. */
const KNOWN_ACRONYMS = new Set([
  'iit', 'nit', 'iiit', 'iim', 'bit', 'mit', 'vit', 'srm', 'kiit', 'lpu',
  'makaut', 'wbut', 'aktu', 'vtu', 'ptu', 'rgpv', 'jntu', 'anna',
  'tbit', 'jis', 'rcc', 'gnit', 'hit', 'iem', 'aot', 'tmsl', 'uem', 'bppimt',
  'nsec', 'msit', 'gcelt', 'iiest', 'nsut', 'dtu', 'nsit', 'bms', 'pes',
  'ju', 'cu', 'du', 'bhu', 'amu', 'jmi', 'jnu', 'ignou', 'nptel',
])

const VOWELS = /[aeiouy]/i

/** Capitalises the first letter, lowercasing the rest. */
function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

/**
 * Title-cases a dotted or hyphenated token piece by piece, so "b.p." becomes
 * "B.P." rather than "B.p.".
 */
function casePunctuated(word: string, shout: boolean): string {
  return word
    .split(/([.\-'/])/)
    .map((part) => {
      if (/^[.\-'/]$/.test(part) || part === '') return part
      return shout ? part.toUpperCase() : capitalise(part)
    })
    .join('')
}

/** True when the word reads like an acronym rather than an English word. */
function looksLikeAcronym(bare: string, original: string): boolean {
  if (KNOWN_ACRONYMS.has(bare)) return true
  // The user typed it in capitals, so take them at their word.
  if (original.length > 1 && original === original.toUpperCase() && /[A-Z]{2,}/.test(original)) {
    return true
  }
  if (REAL_SHORT_WORDS.has(bare)) return false
  // A short cluster with no vowel, or any run of 2-3 letters that is not a real
  // word, is almost always initials: abc, xyz, bcd.
  if (bare.length <= 3 && !SMALL_WORDS.has(bare)) return true
  return bare.length <= 5 && !VOWELS.test(bare)
}

/**
 * The display form stored in the database.
 *
 * A live preview of this is shown while the student types, so the heuristics
 * below never trap anyone: typing an acronym in capitals always preserves it.
 */
export function normalizeCollegeName(input: string): string {
  const words = input.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''

  const allCaps = input === input.toUpperCase()

  return words
    .map((word, i) => {
      const bare = word.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase()
      if (!bare) return word

      const isEdge = i === 0 || i === words.length - 1

      // A name shouted in full is being fixed, not preserved, so ignore the
      // "user typed capitals" signal for every word in it.
      const shout = looksLikeAcronym(bare, allCaps ? bare : word)

      if (shout) return casePunctuated(word, true)
      if (SMALL_WORDS.has(bare) && !isEdge) return word.toLowerCase()
      return casePunctuated(word, false)
    })
    .join(' ')
}

/**
 * Comparison key used to spot a college that already exists. Strips case,
 * spacing and punctuation so "B.P. Poddar" and "BP Poddar" collapse together.
 */
export function collegeNameKey(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim()
}
