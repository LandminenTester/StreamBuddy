<script setup lang="ts">
import type { Poll } from '@shared/types/poll'
import { votePercentage } from '@renderer/views/polls/utils'

defineProps<{ poll: Poll }>()
</script>

<template>
  <div class="space-y-2">
    <div v-for="choice in poll.choices" :key="choice.title">
      <div class="flex items-center justify-between text-sm">
        <span>{{ choice.title }}</span>
        <span class="text-slate-500"
          >{{ choice.votes }} ({{ votePercentage(poll, choice.votes) }}%)</span
        >
      </div>
      <div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
        <div
          class="h-full rounded-full bg-twitch-purple transition-all"
          :style="{ width: `${votePercentage(poll, choice.votes)}%` }"
        />
      </div>
    </div>
  </div>
</template>
