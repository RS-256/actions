<script setup lang="ts">
import { useAppState } from "../../composables/useAppState"
import { useI18n } from "../../composables/useI18n"
import { useSections } from "../../composables/useSections"
import { FILE_PATHS } from "../../core/catalog"
import SectionCard from "../ui/SectionCard.vue"

const { state } = useAppState()
const { t } = useI18n()
const { sectionOpen } = useSections()

const open = sectionOpen( "files" )

const cards = [
  { id: "ci", path: FILE_PATHS.ci },
  { id: "deploy", path: FILE_PATHS.deploy },
  { id: "dependabot", path: FILE_PATHS.dependabot }
] as const

const toggle = ( id: ( typeof cards )[ number ][ "id" ] ) => {
  state[ id ].enabled = ! state[ id ].enabled
}
</script>

<template>
  <SectionCard :title="t( 'ui.picker.title' )" :hint="t( 'ui.picker.hint' )" v-model:open="open">
    <div class="grid gap-2.5 sm:grid-cols-3">
      <button
        v-for="card in cards"
        :key="card.id"
        type="button"
        :aria-pressed="state[ card.id ].enabled"
        :class="[
          'cursor-pointer rounded-xl px-3.5 py-3 text-left transition-colors',
          state[ card.id ].enabled
            ? 'bg-accent-soft text-accent-strong'
            : 'border border-line bg-base text-muted hover:bg-surface-hover'
        ]"
        @click="toggle( card.id )"
      >
        <span class="block text-sm font-bold">{{ card.id }}</span>
        <span class="font-mono text-[11.5px] opacity-80">{{ card.path }}</span>
      </button>
    </div>
  </SectionCard>
</template>
