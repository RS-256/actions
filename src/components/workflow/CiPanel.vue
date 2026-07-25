<script setup lang="ts">
import { computed } from "vue"
import { useAppState } from "../../composables/useAppState"
import { useI18n } from "../../composables/useI18n"
import { useSections } from "../../composables/useSections"
import { CI_JOB_IDS, NODE_VERSIONS, PACKAGE_MANAGER_IDS } from "../../core/catalog"
import type { PackageManager, PrType } from "../../types/config"
import FieldGroup from "../ui/FieldGroup.vue"
import FieldRow from "../ui/FieldRow.vue"
import InheritableField from "../ui/InheritableField.vue"
import SectionCard from "../ui/SectionCard.vue"
import TagInput from "../ui/TagInput.vue"
import ToggleBadge from "../ui/ToggleBadge.vue"
import ToggleSwitch from "../ui/ToggleSwitch.vue"

const { state } = useAppState()
const { t } = useI18n()
const { sectionOpen } = useSections()

const open = sectionOpen( "ci" )

const PR_TYPES: PrType[] = [ "opened", "synchronize", "reopened" ]
const packageManagerOptions: { value: PackageManager; label: string }[] = PACKAGE_MANAGER_IDS.map( ( id ) => ( {
  value: id,
  label: id
} ) )

const ci = computed( () => state.ci )

const toggleNodeVersion = ( version: string ) => {
  const next = ci.value.nodeVersions.includes( version )
    ? ci.value.nodeVersions.filter( ( entry ) => entry !== version )
    : [ ...ci.value.nodeVersions, version ]
  // Sorted so the generated matrix does not depend on click order.
  ci.value.nodeVersions = next.sort( ( a, b ) => Number( a ) - Number( b ) )
}

const togglePrType = ( type: PrType ) => {
  ci.value.prTypes = ci.value.prTypes.includes( type )
    ? ci.value.prTypes.filter( ( entry ) => entry !== type )
    : PR_TYPES.filter( ( entry ) => entry === type || ci.value.prTypes.includes( entry ) )
}
</script>

<template>
  <SectionCard :title="t( 'ui.section.ci.title' )" :hint="t( 'ui.section.ci.hint' )" v-model:open="open" :disabled="!state.ci.enabled">
    <FieldGroup :label="t( 'ui.group.jobs' )">
      <div class="flex flex-wrap gap-1.5">
        <ToggleBadge
          v-for="job in CI_JOB_IDS"
          :key="job"
          :label="job"
          mono
          :selected="ci.jobs[ job ]"
          @update:selected="ci.jobs[ job ] = $event"
        />
      </div>
      <p class="mt-1.5 text-xs text-muted">{{ t( "help.ci.jobs" ) }}</p>
    </FieldGroup>

    <FieldGroup :label="t( 'ui.group.trigger' )">
      <FieldRow :label="t( 'ui.field.targetBranches' )">
        <TagInput v-model="ci.targetBranches" mono :aria-label="t( 'ui.field.targetBranches' )" />
      </FieldRow>
      <FieldRow :label="t( 'ui.field.prTypes' )" :help="t( 'help.ci.prTypes' )">
        <ToggleBadge
          v-for="type in PR_TYPES"
          :key="type"
          :label="type"
          mono
          :selected="ci.prTypes.includes( type )"
          @update:selected="togglePrType( type )"
        />
      </FieldRow>
      <FieldRow :label="t( 'ui.field.concurrency' )">
        <ToggleSwitch v-model="ci.concurrency" :aria-label="t( 'ui.field.concurrency' )" />
      </FieldRow>
    </FieldGroup>

    <FieldGroup :label="t( 'ui.group.build' )">
      <FieldRow :label="t( 'ui.field.nodeVersions' )" :help="t( 'help.ci.nodeVersions' )">
        <ToggleBadge
          v-for="version in NODE_VERSIONS"
          :key="version"
          :label="version"
          mono
          :selected="ci.nodeVersions.includes( version )"
          @update:selected="toggleNodeVersion( version )"
        />
      </FieldRow>
      <FieldRow :label="t( 'ui.field.packageManager' )">
        <InheritableField
          v-model="ci.packageManager"
          :options="packageManagerOptions"
          :shared="state.common.packageManager"
          width="max-w-[190px]"
          :aria-label="t( 'ui.field.packageManager' )"
        />
      </FieldRow>
    </FieldGroup>
  </SectionCard>
</template>
