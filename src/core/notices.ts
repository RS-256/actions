import type { AppState } from "../types/config"

/**
 * Warnings and preconditions shown next to the settings.
 * Pure so the rules stay testable and identical for every panel.
 */

export type NoticeLevel = "info" | "warning"

export type NoticeScope = "ci" | "deploy" | "dependabot" | "autoMerge"

export interface Notice {
  scope: NoticeScope
  level: NoticeLevel
  /** Dictionary key under "help.". */
  key: string
  params?: Record< string, string | number >
}

export const collectNotices = ( state: AppState ): Notice[] => {
  const notices: Notice[] = []
  const { ci, deploy, dependabot } = state
  const autoMerge = dependabot.autoMerge
  const enabledJobs = ci.enabled ? [ "lint", "test", "build" ].filter( ( id ) => ci.jobs[ id as "lint" ] ) : []

  if ( deploy.enabled && deploy.target === "github-pages" ) {
    notices.push( { scope: "deploy", level: "info", key: "help.deploy.pagesSource" } )
  }
  if ( deploy.enabled && deploy.target === "custom" && deploy.secrets.length > 0 ) {
    notices.push( { scope: "deploy", level: "info", key: "help.deploy.secrets" } )
  }
  if ( deploy.enabled && deploy.target === "custom" && deploy.deployCommand.trim() === "" ) {
    notices.push( { scope: "deploy", level: "warning", key: "help.deploy.noCommand" } )
  }

  if ( dependabot.enabled && dependabot.openPullRequestsLimit === 0 ) {
    notices.push( { scope: "dependabot", level: "warning", key: "help.dependabot.limitZero" } )
  }
  if ( dependabot.enabled && dependabot.groupMinorPatch && autoMerge.enabled ) {
    notices.push( { scope: "dependabot", level: "info", key: "help.dependabot.groupsAutoMerge" } )
  }

  if ( ! dependabot.enabled ) {
    notices.push( { scope: "autoMerge", level: "info", key: "help.autoMerge.needsDependabot" } )
    return notices
  }
  if ( ! autoMerge.enabled ) return notices

  if ( autoMerge.strategy === "same-workflow" ) {
    notices.push(
      enabledJobs.length > 0
        ? {
            scope: "autoMerge",
            level: "info",
            key: "help.autoMerge.sameWorkflow",
            params: { jobs: enabledJobs.join( ", " ) }
          }
        : { scope: "autoMerge", level: "warning", key: "help.autoMerge.noChecks" }
    )
  } else {
    notices.push( { scope: "autoMerge", level: "info", key: "help.autoMerge.branchProtection" } )
    if ( ! ci.enabled || enabledJobs.length === 0 ) {
      notices.push( { scope: "autoMerge", level: "warning", key: "help.autoMerge.branchProtectionNoCi" } )
    }
  }

  if ( autoMerge.updateTypes.includes( "major" ) ) {
    notices.push( { scope: "autoMerge", level: "warning", key: "help.autoMerge.major" } )
  }
  if ( autoMerge.updateTypes.length === 0 ) {
    notices.push( { scope: "autoMerge", level: "warning", key: "help.autoMerge.noUpdateTypes" } )
  }
  if ( autoMerge.approve ) {
    notices.push( { scope: "autoMerge", level: "info", key: "help.autoMerge.approve" } )
  }

  return notices
}
