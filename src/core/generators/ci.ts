import type { GeneratedFile } from "../../types/config"
import { type CiJobId, FILE_PATHS } from "../catalog"
import { buildSteps, scriptCommand } from "../steps"
import { type CommentSpec, flowList, numericIfPossible, renderYaml } from "../yaml"
import { AUTO_MERGE_JOB_ID, buildAutoMergeJob } from "./autoMerge"
import { fileHeader, type GenContext } from "./context"

/**
 * ci.yml - the set of checks to run on a pull request, plus (with the
 * same-workflow strategy) the Dependabot auto-merge job that waits for them.
 */

const DEFAULT_PR_TYPES = [ "opened", "synchronize", "reopened" ]

const JOB_SCRIPTS: Record< CiJobId, string > = { lint: "lint", test: "test", build: "build" }

const MATRIX_NODE_VERSION = "${{ matrix.node-version }}"

const buildCheckJob = ( ctx: GenContext, id: CiJobId ) => {
  const packageManager = ctx.resolved.ci.packageManager
  const versions = ctx.state.ci.nodeVersions.length > 0 ? ctx.state.ci.nodeVersions : [ ctx.state.common.nodeVersion ]
  const useMatrix = versions.length > 1

  const { steps, comments } = buildSteps( {
    framework: "none",
    packageManager,
    nodeVersion: useMatrix ? MATRIX_NODE_VERSION : versions[ 0 ],
    cache: true,
    commands: [ scriptCommand( packageManager, JOB_SCRIPTS[ id ] ) ],
    named: false
  } )

  const job: Record< string, unknown > = {
    "runs-on": "ubuntu-latest",
    permissions: { contents: "read" },
    ...( useMatrix ? { strategy: { matrix: { "node-version": flowList( versions.map( numericIfPossible ) ) } } } : {} ),
    steps
  }

  return { job, comments }
}

export const generateCi = ( ctx: GenContext ): GeneratedFile | null => {
  const { ci } = ctx.state
  if ( ! ci.enabled && ! ctx.autoMergeInCi ) return null

  const jobs: Record< string, unknown > = {}
  const specs: CommentSpec[] = [ { path: [ "permissions" ], text: ctx.t( "yaml.common.permissions" ) } ]

  for ( const id of ctx.ciJobs ) {
    const { job, comments } = buildCheckJob( ctx, id )
    jobs[ id ] = job
    specs.push( { path: [ "jobs", id ], text: ctx.t( `yaml.ci.job.${ id }` ) } )
    for ( const [ index, key ] of Object.entries( comments ) ) {
      specs.push( { path: [ "jobs", id, "steps", Number( index ) ], text: ctx.t( key ) } )
    }
  }

  if ( ctx.autoMergeInCi ) {
    const { job, comments } = buildAutoMergeJob( ctx )
    jobs[ AUTO_MERGE_JOB_ID ] = job
    specs.push( {
      path: [ "jobs", AUTO_MERGE_JOB_ID ],
      text: ctx.t( ctx.ciJobs.length > 0 ? "yaml.autoMerge.jobSameWorkflow" : "yaml.autoMerge.jobNoChecks" )
    } )
    for ( const entry of comments ) {
      specs.push( { path: [ "jobs", AUTO_MERGE_JOB_ID, ...entry.path ], text: ctx.t( entry.key ) } )
    }
  }

  const typesDiffer =
    ci.prTypes.length !== DEFAULT_PR_TYPES.length || ci.prTypes.some( ( type ) => ! DEFAULT_PR_TYPES.includes( type ) )

  const branches = ci.targetBranches.length > 0 ? ci.targetBranches : [ ctx.state.common.defaultBranch ]

  const tree = {
    name: "CI",
    on: {
      pull_request: {
        branches: flowList( branches ),
        // GitHub already defaults to opened/synchronize/reopened; only an
        // actual change is worth writing down.
        ...( typesDiffer ? { types: flowList( ci.prTypes ) } : {} )
      }
    },
    permissions: {},
    ...( ci.concurrency
      ? {
          concurrency: {
            group: "ci-${{ github.event.pull_request.number }}",
            "cancel-in-progress": true
          }
        }
      : {} ),
    jobs
  }

  return {
    path: FILE_PATHS.ci,
    label: "ci.yml",
    content: renderYaml( tree, { header: fileHeader( ctx, "yaml.ci.header" ), comments: specs } )
  }
}
