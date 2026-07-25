import { computed } from "vue"
import { createTranslator, type Params } from "../core/i18n"
import type { Lang } from "../types/config"
import { useAppState } from "./useAppState"

/** Reactive wrapper around core/i18n. UI components use this; generators do not. */
export const useI18n = () => {
  const { state } = useAppState()
  const translator = computed( () => createTranslator( state.ui.language ) )

  return {
    language: computed( () => state.ui.language ),
    setLanguage: ( lang: Lang ) => {
      state.ui.language = lang
    },
    t: ( key: string, params?: Params ) => translator.value( key, params )
  }
}
