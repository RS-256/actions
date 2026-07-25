<script setup lang="ts">
import { useAppState } from "../../composables/useAppState"
import { useI18n } from "../../composables/useI18n"
import { useSections } from "../../composables/useSections"
import { NODE_VERSION_FILE, NODE_VERSIONS, PACKAGE_MANAGER_IDS, TIMEZONES } from "../../core/catalog"
import type { PackageManager } from "../../types/config"
import FieldRow from "../ui/FieldRow.vue"
import SectionCard from "../ui/SectionCard.vue"
import SelectField from "../ui/SelectField.vue"
import TextField from "../ui/TextField.vue"

const { state } = useAppState()
const { t } = useI18n()
const { sectionOpen } = useSections()

const open = sectionOpen( "common" )

const packageManagerOptions = PACKAGE_MANAGER_IDS.map( ( id ) => ( { value: id, label: id } ) )
const nodeVersionOptions = [
  ...NODE_VERSIONS.map( ( version ) => ( { value: version, label: version } ) ),
  { value: NODE_VERSION_FILE, label: t( "ui.option.nodeVersion.nvmrc" ) }
]
const timezoneOptions = TIMEZONES.map( ( zone ) => ( { value: zone, label: zone } ) )
</script>

<template>
  <SectionCard :title="t( 'ui.section.common.title' )" :hint="t( 'ui.section.common.hint' )" v-model:open="open">
    <FieldRow :label="t( 'ui.field.packageManager' )">
      <SelectField
        :model-value="state.common.packageManager"
        :options="packageManagerOptions"
        width="max-w-[140px]"
        @update:model-value="state.common.packageManager = $event as PackageManager"
      />
    </FieldRow>
    <FieldRow :label="t( 'ui.field.nodeVersion' )">
      <SelectField v-model="state.common.nodeVersion" :options="nodeVersionOptions" width="max-w-[160px]" />
    </FieldRow>
    <FieldRow :label="t( 'ui.field.defaultBranch' )">
      <TextField v-model="state.common.defaultBranch" mono width="max-w-[180px]" />
    </FieldRow>
    <FieldRow :label="t( 'ui.field.timezone' )">
      <SelectField v-model="state.common.timezone" :options="timezoneOptions" width="max-w-[200px]" />
    </FieldRow>
  </SectionCard>
</template>
