<script setup lang="ts">
interface Props {
  label: string
  selected: boolean
  disabled?: boolean
  title?: string
  mono?: boolean
}

const props = defineProps< Props >()
const emit = defineEmits< ( event: "update:selected", value: boolean ) => void >()

const toggle = () => {
  if ( ! props.disabled ) emit( "update:selected", ! props.selected )
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="selected"
    :disabled="disabled"
    :title="title"
    :class="[
      'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
      mono ? 'font-mono text-[12.5px]' : '',
      selected
        ? 'bg-accent-soft text-accent-strong'
        : 'border border-line text-muted hover:bg-surface-hover hover:text-ink',
      disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'
    ]"
    @click="toggle"
  >
    {{ label }}
  </button>
</template>
