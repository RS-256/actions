<script setup lang="ts">
defineProps< { label: string; help?: string } >()
</script>

<template>
  <div class="grid items-center gap-1 py-[7px] sm:grid-cols-[168px_minmax(0,1fr)] sm:gap-3">
    <span class="text-[13px] text-muted">{{ label }}</span>
    <div class="flex min-w-0 flex-wrap items-center gap-2">
      <slot />
    </div>
    <p v-if="help" class="text-xs text-muted sm:col-start-2">{{ help }}</p>
  </div>
</template>
