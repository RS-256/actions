import { describe, expect, it } from "vitest"
import { parse } from "yaml"
import type { AppState } from "../../types/config"
import { displayWidth } from "../comment"
import { generateAll } from "../generators"
import { commentLines, stateWith, stripComments, withLang } from "./helpers"

/** Everything on: the widest surface the generators can produce. */
const everything = ( state: AppState ) => {
  state.ci.jobs = { lint: true, test: true, build: true }
  state.ci.nodeVersions = [ "20", "22" ]
  state.dependabot.autoMerge.enabled = true
  state.dependabot.autoMerge.approve = true
  state.dependabot.ecosystems = [
    { id: "npm", directory: "/" },
    { id: "github-actions", directory: "/" },
    { id: "docker", directory: "/app" }
  ]
  state.dependabot.labels = [ "dependencies" ]
  state.dependabot.commitMessagePrefix = "chore(deps)"
}

const everythingStandalone = ( state: AppState ) => {
  everything( state )
  state.dependabot.autoMerge.strategy = "branch-protection"
}

describe( "generated output", () => {
  it( "parses as valid YAML", () => {
    for ( const file of generateAll( stateWith( everythingStandalone ) ) ) {
      expect( () => parse( file.content ) ).not.toThrow()
    }
  } )

  it( 'keeps "on" a key and not a boolean', () => {
    for ( const file of generateAll( stateWith( everythingStandalone ) ) ) {
      if ( ! file.path.includes( "workflows" ) ) continue
      expect( file.content ).toMatch( /^on:$/m )
      expect( Object.keys( parse( file.content ) ) ).toContain( "on" )
      expect( Object.keys( parse( file.content ) ) ).not.toContain( "true" )
    }
  } )

  it( "preserves GitHub expressions verbatim", () => {
    const content = generateAll( stateWith( everything ) )[ 0 ].content
    expect( content ).toContain( '"${{ github.event.pull_request.html_url }}"' )
    expect( parse( content ).jobs[ "auto-merge" ].steps.at( -1 ).env.PR_URL ).toBe(
      "${{ github.event.pull_request.html_url }}"
    )
  } )

  it( "changes only the comments between languages", () => {
    const en = generateAll( stateWith( everythingStandalone, withLang( "en_us" ) ) )
    const ja = generateAll( stateWith( everythingStandalone, withLang( "ja_jp" ) ) )
    expect( en ).toHaveLength( ja.length )
    en.forEach( ( file, index ) => {
      expect( stripComments( file.content ) ).toBe( stripComments( ja[ index ].content ) )
      expect( commentLines( file.content ) ).not.toEqual( commentLines( ja[ index ].content ) )
    } )
  } )

  it( "follows the comment language independently of the ui language", () => {
    const files = generateAll(
      stateWith( everything, withLang( "ja_jp" ), ( s ) => {
        s.output.commentLanguage = "en_us"
      } )
    )
    expect( files[ 0 ].content ).toContain( "# Checks that run on every pull request" )
  } )

  it( "emits no comment line at all when comments are off", () => {
    const files = generateAll(
      stateWith( everythingStandalone, ( s ) => {
        s.output.comments = false
      } )
    )
    for ( const file of files ) {
      expect( commentLines( file.content ) ).toEqual( [] )
      expect( file.content.startsWith( "#" ) ).toBe( false )
    }
  } )

  it( "keeps the structure identical whether comments are on or off", () => {
    const on = generateAll( stateWith( everythingStandalone ) )
    const off = generateAll(
      stateWith( everythingStandalone, ( s ) => {
        s.output.comments = false
      } )
    )
    on.forEach( ( file, index ) => {
      expect( parse( stripComments( file.content ) ) ).toEqual( parse( off[ index ].content ) )
    } )
  } )

  it( "adds the generated-by line only when enabled", () => {
    const withLine = generateAll( stateWith( everything ) )
    expect( withLine[ 0 ].content.split( "\n" )[ 0 ] ).toContain( "https://rs256.net/actions/" )
    const without = generateAll(
      stateWith( everything, ( s ) => {
        s.output.generatedBy = false
      } )
    )
    expect( without[ 0 ].content ).not.toContain( "https://rs256.net/actions/" )
  } )

  it( "wraps every line to 100 display columns", () => {
    for ( const lang of [ "en_us", "ja_jp" ] as const ) {
      for ( const file of generateAll( stateWith( everythingStandalone, withLang( lang ) ) ) ) {
        for ( const line of file.content.split( "\n" ) ) {
          if ( displayWidth( line ) <= 100 ) continue
          // A single unbreakable token (a docs URL) may overflow; anything else
          // means a dictionary entry needs a manual line break.
          const longest = Math.max( ...line.trim().split( /\s+/ ).map( displayWidth ) )
          expect( longest, `${ file.path }: ${ line }` ).toBeGreaterThan( 90 )
        }
      }
    }
  } )
} )
