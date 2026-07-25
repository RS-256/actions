import type { AppState, PackageManager, UpdateType } from "../../types/config"
import { type CiJobId, SEMVER_UPDATE_PREFIX } from "../catalog"
import type { Translator } from "../i18n"

/**
 * Everything the individual generators are allowed to know.
 * All cross-file decisions (which jobs exist, where auto-merge lands) are made
 * once in generators/index.ts so they cannot drift between files.
 */
export interface GenContext {
  state: AppState
  t: Translator
  /** Enabled ci jobs in output order; the auto-merge "needs:" list. */
  ciJobs: CiJobId[]
  /** auto-merge lives inside ci.yml (strategy: same-workflow). */
  autoMergeInCi: boolean
  /** auto-merge is a file of its own (strategy: branch-protection). */
  autoMergeStandalone: boolean
  /** Inherited<T> fields, already collapsed against the shared settings. */
  resolved: {
    ci: { packageManager: PackageManager }
    deploy: { packageManager: PackageManager; nodeVersion: string }
    dependabot: { timezone: string }
  }
}

/** Leading comment for a file: the generated-by line plus the file's own header. */
export const fileHeader = ( ctx: GenContext, key: string ): string | undefined => {
  const lines: string[] = []
  if ( ctx.state.output.generatedBy ) {
    const generatedBy = ctx.t( "yaml.common.generatedBy" )
    if ( generatedBy ) lines.push( generatedBy )
  }
  const body = ctx.t( key )
  if ( body ) lines.push( body )
  return lines.length > 0 ? lines.join( "\n" ) : undefined
}

/**
 * The "if:" guard for the merge step, built from the selected update types.
 * Returns null when every type is allowed, so no guard is emitted at all.
 */
export const updateTypeCondition = ( types: UpdateType[] ): string | null => {
  const selected = new Set( types )
  if ( selected.size === 0 ) return "false"
  if ( selected.has( "minor" ) && selected.has( "patch" ) && selected.has( "major" ) ) return null
  if ( selected.size === 2 && selected.has( "minor" ) && selected.has( "patch" ) ) {
    return `steps.metadata.outputs.update-type != '${ SEMVER_UPDATE_PREFIX }major'`
  }
  const list = types.map( ( type ) => `${ SEMVER_UPDATE_PREFIX }${ type }` )
  return `contains(fromJSON('${ JSON.stringify( list ) }'), steps.metadata.outputs.update-type)`
}
