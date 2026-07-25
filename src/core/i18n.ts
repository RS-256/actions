import { DEFAULT_LANG, LANGUAGES, type MessageKey } from "../assets/lang"
import type { Lang } from "../types/config"

export type Params = Record< string, string | number >

export type Translator = ( key: MessageKey, params?: Params ) => string

const interpolate = ( raw: string, params?: Params ): string =>
  params ? raw.replace( /\{(\w+)\}/g, ( _, k ) => String( params[ k ] ?? "" ) ) : raw

/**
 * Missing keys fall back to en_us and then to the key itself; never throws.
 * A missing comment should not break the generated YAML.
 */
export const createTranslator =
  ( lang: Lang ): Translator =>
  ( key, params ) =>
    interpolate( LANGUAGES[ lang ][ key ] ?? LANGUAGES[ DEFAULT_LANG ][ key ] ?? key, params )

/**
 * Used when comments are turned off: generators keep calling t() and yaml.ts
 * skips every empty comment, so no generator needs an "if comments" branch.
 */
export const silentTranslator: Translator = () => ""
