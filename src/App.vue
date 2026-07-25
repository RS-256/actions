<script setup lang="ts">
import { onMounted, ref } from "vue"
import SiteFooter from "./components/layout/SiteFooter.vue"
import SiteHeader from "./components/layout/SiteHeader.vue"
import PreviewPane from "./components/preview/PreviewPane.vue"
import CiPanel from "./components/workflow/CiPanel.vue"
import CommonPanel from "./components/workflow/CommonPanel.vue"
import DependabotPanel from "./components/workflow/DependabotPanel.vue"
import DeployPanel from "./components/workflow/DeployPanel.vue"
import WorkflowPicker from "./components/workflow/WorkflowPicker.vue"
import { restoreState, startPersistence, useAppState } from "./composables/useAppState"
import { useI18n } from "./composables/useI18n"

const { reset } = useAppState()
const { t } = useI18n()

/** Restoring is async (the shared payload is inflated), so hold the panels back. */
const ready = ref( false )

onMounted( async () => {
  await restoreState()
  document.title = `${ t( "ui.app.toolName" ) } | rs256`
  startPersistence()
  ready.value = true
} )
</script>

<template>
  <SiteHeader />

  <main class="mx-auto w-full max-w-7xl flex-1 px-4 pt-7 pb-12 sm:px-6">
    <div class="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-[26px] font-extrabold tracking-tight">{{ t( "ui.app.title" ) }}</h1>
        <p class="text-muted">{{ t( "ui.app.lede" ) }}</p>
      </div>
      <button
        type="button"
        class="shrink-0 cursor-pointer rounded-full border border-line px-4 py-1.5 text-[13px] text-muted transition-colors hover:bg-surface-hover hover:text-ink"
        @click="reset"
      >
        {{ t( "ui.app.reset" ) }}
      </button>
    </div>

    <div v-if="ready" class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_520px]">
      <!--
        Every card stays mounted. A file that is off keeps its card, greyed out
        and collapsed, so toggling files does not reshuffle the page.
      -->
      <div>
        <WorkflowPicker />
        <CiPanel />
        <DeployPanel />
        <DependabotPanel />
        <CommonPanel />
      </div>
      <PreviewPane />
    </div>
  </main>

  <SiteFooter />
</template>
