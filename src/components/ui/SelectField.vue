<script setup lang="ts">
interface Option {
  value: string
  label: string
}

defineProps< { modelValue: string; options: Option[]; disabled?: boolean; width?: string; ariaLabel?: string } >()
const emit = defineEmits< ( event: "update:modelValue", value: string ) => void >()
</script>

<template>
  <select
    :value="modelValue"
    :disabled="disabled"
    :aria-label="ariaLabel"
    :class="[
      'w-full rounded-lg border border-line bg-base px-2.5 py-1.5 text-[13px] text-ink transition-colors',
      'hover:border-accent-soft disabled:cursor-not-allowed disabled:opacity-45',
      width ?? 'max-w-[260px]'
    ]"
    @change="emit( 'update:modelValue', ( $event.target as HTMLSelectElement ).value )"
  >
    <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
  </select>
</template>
