<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { imageUrl } from '../utils/format'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ modelValue: File | null; existingImage?: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [file: File | null] }>()
const error = ref('')
const preview = ref('')
const dragging = ref(false)
const input = ref<HTMLInputElement | null>(null)

function selectFile(file?: File) {
  dragging.value = false
  error.value = ''
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    error.value = 'Escolha uma imagem JPG, PNG ou WEBP.'
  else if (file.size > 5 * 1024 * 1024) error.value = 'A imagem deve ter no máximo 5 MB.'
  else emit('update:modelValue', file)
  if (input.value) input.value.value = ''
}
watch(
  () => props.modelValue,
  (file) => {
    if (preview.value) URL.revokeObjectURL(preview.value)
    preview.value = file ? URL.createObjectURL(file) : ''
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  if (preview.value) URL.revokeObjectURL(preview.value)
})
</script>

<template>
  <label
    class="upload-area"
    :class="{ 'is-dragging': dragging }"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="selectFile($event.dataTransfer?.files[0])"
  >
    <input
      ref="input"
      class="sr-only"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      @change="selectFile(($event.target as HTMLInputElement).files?.[0])"
    />
    <AppIcon name="upload" :size="38" /><strong>Arraste sua imagem aqui</strong
    ><span>ou clique para selecionar</span><small>JPG, PNG ou WEBP · até 5 MB</small>
  </label>
  <p v-if="error" class="field-error" role="alert">{{ error }}</p>
  <div v-if="preview || existingImage" class="upload-preview">
    <img :src="preview || imageUrl(existingImage)" alt="Prévia da imagem selecionada" />
    <button
      v-if="modelValue"
      class="icon-button"
      type="button"
      aria-label="Remover imagem selecionada"
      @click="emit('update:modelValue', null)"
    >
      <AppIcon name="close" :size="16" />
    </button>
    <small>{{ modelValue ? modelValue.name : 'Imagem atual' }}</small>
  </div>
</template>
