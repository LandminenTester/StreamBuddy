<script setup lang="ts">
import type { Poll } from '@shared/types/poll'
import { votePercentage } from '@renderer/views/polls/utils'

defineProps<{ poll: Poll }>()
</script>

<template>
  <div class="space-y-3">
    <div v-for="choice in poll.choices" :key="choice.title">
      <div class="flex items-center justify-between text-sm">
        <span class="text-fg">{{ choice.title }}</span>
        <span class="tabular-nums text-fg-muted">
          {{ choice.votes }} ({{ votePercentage(poll, choice.votes) }}%)
        </span>
      </div>
      <div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
        <div
          class="h-full rounded-full bg-accent transition-all"
          :style="{ width: `${votePercentage(poll, choice.votes)}%` }"
        />
      </div>
    </div>
  </div>
</template>
