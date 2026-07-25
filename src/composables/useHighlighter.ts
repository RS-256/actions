import { ref, shallowRef } from "vue"

/**
 * Shiki, loaded lazily with a fine-grained bundle: one language, two themes and
 * the JavaScript regex engine. Both theme colors are emitted as CSS variables
 * (see global.css), so switching themes needs no re-highlight.
 */

const LIGHT_THEME = "rose-pine-dawn"
const DARK_THEME = "rose-pine-moon"

type Highlight = ( code: string ) => string

const highlight = shallowRef< Highlight | null >( null )
const failed = ref( false )
let pending: Promise< void > | null = null

export const useHighlighter = () => {
  const load = (): Promise< void > => {
    if ( pending ) return pending
    pending = ( async () => {
      try {
        const [ { createHighlighterCore }, { createJavaScriptRegexEngine } ] = await Promise.all( [
          import( "shiki/core" ),
          import( "shiki/engine/javascript" )
        ] )
        const core = await createHighlighterCore( {
          themes: [ import( "@shikijs/themes/rose-pine-dawn" ), import( "@shikijs/themes/rose-pine-moon" ) ],
          langs: [ import( "@shikijs/langs/yaml" ) ],
          engine: createJavaScriptRegexEngine()
        } )
        highlight.value = ( code: string ) =>
          core.codeToHtml( code, {
            lang: "yaml",
            themes: { light: LIGHT_THEME, dark: DARK_THEME },
            defaultColor: false
          } )
      } catch {
        // Plain text is an acceptable fallback; the YAML itself is what matters.
        failed.value = true
      }
    } )()
    return pending
  }

  return { highlight, failed, load }
}
