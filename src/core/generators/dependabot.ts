import type { GeneratedFile, IgnoreRule } from "../../types/config"
import { FILE_PATHS, SEMVER_UPDATE_PREFIX, UPDATE_TYPES } from "../catalog"
import { type CommentSpec, q, renderYaml } from "../yaml"
import { fileHeader, type GenContext } from "./context"

/**
 * .github/dependabot.yml
 *
 * Values are double-quoted to match how the option reference and the existing
 * repositories write this file.
 */

/**
 * The "ignore:" list: the ignoreMajor wildcard first, then the per-dependency
 * holds. An entry without "update-types" ignores the dependency outright, which
 * is what an empty selection means.
 */
const buildIgnore = ( ignoreMajor: boolean, rules: IgnoreRule[] ): Record< string, unknown >[] => {
  const entries: Record< string, unknown >[] = []
  if ( ignoreMajor ) {
    entries.push( { "dependency-name": q( "*" ), "update-types": [ q( `${ SEMVER_UPDATE_PREFIX }major` ) ] } )
  }
  for ( const rule of rules ) {
    const name = rule.dependencyName.trim()
    if ( ! name ) continue
    // Written in catalog order, not in the order the badges happened to be tapped.
    const types = UPDATE_TYPES.filter( ( type ) => rule.updateTypes.includes( type ) )
    entries.push( {
      "dependency-name": q( name ),
      ...( types.length > 0
        ? { "update-types": types.map( ( type ) => q( `${ SEMVER_UPDATE_PREFIX }${ type }` ) ) }
        : {} )
    } )
  }
  return entries
}

export const generateDependabot = ( ctx: GenContext ): GeneratedFile | null => {
  const { dependabot } = ctx.state
  if ( ! dependabot.enabled || dependabot.ecosystems.length === 0 ) return null

  const specs: CommentSpec[] = []
  const namedHolds = dependabot.ignore.some( ( rule ) => rule.dependencyName.trim() !== "" )

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
    // Rebuilt per entry: sharing one Scalar between entries would emit YAML anchors.
    const ignore = buildIgnore( dependabot.ignoreMajor, dependabot.ignore )
    if ( ignore.length > 0 ) entry.ignore = ignore

    specs.push( { path: [ "updates", index ], text: ctx.t( `yaml.dependabot.entry.${ ecosystem.id }` ) } )
    if ( dependabot.groupMinorPatch ) {
      specs.push( { path: [ "updates", index, "groups" ], text: ctx.t( "yaml.dependabot.groups" ) } )
    }
    // The wildcard speaks for itself; a named hold does not say why it is there.
    if ( namedHolds ) specs.push( { path: [ "updates", index, "ignore" ], text: ctx.t( "yaml.dependabot.ignore" ) } )
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
