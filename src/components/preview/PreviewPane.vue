<script setup lang="ts">
import { computed } from "vue"
import { useAppState } from "../../composables/useAppState"
import { useGeneratedFiles } from "../../composables/useGeneratedFiles"
import { useI18n } from "../../composables/useI18n"
import type { Lang } from "../../types/config"
import SelectField from "../ui/SelectField.vue"
import ToggleSwitch from "../ui/ToggleSwitch.vue"
import CodeBlock from "./CodeBlock.vue"
import DownloadBar from "./DownloadBar.vue"
import FileTabs from "./FileTabs.vue"

const { state } = useAppState()
const { t } = useI18n()
const { files, activeFile, highlighted, select } = useGeneratedFiles()

/**
 * Comments on/off and the comment language are one control: "no comments" is
 * the fourth option rather than a separate switch.
 */
type CommentChoice = "ui" | Lang | "none"

const commentChoice = computed< string >( {
  get: () => ( state.output.comments ? state.output.commentLanguage : "none" ),
  set: ( value: string ) => {
    const choice = value as CommentChoice
    state.output.comments = choice !== "none"
    if ( choice !== "none" ) state.output.commentLanguage = choice
  }
} )

const commentOptions = computed( () =>
  ( [ "ui", "en_us", "ja_jp", "none" ] as CommentChoice[] ).map( ( value ) => ( {
    value,
    label: t( `ui.option.commentLanguage.${ value }` )
  } ) )
)
</script>

<template>
  <div class="lg:sticky lg:top-20">
    <div class="overflow-hidden rounded-xl border border-line bg-surface">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-line px-2.5 pt-2">
        <FileTabs :files="files" :active-path="activeFile?.path" @select="select" />
        <div class="flex items-center gap-3 pb-1.5">
          <ToggleSwitch
            v-model="state.output.generatedBy"
            :disabled="!state.output.comments"
            :label="t( 'ui.field.generatedBy' )"
            :title="t( 'help.output.generatedBy' )"
          />
          <SelectField
            v-model="commentChoice"
            :options="commentOptions"
            width="max-w-[190px]"
            :aria-label="t( 'ui.option.commentLanguage.ui' )"
          />
        </div>
      </div>

      <CodeBlock v-if="activeFile" :code="activeFile.content" :html="highlighted" />
      <p v-else class="px-4 py-10 text-center text-[13px] text-muted">{{ t( "ui.preview.empty" ) }}</p>

      <DownloadBar :active-file="activeFile" />
    </div>
  </div>
</template>
