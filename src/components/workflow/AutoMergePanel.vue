<script setup lang="ts">
import { computed } from "vue"
import { useAppState } from "../../composables/useAppState"
import { useI18n } from "../../composables/useI18n"
import { UPDATE_TYPES } from "../../core/catalog"
import type { AutoMergeConfig, UpdateType } from "../../types/config"
import FieldGroup from "../ui/FieldGroup.vue"
import FieldRow from "../ui/FieldRow.vue"
import NoticeBanner from "../ui/NoticeBanner.vue"
import SelectField from "../ui/SelectField.vue"
import ToggleBadge from "../ui/ToggleBadge.vue"
import ToggleSwitch from "../ui/ToggleSwitch.vue"

const { state, notices } = useAppState()
const { t } = useI18n()

const autoMerge = computed( () => state.dependabot.autoMerge )
/** Auto-merge has no meaning without the Dependabot pull requests it merges. */
const disabled = computed( () => ! state.dependabot.enabled )
const ownNotices = computed( () => notices.value.filter( ( notice ) => notice.scope === "autoMerge" ) )

const strategyOptions: { value: AutoMergeConfig[ "strategy" ]; label: string }[] = [
  { value: "same-workflow", label: t( "ui.option.strategy.same-workflow" ) },
  { value: "branch-protection", label: t( "ui.option.strategy.branch-protection" ) }
]
const mergeMethodOptions: { value: AutoMergeConfig[ "mergeMethod" ]; label: string }[] = [
  { value: "squash", label: "squash" },
  { value: "merge", label: "merge" },
  { value: "rebase", label: "rebase" }
]

const toggleUpdateType = ( type: UpdateType ) => {
  autoMerge.value.updateTypes = autoMerge.value.updateTypes.includes( type )
    ? autoMerge.value.updateTypes.filter( ( entry ) => entry !== type )
    : UPDATE_TYPES.filter( ( entry ) => entry === type || autoMerge.value.updateTypes.includes( entry ) )
}
</script>

<template>
  <FieldGroup :label="t( 'ui.group.autoMerge' )">
    <FieldRow :label="t( 'ui.field.autoMergeEnabled' )">
      <ToggleSwitch
        v-model="autoMerge.enabled"
        :disabled="disabled"
        :aria-label="t( 'ui.field.autoMergeEnabled' )"
        :title="disabled ? t( 'help.autoMerge.needsDependabot' ) : undefined"
      />
    </FieldRow>

    <template v-if="autoMerge.enabled && !disabled">
      <FieldRow :label="t( 'ui.field.strategy' )">
        <SelectField
          :model-value="autoMerge.strategy"
          :options="strategyOptions"
          width="max-w-[260px]"
          :aria-label="t( 'ui.field.strategy' )"
          @update:model-value="autoMerge.strategy = $event as AutoMergeConfig[ 'strategy' ]"
        />
      </FieldRow>
      <FieldRow :label="t( 'ui.field.updateTypes' )">
        <ToggleBadge
          v-for="type in UPDATE_TYPES"
          :key="type"
          :label="type"
          mono
          :selected="autoMerge.updateTypes.includes( type )"
          @update:selected="toggleUpdateType( type )"
        />
      </FieldRow>
      <FieldRow :label="t( 'ui.field.mergeMethod' )">
        <SelectField
          :model-value="autoMerge.mergeMethod"
          :options="mergeMethodOptions"
          width="max-w-[140px]"
          :aria-label="t( 'ui.field.mergeMethod' )"
          @update:model-value="autoMerge.mergeMethod = $event as AutoMergeConfig[ 'mergeMethod' ]"
        />
      </FieldRow>
      <FieldRow :label="t( 'ui.field.approve' )">
        <ToggleSwitch v-model="autoMerge.approve" :aria-label="t( 'ui.field.approve' )" />
      </FieldRow>
    </template>

    <NoticeBanner
      v-for="notice in ownNotices"
      :key="notice.key"
      :level="notice.level"
      :text="t( notice.key, notice.params )"
    />
  </FieldGroup>
</template>
