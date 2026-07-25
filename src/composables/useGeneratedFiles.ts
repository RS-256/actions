import { computed, ref, watch } from "vue"
import { useAppState } from "./useAppState"
import { useHighlighter } from "./useHighlighter"

/** Highlighting is the only thing worth debouncing; generation itself is a few ms. */
const HIGHLIGHT_DEBOUNCE_MS = 100

const activePath = ref< string | null >( null )

export const useGeneratedFiles = () => {
  const { files } = useAppState()
  const { highlight, failed, load } = useHighlighter()

  const activeFile = computed(
    () => files.value.find( ( file ) => file.path === activePath.value ) ?? files.value[ 0 ]
  )

  const highlighted = ref< string | null >( null )
  let timer: number | undefined

  watch(
    [ () => activeFile.value?.content, highlight ],
    ( [ content ] ) => {
      window.clearTimeout( timer )
      if ( ! content ) {
        highlighted.value = null
        return
      }
      if ( ! highlight.value ) {
        void load()
        return
      }
      timer = window.setTimeout( () => {
        highlighted.value = highlight.value?.( content ) ?? null
      }, HIGHLIGHT_DEBOUNCE_MS )
    },
    { immediate: true }
  )

  return {
    files,
    activeFile,
    activePath,
    select: ( path: string ) => {
      activePath.value = path
    },
    highlighted,
    highlightFailed: failed
  }
}
