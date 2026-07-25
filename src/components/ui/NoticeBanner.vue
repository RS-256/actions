<script setup lang="ts">
import type { NoticeLevel } from "../../core/notices"

defineProps< { level: NoticeLevel; text: string } >()
</script>

<template>
  <div
    class="mt-3 rounded-[10px] px-3.5 py-2.5 text-[12.5px] leading-relaxed whitespace-pre-line"
    :class="level === 'warning' ? 'bg-warn-field text-warn-ink' : 'bg-info-field text-info-ink'"
    :role="level === 'warning' ? 'alert' : undefined"
  >
    {{ text }}
  </div>
</template>
