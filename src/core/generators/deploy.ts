import type { GeneratedFile } from "../../types/config"
import { ACTION_VERSIONS, FILE_PATHS, PACKAGE_MANAGERS } from "../catalog"
import { buildSteps, type Step, scriptCommand } from "../steps"
import { type CommentSpec, flowList, renderYaml } from "../yaml"
import { fileHeader, type GenContext } from "./context"

/**
 * deploy.yml - build on push, then publish.
 *
 * The GitHub Pages shape is deliberately the same as the existing rs256.net and
 * mc_animator workflows; those files are the reference output for this generator.
 */

const PAGE_URL = "${{ steps.deployment.outputs.page_url }}"

const deployPagesJob = () => ( {
  needs: "build",
  environment: { name: "github-pages", url: PAGE_URL },
  "runs-on": "ubuntu-latest",
  steps: [
    {
      name: "Deploy to GitHub Pages",
      id: "deployment",
      uses: `actions/deploy-pages@${ ACTION_VERSIONS.deployPages }`
    }
  ]
} )

export const generateDeploy = ( ctx: GenContext ): GeneratedFile | null => {
  const { deploy } = ctx.state
  if ( ! deploy.enabled ) return null

  const { packageManager, nodeVersion } = ctx.resolved.deploy
  const pages = deploy.target === "github-pages"
  // The Astro action bundles install, build and the artifact upload, which only
  // makes sense for the Pages target.
  const framework = pages ? deploy.framework : "none"
  const installOverride = deploy.installCommand?.trim()

  const built = buildSteps( {
    framework,
    packageManager,
    nodeVersion,
    cache: deploy.cache,
    commands: [ deploy.buildCommand?.trim() || scriptCommand( packageManager, "build" ) ],
    named: true
  } )
  const steps: Step[] = built.steps

  if ( installOverride ) {
    const installStep = steps.find( ( step ) => step.run === PACKAGE_MANAGERS[ packageManager ].install )
    if ( installStep ) installStep.run = installOverride
  }

  const specs: CommentSpec[] = []
  const tree: Record< string, unknown > = {
    name: pages ? "Deploy to GitHub Pages" : "Deploy",
    on: {
      push: {
        branches: flowList( deploy.branches.length > 0 ? deploy.branches : [ ctx.state.common.defaultBranch ] )
      },
      ...( deploy.manualDispatch ? { workflow_dispatch: null } : {} )
    }
  }

  if ( pages ) {
    if ( framework === "none" ) {
      steps.push( {
        name: "Upload artifact",
        uses: `actions/upload-pages-artifact@${ ACTION_VERSIONS.uploadPagesArtifact }`,
        with: { path: deploy.outputDir }
      } )
    }

    tree.permissions = { contents: "read", pages: "write", "id-token": "write" }
    if ( deploy.concurrency ) {
      // A queued Pages deployment must not be cancelled: the last completed run
      // is what stays published.
      tree.concurrency = { group: "pages", "cancel-in-progress": false }
    }
    tree.jobs = {
      build: { "runs-on": "ubuntu-latest", steps },
      deploy: deployPagesJob()
    }

    specs.push( { path: [ "permissions" ], text: ctx.t( "yaml.deploy.pagesPermissions" ) } )
    specs.push( { path: [ "jobs", "deploy" ], text: ctx.t( "yaml.deploy.pagesSetup" ) } )
    for ( const [ index, key ] of Object.entries( built.comments ) ) {
      specs.push( { path: [ "jobs", "build", "steps", Number( index ) ], text: ctx.t( key ) } )
    }
  } else {
    const env: Record< string, unknown > = {}
    for ( const secret of deploy.secrets ) env[ secret ] = `\${{ secrets.${ secret } }}`

    steps.push( {
      name: "Deploy",
      run: deploy.deployCommand || 'echo "set a deploy command"',
      ...( deploy.secrets.length > 0 ? { env } : {} )
    } )

    tree.permissions = { contents: "read" }
    if ( deploy.concurrency ) {
      tree.concurrency = { group: "deploy-${{ github.ref }}", "cancel-in-progress": true }
    }
    tree.jobs = { deploy: { "runs-on": "ubuntu-latest", steps } }

    for ( const [ index, key ] of Object.entries( built.comments ) ) {
      specs.push( { path: [ "jobs", "deploy", "steps", Number( index ) ], text: ctx.t( key ) } )
    }
    if ( deploy.secrets.length > 0 ) {
      specs.push( { path: [ "jobs", "deploy", "steps", steps.length - 1 ], text: ctx.t( "yaml.deploy.secrets" ) } )
    }
  }

  return {
    path: FILE_PATHS.deploy,
    label: "deploy.yml",
    content: renderYaml( tree, {
      header: fileHeader( ctx, pages ? "yaml.deploy.headerPages" : "yaml.deploy.headerCustom" ),
      comments: specs
    } )
  }
}
