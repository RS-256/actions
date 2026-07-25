import { execFileSync } from "node:child_process"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { parse } from "yaml"

/**
 * The dictionaries are not type-derived (flattening a YAML import cannot be
 * followed statically), so their integrity is a test instead.
 */

const SRC = "src"
const LANG_DIR = join( SRC, "assets", "lang" )

const flatten = ( value: unknown, prefix = "" ): Record< string, string > => {
  const out: Record< string, string > = {}
  for ( const [ k, v ] of Object.entries( value as Record< string, unknown > ) ) {
    const key = prefix ? `${ prefix }.${ k }` : k
    if ( v && typeof v === "object" ) Object.assign( out, flatten( v, key ) )
    else out[ key ] = String( v )
  }
  return out
}

const dictionary = ( name: string ) => flatten( parse( readFileSync( join( LANG_DIR, name ), "utf8" ) ) )

const sourceFiles = ( dir: string ): string[] =>
  readdirSync( dir ).flatMap( ( entry ) => {
    const path = join( dir, entry )
    if ( statSync( path ).isDirectory() ) return sourceFiles( path )
    return /\.(ts|vue)$/.test( path ) && ! path.includes( "__tests__" ) ? [ path ] : []
  } )

const sources = sourceFiles( SRC ).map( ( path ) => readFileSync( path, "utf8" ) )

const NAMESPACE = "(?:ui|help|yaml)"
/** Keys written out in full, e.g. t( "ui.picker.title" ). */
const staticKeys = new Set< string >()
/** Prefixes of keys built at runtime, e.g. `yaml.dependabot.entry.${ id }`. */
const dynamicPrefixes = new Set< string >()

for ( const source of sources ) {
  for ( const match of source.matchAll( new RegExp( `["'\`](${ NAMESPACE }\\.[\\w.-]+)["'\`]`, "g" ) ) ) {
    staticKeys.add( match[ 1 ] )
  }
  for ( const match of source.matchAll( new RegExp( `\`(${ NAMESPACE }\\.[\\w.-]*)\\$\\{`, "g" ) ) ) {
    dynamicPrefixes.add( match[ 1 ] )
  }
}

const en = dictionary( "en_us.yaml" )
const ja = dictionary( "ja_jp.yaml" )

describe( "language dictionaries", () => {
  it( "have the same keys in both languages", () => {
    expect( Object.keys( ja ).sort() ).toEqual( Object.keys( en ).sort() )
  } )

  it( "have no empty values", () => {
    for ( const [ lang, dict ] of [
      [ "en_us", en ],
      [ "ja_jp", ja ]
    ] as const ) {
      for ( const [ key, value ] of Object.entries( dict ) ) {
        expect( value.trim(), `${ lang }: ${ key }` ).not.toBe( "" )
      }
    }
  } )

  it( "define every key the source refers to", () => {
    for ( const key of staticKeys ) expect( en, `missing key: ${ key }` ).toHaveProperty( [ key ] )
  } )

  it( "have no unused keys", () => {
    const unused = Object.keys( en ).filter(
      ( key ) => ! staticKeys.has( key ) && ! [ ...dynamicPrefixes ].some( ( prefix ) => key.startsWith( prefix ) )
    )
    expect( unused ).toEqual( [] )
  } )

  it( "keep placeholders consistent between languages", () => {
    const placeholders = ( text: string ) => ( text.match( /\{\w+\}/g ) ?? [] ).sort()
    for ( const key of Object.keys( en ) ) {
      expect( placeholders( ja[ key ] ), key ).toEqual( placeholders( en[ key ] ) )
    }
  } )
} )

describe( "check:ascii", () => {
  it( "passes for the whole repository", () => {
    expect( () => execFileSync( process.execPath, [ "scripts/check-ascii.mjs" ], { encoding: "utf8" } ) ).not.toThrow()
  } )
} )
