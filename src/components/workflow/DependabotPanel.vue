<script setup lang="ts">
import { computed } from "vue"
import { useAppState } from "../../composables/useAppState"
import { useI18n } from "../../composables/useI18n"
import { useSections } from "../../composables/useSections"
import { INTERVALS, TIMEZONES, WEEKDAYS } from "../../core/catalog"
import type { DependabotConfig, Weekday } from "../../types/config"
import FieldGroup from "../ui/FieldGroup.vue"
import FieldRow from "../ui/FieldRow.vue"
import InheritableField from "../ui/InheritableField.vue"
import NoticeBanner from "../ui/NoticeBanner.vue"
import SectionCard from "../ui/SectionCard.vue"
import SelectField from "../ui/SelectField.vue"
import TagInput from "../ui/TagInput.vue"
import TextField from "../ui/TextField.vue"
import ToggleSwitch from "../ui/ToggleSwitch.vue"
import AutoMergePanel from "./AutoMergePanel.vue"
import EcosystemPicker from "./EcosystemPicker.vue"

const { state, notices } = useAppState()
const { t } = useI18n()
const { sectionOpen } = useSections()

const open = sectionOpen( "dependabot" )

const dependabot = computed( () => state.dependabot )
const ownNotices = computed( () => notices.value.filter( ( notice ) => notice.scope === "dependabot" ) )

const intervalOptions = INTERVALS.map( ( interval ) => ( { value: interval, label: interval } ) )
const weekdayOptions = WEEKDAYS.map( ( day ) => ( { value: day, label: day } ) )
const timezoneOptions = TIMEZONES.map( ( zone ) => ( { value: zone, label: zone } ) )

const limit = computed( {
  get: () => String( dependabot.value.openPullRequestsLimit ),
  set: ( value: string ) => {
    const parsed = Number.parseInt( value, 10 )
    dependabot.value.openPullRequestsLimit = Number.isNaN( parsed ) ? 0 : Math.max( 0, parsed )
  }
} )
</script>

<template>
  <SectionCard :title="t( 'ui.section.dependabot.title' )" :hint="t( 'ui.section.dependabot.hint' )" v-model:open="open" :disabled="!state.dependabot.enabled">
    <FieldGroup :label="t( 'ui.group.ecosystems' )">
      <EcosystemPicker />
    </FieldGroup>

    <FieldGroup :label="t( 'ui.group.schedule' )">
      <FieldRow :label="t( 'ui.field.interval' )">
        <SelectField
          :model-value="dependabot.interval"
          :options="intervalOptions"
          width="max-w-[140px]"
          :aria-label="t( 'ui.field.interval' )"
          @update:model-value="dependabot.interval = $event as DependabotConfig[ 'interval' ]"
        />
      </FieldRow>
      <FieldRow v-if="dependabot.interval === 'weekly'" :label="t( 'ui.field.day' )">
        <SelectField
          :model-value="dependabot.day"
          :options="weekdayOptions"
          width="max-w-[140px]"
          :aria-label="t( 'ui.field.day' )"
          @update:model-value="dependabot.day = $event as Weekday"
        />
      </FieldRow>
      <FieldRow :label="t( 'ui.field.time' )">
        <TextField v-model="dependabot.time" type="time" mono width="max-w-[110px]" />
      </FieldRow>
      <FieldRow :label="t( 'ui.field.timezone' )">
        <InheritableField
          v-model="dependabot.timezone"
          :options="timezoneOptions"
          :shared="state.common.timezone"
          width="max-w-[230px]"
          :aria-label="t( 'ui.field.timezone' )"
        />
      </FieldRow>
    </FieldGroup>

    <FieldGroup :label="t( 'ui.group.options' )">
      <FieldRow :label="t( 'ui.field.groupMinorPatch' )">
        <ToggleSwitch v-model="dependabot.groupMinorPatch" :aria-label="t( 'ui.field.groupMinorPatch' )" />
      </FieldRow>
      <FieldRow v-if="dependabot.groupMinorPatch" :label="t( 'ui.field.groupName' )">
        <TextField v-model="dependabot.groupName" mono width="max-w-[220px]" />
      </FieldRow>
      <FieldRow :label="t( 'ui.field.openPullRequestsLimit' )">
        <TextField
          v-model="limit"
          type="number"
          :min="0"
          width="max-w-[90px]"
          :aria-label="t( 'ui.field.openPullRequestsLimit' )"
        />
      </FieldRow>
      <FieldRow :label="t( 'ui.field.labels' )">
        <TagInput v-model="dependabot.labels" mono :aria-label="t( 'ui.field.labels' )" />
      </FieldRow>
      <FieldRow :label="t( 'ui.field.commitMessagePrefix' )">
        <TextField
          v-model="dependabot.commitMessagePrefix"
          mono
          placeholder="chore(deps)"
          width="max-w-[200px]"
          :aria-label="t( 'ui.field.commitMessagePrefix' )"
        />
      </FieldRow>
      <FieldRow :label="t( 'ui.field.ignoreMajor' )" :help="t( 'help.dependabot.ignoreMajor' )">
        <ToggleSwitch v-model="dependabot.ignoreMajor" :aria-label="t( 'ui.field.ignoreMajor' )" />
      </FieldRow>
    </FieldGroup>

    <AutoMergePanel />

    <NoticeBanner
      v-for="notice in ownNotices"
      :key="notice.key"
      :level="notice.level"
      :text="t( notice.key, notice.params )"
    />
  </SectionCard>
</template>
