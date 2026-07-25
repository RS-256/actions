import type { AppState, Lang } from "../../types/config"
import { createDefaultState } from "../defaults"

type Mutate = ( state: AppState ) => void

/** A default state with the given tweaks applied. */
export const stateWith = ( ...mutations: Mutate[] ): AppState => {
  const state = createDefaultState()
  for ( const mutate of mutations ) mutate( state )
  return state
}

export const withLang =
  ( lang: Lang ): Mutate =>
  ( state ) => {
    state.ui.language = lang
  }

export const stripComments = ( yaml: string ): string =>
  yaml
    .split( "\n" )
    .filter( ( line ) => ! /^\s*#/.test( line ) )
    .join( "\n" )

export const commentLines = ( yaml: string ): string[] => yaml.split( "\n" ).filter( ( line ) => /^\s*#/.test( line ) )
