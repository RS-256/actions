import { describe, expect, it } from "vitest"
import { parse } from "yaml"
import { createContext } from "../generators"
import { generateDeploy } from "../generators/deploy"
import { stateWith, withLang } from "./helpers"

const render = ( state: Parameters< typeof createContext >[ 0 ] ) => generateDeploy( createContext( state ) )

describe( "generateDeploy", () => {
  it( "returns nothing when deploy is off", () => {
    expect(
      render(
        stateWith( ( s ) => {
          s.deploy.enabled = false
        } )
      )
    ).toBeNull()
  } )

  it( "matches the GitHub Pages workflow shape of the existing repositories", () => {
    // mc_animator/.github/workflows/deploy.yml is the reference. Two intentional
    // differences: action versions come from ACTION_VERSIONS, and a queued Pages
    // deployment is not cancelled (spec 5.1).
    const file = render(
      stateWith( ( s ) => {
        s.common.nodeVersion = "24"
      } )
    )
    expect( parse( file?.content ?? "" ) ).toEqual( {
      name: "Deploy to GitHub Pages",
      on: { push: { branches: [ "main" ] }, workflow_dispatch: null },
      permissions: { contents: "read", pages: "write", "id-token": "write" },
      concurrency: { group: "pages", "cancel-in-progress": false },
      jobs: {
        build: {
          "runs-on": "ubuntu-latest",
          steps: [
            { name: "Checkout", uses: "actions/checkout@v7" },
            { name: "Setup Node", uses: "actions/setup-node@v7", with: { "node-version": 24, cache: "npm" } },
            { name: "Install dependencies", run: "npm ci" },
            { name: "Build", run: "npm run build" },
            { name: "Upload artifact", uses: "actions/upload-pages-artifact@v5", with: { path: "dist" } }
          ]
        },
        deploy: {
          needs: "build",
          environment: { name: "github-pages", url: "${{ steps.deployment.outputs.page_url }}" },
          "runs-on": "ubuntu-latest",
          steps: [ { name: "Deploy to GitHub Pages", id: "deployment", uses: "actions/deploy-pages@v5" } ]
        }
      }
    } )
  } )

  it( "folds the Astro preset into a single build step", () => {
    const file = render(
      stateWith( ( s ) => {
        s.deploy.framework = "astro"
      } )
    )
    const tree = parse( file?.content ?? "" )
    expect( tree.jobs.build.steps ).toEqual( [
      { name: "Checkout", uses: "actions/checkout@v7" },
      { name: "Build with Astro", uses: "withastro/action@v6" }
    ] )
  } )

  it( "adds the pnpm setup step before setup-node", () => {
    const file = render(
      stateWith( ( s ) => {
        s.common.packageManager = "pnpm"
      } )
    )
    const tree = parse( file?.content ?? "" )
    expect( tree.jobs.build.steps.map( ( step: { uses?: string; run?: string } ) => step.uses ?? step.run ) ).toEqual( [
      "actions/checkout@v7",
      "pnpm/action-setup@v4",
      "actions/setup-node@v7",
      "pnpm install --frozen-lockfile",
      "pnpm build",
      "actions/upload-pages-artifact@v5"
    ] )
  } )

  it( "uses .nvmrc instead of a pinned version", () => {
    const file = render(
      stateWith( ( s ) => {
        s.deploy.nodeVersion = { mode: "override", value: "nvmrc" }
      } )
    )
    const tree = parse( file?.content ?? "" )
    expect( tree.jobs.build.steps[ 1 ].with ).toEqual( { "node-version-file": ".nvmrc", cache: "npm" } )
  } )

  it( "expands secrets into the deploy step env for a custom target", () => {
    const file = render(
      stateWith( ( s ) => {
        s.deploy.target = "custom"
        s.deploy.deployCommand = "npx wrangler deploy"
        s.deploy.secrets = [ "CLOUDFLARE_API_TOKEN" ]
      } )
    )
    const tree = parse( file?.content ?? "" )
    expect( tree.permissions ).toEqual( { contents: "read" } )
    expect( tree.jobs.deploy.steps.at( -1 ) ).toEqual( {
      name: "Deploy",
      run: "npx wrangler deploy",
      env: { CLOUDFLARE_API_TOKEN: "${{ secrets.CLOUDFLARE_API_TOKEN }}" }
    } )
  } )

  it( "drops concurrency when it is turned off", () => {
    const file = render(
      stateWith( ( s ) => {
        s.deploy.concurrency = false
      } )
    )
    expect( parse( file?.content ?? "" ).concurrency ).toBeUndefined()
  } )

  it( "snapshot: github pages, en", () => {
    expect( render( stateWith( withLang( "en_us" ) ) )?.content ).toMatchSnapshot()
  } )

  it( "snapshot: github pages, ja", () => {
    expect( render( stateWith( withLang( "ja_jp" ) ) )?.content ).toMatchSnapshot()
  } )

  it( "snapshot: custom command, ja", () => {
    expect(
      render(
        stateWith( withLang( "ja_jp" ), ( s ) => {
          s.deploy.target = "custom"
          s.deploy.deployCommand = "rsync -az dist/ deploy@example.com:/srv/www/"
          s.deploy.secrets = [ "SSH_KEY" ]
          s.common.packageManager = "pnpm"
        } )
      )?.content
    ).toMatchSnapshot()
  } )
} )
