import type { GeneratedFile } from "../../types/config"
import { FILE_PATHS } from "../catalog"
import { type CommentSpec, q, renderYaml } from "../yaml"
import { fileHeader, type GenContext } from "./context"

/**
 * .github/dependabot.yml
 *
 * Values are double-quoted to match how the option reference and the existing
 * repositories write this file.
 */

export const generateDependabot = ( ctx: GenContext ): GeneratedFile | null => {
  const { dependabot } = ctx.state
  if ( ! dependabot.enabled || dependabot.ecosystems.length === 0 ) return null

  const specs: CommentSpec[] = []

  const updates = dependabot.ecosystems.map( ( ecosystem, index ) => {
    const entry: Record< string, unknown > = {
      "package-ecosystem": q( ecosystem.id ),
      directory: q( ecosystem.directory || "/" ),
      schedule: {
        interval: q( dependabot.interval ),
        ...( dependabot.interval === "weekly" ? { day: q( dependabot.day ) } : {} ),
        // Unquoted, 09:00 is a sexagesimal number in YAML 1.1.
        time: q( dependabot.time ),
        timezone: q( ctx.resolved.dependabot.timezone )
      },
      "open-pull-requests-limit": dependabot.openPullRequestsLimit
    }

    if ( dependabot.labels.length > 0 ) entry.labels = dependabot.labels.map( q )
    if ( dependabot.commitMessagePrefix ) {
      entry[ "commit-message" ] = { prefix: q( dependabot.commitMessagePrefix ) }
    }
    if ( dependabot.groupMinorPatch ) {
      entry.groups = {
        [ dependabot.groupName || "minor-and-patch" ]: { "update-types": [ q( "minor" ), q( "patch" ) ] }
      }
    }
    if ( dependabot.ignoreMajor ) {
      entry.ignore = [ { "dependency-name": q( "*" ), "update-types": [ q( "version-update:semver-major" ) ] } ]
    }

    specs.push( { path: [ "updates", index ], text: ctx.t( `yaml.dependabot.entry.${ ecosystem.id }` ) } )
    if ( dependabot.groupMinorPatch ) {
      specs.push( { path: [ "updates", index, "groups" ], text: ctx.t( "yaml.dependabot.groups" ) } )
    }
    if ( dependabot.openPullRequestsLimit === 0 ) {
      specs.push( {
        path: [ "updates", index, "open-pull-requests-limit" ],
        text: ctx.t( "yaml.dependabot.limitZero" )
      } )
    }
    return entry
  } )

  return {
    path: FILE_PATHS.dependabot,
    label: "dependabot.yml",
    content: renderYaml(
      { version: 2, updates },
      { header: fileHeader( ctx, "yaml.dependabot.header" ), comments: specs }
    )
  }
}
