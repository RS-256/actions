import type { AppState } from "../types/config"
import { DEFAULT_ECOSYSTEM_DIRECTORY } from "./catalog"

/**
 * The default state. Also the baseline that serialize.ts diffs against, so every
 * field must be present and stable.
 */
export const createDefaultState = (): AppState => ( {
  ui: { language: "en_us" },
  common: {
    packageManager: "npm",
    nodeVersion: "22",
    defaultBranch: "main",
    timezone: "Asia/Tokyo"
  },
  ci: {
    enabled: true,
    targetBranches: [ "main" ],
    prTypes: [ "opened", "synchronize", "reopened" ],
    nodeVersions: [ "22" ],
    packageManager: { mode: "inherit" },
    jobs: { lint: false, test: true, build: true },
    concurrency: true
  },
  deploy: {
    enabled: true,
    target: "github-pages",
    framework: "none",
    branches: [ "main" ],
    manualDispatch: true,
    nodeVersion: { mode: "inherit" },
    packageManager: { mode: "inherit" },
    installCommand: null,
    buildCommand: null,
    outputDir: "dist",
    cache: true,
    concurrency: true,
    deployCommand: "",
    secrets: []
  },
  dependabot: {
    enabled: true,
    ecosystems: [
      { id: "npm", directory: DEFAULT_ECOSYSTEM_DIRECTORY },
      { id: "github-actions", directory: DEFAULT_ECOSYSTEM_DIRECTORY }
    ],
    groupMinorPatch: true,
    groupName: "minor-and-patch",
    interval: "weekly",
    day: "monday",
    time: "09:00",
    timezone: { mode: "inherit" },
    openPullRequestsLimit: 5,
    labels: [],
    commitMessagePrefix: "",
    ignoreMajor: false,
    autoMerge: {
      enabled: false,
      strategy: "same-workflow",
      updateTypes: [ "minor", "patch" ],
      mergeMethod: "squash",
      approve: false
    }
  },
  output: {
    comments: true,
    commentLanguage: "ui",
    generatedBy: true
  }
} )
