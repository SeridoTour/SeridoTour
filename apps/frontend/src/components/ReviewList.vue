<script setup lang="ts">
import type { Review } from '../types/tourism'
import { formatDate, imageUrl, initials } from '../utils/format'
import RatingStars from './RatingStars.vue'
defineProps<{ reviews: Review[] }>()
</script>
<template>
  <article v-for="review in reviews" :key="review.id" class="review">
    <div class="review-author">
      <span class="avatar">{{ initials(review.user.name) }}</span>
      <div>
        <strong>{{ review.user.name }}</strong
        ><small>{{ formatDate(review.createdAt) }}</small>
      </div>
    </div>
    <RatingStars :rating="review.rating" />
    <p>{{ review.comment }}</p>
    <img
      v-if="review.imageUrl"
      :src="imageUrl(review.imageUrl)"
      :alt="`Foto da experiência de ${review.user.name}`"
      loading="lazy"
    />
  </article>
</template>
