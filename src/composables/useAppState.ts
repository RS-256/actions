import { computed, reactive, watch } from "vue"
import { LANG_IDS, resolveLang, toBcp47 } from "../assets/lang"
import { createDefaultState } from "../core/defaults"
import { generateAll } from "../core/generators"
import { collectNotices } from "../core/notices"
import { decodeState, encodeState, mergeState } from "../core/serialize"
import type { AppState, Lang } from "../types/config"

/**
 * Singleton store: a module-scoped reactive object, the same pattern as
 * mc_animator/src/composables/useAppState.ts. No store library is needed for a
 * single configuration object.
 */

const STORAGE_KEY = "actions-gen:state"
const LANG_STORAGE_KEY = "actions-gen:lang"
const QUERY_KEY = "c"
const PERSIST_DEBOUNCE_MS = 300

const state = reactive< AppState >( createDefaultState() )

/**
 * Generation is a computed, never an imperative "regenerate on change" call.
 * The reactive proxy is passed through on purpose: unwrapping it with toRaw()
 * would stop the computed from tracking anything.
 */
const files = computed( () => generateAll( state ) )

const notices = computed( () => collectNotices( state ) )

const apply = ( next: AppState ): void => {
  Object.assign( state, next )
}

export const resetState = (): void => {
  apply( createDefaultState() )
}

const storedLanguage = (): Lang | null => {
  const saved = localStorage.getItem( LANG_STORAGE_KEY )
  return saved && LANG_IDS.includes( saved as Lang ) ? ( saved as Lang ) : null
}

/** URL query wins over localStorage, which wins over the defaults. */
export const restoreState = async (): Promise< void > => {
  const shared = new URLSearchParams( window.location.search ).get( QUERY_KEY )
  if ( shared ) {
    const decoded = await decodeState( shared )
    if ( decoded ) {
      apply( decoded )
      return
    }
  }

  const saved = localStorage.getItem( STORAGE_KEY )
  if ( saved ) {
    try {
      apply( mergeState( JSON.parse( saved ) ) )
      return
    } catch {
      // Fall through to the defaults rather than showing a blank page.
    }
  }

  state.ui.language = storedLanguage() ?? resolveLang( navigator.language )
}

let persistTimer: number | undefined

/** Keeps localStorage and the ?c= query in step with the current state. */
export const startPersistence = (): void => {
  watch(
    () => JSON.stringify( state ),
    ( json ) => {
      window.clearTimeout( persistTimer )
      persistTimer = window.setTimeout( async () => {
        localStorage.setItem( STORAGE_KEY, json )
        localStorage.setItem( LANG_STORAGE_KEY, state.ui.language )
        const url = new URL( window.location.href )
        // An untouched configuration needs no query string.
        if ( json === JSON.stringify( createDefaultState() ) ) url.searchParams.delete( QUERY_KEY )
        else url.searchParams.set( QUERY_KEY, await encodeState( state ) )
        window.history.replaceState( null, "", url )
      }, PERSIST_DEBOUNCE_MS )
    },
    { immediate: true }
  )

  watch(
    () => state.ui.language,
    ( lang ) => {
      document.documentElement.lang = toBcp47( lang )
    },
    { immediate: true }
  )
}

export const shareUrl = async (): Promise< string > => {
  const url = new URL( window.location.href )
  url.searchParams.set( QUERY_KEY, await encodeState( state ) )
  return url.toString()
}

export const useAppState = () => ( { state, files, notices, reset: resetState } )
