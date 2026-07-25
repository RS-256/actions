import { computed, reactive, type WritableComputedRef } from "vue"

/**
 * Which settings cards are expanded.
 *
 * This is a view preference, not configuration: it stays out of AppState so it
 * never lands in the shared URL. Cards are expanded unless stored otherwise.
 */

const STORAGE_KEY = "actions-gen:sections"

const load = (): Record< string, boolean > => {
  try {
    const saved = localStorage.getItem( STORAGE_KEY )
    const parsed = saved ? JSON.parse( saved ) : null
    if ( parsed && typeof parsed === "object" && ! Array.isArray( parsed ) ) {
      return Object.fromEntries(
        Object.entries( parsed as Record< string, unknown > ).filter( ( [ , value ] ) => typeof value === "boolean" )
      ) as Record< string, boolean >
    }
  } catch {
    // A corrupted preference should not keep every card closed.
  }
  return {}
}

const openState = reactive< Record< string, boolean > >( load() )

const persist = () => {
  localStorage.setItem( STORAGE_KEY, JSON.stringify( openState ) )
}

export const useSections = () => ( {
  /** Two-way binding for one card, usable as v-model:open. */
  sectionOpen: ( id: string ): WritableComputedRef< boolean > =>
    computed( {
      get: () => openState[ id ] !== false,
      set: ( value: boolean ) => {
        openState[ id ] = value
        persist()
      }
    } )
} )
