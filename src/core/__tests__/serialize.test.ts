import { describe, expect, it } from "vitest"
import { createDefaultState } from "../defaults"
import { decodeState, encodeState } from "../serialize"
import { stateWith } from "./helpers"

describe( "serialize", () => {
  it( "round-trips the default state", async () => {
    const state = createDefaultState()
    expect( await decodeState( await encodeState( state ) ) ).toEqual( state )
  } )

  it( "round-trips a heavily edited state", async () => {
    const state = stateWith( ( s ) => {
      s.ui.language = "ja_jp"
      s.common = { packageManager: "pnpm", nodeVersion: "24", defaultBranch: "trunk", timezone: "UTC" }
      s.ci.jobs = { lint: true, test: false, build: true }
      s.ci.nodeVersions = [ "20", "22", "24", "26" ]
      s.ci.packageManager = { mode: "override", value: "yarn" }
      s.deploy.target = "custom"
      s.deploy.deployCommand = "make deploy"
      s.deploy.secrets = [ "TOKEN", "HOST" ]
      s.deploy.installCommand = "npm install"
      s.dependabot.ecosystems = [ { id: "cargo", directory: "/crates" } ]
      s.dependabot.interval = "daily"
      s.dependabot.autoMerge = {
        enabled: true,
        strategy: "branch-protection",
        updateTypes: [ "patch" ],
        mergeMethod: "merge",
        approve: true
      }
      s.output = { comments: false, commentLanguage: "ja_jp", generatedBy: false }
    } )
    expect( await decodeState( await encodeState( state ) ) ).toEqual( state )
  } )

  it( "stays short for a small change", async () => {
    const encoded = await encodeState(
      stateWith( ( s ) => {
        s.ci.jobs.lint = true
      } )
    )
    expect( encoded.length ).toBeLessThan( 60 )
    expect( encoded ).toMatch( /^[\w-]+$/ )
  } )

  it( "returns null for junk instead of throwing", async () => {
    expect( await decodeState( "" ) ).toBeNull()
    expect( await decodeState( "not-a-payload" ) ).toBeNull()
    expect( await decodeState( "!!!" ) ).toBeNull()
  } )

  it( "ignores unknown and mistyped fields", async () => {
    const payload = await encodeState( createDefaultState() )
    const decoded = await decodeState( payload )
    expect( decoded ).toEqual( createDefaultState() )

    // A hand-made plain payload: marker 0 means "uncompressed JSON".
    const json = JSON.stringify( { v: 1, s: { nope: 1, ci: { enabled: "yes", jobs: { lint: true } } } } )
    const bytes = new Uint8Array( [ 0, ...new TextEncoder().encode( json ) ] )
    let binary = ""
    for ( const byte of bytes ) binary += String.fromCharCode( byte )
    const encoded = btoa( binary ).replace( /\+/g, "-" ).replace( /\//g, "_" ).replace( /=+$/, "" )

    const state = await decodeState( encoded )
    expect( state?.ci.enabled ).toBe( true ) // string rejected, default kept
    expect( state?.ci.jobs.lint ).toBe( true ) // boolean accepted
    expect( ( state as unknown as Record< string, unknown > ).nope ).toBeUndefined()
  } )
} )
