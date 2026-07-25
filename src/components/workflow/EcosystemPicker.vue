<script setup lang="ts">
import { computed, ref } from "vue"
import { useAppState } from "../../composables/useAppState"
import { useI18n } from "../../composables/useI18n"
import { DEFAULT_ECOSYSTEM_DIRECTORY, ECOSYSTEMS } from "../../core/catalog"
import type { Ecosystem } from "../../types/config"
import FieldRow from "../ui/FieldRow.vue"
import TextField from "../ui/TextField.vue"
import ToggleBadge from "../ui/ToggleBadge.vue"

const { state } = useAppState()
const { t } = useI18n()

const expanded = ref( false )

const common = ECOSYSTEMS.filter( ( eco ) => eco.group === "common" )
const other = ECOSYSTEMS.filter( ( eco ) => eco.group === "other" )

const selected = computed( () => state.dependabot.ecosystems )

const isSelected = ( id: Ecosystem ) => selected.value.some( ( entry ) => entry.id === id )

const toggle = ( id: Ecosystem ) => {
  if ( isSelected( id ) ) {
    state.dependabot.ecosystems = selected.value.filter( ( entry ) => entry.id !== id )
    return
  }
  // Keep the catalog order so the generated updates list is stable.
  const next = [ ...selected.value, { id, directory: DEFAULT_ECOSYSTEM_DIRECTORY } ]
  state.dependabot.ecosystems = ECOSYSTEMS.flatMap( ( eco ) => next.filter( ( entry ) => entry.id === eco.id ) )
}
</script>

<template>
  <div>
    <div class="flex flex-wrap gap-1.5">
      <ToggleBadge
        v-for="eco in common"
        :key="eco.id"
        :label="eco.label"
        mono
        :selected="isSelected( eco.id )"
        @update:selected="toggle( eco.id )"
      />
      <template v-if="expanded">
        <ToggleBadge
          v-for="eco in other"
          :key="eco.id"
          :label="eco.label"
          mono
          :selected="isSelected( eco.id )"
          @update:selected="toggle( eco.id )"
        />
      </template>
      <ToggleBadge
        :label="expanded ? t( 'ui.ecosystem.less' ) : t( 'ui.ecosystem.more', { count: other.length } )"
        :selected="false"
        @update:selected="expanded = !expanded"
      />
    </div>

    <div v-if="expanded && selected.length > 0" class="mt-3">
      <p class="mb-1.5 text-xs font-bold tracking-wide text-muted">{{ t( "ui.group.directories" ) }}</p>
      <FieldRow
        v-for="entry in selected"
        :key="entry.id"
        :label="entry.id"
        :help="entry.id === selected[ 0 ].id ? t( 'help.dependabot.directory' ) : undefined"
      >
        <TextField v-model="entry.directory" mono width="max-w-[220px]" :aria-label="t( 'ui.field.directory' )" />
      </FieldRow>
    </div>
  </div>
</template>
