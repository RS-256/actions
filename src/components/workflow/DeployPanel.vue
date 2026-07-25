<script setup lang="ts">
import { computed } from "vue"
import { useAppState } from "../../composables/useAppState"
import { useI18n } from "../../composables/useI18n"
import { useSections } from "../../composables/useSections"
import { NODE_VERSION_FILE, NODE_VERSIONS, PACKAGE_MANAGER_IDS, PACKAGE_MANAGERS } from "../../core/catalog"
import { resolve } from "../../core/resolve"
import { scriptCommand } from "../../core/steps"
import type { DeployConfig, PackageManager } from "../../types/config"
import FieldGroup from "../ui/FieldGroup.vue"
import FieldRow from "../ui/FieldRow.vue"
import InheritableField from "../ui/InheritableField.vue"
import NoticeBanner from "../ui/NoticeBanner.vue"
import SectionCard from "../ui/SectionCard.vue"
import SelectField from "../ui/SelectField.vue"
import TagInput from "../ui/TagInput.vue"
import TextField from "../ui/TextField.vue"
import ToggleSwitch from "../ui/ToggleSwitch.vue"

const { state, notices } = useAppState()
const { t } = useI18n()
const { sectionOpen } = useSections()

const open = sectionOpen( "deploy" )

const deploy = computed( () => state.deploy )
const pages = computed( () => deploy.value.target === "github-pages" )
const ownNotices = computed( () => notices.value.filter( ( notice ) => notice.scope === "deploy" ) )

const packageManager = computed( () => resolve( deploy.value.packageManager, state.common.packageManager ) )

const packageManagerOptions: { value: PackageManager; label: string }[] = PACKAGE_MANAGER_IDS.map( ( id ) => ( {
  value: id,
  label: id
} ) )
const nodeVersionOptions = [
  ...NODE_VERSIONS.map( ( version ) => ( { value: version, label: version } ) ),
  { value: NODE_VERSION_FILE, label: t( "ui.option.nodeVersion.nvmrc" ) }
]
const targetOptions: { value: DeployConfig[ "target" ]; label: string }[] = [
  { value: "github-pages", label: t( "ui.option.target.github-pages" ) },
  { value: "custom", label: t( "ui.option.target.custom" ) }
]
const frameworkOptions: { value: DeployConfig[ "framework" ]; label: string }[] = [
  { value: "none", label: t( "ui.option.framework.none" ) },
  { value: "astro", label: t( "ui.option.framework.astro" ) }
]

/** Empty means "derive from the package manager", so the placeholder shows what will be emitted. */
const installPlaceholder = computed( () => PACKAGE_MANAGERS[ packageManager.value ].install )
const buildPlaceholder = computed( () => scriptCommand( packageManager.value, "build" ) )
</script>

<template>
  <SectionCard :title="t( 'ui.section.deploy.title' )" :hint="t( 'ui.section.deploy.hint' )" v-model:open="open" :disabled="!state.deploy.enabled">
    <FieldGroup>
      <FieldRow :label="t( 'ui.field.target' )">
        <SelectField
          :model-value="deploy.target"
          :options="targetOptions"
          width="max-w-[200px]"
          :aria-label="t( 'ui.field.target' )"
          @update:model-value="deploy.target = $event as DeployConfig[ 'target' ]"
        />
      </FieldRow>
      <FieldRow v-if="pages" :label="t( 'ui.field.framework' )" :help="t( 'help.deploy.framework' )">
        <SelectField
          :model-value="deploy.framework"
          :options="frameworkOptions"
          width="max-w-[200px]"
          :aria-label="t( 'ui.field.framework' )"
          @update:model-value="deploy.framework = $event as DeployConfig[ 'framework' ]"
        />
      </FieldRow>
    </FieldGroup>

    <FieldGroup :label="t( 'ui.group.trigger' )">
      <FieldRow :label="t( 'ui.field.branches' )">
        <TagInput v-model="deploy.branches" mono :aria-label="t( 'ui.field.branches' )" />
      </FieldRow>
      <FieldRow :label="t( 'ui.field.manualDispatch' )">
        <ToggleSwitch v-model="deploy.manualDispatch" :aria-label="t( 'ui.field.manualDispatch' )" />
      </FieldRow>
      <FieldRow :label="t( 'ui.field.concurrency' )">
        <ToggleSwitch v-model="deploy.concurrency" :aria-label="t( 'ui.field.concurrency' )" />
      </FieldRow>
    </FieldGroup>

    <FieldGroup :label="t( 'ui.group.build' )">
      <FieldRow :label="t( 'ui.field.nodeVersion' )">
        <InheritableField
          v-model="deploy.nodeVersion"
          :options="nodeVersionOptions"
          :shared="state.common.nodeVersion"
          width="max-w-[190px]"
          :aria-label="t( 'ui.field.nodeVersion' )"
        />
      </FieldRow>
      <FieldRow :label="t( 'ui.field.packageManager' )">
        <InheritableField
          v-model="deploy.packageManager"
          :options="packageManagerOptions"
          :shared="state.common.packageManager"
          width="max-w-[190px]"
          :aria-label="t( 'ui.field.packageManager' )"
        />
      </FieldRow>
      <template v-if="deploy.framework === 'none'">
        <FieldRow :label="t( 'ui.field.installCommand' )" :help="t( 'help.deploy.installCommand' )">
          <TextField
            :model-value="deploy.installCommand ?? ''"
            :placeholder="installPlaceholder"
            mono
            :aria-label="t( 'ui.field.installCommand' )"
            @update:model-value="deploy.installCommand = $event.trim() === '' ? null : $event"
          />
        </FieldRow>
        <FieldRow :label="t( 'ui.field.buildCommand' )">
          <TextField
            :model-value="deploy.buildCommand ?? ''"
            :placeholder="buildPlaceholder"
            mono
            :aria-label="t( 'ui.field.buildCommand' )"
            @update:model-value="deploy.buildCommand = $event.trim() === '' ? null : $event"
          />
        </FieldRow>
        <FieldRow :label="t( 'ui.field.cache' )">
          <ToggleSwitch v-model="deploy.cache" :aria-label="t( 'ui.field.cache' )" />
        </FieldRow>
      </template>
      <FieldRow v-if="pages && deploy.framework === 'none'" :label="t( 'ui.field.outputDir' )">
        <TextField v-model="deploy.outputDir" mono width="max-w-[160px]" />
      </FieldRow>
    </FieldGroup>

    <FieldGroup v-if="!pages">
      <FieldRow :label="t( 'ui.field.deployCommand' )">
        <TextField v-model="deploy.deployCommand" mono :aria-label="t( 'ui.field.deployCommand' )" />
      </FieldRow>
      <FieldRow :label="t( 'ui.field.secrets' )">
        <TagInput v-model="deploy.secrets" mono :aria-label="t( 'ui.field.secrets' )" />
      </FieldRow>
    </FieldGroup>

    <NoticeBanner
      v-for="notice in ownNotices"
      :key="notice.key"
      :level="notice.level"
      :text="t( notice.key, notice.params )"
    />
  </SectionCard>
</template>
