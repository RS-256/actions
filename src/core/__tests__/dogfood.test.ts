import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { describe, expect, it } from "vitest"
import type { AppState } from "../../types/config"
import { generateAll } from "../generators"
import { stateWith } from "./helpers"

/**
 * Dogfooding: this repository's own .github files are the tool's output.
 *
 * The test writes any file that does not exist yet and compares the rest, so a
 * change to the generators shows up here. To accept a new shape, delete the
 * affected file under .github/ and run the tests again.
 */

/** The configuration this repository uses. */
const ownConfig = ( state: AppState ): void => {
  state.ui.language = "ja_jp"
  state.common = { packageManager: "npm", nodeVersion: "22", defaultBranch: "main", timezone: "Asia/Tokyo" }
  state.ci.jobs = { lint: true, test: true, build: true }
  state.deploy.target = "github-pages"
  state.deploy.outputDir = "dist"
  state.dependabot.commitMessagePrefix = "chore(deps)"
  state.dependabot.autoMerge.enabled = true
  state.dependabot.autoMerge.strategy = "same-workflow"
  state.dependabot.autoMerge.updateTypes = [ "minor", "patch" ]
}

describe( "own workflows", () => {
  const files = generateAll( stateWith( ownConfig ) )

  it( "generates the three files this repository needs", () => {
    expect( files.map( ( file ) => file.path ) ).toEqual( [
      ".github/workflows/ci.yml",
      ".github/workflows/deploy.yml",
      ".github/dependabot.yml"
    ] )
  } )

  for ( const file of files ) {
    it( `matches the committed ${ file.path }`, () => {
      if ( ! existsSync( file.path ) ) {
        mkdirSync( dirname( file.path ), { recursive: true } )
        writeFileSync( file.path, file.content )
      }
      expect( readFileSync( file.path, "utf8" ).replace( /\r\n/g, "\n" ) ).toBe( file.content )
    } )
  }
} )
