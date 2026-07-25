<script setup lang="ts">
import type { GeneratedFile } from "../../types/config"

defineProps< { files: GeneratedFile[]; activePath: string | undefined } >()
const emit = defineEmits< ( event: "select", path: string ) => void >()
</script>

<template>
  <div class="flex flex-wrap" role="tablist">
    <button
      v-for="file in files"
      :key="file.path"
      type="button"
      role="tab"
      :aria-selected="file.path === activePath"
      :title="file.path"
      :class="[
        'cursor-pointer border-b-2 px-3 pt-[7px] pb-[9px] font-mono text-[12.5px] transition-colors',
        file.path === activePath
          ? 'border-accent text-accent-strong'
          : 'border-transparent text-muted hover:text-ink'
      ]"
      @click="emit( 'select', file.path )"
    >
      {{ file.label }}
    </button>
  </div>
</template>
