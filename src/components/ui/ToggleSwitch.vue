<script setup lang="ts">
interface Props {
  modelValue: boolean
  disabled?: boolean
  /** Visible text next to the switch. Inside a FieldRow, use ariaLabel instead. */
  label?: string
  ariaLabel?: string
  title?: string
}

const props = defineProps< Props >()
const emit = defineEmits< ( event: "update:modelValue", value: boolean ) => void >()

const toggle = () => {
  if ( ! props.disabled ) emit( "update:modelValue", ! props.modelValue )
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="ariaLabel ?? label"
    :disabled="disabled"
    :title="title"
    :class="[
      'inline-flex items-center gap-2.5',
      disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'
    ]"
    @click="toggle"
  >
    <span
      :class="[
        'relative h-[21px] w-[38px] flex-none rounded-full transition-colors',
        modelValue ? 'bg-accent' : 'bg-line'
      ]"
    >
      <span
        :class="[
          'absolute top-0.5 left-0.5 size-[17px] rounded-full bg-surface transition-transform',
          modelValue ? 'translate-x-[17px]' : ''
        ]"
        style="box-shadow: 0 1px 2px oklch(0% 0 0 / 0.15)"
      />
    </span>
    <span v-if="label" class="text-[13px] whitespace-nowrap text-muted">{{ label }}</span>
  </button>
</template>
