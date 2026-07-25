import type { Inherited } from "../types/config"

/**
 * Collapses an inheritable field against the shared value.
 * Generators only ever see resolved values; the UI is the only layer that
 * handles Inherited<T>.
 */
export const resolve = < T >( field: Inherited< T >, common: T ): T =>
  field.mode === "inherit" ? common : field.value
