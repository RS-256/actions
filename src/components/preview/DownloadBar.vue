<script setup lang="ts">
import { ref } from "vue"
import { shareUrl, useAppState } from "../../composables/useAppState"
import { useI18n } from "../../composables/useI18n"
import { createZip, downloadBlob, downloadText, ZIP_FILENAME } from "../../core/zip"
import type { GeneratedFile } from "../../types/config"

const props = defineProps< { activeFile: GeneratedFile | undefined } >()

const { files } = useAppState()
const { t } = useI18n()

/** Which button has just been used, so its label can confirm the action. */
const flashed = ref< "copy" | "share" | null >( null )

const flash = ( which: "copy" | "share" ) => {
  flashed.value = which
  window.setTimeout( () => {
    if ( flashed.value === which ) flashed.value = null
  }, 1600 )
}

const copy = async () => {
  if ( ! props.activeFile ) return
  await navigator.clipboard.writeText( props.activeFile.content )
  flash( "copy" )
}

const share = async () => {
  await navigator.clipboard.writeText( await shareUrl() )
  flash( "share" )
}

const downloadOne = () => {
  if ( ! props.activeFile ) return
  downloadText( props.activeFile.content, props.activeFile.path.split( "/" ).pop() ?? "workflow.yml" )
}

const downloadAll = async () => {
  downloadBlob( await createZip( files.value ), ZIP_FILENAME )
}

const BUTTON =
  "cursor-pointer rounded-full border border-line px-4 py-1.5 text-[13px] text-muted transition-colors hover:bg-surface-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-45"
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 border-t border-line px-3.5 py-2.5">
    <button type="button" :class="BUTTON" :disabled="!activeFile" @click="copy">
      {{ flashed === "copy" ? t( "ui.preview.copied" ) : t( "ui.preview.copy" ) }}
    </button>
    <button type="button" :class="BUTTON" :disabled="!activeFile" @click="downloadOne">
      {{ t( "ui.preview.download" ) }}
    </button>
    <span class="flex-1" />
    <button type="button" :class="BUTTON" @click="share">
      {{ flashed === "share" ? t( "ui.preview.shared" ) : t( "ui.preview.share" ) }}
    </button>
    <button
      type="button"
      class="cursor-pointer rounded-full bg-accent px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-45 dark:text-[#17111a]"
      :disabled="files.length === 0"
      @click="downloadAll"
    >
      {{ t( "ui.preview.downloadAll" ) }}
    </button>
  </div>
</template>
