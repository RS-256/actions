<script setup lang="ts">
defineProps< { label?: string } >()
</script>

<template>
  <div class="mt-3.5 border-t border-dashed border-line pt-2.5 first:mt-0 first:border-t-0 first:pt-0">
    <p v-if="label" class="mb-1.5 text-xs font-bold tracking-wide text-muted">{{ label }}</p>
    <slot />
  </div>
</template>
