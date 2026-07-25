import type { Ecosystem, Interval, PackageManager, UpdateType, Weekday } from "../types/config"

/**
 * Values that change over time, kept in one place.
 * When Dependabot bumps an action in this repository, update the matching entry
 * here as well - the generated templates read these versions, not the workflows.
 */
export const ACTION_VERSIONS = {
  checkout: "v7",
  setupNode: "v7",
  uploadPagesArtifact: "v5",
  deployPages: "v5",
  fetchMetadata: "v3",
  withastro: "v6",
  pnpmActionSetup: "v4",
  setupBun: "v2"
} as const

export const DOCS_URLS = {
  workflowSyntax: "https://docs.github.com/actions/reference/workflows-and-actions/workflow-syntax",
  pages:
    "https://docs.github.com/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site",
  dependabot:
    "https://docs.github.com/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file",
  autoMerge:
    "https://docs.github.com/code-security/dependabot/working-with-dependabot/automating-dependabot-with-github-actions"
} as const

export interface PackageManagerSpec {
  id: PackageManager
  /** Lockfile-respecting install command. */
  install: string
  /** Prefix for package.json scripts, e.g. "npm run". */
  run: string
  /** Bare test command; npm needs no "run". */
  test: string
  /** Value for the setup-node "cache" input. */
  cacheKey: string
}

export const PACKAGE_MANAGERS: Record< PackageManager, PackageManagerSpec > = {
  npm: { id: "npm", install: "npm ci", run: "npm run", test: "npm test", cacheKey: "npm" },
  pnpm: { id: "pnpm", install: "pnpm install --frozen-lockfile", run: "pnpm", test: "pnpm test", cacheKey: "pnpm" },
  yarn: { id: "yarn", install: "yarn install --immutable", run: "yarn", test: "yarn test", cacheKey: "yarn" },
  bun: { id: "bun", install: "bun install --frozen-lockfile", run: "bun run", test: "bun test", cacheKey: "" }
}

export const PACKAGE_MANAGER_IDS: PackageManager[] = [ "npm", "pnpm", "yarn", "bun" ]

/** Sentinel for "read the version from .nvmrc" instead of pinning one. */
export const NODE_VERSION_FILE = "nvmrc"

export const NODE_VERSIONS = [ "20", "22", "24", "26" ] as const

export const CI_JOB_IDS = [ "lint", "test", "build" ] as const

export type CiJobId = ( typeof CI_JOB_IDS )[ number ]

export interface EcosystemSpec {
  id: Ecosystem
  /** Human-readable label; the id itself stays visible because the docs use it. */
  label: string
  group: "common" | "other"
}

export const ECOSYSTEMS: EcosystemSpec[] = [
  { id: "npm", label: "npm (Node.js)", group: "common" },
  { id: "github-actions", label: "github-actions", group: "common" },
  { id: "pip", label: "pip (Python)", group: "common" },
  { id: "docker", label: "docker", group: "common" },
  { id: "gradle", label: "gradle (Java)", group: "common" },
  { id: "cargo", label: "cargo (Rust)", group: "common" },
  { id: "gomod", label: "gomod (Go)", group: "common" },
  { id: "uv", label: "uv (Python)", group: "other" },
  { id: "maven", label: "maven (Java)", group: "other" },
  { id: "composer", label: "composer (PHP)", group: "other" },
  { id: "bundler", label: "bundler (Ruby)", group: "other" },
  { id: "nuget", label: "nuget (.NET)", group: "other" },
  { id: "terraform", label: "terraform", group: "other" },
  { id: "swift", label: "swift", group: "other" },
  { id: "pub", label: "pub (Dart)", group: "other" },
  { id: "mix", label: "mix (Elixir)", group: "other" },
  { id: "devcontainers", label: "devcontainers", group: "other" }
]

export const DEFAULT_ECOSYSTEM_DIRECTORY = "/"

export const INTERVALS: Interval[] = [ "daily", "weekly", "monthly" ]

export const WEEKDAYS: Weekday[] = [ "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday" ]

export const UPDATE_TYPES: UpdateType[] = [ "minor", "patch", "major" ]

/** How Dependabot spells an update type, both in dependabot.yml and in fetch-metadata output. */
export const SEMVER_UPDATE_PREFIX = "version-update:semver-"

/** A short list of common zones. Dependabot accepts any IANA name; add more here as needed. */
export const TIMEZONES = [ "Asia/Tokyo", "UTC", "America/Los_Angeles", "America/New_York", "Europe/London" ]

export const FILE_PATHS = {
  ci: ".github/workflows/ci.yml",
  deploy: ".github/workflows/deploy.yml",
  dependabot: ".github/dependabot.yml",
  autoMerge: ".github/workflows/dependabot-auto-merge.yml"
} as const
