<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{
    id: string
    open: boolean
    title: string
    message?: string
    confirmLabel?: string
    busy?: boolean
    danger?: boolean
  }>(),
  { confirmLabel: 'Confirmar' },
)
const emit = defineEmits<{ close: []; confirm: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
watchEffect(() => {
  if (!dialog.value) return
  if (props.open && !dialog.value.open) dialog.value.showModal()
  if (!props.open && dialog.value.open) dialog.value.close()
})
</script>

<template>
  <dialog
    ref="dialog"
    class="confirm-dialog"
    :aria-labelledby="`${id}-title`"
    @cancel.prevent="!busy && emit('close')"
  >
    <form @submit.prevent="emit('confirm')">
      <div class="section-heading">
        <h2 :id="`${id}-title`">{{ title }}</h2>
        <button
          type="button"
          class="icon-button"
          aria-label="Fechar"
          :disabled="busy"
          @click="emit('close')"
        >
          <AppIcon name="close" />
        </button>
      </div>
      <p v-if="message" class="muted">{{ message }}</p>
      <slot />
      <div class="form-actions">
        <button type="button" class="btn-secondary" :disabled="busy" @click="emit('close')">
          Cancelar</button
        ><button type="submit" :class="danger ? 'btn-danger' : 'btn-primary'" :disabled="busy">
          {{ busy ? 'Aguarde...' : confirmLabel }}
        </button>
      </div>
    </form>
  </dialog>
</template>
