<script setup lang="ts">
defineProps< { code: string; html: string | null } >()
</script>

<template>
  <!-- eslint-disable vue/no-v-html - the markup comes from Shiki, not from user input -->
  <div v-if="html" class="code-pane overflow-x-auto px-4 py-4" v-html="html" />
  <pre v-else class="code-pane overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-[1.75]">{{ code }}</pre>
</template>

<style scoped>
.code-pane :deep(pre) {
  margin: 0;
  background-color: transparent !important;
}

.code-pane :deep(code) {
  counter-reset: line;
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.75;
  tab-size: 2;
}

/* Line numbers, per the component spec. The copy button uses the raw text, so
   they never end up in the clipboard. */
.code-pane :deep(.line)::before {
  counter-increment: line;
  content: counter(line);
  display: inline-block;
  width: 2.25em;
  margin-right: 1em;
  text-align: right;
  color: var(--c-muted);
  opacity: 0.5;
  user-select: none;
}
</style>
