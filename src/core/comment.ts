/**
 * Comment wrapping for the generated YAML.
 *
 * The "yaml" library's lineWidth only affects scalars, never comments, so the
 * wrapping has to happen before the text reaches commentBefore.
 */

/** Total display columns a generated line may occupy. */
export const DEFAULT_WIDTH = 100

/**
 * East Asian Wide / Fullwidth characters occupy two columns. Counting code
 * points instead would let a Japanese comment run to ~200 columns.
 */
export const charWidth = ( ch: string ): number => {
  const cp = ch.codePointAt( 0 ) ?? 0
  if (
    ( cp >= 0x1100 && cp <= 0x115f ) || // Hangul Jamo
    ( cp >= 0x2e80 && cp <= 0x303e ) || // CJK radicals, punctuation
    ( cp >= 0x3041 && cp <= 0x33ff ) || // Hiragana .. CJK compatibility
    ( cp >= 0x3400 && cp <= 0x4dbf ) ||
    ( cp >= 0x4e00 && cp <= 0x9fff ) || // CJK unified ideographs
    ( cp >= 0xa000 && cp <= 0xa4cf ) ||
    ( cp >= 0xac00 && cp <= 0xd7a3 ) || // Hangul syllables
    ( cp >= 0xf900 && cp <= 0xfaff ) ||
    ( cp >= 0xfe30 && cp <= 0xfe6f ) ||
    ( cp >= 0xff00 && cp <= 0xff60 ) || // Fullwidth forms
    ( cp >= 0xffe0 && cp <= 0xffe6 ) ||
    ( cp >= 0x1f300 && cp <= 0x1f9ff ) // Emoji
  ) {
    return 2
  }
  return 1
}

export const displayWidth = ( text: string ): number => {
  let width = 0
  for ( const ch of text ) width += charWidth( ch )
  return width
}

/**
 * Simple kinsoku rules. Written as escapes because source files stay ASCII;
 * in order: ideographic full stop, comma, fullwidth stop, fullwidth comma,
 * closing brackets, fullwidth exclamation / question mark, katakana middle dot.
 */
const NO_LINE_START = "\u3002\u3001\uFF0E\uFF0C\uFF09\u300D\u300F\u3011\uFF01\uFF1F\u30FB:;,.!?)]}>"
/** Opening brackets, fullwidth and ASCII. */
const NO_LINE_END = "\uFF08\u300C\u300E\u3010([{<"

const isAscii = ( ch: string ): boolean => ( ch.codePointAt( 0 ) ?? 0 ) < 0x80

/** Wraps one paragraph (no newlines) to the given number of display columns. */
const wrapParagraph = ( text: string, width: number ): string[] => {
  const chars = [ ...text ]
  const lines: string[] = []
  let line: string[] = []
  let lineWidth = 0

  const flush = () => {
    const joined = line.join( "" ).replace( /\s+$/, "" )
    if ( joined.length > 0 ) lines.push( joined )
    line = []
    lineWidth = 0
  }

  for ( let i = 0; i < chars.length; i++ ) {
    const ch = chars[ i ]
    const w = charWidth( ch )

    if ( lineWidth + w > width && line.length > 0 ) {
      if ( isAscii( ch ) && ch !== " " ) {
        // Only break at a space, so a word - or a long URL - is never split.
        // A token longer than the limit simply overflows.
        const lastSpace = line.lastIndexOf( " " )
        if ( lastSpace > 0 ) {
          const carry = line.splice( lastSpace )
          carry.shift() // drop the space itself
          flush()
          line = carry
          lineWidth = displayWidth( carry.join( "" ) )
        }
      } else if ( ! NO_LINE_START.includes( ch ) && ! NO_LINE_END.includes( line[ line.length - 1 ] ) ) {
        flush()
      }
    }

    if ( ch === " " && line.length === 0 ) continue // no leading spaces after a break
    line.push( ch )
    lineWidth += w
  }
  flush()
  return lines
}

export interface WrapOptions {
  /** Indent of the node the comment is attached to, in spaces. */
  indent: number
  /** Total display columns, including the indent and the "# " prefix. */
  width?: number
}

/**
 * Returns a comment body for Document/Node.commentBefore.
 *
 * Every line is prefixed with a single space because the library writes "#"
 * without one; existing newlines are honoured as hard breaks so a dictionary
 * entry can choose its own line breaks.
 */
export const wrapComment = ( text: string, opts: WrapOptions ): string => {
  if ( text.length === 0 ) return ""
  const width = opts.width ?? DEFAULT_WIDTH
  const usable = Math.max( 20, width - opts.indent - 2 )

  return text
    .split( "\n" )
    .flatMap( ( paragraph ) => ( paragraph.trim() === "" ? [ "" ] : wrapParagraph( paragraph.trim(), usable ) ) )
    .map( ( line ) => ( line === "" ? "" : ` ${ line }` ) )
    .join( "\n" )
}
