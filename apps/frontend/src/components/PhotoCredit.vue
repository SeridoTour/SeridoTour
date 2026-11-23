<script setup lang="ts">
import { computed } from 'vue'
import { getCatalogPhoto } from '../utils/catalogPhotos'

const props = defineProps<{
  place: { id: string; imageUrl?: string | null }
  compact?: boolean
}>()
const photo = computed(() => getCatalogPhoto(props.place))
</script>

<template>
  <p v-if="photo" class="photo-credit" :class="{ 'photo-credit--compact': compact }">
    <span v-if="!compact" class="photo-credit-caption">{{ photo.caption }}</span>
    <span>
      Foto: {{ photo.author || 'autoria individual não informada' }} ·
      <a :href="photo.sourceUrl" target="_blank" rel="noopener noreferrer">{{ photo.sourceLabel }}</a>
      <template v-if="photo.license && photo.licenseUrl">
        · <a :href="photo.licenseUrl" target="_blank" rel="noopener noreferrer">{{ photo.license }}</a>
      </template>
    </span>
    <strong v-if="photo.permissionStatus === 'pending'" class="photo-permission-pending">
      Autorização de reutilização pendente.
    </strong>
    <span v-if="!compact && photo.creditNote">{{ photo.creditNote }}</span>
    <span class="photo-credit-changes">{{ compact ? 'Enquadramento pelo layout.' : photo.changes }}</span>
  </p>
</template>
