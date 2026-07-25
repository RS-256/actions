import { describe, expect, it } from "vitest"
import { parse } from "yaml"
import type { AppState } from "../../types/config"
import { ECOSYSTEMS } from "../catalog"
import { createContext } from "../generators"
import { generateDependabot } from "../generators/dependabot"
import { stateWith, withLang } from "./helpers"

const render = ( state: AppState ) => generateDependabot( createContext( state ) )

describe( "generateDependabot", () => {
  it( "returns nothing without ecosystems", () => {
    expect(
      render(
        stateWith( ( s ) => {
          s.dependabot.ecosystems = []
        } )
      )
    ).toBeNull()
  } )

  it( "produces one updates entry per selected ecosystem", () => {
    const file = render(
      stateWith( ( s ) => {
        s.dependabot.ecosystems = ECOSYSTEMS.map( ( eco ) => ( { id: eco.id, directory: "/" } ) )
      } )
    )
    const tree = parse( file?.content ?? "" )
    expect( tree.updates ).toHaveLength( ECOSYSTEMS.length )
    expect( tree.updates.map( ( entry: { "package-ecosystem": string } ) => entry[ "package-ecosystem" ] ) ).toEqual(
      ECOSYSTEMS.map( ( eco ) => eco.id )
    )
  } )

  it( "writes groups only while grouping is on", () => {
    expect( parse( render( stateWith() )?.content ?? "" ).updates[ 0 ].groups ).toEqual( {
      "minor-and-patch": { "update-types": [ "minor", "patch" ] }
    } )
    const off = render(
      stateWith( ( s ) => {
        s.dependabot.groupMinorPatch = false
      } )
    )
    expect( parse( off?.content ?? "" ).updates[ 0 ].groups ).toBeUndefined()
  } )

  it( "drops the day when the interval is not weekly", () => {
    expect( parse( render( stateWith() )?.content ?? "" ).updates[ 0 ].schedule.day ).toBe( "monday" )
    const daily = render(
      stateWith( ( s ) => {
        s.dependabot.interval = "daily"
      } )
    )
    expect( parse( daily?.content ?? "" ).updates[ 0 ].schedule ).toEqual( {
      interval: "daily",
      time: "09:00",
      timezone: "Asia/Tokyo"
    } )
  } )

  it( "keeps the time a string so 09:00 is not read as a number", () => {
    const content = render( stateWith() )?.content ?? ""
    expect( content ).toContain( 'time: "09:00"' )
    expect( parse( content ).updates[ 0 ].schedule.time ).toBe( "09:00" )
  } )

  it( "writes the optional fields only when filled in", () => {
    const tree = parse(
      render(
        stateWith( ( s ) => {
          s.dependabot.labels = [ "dependencies", "automated" ]
          s.dependabot.commitMessagePrefix = "chore(deps)"
          s.dependabot.ignoreMajor = true
          s.dependabot.openPullRequestsLimit = 10
        } )
      )?.content ?? ""
    )
    expect( tree.updates[ 0 ].labels ).toEqual( [ "dependencies", "automated" ] )
    expect( tree.updates[ 0 ][ "commit-message" ] ).toEqual( { prefix: "chore(deps)" } )
    expect( tree.updates[ 0 ].ignore ).toEqual( [
      { "dependency-name": "*", "update-types": [ "version-update:semver-major" ] }
    ] )
    expect( tree.updates[ 0 ][ "open-pull-requests-limit" ] ).toBe( 10 )

    const bare = parse( render( stateWith() )?.content ?? "" )
    expect( bare.updates[ 0 ].labels ).toBeUndefined()
    expect( bare.updates[ 0 ][ "commit-message" ] ).toBeUndefined()
    expect( bare.updates[ 0 ].ignore ).toBeUndefined()
  } )

  it( "honours a per-ecosystem directory", () => {
    const tree = parse(
      render(
        stateWith( ( s ) => {
          s.dependabot.ecosystems = [ { id: "npm", directory: "/frontend" } ]
        } )
      )?.content ?? ""
    )
    expect( tree.updates[ 0 ].directory ).toBe( "/frontend" )
  } )

  it( "snapshot: npm and github-actions, ja", () => {
    expect( render( stateWith( withLang( "ja_jp" ) ) )?.content ).toMatchSnapshot()
  } )

  it( "snapshot: npm and github-actions, en", () => {
    expect( render( stateWith( withLang( "en_us" ) ) )?.content ).toMatchSnapshot()
  } )
} )
