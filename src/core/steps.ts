import type { PackageManager } from "../types/config"
import { ACTION_VERSIONS, NODE_VERSION_FILE, PACKAGE_MANAGERS } from "./catalog"
import { numericIfPossible } from "./yaml"

/**
 * The build step list is shared by deploy and by the ci jobs. Duplicating it
 * would guarantee that one of the two copies eventually goes stale.
 */

export interface Step {
  name?: string
  id?: string
  if?: string
  uses?: string
  with?: Record< string, unknown >
  run?: string
  env?: Record< string, unknown >
}

export interface BuildStepsOptions {
  framework: "none" | "astro"
  packageManager: PackageManager
  /** A version, the NODE_VERSION_FILE sentinel, or a matrix expression. */
  nodeVersion: string
  cache: boolean
  /** Commands appended after the install step. */
  commands: string[]
  /** Deploy uses named steps (like the existing repositories); ci keeps them terse. */
  named: boolean
}

export interface BuiltSteps {
  steps: Step[]
  /** Step index -> dictionary key, for callers that attach comments. */
  comments: Record< number, string >
}

const setupNodeStep = ( options: BuildStepsOptions ): Step => {
  const withInput: Record< string, unknown > =
    options.nodeVersion === NODE_VERSION_FILE
      ? { "node-version-file": ".nvmrc" }
      : { "node-version": numericIfPossible( options.nodeVersion ) }

  const cacheKey = PACKAGE_MANAGERS[ options.packageManager ].cacheKey
  if ( options.cache && cacheKey ) withInput.cache = cacheKey

  return {
    ...( options.named ? { name: "Setup Node" } : {} ),
    uses: `actions/setup-node@${ ACTION_VERSIONS.setupNode }`,
    with: withInput
  }
}

export const checkoutStep = ( named: boolean ): Step => ( {
  ...( named ? { name: "Checkout" } : {} ),
  uses: `actions/checkout@${ ACTION_VERSIONS.checkout }`
} )

export const buildSteps = ( options: BuildStepsOptions ): BuiltSteps => {
  const steps: Step[] = [ checkoutStep( options.named ) ]
  const comments: Record< number, string > = {}

  if ( options.framework === "astro" ) {
    // The action runs install, build and the Pages artifact upload in one step.
    steps.push( {
      ...( options.named ? { name: "Build with Astro" } : {} ),
      uses: `withastro/action@${ ACTION_VERSIONS.withastro }`
    } )
    return { steps, comments }
  }

  const pm = PACKAGE_MANAGERS[ options.packageManager ]

  if ( options.packageManager === "pnpm" ) {
    comments[ steps.length ] = "yaml.steps.pnpmSetup"
    steps.push( {
      ...( options.named ? { name: "Setup pnpm" } : {} ),
      uses: `pnpm/action-setup@${ ACTION_VERSIONS.pnpmActionSetup }`
    } )
  }

  if ( options.packageManager === "bun" ) {
    steps.push( {
      ...( options.named ? { name: "Setup Bun" } : {} ),
      uses: `oven-sh/setup-bun@${ ACTION_VERSIONS.setupBun }`
    } )
  } else {
    steps.push( setupNodeStep( options ) )
  }

  steps.push( {
    ...( options.named ? { name: "Install dependencies" } : {} ),
    run: pm.install
  } )

  for ( const command of options.commands ) {
    steps.push( { ...( options.named ? { name: commandLabel( command ) } : {} ), run: command } )
  }

  return { steps, comments }
}

/** "npm run build" -> "Build", so named steps read well without extra dictionary keys. */
const commandLabel = ( command: string ): string => {
  const script = command.replace( /^(npm run|pnpm run|yarn run|bun run|npm|pnpm|yarn|bun)\s+/, "" )
  const word = script.split( /\s+/ )[ 0 ] || "Run"
  return word.charAt( 0 ).toUpperCase() + word.slice( 1 )
}

/** Command for a package.json script, e.g. "npm run lint" / "pnpm lint". */
export const scriptCommand = ( packageManager: PackageManager, script: string ): string => {
  const pm = PACKAGE_MANAGERS[ packageManager ]
  return script === "test" ? pm.test : `${ pm.run } ${ script }`
}
