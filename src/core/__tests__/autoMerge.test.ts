import { describe, expect, it } from "vitest"
import { parse } from "yaml"
import type { AppState } from "../../types/config"
import { FILE_PATHS } from "../catalog"
import { generateAll } from "../generators"
import { updateTypeCondition } from "../generators/context"
import { stateWith, withLang } from "./helpers"

const paths = ( state: AppState ) => generateAll( state ).map( ( file ) => file.path )

const autoMergeOn = ( state: AppState ) => {
  state.dependabot.autoMerge.enabled = true
}

describe( "updateTypeCondition", () => {
  it( "drops the guard when every update type is allowed", () => {
    expect( updateTypeCondition( [ "minor", "patch", "major" ] ) ).toBeNull()
  } )

  it( "negates major for the default selection", () => {
    expect( updateTypeCondition( [ "minor", "patch" ] ) ).toBe(
      "steps.metadata.outputs.update-type != 'version-update:semver-major'"
    )
  } )

  it( "lists the allowed types otherwise", () => {
    expect( updateTypeCondition( [ "patch" ] ) ).toBe(
      "contains(fromJSON('[\"version-update:semver-patch\"]'), steps.metadata.outputs.update-type)"
    )
  } )

  it( "never merges when nothing is selected", () => {
    expect( updateTypeCondition( [] ) ).toBe( "false" )
  } )
} )

describe( "auto-merge placement", () => {
  it( "stays inside ci.yml with the same-workflow strategy", () => {
    expect( paths( stateWith( autoMergeOn ) ) ).toEqual( [ FILE_PATHS.ci, FILE_PATHS.deploy, FILE_PATHS.dependabot ] )
  } )

  it( "becomes a fourth file with the branch-protection strategy", () => {
    expect(
      paths(
        stateWith( autoMergeOn, ( s ) => {
          s.dependabot.autoMerge.strategy = "branch-protection"
        } )
      )
    ).toEqual( [ FILE_PATHS.ci, FILE_PATHS.deploy, FILE_PATHS.dependabot, FILE_PATHS.autoMerge ] )
  } )

  it( "is not generated at all while dependabot is off", () => {
    const files = generateAll(
      stateWith( autoMergeOn, ( s ) => {
        s.dependabot.enabled = false
      } )
    )
    expect( files.map( ( file ) => file.path ) ).toEqual( [ FILE_PATHS.ci, FILE_PATHS.deploy ] )
    expect( files[ 0 ].content ).not.toContain( "auto-merge" )
  } )

  it( "merges immediately in ci.yml but waits with --auto when standalone", () => {
    const inCi = generateAll( stateWith( autoMergeOn ) )[ 0 ].content
    expect( inCi ).toContain( 'gh pr merge --squash "$PR_URL"' )

    const standalone = generateAll(
      stateWith( autoMergeOn, ( s ) => {
        s.dependabot.autoMerge.strategy = "branch-protection"
      } )
    ).at( -1 )!.content
    expect( standalone ).toContain( 'gh pr merge --auto --squash "$PR_URL"' )
  } )

  it( "grants the write scopes the Dependabot token lacks", () => {
    const tree = parse( generateAll( stateWith( autoMergeOn ) )[ 0 ].content )
    expect( tree.permissions ).toEqual( {} )
    expect( tree.jobs[ "auto-merge" ].permissions ).toEqual( { contents: "write", "pull-requests": "write" } )
    expect( tree.jobs[ "auto-merge" ].if ).toBe( "github.actor == 'dependabot[bot]'" )
  } )

  it( "adds an approve step only when asked", () => {
    const withApprove = parse(
      generateAll(
        stateWith( autoMergeOn, ( s ) => {
          s.dependabot.autoMerge.approve = true
        } )
      )[ 0 ].content
    )
    const steps = withApprove.jobs[ "auto-merge" ].steps
    expect( steps ).toHaveLength( 3 )
    expect( steps[ 1 ].run ).toBe( 'gh pr review --approve "$PR_URL"' )

    const without = parse( generateAll( stateWith( autoMergeOn ) )[ 0 ].content )
    expect( without.jobs[ "auto-merge" ].steps ).toHaveLength( 2 )
  } )

  it( "uses the selected merge method", () => {
    const tree = parse(
      generateAll(
        stateWith( autoMergeOn, ( s ) => {
          s.dependabot.autoMerge.mergeMethod = "rebase"
        } )
      )[ 0 ].content
    )
    expect( tree.jobs[ "auto-merge" ].steps.at( -1 ).run ).toContain( "--rebase" )
  } )

  it( "snapshot: standalone auto-merge workflow, ja", () => {
    expect(
      generateAll(
        stateWith( withLang( "ja_jp" ), autoMergeOn, ( s ) => {
          s.dependabot.autoMerge.strategy = "branch-protection"
        } )
      ).at( -1 )?.content
    ).toMatchSnapshot()
  } )
} )
