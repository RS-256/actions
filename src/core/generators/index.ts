import type { AppState, GeneratedFile, Lang } from "../../types/config"
import { CI_JOB_IDS } from "../catalog"
import { createTranslator, silentTranslator } from "../i18n"
import { resolve } from "../resolve"
import { generateAutoMergeFile } from "./autoMerge"
import { generateCi } from "./ci"
import type { GenContext } from "./context"
import { generateDependabot } from "./dependabot"
import { generateDeploy } from "./deploy"

export const commentLanguage = ( state: AppState ): Lang =>
  state.output.commentLanguage === "ui" ? state.ui.language : state.output.commentLanguage

/**
 * The one place that decides which files exist, which ci jobs are enabled, and
 * where the auto-merge job lands. Individual generators only read the result.
 */
export const createContext = ( state: AppState ): GenContext => {
  const autoMergeActive = state.dependabot.enabled && state.dependabot.autoMerge.enabled

  return {
    state,
    t: state.output.comments ? createTranslator( commentLanguage( state ) ) : silentTranslator,
    // Disabled jobs are left out of needs: entirely. Keeping them with "if: false"
    // would propagate a skipped result into auto-merge.
    ciJobs: state.ci.enabled ? CI_JOB_IDS.filter( ( id ) => state.ci.jobs[ id ] ) : [],
    autoMergeInCi: autoMergeActive && state.dependabot.autoMerge.strategy === "same-workflow",
    autoMergeStandalone: autoMergeActive && state.dependabot.autoMerge.strategy === "branch-protection",
    resolved: {
      ci: { packageManager: resolve( state.ci.packageManager, state.common.packageManager ) },
      deploy: {
        packageManager: resolve( state.deploy.packageManager, state.common.packageManager ),
        nodeVersion: resolve( state.deploy.nodeVersion, state.common.nodeVersion )
      },
      dependabot: { timezone: resolve( state.dependabot.timezone, state.common.timezone ) }
    }
  }
}

export const generateAll = ( state: AppState ): GeneratedFile[] => {
  const ctx = createContext( state )
  return [ generateCi( ctx ), generateDeploy( ctx ), generateDependabot( ctx ), generateAutoMergeFile( ctx ) ].filter(
    ( file ): file is GeneratedFile => file !== null
  )
}
