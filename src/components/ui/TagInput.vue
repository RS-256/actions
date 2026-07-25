<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "../../composables/useI18n"

/** Comma- or Enter-separated list of short values: branches, labels, secret names. */
const props = defineProps< { modelValue: string[]; placeholder?: string; mono?: boolean; ariaLabel?: string } >()
const emit = defineEmits< ( event: "update:modelValue", value: string[] ) => void >()

const { t } = useI18n()
const draft = ref( "" )

const commit = () => {
  const values = draft.value
    .split( "," )
    .map( ( value ) => value.trim() )
    .filter( ( value ) => value.length > 0 && ! props.modelValue.includes( value ) )
  if ( values.length > 0 ) emit( "update:modelValue", [ ...props.modelValue, ...values ] )
  draft.value = ""
}

const remove = ( value: string ) => {
  emit(
    "update:modelValue",
    props.modelValue.filter( ( entry ) => entry !== value )
  )
}
</script>

<template>
  <div class="flex min-w-0 flex-wrap items-center gap-1.5">
    <span
      v-for="value in modelValue"
      :key="value"
      class="inline-flex items-center gap-1 rounded-full bg-accent-soft py-1 pr-1.5 pl-3 text-[13px] text-accent-strong"
      :class="mono ? 'font-mono text-xs' : ''"
    >
      {{ value }}
      <button
        type="button"
        class="cursor-pointer rounded-full px-1 leading-none opacity-70 transition-opacity hover:opacity-100"
        :aria-label="t( 'ui.tagInput.remove', { value } )"
        @click="remove( value )"
      >
        &times;
      </button>
    </span>
    <input
      v-model="draft"
      type="text"
      :aria-label="ariaLabel"
      :placeholder="placeholder ?? t( 'ui.tagInput.placeholder' )"
      class="w-32 min-w-0 flex-1 rounded-lg border border-line bg-base px-2.5 py-1.5 text-[13px] text-ink transition-colors hover:border-accent-soft"
      :class="mono ? 'font-mono text-xs' : ''"
      @keydown.enter.prevent="commit"
      @blur="commit"
    />
  </div>
</template>
