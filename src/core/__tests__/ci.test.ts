import { describe, expect, it } from "vitest"
import { parse } from "yaml"
import type { AppState } from "../../types/config"
import { CI_JOB_IDS } from "../catalog"
import { createContext } from "../generators"
import { generateCi } from "../generators/ci"
import { stateWith, withLang } from "./helpers"

const render = ( state: AppState ) => generateCi( createContext( state ) )

describe( "generateCi", () => {
  it( "returns nothing when ci is off and auto-merge does not need it", () => {
    expect(
      render(
        stateWith( ( s ) => {
          s.ci.enabled = false
        } )
      )
    ).toBeNull()
  } )

  it( "omits the default pull request types and keeps an edited set", () => {
    expect( parse( render( stateWith() )?.content ?? "" ).on.pull_request.types ).toBeUndefined()
    const edited = render(
      stateWith( ( s ) => {
        s.ci.prTypes = [ "opened", "reopened" ]
      } )
    )
    expect( parse( edited?.content ?? "" ).on.pull_request.types ).toEqual( [ "opened", "reopened" ] )
  } )

  it( "builds a matrix only for two or more node versions", () => {
    const single = parse( render( stateWith() )?.content ?? "" )
    expect( single.jobs.build.strategy ).toBeUndefined()
    expect( single.jobs.build.steps[ 1 ].with[ "node-version" ] ).toBe( 22 )

    const matrix = parse(
      render(
        stateWith( ( s ) => {
          s.ci.nodeVersions = [ "20", "22" ]
        } )
      )?.content ?? ""
    )
    expect( matrix.jobs.build.strategy ).toEqual( { matrix: { "node-version": [ 20, 22 ] } } )
    expect( matrix.jobs.build.steps[ 1 ].with[ "node-version" ] ).toBe( "${{ matrix.node-version }}" )
  } )

  it( "lists exactly the enabled jobs in the auto-merge needs, for all 8 combinations", () => {
    for ( let mask = 0; mask < 8; mask++ ) {
      const enabled = CI_JOB_IDS.filter( ( _, index ) => ( mask >> index ) & 1 )
      const file = render(
        stateWith( ( s ) => {
          s.ci.jobs = {
            lint: enabled.includes( "lint" ),
            test: enabled.includes( "test" ),
            build: enabled.includes( "build" )
          }
          s.dependabot.autoMerge.enabled = true
        } )
      )
      const tree = parse( file?.content ?? "" )
      expect( Object.keys( tree.jobs ) ).toEqual( [ ...enabled, "auto-merge" ] )
      if ( enabled.length > 0 ) {
        expect( tree.jobs[ "auto-merge" ].needs ).toEqual( enabled )
      } else {
        // Nothing to wait for: needs is left out entirely rather than empty.
        expect( tree.jobs[ "auto-merge" ].needs ).toBeUndefined()
      }
    }
  } )

  it( "keeps ci.yml when only the auto-merge job remains", () => {
    const file = render(
      stateWith( ( s ) => {
        s.ci.enabled = false
        s.dependabot.autoMerge.enabled = true
      } )
    )
    expect( Object.keys( parse( file?.content ?? "" ).jobs ) ).toEqual( [ "auto-merge" ] )
  } )

  it( "drops the auto-merge job when the branch-protection strategy is chosen", () => {
    const file = render(
      stateWith( ( s ) => {
        s.dependabot.autoMerge.enabled = true
        s.dependabot.autoMerge.strategy = "branch-protection"
      } )
    )
    expect( Object.keys( parse( file?.content ?? "" ).jobs ) ).toEqual( [ "test", "build" ] )
  } )

  it( "snapshot: default jobs with auto-merge, ja", () => {
    expect(
      render(
        stateWith( withLang( "ja_jp" ), ( s ) => {
          s.dependabot.autoMerge.enabled = true
        } )
      )?.content
    ).toMatchSnapshot()
  } )

  it( "snapshot: all jobs, matrix, approve, en", () => {
    expect(
      render(
        stateWith( withLang( "en_us" ), ( s ) => {
          s.ci.jobs = { lint: true, test: true, build: true }
          s.ci.nodeVersions = [ "20", "22", "24" ]
          s.dependabot.autoMerge.enabled = true
          s.dependabot.autoMerge.approve = true
          s.dependabot.autoMerge.updateTypes = [ "minor" ]
        } )
      )?.content
    ).toMatchSnapshot()
  } )
} )
