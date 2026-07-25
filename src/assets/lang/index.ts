import type { Lang } from "../../types/config"
import en_us from "./en_us.yaml"
import ja_jp from "./ja_jp.yaml"

export const DEFAULT_LANG: Lang = "en_us"

/**
 * Dictionaries are written as nested YAML and flattened to dotted keys on load:
 * hierarchical to write, flat to look up.
 */
const flatten = ( obj: unknown, prefix = "" ): Record< string, string > => {
  const out: Record< string, string > = {}
  for ( const [ k, v ] of Object.entries( obj as Record< string, unknown > ) ) {
    const key = prefix ? `${ prefix }.${ k }` : k
    if ( v && typeof v === "object" ) Object.assign( out, flatten( v, key ) )
    else out[ key ] = String( v )
  }
  return out
}

export const LANGUAGES: Record< Lang, Record< string, string > > = {
  en_us: flatten( en_us ),
  ja_jp: flatten( ja_jp )
}

export const LANG_IDS = Object.keys( LANGUAGES ) as Lang[]

export type MessageKey = string

/**
 * Resolves a BCP-47 tag such as "ja-JP" to a dictionary id.
 * Exact match first, then the leading subtag, then the default.
 */
export const resolveLang = ( tag: string | undefined ): Lang => {
  if ( ! tag ) return DEFAULT_LANG
  const normalized = tag.toLowerCase().replace( /-/g, "_" )
  if ( LANG_IDS.includes( normalized as Lang ) ) return normalized as Lang
  const primary = normalized.split( "_" )[ 0 ]
  return LANG_IDS.find( ( id ) => id.startsWith( `${ primary }_` ) ) ?? DEFAULT_LANG
}

/** <html lang> needs BCP-47; the internal id is never converted anywhere else. */
export const toBcp47 = ( lang: Lang ): string => {
  const [ primary, region ] = lang.split( "_" )
  return region ? `${ primary }-${ region.toUpperCase() }` : primary
}
