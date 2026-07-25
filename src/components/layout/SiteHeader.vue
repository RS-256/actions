<script setup lang="ts">
import { LANG_IDS } from "../../assets/lang"
import { useI18n } from "../../composables/useI18n"
import type { Lang } from "../../types/config"
import SelectField from "../ui/SelectField.vue"
import ThemeToggle from "./ThemeToggle.vue"

/**
 * The frame is the parent site's header, minus its navigation: the logo, the
 * tool name and the theme toggle. The logo links out with an absolute URL
 * because rs256.net is a separate deployment.
 */

const { t, language, setLanguage } = useI18n()

const languageOptions = LANG_IDS.map( ( id ) => ( { value: id, label: t( `ui.language.${ id }` ) } ) )
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-line bg-base/80 backdrop-blur-md">
    <div class="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
      <div class="flex items-baseline gap-2.5">
        <a
          href="https://rs256.net/"
          class="font-display text-lg font-extrabold tracking-tight transition-colors hover:text-accent-strong"
        >
          rs256<span class="text-accent">.</span>
        </a>
        <span class="text-line">/</span>
        <span class="text-sm font-medium text-muted">{{ t( "ui.app.toolName" ) }}</span>
      </div>
      <div class="flex items-center gap-1 sm:gap-2">
        <SelectField
          :model-value="language"
          :options="languageOptions"
          :aria-label="t( 'ui.language.label' )"
          width="max-w-[110px]"
          @update:model-value="setLanguage( $event as Lang )"
        />
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>
