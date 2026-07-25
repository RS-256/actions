import { type AppState, CONFIG_VERSION } from "../types/config"
import { createDefaultState } from "./defaults"

/**
 * Shared-URL payload: only the difference from the default state is stored, so
 * the query string stays short and changing a default does not invalidate old
 * links. A broken payload resolves to the default state rather than an error.
 */

type Bytes = Uint8Array< ArrayBuffer >

const PLAIN = 0
const DEFLATE = 1

type Json = Record< string, unknown >

const isPlainObject = ( value: unknown ): value is Json =>
  typeof value === "object" && value !== null && ! Array.isArray( value )

/** Returns undefined when the subtree matches the baseline. */
const diff = ( value: unknown, base: unknown ): unknown => {
  if ( isPlainObject( value ) && isPlainObject( base ) ) {
    const out: Json = {}
    for ( const [ key, next ] of Object.entries( value ) ) {
      const delta = diff( next, base[ key ] )
      if ( delta !== undefined ) out[ key ] = delta
    }
    return Object.keys( out ).length > 0 ? out : undefined
  }
  return JSON.stringify( value ) === JSON.stringify( base ) ? undefined : value
}

/** Inherited<T> is a union, so its "value" key is absent from the inherit baseline. */
const isInherited = ( value: unknown ): value is Json =>
  isPlainObject( value ) && ( value.mode === "inherit" || value.mode === "override" )

/** Copies only keys the baseline knows about, and only when the type matches. */
const merge = < T >( base: T, patch: unknown ): T => {
  if ( ! isPlainObject( patch ) || ! isPlainObject( base ) ) return base
  const out = { ...( base as Json ) }
  for ( const [ key, value ] of Object.entries( patch ) ) {
    if ( ! ( key in out ) ) continue
    const current = out[ key ]
    if ( isInherited( current ) && isInherited( value ) ) {
      out[ key ] = value.mode === "override" ? { mode: "override", value: value.value } : { mode: "inherit" }
    } else if ( isPlainObject( current ) && isPlainObject( value ) ) {
      out[ key ] = merge( current, value )
    } else if ( Array.isArray( current ) && Array.isArray( value ) ) {
      out[ key ] = value
    } else if ( current === null || typeof current === typeof value ) {
      out[ key ] = value
    }
  }
  return out as T
}

/** Validates arbitrary JSON (localStorage, a shared payload) against the defaults. */
export const mergeState = ( patch: unknown ): AppState => merge( createDefaultState(), patch )

const toBase64Url = ( bytes: Bytes ): string => {
  let binary = ""
  for ( const byte of bytes ) binary += String.fromCharCode( byte )
  return btoa( binary ).replace( /\+/g, "-" ).replace( /\//g, "_" ).replace( /=+$/, "" )
}

const fromBase64Url = ( text: string ): Bytes => {
  const padded = text.replace( /-/g, "+" ).replace( /_/g, "/" )
  const binary = atob( padded + "=".repeat( ( 4 - ( padded.length % 4 ) ) % 4 ) )
  return Uint8Array.from( binary, ( ch ) => ch.charCodeAt( 0 ) )
}

const streamBytes = async ( input: Bytes, transform: "deflate-raw" | "inflate-raw" ): Promise< Bytes > => {
  const stream =
    transform === "deflate-raw" ? new CompressionStream( "deflate-raw" ) : new DecompressionStream( "deflate-raw" )
  const writer = stream.writable.getWriter()
  void writer.write( input )
  void writer.close()
  const chunks: Bytes[] = []
  const reader = stream.readable.getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if ( done ) break
    chunks.push( value as Bytes )
  }
  const total = chunks.reduce( ( sum, chunk ) => sum + chunk.length, 0 )
  const out = new Uint8Array( total )
  let offset = 0
  for ( const chunk of chunks ) {
    out.set( chunk, offset )
    offset += chunk.length
  }
  return out
}

const withMarker = ( marker: number, body: Bytes ): Bytes => {
  const out = new Uint8Array( body.length + 1 )
  out[ 0 ] = marker
  out.set( body, 1 )
  return out
}

export const encodeState = async ( state: AppState ): Promise< string > => {
  const payload = JSON.stringify( { v: CONFIG_VERSION, s: diff( state, createDefaultState() ) ?? {} } )
  const bytes = new TextEncoder().encode( payload )
  if ( typeof CompressionStream === "undefined" ) return toBase64Url( withMarker( PLAIN, bytes ) )
  try {
    return toBase64Url( withMarker( DEFLATE, await streamBytes( bytes, "deflate-raw" ) ) )
  } catch {
    return toBase64Url( withMarker( PLAIN, bytes ) )
  }
}

/** Hook for future CONFIG_VERSION bumps; unknown versions fall back to defaults. */
const migrate = ( version: number, patch: unknown ): unknown => ( version === CONFIG_VERSION ? patch : null )

export const decodeState = async ( encoded: string ): Promise< AppState | null > => {
  try {
    const bytes = fromBase64Url( encoded )
    if ( bytes.length < 2 ) return null
    const body = bytes.subarray( 1 )
    const json =
      bytes[ 0 ] === DEFLATE
        ? new TextDecoder().decode( await streamBytes( body, "inflate-raw" ) )
        : new TextDecoder().decode( body )
    const payload = JSON.parse( json ) as { v?: number; s?: unknown }
    const patch = migrate( Number( payload.v ), payload.s )
    if ( patch === null ) return null
    return merge( createDefaultState(), patch )
  } catch {
    return null
  }
}
