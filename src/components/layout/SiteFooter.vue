<script setup lang="ts">
import { useI18n } from "../../composables/useI18n"

const { t } = useI18n()
</script>

<template>
  <footer class="mt-10 border-t border-line">
    <div
      class="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 text-[12.5px] text-muted sm:px-6"
    >
      <span>{{ t( "ui.footer.copyright" ) }}</span>
      <a href="https://rs256.net/" class="transition-colors hover:text-accent-strong">
        {{ t( "ui.footer.parent" ) }}
      </a>
    </div>
  </footer>
</template>
