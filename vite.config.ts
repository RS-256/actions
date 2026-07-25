import { readFileSync } from "node:fs"
import tailwindcss from "@tailwindcss/vite"
import vue from "@vitejs/plugin-vue"
import type { Plugin } from "vite"
import { defineConfig } from "vitest/config"
import { parse } from "yaml"

/**
 * Loads the language dictionaries as plain objects.
 * A dedicated plugin package would pull in a second YAML parser; we already
 * depend on "yaml" for the generators, so reuse it.
 */
const yamlPlugin = (): Plugin => ( {
  name: "rs256-yaml",
  transform( code, id ) {
    if ( !id.endsWith( ".yaml" ) && !id.endsWith( ".yml" ) ) return null
    return { code: `export default ${ JSON.stringify( parse( code ) ) }`, map: null }
  },
  load( id ) {
    // Vite does not read .yaml files by itself, so hand the raw text to transform().
    if ( !id.endsWith( ".yaml" ) && !id.endsWith( ".yml" ) ) return null
    return readFileSync( id.split( "?" )[ 0 ], "utf8" )
  }
} )

export default defineConfig( {
  plugins: [ vue(), tailwindcss(), yamlPlugin() ],
  // GitHub Pages project site: served from rs256.net/actions/.
  base: "/actions/",
  test: {
    environment: "node",
    include: [ "src/**/*.test.ts" ]
  }
} )
