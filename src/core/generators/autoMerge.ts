import type { GeneratedFile } from "../../types/config"
import { ACTION_VERSIONS, FILE_PATHS } from "../catalog"
import type { Step } from "../steps"
import { type CommentSpec, flowList, renderYaml } from "../yaml"
import { fileHeader, type GenContext, updateTypeCondition } from "./context"

/**
 * The auto-merge job. Two shapes, one implementation:
 *  - strategy "same-workflow": this job is added to ci.yml and waits for the
 *    checks through needs:, so no branch protection is involved.
 *  - strategy "branch-protection": the same job in its own file, merging with
 *    --auto so GitHub holds it until the required checks pass.
 */

export const AUTO_MERGE_JOB_ID = "auto-merge"

const PR_URL = "${{ github.event.pull_request.html_url }}"
const GH_TOKEN = "${{ secrets.GITHUB_TOKEN }}"

export interface AutoMergeJob {
  job: Record< string, unknown >
  /** Path suffixes (relative to the job) that carry comments, keyed by dictionary key. */
  comments: { path: ( string | number )[]; key: string }[]
}

export const buildAutoMergeJob = ( ctx: GenContext ): AutoMergeJob => {
  const { autoMerge } = ctx.state.dependabot
  const condition = updateTypeCondition( autoMerge.updateTypes )
  const waitForChecks = ctx.autoMergeStandalone
  const steps: Step[] = []
  const comments: { path: ( string | number )[]; key: string }[] = []

  steps.push( {
    name: "Fetch Dependabot metadata",
    id: "metadata",
    uses: `dependabot/fetch-metadata@${ ACTION_VERSIONS.fetchMetadata }`,
    with: { "github-token": GH_TOKEN }
  } )

  if ( autoMerge.approve ) {
    comments.push( { path: [ "steps", steps.length ], key: "yaml.autoMerge.approve" } )
    steps.push( {
      name: "Approve",
      ...( condition ? { if: condition } : {} ),
      run: `gh pr review --approve "$PR_URL"`,
      env: { PR_URL, GH_TOKEN }
    } )
  }

  if ( condition ) comments.push( { path: [ "steps", steps.length ], key: "yaml.autoMerge.skipMajor" } )
  steps.push( {
    name: "Merge",
    ...( condition ? { if: condition } : {} ),
    // --auto is only useful with required checks; the same-workflow strategy has
    // already waited for them through needs:.
    run: `gh pr merge ${ waitForChecks ? "--auto " : "" }--${ autoMerge.mergeMethod } "$PR_URL"`,
    env: { PR_URL, GH_TOKEN }
  } )

  const job: Record< string, unknown > = {
    ...( ctx.autoMergeInCi && ctx.ciJobs.length > 0 ? { needs: flowList( ctx.ciJobs ) } : {} ),
    if: "github.actor == 'dependabot[bot]'",
    "runs-on": "ubuntu-latest",
    permissions: { contents: "write", "pull-requests": "write" },
    steps
  }

  comments.push( { path: [ "permissions" ], key: "yaml.autoMerge.permissions" } )

  return { job, comments }
}

/** strategy "branch-protection" only: auto-merge as a standalone workflow. */
export const generateAutoMergeFile = ( ctx: GenContext ): GeneratedFile | null => {
  if ( ! ctx.autoMergeStandalone ) return null

  const { job, comments } = buildAutoMergeJob( ctx )
  const tree = {
    name: "Dependabot auto-merge",
    on: { pull_request: null },
    // Default to no permissions and grant them per job.
    permissions: {},
    jobs: { [ AUTO_MERGE_JOB_ID ]: job }
  }

  const specs: CommentSpec[] = [
    { path: [ "permissions" ], text: ctx.t( "yaml.common.permissions" ) },
    { path: [ "jobs", AUTO_MERGE_JOB_ID ], text: ctx.t( "yaml.autoMerge.jobBranchProtection" ) },
    ...comments.map( ( entry ) => ( {
      path: [ "jobs", AUTO_MERGE_JOB_ID, ...entry.path ],
      text: ctx.t( entry.key )
    } ) )
  ]

  return {
    path: FILE_PATHS.autoMerge,
    label: "dependabot-auto-merge.yml",
    content: renderYaml( tree, { header: fileHeader( ctx, "yaml.autoMerge.header" ), comments: specs } )
  }
}
