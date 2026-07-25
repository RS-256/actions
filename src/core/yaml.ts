import { Document, isNode, isPair, isSeq, Scalar, YAMLSeq } from "yaml"
import { wrapComment } from "./comment"

/**
 * Every YAML string goes through here.
 *
 * Two traps this module exists to close:
 *  - YAML 1.1 resolves "on" to a boolean, so documents are emitted with the
 *    1.2 core schema where "on" is an ordinary string key.
 *  - Comments are only ever attached through the Document API. Splicing "#"
 *    lines into a finished string breaks indentation sooner or later.
 */

const EXPRESSION = "${{"

/** Forces double quotes; used for GitHub expressions and for values that must stay strings. */
export const q = ( value: string ): Scalar< string > => {
  const scalar = new Scalar( value )
  scalar.type = Scalar.QUOTE_DOUBLE
  return scalar
}

/** Quotes only when the value contains a GitHub expression. */
const scalarFor = ( value: unknown ): unknown =>
  typeof value === "string" && value.includes( EXPRESSION ) ? q( value ) : value

/** Inline sequence, e.g. "branches: [main]" - matches how workflows are usually written. */
export const flowList = ( items: ( string | number )[] ): YAMLSeq => {
  const seq = new YAMLSeq()
  seq.flow = true
  for ( const item of items ) seq.add( scalarFor( item ) )
  return seq
}

/** Digits become numbers so "node-version: 22" is emitted without quotes. */
export const numericIfPossible = ( value: string ): string | number =>
  /^\d+$/.test( value ) ? Number( value ) : value

const prepare = ( value: unknown ): unknown => {
  if ( isNode( value ) ) return value
  if ( Array.isArray( value ) ) return value.map( prepare )
  if ( value && typeof value === "object" ) {
    const out: Record< string, unknown > = {}
    for ( const [ k, v ] of Object.entries( value as Record< string, unknown > ) ) out[ k ] = prepare( v )
    return out
  }
  return scalarFor( value )
}

export interface CommentSpec {
  /** Path to the node the comment goes above. */
  path: ( string | number )[]
  /** Already-translated text. Empty text is skipped, which is how comments: false works. */
  text: string
}

export interface RenderOptions {
  /** Comment placed at the very top of the file. */
  header?: string
  comments?: CommentSpec[]
}

/** Block-level indent of a node, derived from how deep its path is. */
const indentOf = ( path: ( string | number )[] ): number => Math.max( 0, path.length - 1 ) * 2

/**
 * Attaches the comment to the key, not the value, so it lands above "build:"
 * instead of between "build:" and its first entry.
 */
const commentBefore = ( doc: Document, path: ( string | number )[], text: string ): void => {
  const parentPath = path.slice( 0, -1 )
  const last = path[ path.length - 1 ]
  const parent = parentPath.length > 0 ? doc.getIn( parentPath, true ) : doc.contents
  if ( ! isNode( parent ) ) return

  if ( isSeq( parent ) ) {
    const item = parent.items[ Number( last ) ]
    if ( isNode( item ) ) item.commentBefore = text
    return
  }

  const items = ( parent as { items?: unknown[] } ).items ?? []
  for ( const pair of items ) {
    if ( ! isPair( pair ) ) continue
    const key = pair.key
    const name = isNode( key ) ? String( ( key as Scalar ).value ) : String( key )
    if ( name !== String( last ) ) continue
    if ( isNode( key ) ) key.commentBefore = text
    return
  }
}

export const renderYaml = ( tree: unknown, options: RenderOptions = {} ): string => {
  const doc = new Document( prepare( tree ), { version: "1.2" } )

  if ( options.header ) {
    // Document.commentBefore would insert a blank line before the first key.
    const first = ( doc.contents as { items?: unknown[] } | null )?.items?.[ 0 ]
    if ( isPair( first ) && isNode( first.key ) ) {
      first.key.commentBefore = wrapComment( options.header, { indent: 0 } )
    } else {
      doc.commentBefore = wrapComment( options.header, { indent: 0 } )
    }
  }

  for ( const spec of options.comments ?? [] ) {
    if ( ! spec.text ) continue
    commentBefore( doc, spec.path, wrapComment( spec.text, { indent: indentOf( spec.path ) } ) )
  }

  return doc.toString( {
    // 0 disables scalar folding: a long "if:" expression must stay on one line.
    lineWidth: 0,
    // "workflow_dispatch:" with no value, not "workflow_dispatch: null".
    nullStr: "",
    indentSeq: true,
    flowCollectionPadding: false
  } )
}
