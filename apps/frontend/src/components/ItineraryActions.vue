<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { itinerariesService, type ItineraryAction } from '../services/itineraries'
import type { Itinerary } from '../types/tourism'
import { getErrorMessage } from '../utils/format'
import AppIcon from './AppIcon.vue'
import ConfirmDialog from './ConfirmDialog.vue'

const props = withDefaults(defineProps<{ itinerary: Itinerary; moderation?: boolean }>(), {
  moderation: false,
})
const emit = defineEmits<{ changed: [] }>()
const auth = useAuthStore()
const busy = ref(false)
const error = ref('')
const reason = ref('')
const pending = ref<'reject' | 'unpublish' | 'delete' | null>(null)
const isAuthor = computed(() => props.itinerary.userId === auth.user?.id)
const canEdit = computed(
  () => (isAuthor.value || auth.isGuia) && props.itinerary.status !== 'EM_ANALISE',
)
const canSubmit = computed(
  () => isAuthor.value && ['RASCUNHO', 'REJEITADO'].includes(props.itinerary.status),
)
const dialogTitle = computed(
  () =>
    ({ reject: 'Rejeitar roteiro', unpublish: 'Despublicar roteiro?', delete: 'Excluir roteiro?' })[
      pending.value || 'delete'
    ],
)
const confirmLabel = computed(
  () =>
    ({ reject: 'Rejeitar roteiro', unpublish: 'Despublicar', delete: 'Excluir roteiro' })[
      pending.value || 'delete'
    ],
)

async function runAction(action: ItineraryAction | 'delete') {
  busy.value = true
  error.value = ''
  try {
    if (action === 'delete') await itinerariesService.remove(props.itinerary.id)
    else
      await itinerariesService.transition(
        props.itinerary.id,
        action,
        action === 'reject' ? reason.value.trim() : undefined,
      )
    pending.value = null
    reason.value = ''
    emit('changed')
  } catch (cause) {
    error.value = getErrorMessage(
      cause,
      'Não foi possível concluir a ação. Atualize a página e tente novamente.',
    )
    pending.value = null
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="itinerary-actions">
    <div class="button-row">
      <button
        v-if="canSubmit"
        class="btn-primary btn-small"
        :disabled="busy"
        @click="runAction('submit')"
      >
        <AppIcon name="arrow" :size="14" />{{
          itinerary.status === 'REJEITADO' ? 'Reenviar para análise' : 'Enviar para análise'
        }}
      </button>
      <RouterLink
        v-if="canEdit"
        :to="`/roteiros/${itinerary.id}/edit`"
        class="btn-secondary btn-small"
        ><AppIcon name="edit" :size="14" />Editar</RouterLink
      >
      <template v-if="moderation && auth.isGuia">
        <button
          v-if="itinerary.status === 'EM_ANALISE'"
          class="btn-success btn-small"
          :disabled="busy"
          @click="runAction('publish')"
        >
          <AppIcon name="check" :size="14" />Publicar
        </button>
        <button
          v-if="itinerary.status === 'EM_ANALISE'"
          class="btn-danger btn-small"
          :disabled="busy"
          @click="pending = 'reject'"
        >
          <AppIcon name="close" :size="14" />Rejeitar
        </button>
        <button
          v-if="itinerary.status === 'PUBLICADO'"
          class="btn-secondary btn-small"
          :disabled="busy"
          @click="pending = 'unpublish'"
        >
          Despublicar
        </button>
      </template>
      <button
        v-if="auth.isGuia"
        class="btn-danger btn-small"
        :disabled="busy"
        @click="pending = 'delete'"
      >
        <AppIcon name="trash" :size="14" />Excluir
      </button>
    </div>
    <p v-if="error" class="notice notice-error" role="alert">{{ error }}</p>
    <ConfirmDialog
      :id="`itinerary-action-${itinerary.id}`"
      :open="pending !== null"
      :title="dialogTitle"
      :confirm-label="confirmLabel"
      :busy="busy"
      danger
      :message="
        pending === 'reject'
          ? 'Informe o que pode melhorar para orientar o autor. O motivo é opcional.'
          : pending === 'unpublish'
            ? 'O roteiro voltará para rascunho e sairá da consulta pública.'
            : 'Esta ação não pode ser desfeita.'
      "
      @close="pending = null"
      @confirm="pending && runAction(pending)"
    >
      <div v-if="pending === 'reject'">
        <label :for="`rejection-reason-${itinerary.id}`" class="field-label"
          >Motivo da rejeição</label
        ><textarea
          :id="`rejection-reason-${itinerary.id}`"
          v-model="reason"
          class="field-control"
          maxlength="1000"
          placeholder="O que o autor precisa ajustar?"
        />
      </div>
    </ConfirmDialog>
  </div>
</template>
