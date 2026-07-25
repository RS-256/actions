<script setup lang="ts">
import { useI18n } from "../../composables/useI18n"
import { useTheme } from "../../composables/useTheme"

const { toggle } = useTheme()
const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    :aria-label="t( 'ui.header.theme' )"
    class="cursor-pointer rounded-full p-2 text-muted transition-colors hover:bg-surface-hover hover:text-accent"
    @click="toggle"
  >
    <svg
      class="size-[18px] dark:hidden"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"
      />
    </svg>
    <svg
      class="hidden size-[18px] dark:block"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  </button>
</template>
