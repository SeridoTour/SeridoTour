<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import L from 'leaflet'
import type { Place } from '../types/tourism'

const props = withDefaults(
  defineProps<{
    places?: Place[]
    selectedId?: string
    coordinates?: { latitude: number; longitude: number } | null
    selectable?: boolean
    scrollWheelZoom?: boolean
  }>(),
  { places: () => [], selectable: false, scrollWheelZoom: false },
)
const emit = defineEmits<{
  select: [id: string]
  pick: [coordinates: { latitude: number; longitude: number }]
}>()
const container = ref<HTMLDivElement | null>(null)
let map: L.Map | undefined
let markers: L.LayerGroup | undefined
let resizeObserver: ResizeObserver | undefined

function pin(selected = false) {
  return L.divIcon({
    className: 'map-marker-wrapper',
    html: `<span class="map-pin${selected ? ' is-selected' : ''}"></span>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
  })
}

function renderMarkers(fitView = true) {
  if (!map || !markers) return
  markers.clearLayers()
  const coordinates: L.LatLngTuple[] = []
  props.places.forEach((place) => {
    if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) return
    const point: L.LatLngTuple = [place.latitude, place.longitude]
    coordinates.push(point)
    const title = document.createElement('span')
    title.textContent = place.name
    L.marker(point, { icon: pin(place.id === props.selectedId), title: place.name })
      .bindTooltip(title)
      .on('click', () => emit('select', place.id))
      .addTo(markers!)
  })
  if (props.coordinates) {
    const point: L.LatLngTuple = [props.coordinates.latitude, props.coordinates.longitude]
    coordinates.push(point)
    L.marker(point, { icon: pin(true) }).addTo(markers)
  }
  if (fitView && coordinates.length)
    map.fitBounds(L.latLngBounds(coordinates), { padding: [40, 40], maxZoom: 13 })
}

onMounted(() => {
  if (!container.value) return
  map = L.map(container.value, { scrollWheelZoom: props.scrollWheelZoom }).setView([-6.3, -36.8], 9)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)
  markers = L.layerGroup().addTo(map)
  if (props.selectable)
    map.on('click', (event) =>
      emit('pick', { latitude: event.latlng.lat, longitude: event.latlng.lng }),
    )
  resizeObserver = new ResizeObserver(() => map?.invalidateSize())
  resizeObserver.observe(container.value)
  renderMarkers()
})
watch(
  () => [props.places, props.coordinates],
  () => renderMarkers(),
  { deep: true },
)
watch(
  () => props.selectedId,
  () => renderMarkers(false),
)
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  map?.remove()
})
defineExpose({ center: renderMarkers })
</script>

<template>
  <div
    ref="container"
    class="place-map"
    :class="{ 'is-selectable': selectable }"
    role="region"
    :aria-label="
      selectable ? 'Clique no mapa para escolher as coordenadas' : 'Mapa dos locais turísticos'
    "
  />
</template>
