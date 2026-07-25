<script setup lang="ts">
interface Props {
  modelValue: string
  placeholder?: string
  disabled?: boolean
  width?: string
  mono?: boolean
  ariaLabel?: string
  type?: "text" | "number" | "time"
  min?: number
}

defineProps< Props >()
const emit = defineEmits< ( event: "update:modelValue", value: string ) => void >()
</script>

<template>
  <input
    :type="type ?? 'text'"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :min="min"
    :aria-label="ariaLabel"
    :class="[
      'w-full rounded-lg border border-line bg-base px-2.5 py-1.5 text-[13px] text-ink transition-colors',
      'hover:border-accent-soft disabled:cursor-not-allowed disabled:opacity-45',
      mono ? 'font-mono text-xs' : '',
      width ?? 'max-w-[260px]'
    ]"
    @input="emit( 'update:modelValue', ( $event.target as HTMLInputElement ).value )"
  />
</template>
