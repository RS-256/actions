<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "../../composables/useI18n"

/**
 * A settings card whose body collapses.
 *
 * A disabled card (its file is turned off) stays visible but is greyed out and
 * held closed, so toggling files does not reshuffle the page. This is a
 * deliberate departure from spec 3, which asked for the panel to be removed
 * from the DOM entirely.
 */

interface Props {
  title: string
  hint?: string
  open: boolean
  /** The file this card belongs to is off. */
  disabled?: boolean
}

const props = defineProps< Props >()
const emit = defineEmits< ( event: "update:open", value: boolean ) => void >()

const { t } = useI18n()

const expanded = computed( () => props.open && ! props.disabled )
</script>

<template>
  <section
    class="mb-4 rounded-xl border border-line bg-surface transition-opacity"
    :class="disabled ? 'opacity-55' : ''"
  >
    <button
      type="button"
      class="flex w-full items-start gap-3 px-5 py-4 text-left"
      :class="disabled ? 'cursor-not-allowed' : 'cursor-pointer'"
      :aria-expanded="expanded"
      :aria-disabled="disabled"
      :title="disabled ? t( 'ui.section.offHint' ) : t( 'ui.section.toggle' )"
      @click="disabled || emit( 'update:open', !open )"
    >
      <span class="min-w-0 flex-1">
        <span class="block font-display text-[15px] font-bold">{{ title }}</span>
        <span v-if="hint" class="mt-0.5 block text-[12.5px] text-muted">{{ hint }}</span>
      </span>
      <svg
        class="mt-1 size-4 flex-none text-muted transition-transform"
        :class="expanded ? 'rotate-180' : ''"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
    <div v-if="expanded" class="px-5 pb-4">
      <slot />
    </div>
  </section>
</template>
