<script setup lang="ts" generic="T extends string">
import { computed } from "vue"
import { useI18n } from "../../composables/useI18n"
import type { Inherited } from "../../types/config"
import SelectField from "./SelectField.vue"

/**
 * A field that follows the shared settings until it is given its own value.
 * Both states live in one select, so going back to the shared value is a single
 * choice rather than a separate link.
 */

const INHERIT = "__inherit__"

const props = defineProps< {
  modelValue: Inherited< T >
  options: { value: T; label: string }[]
  shared: T
  disabled?: boolean
  width?: string
  ariaLabel?: string
} >()
const emit = defineEmits< ( event: "update:modelValue", value: Inherited< T > ) => void >()

const { t } = useI18n()

const sharedLabel = computed(
  () => props.options.find( ( option ) => option.value === props.shared )?.label ?? props.shared
)

const selectOptions = computed( () => [
  { value: INHERIT, label: `${ t( "ui.inherit.shared" ) }: ${ sharedLabel.value }` },
  ...props.options
] )

const current = computed( () => ( props.modelValue.mode === "inherit" ? INHERIT : props.modelValue.value ) )

const update = ( value: string ) => {
  emit( "update:modelValue", value === INHERIT ? { mode: "inherit" } : { mode: "override", value: value as T } )
}
</script>

<template>
  <div class="flex min-w-0 flex-col gap-1">
    <SelectField
      :model-value="current"
      :options="selectOptions"
      :disabled="disabled"
      :width="width"
      :aria-label="ariaLabel"
      @update:model-value="update"
    />
    <span v-if="modelValue.mode === 'inherit'" class="text-xs text-muted">{{ t( "ui.inherit.hint" ) }}</span>
  </div>
</template>
