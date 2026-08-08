<script setup lang="ts">
import { computed, ref } from 'vue'

export interface TimelineLayerValue {
  startMs: number
  durationMs: number
  fadeInMs?: number
  fadeOutMs?: number
}

const props = withDefaults(
  defineProps<{
    modelValue: TimelineLayerValue
    rangeMs?: number
    minDurationMs?: number
    /** Obergrenze für die Dauer (z.B. natürliche Länge einer Video-/Audiodatei) -- nur Verkürzen erlaubt. */
    maxDurationMs?: number
    snapMs?: number
    label: string
    showFades?: boolean
  }>(),
  {
    rangeMs: 15000,
    minDurationMs: 100,
    maxDurationMs: undefined,
    snapMs: 100,
    showFades: false
  }
)

const emit = defineEmits<{ 'update:modelValue': [value: TimelineLayerValue] }>()

type DragMode = 'move' | 'resize-start' | 'resize-end' | 'fade-in' | 'fade-out'

interface DragState {
  mode: DragMode
  pointerId: number
  startX: number
  original: TimelineLayerValue
}

const drag = ref<DragState | null>(null)
const trackEl = ref<HTMLElement | null>(null)

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

const leftPercent = computed(() => (props.modelValue.startMs / props.rangeMs) * 100)
const widthPercent = computed(() => (props.modelValue.durationMs / props.rangeMs) * 100)
const fadeInPercent = computed(() =>
  props.modelValue.durationMs > 0
    ? ((props.modelValue.fadeInMs ?? 0) / props.modelValue.durationMs) * 100
    : 0
)
const fadeOutPercent = computed(() =>
  props.modelValue.durationMs > 0
    ? ((props.modelValue.fadeOutMs ?? 0) / props.modelValue.durationMs) * 100
    : 0
)

function onPointerDown(event: PointerEvent, mode: DragMode): void {
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  drag.value = {
    mode,
    pointerId: event.pointerId,
    startX: event.clientX,
    original: { ...props.modelValue }
  }
}

function onPointerMove(event: PointerEvent): void {
  if (!drag.value || event.pointerId !== drag.value.pointerId || !trackEl.value) return

  const trackWidth = trackEl.value.getBoundingClientRect().width
  const deltaMs = ((event.clientX - drag.value.startX) / trackWidth) * props.rangeMs
  const snapped = Math.round(deltaMs / props.snapMs) * props.snapMs
  const original = drag.value.original
  const next: TimelineLayerValue = { ...original }

  switch (drag.value.mode) {
    case 'move':
      next.startMs = clamp(original.startMs + snapped, 0, props.rangeMs - original.durationMs)
      break
    case 'resize-start': {
      const newStart = clamp(
        original.startMs + snapped,
        0,
        original.startMs + original.durationMs - props.minDurationMs
      )
      next.startMs = newStart
      next.durationMs = original.startMs + original.durationMs - newStart
      break
    }
    case 'resize-end': {
      const upperBound = Math.min(
        props.rangeMs - original.startMs,
        props.maxDurationMs ?? Infinity
      )
      next.durationMs = clamp(original.durationMs + snapped, props.minDurationMs, upperBound)
      break
    }
    case 'fade-in':
      next.fadeInMs = clamp((original.fadeInMs ?? 0) + snapped, 0, next.durationMs)
      break
    case 'fade-out':
      next.fadeOutMs = clamp((original.fadeOutMs ?? 0) + snapped, 0, next.durationMs)
      break
  }

  emit('update:modelValue', next)
}

function onPointerUp(event: PointerEvent): void {
  if (drag.value?.pointerId === event.pointerId) drag.value = null
}
</script>

<template>
  <div class="flex items-center gap-3">
    <span class="w-20 shrink-0 text-xs font-medium text-fg-muted">{{ label }}</span>

    <div class="min-w-0 flex-1">
      <div ref="trackEl" class="relative h-8 rounded border border-line bg-surface-subtle">
        <div
          class="absolute top-1 h-6 cursor-grab rounded bg-accent/70 active:cursor-grabbing"
          :style="{ left: `${leftPercent}%`, width: `${widthPercent}%` }"
          @pointerdown="onPointerDown($event, 'move')"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
        >
          <div
            v-if="showFades"
            class="pointer-events-none absolute inset-y-0 left-0 bg-black/20"
            :style="{ width: `${fadeInPercent}%` }"
          />
          <div
            v-if="showFades"
            class="pointer-events-none absolute inset-y-0 right-0 bg-black/20"
            :style="{ width: `${fadeOutPercent}%` }"
          />

          <div
            class="absolute inset-y-0 left-0 w-2 cursor-ew-resize"
            @pointerdown.stop="onPointerDown($event, 'resize-start')"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
          />
          <div
            class="absolute inset-y-0 right-0 w-2 cursor-ew-resize"
            @pointerdown.stop="onPointerDown($event, 'resize-end')"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
          />

          <div
            v-if="showFades"
            class="absolute inset-y-0 w-1.5 cursor-col-resize bg-fg/40"
            :style="{ left: `${fadeInPercent}%` }"
            @pointerdown.stop="onPointerDown($event, 'fade-in')"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
          />
          <div
            v-if="showFades"
            class="absolute inset-y-0 w-1.5 cursor-col-resize bg-fg/40"
            :style="{ right: `${fadeOutPercent}%` }"
            @pointerdown.stop="onPointerDown($event, 'fade-out')"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
          />
        </div>
      </div>
      <p class="mt-0.5 text-[11px] text-fg-subtle">
        {{ (modelValue.startMs / 1000).toFixed(1) }}s
        &ndash;
        {{ ((modelValue.startMs + modelValue.durationMs) / 1000).toFixed(1) }}s
        <template v-if="showFades">
          · {{ $t('alerts.manager.timeline.fadeReadout') }}
          {{ ((modelValue.fadeInMs ?? 0) / 1000).toFixed(1) }}s /
          {{ ((modelValue.fadeOutMs ?? 0) / 1000).toFixed(1) }}s
        </template>
      </p>
    </div>
  </div>
</template>
