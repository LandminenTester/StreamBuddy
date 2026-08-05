<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import AppButton from './AppButton.vue'

const props = defineProps<{
  page: number
  pageCount: number
}>()
const emit = defineEmits<{ 'update:page': [page: number] }>()

const canGoBack = computed(() => props.page > 1)
const canGoForward = computed(() => props.page < props.pageCount)

function goTo(page: number): void {
  emit('update:page', Math.min(Math.max(page, 1), Math.max(props.pageCount, 1)))
}
</script>

<template>
  <div v-if="pageCount > 1" class="mt-3 flex items-center justify-between gap-3">
    <AppButton size="sm" variant="ghost" :disabled="!canGoBack" @click="goTo(page - 1)">
      <template #icon><ChevronLeft class="h-3.5 w-3.5" /></template>
      {{ $t('common.pagination.previous') }}
    </AppButton>
    <span class="text-xs text-fg-muted">
      {{ $t('common.pagination.pageOf', { page, pageCount }) }}
    </span>
    <AppButton size="sm" variant="ghost" :disabled="!canGoForward" @click="goTo(page + 1)">
      {{ $t('common.pagination.next') }}
      <template #icon><ChevronRight class="h-3.5 w-3.5" /></template>
    </AppButton>
  </div>
</template>
