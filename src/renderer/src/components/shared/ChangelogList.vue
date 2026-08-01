<script setup lang="ts">
import type { ChangelogEntry } from '@shared/types/appInfo'

defineProps<{ entries: ChangelogEntry[] }>()
</script>

<template>
  <div class="space-y-5 text-sm">
    <p v-if="entries.length === 0" class="py-2 text-center text-fg-muted">
      {{ $t('update.changelogEmpty') }}
    </p>
    <div v-for="entry in entries" :key="entry.version">
      <p class="font-medium text-fg">
        v{{ entry.version }}
        <span v-if="entry.date" class="font-normal text-fg-muted">({{ entry.date }})</span>
      </p>
      <div v-for="section in entry.sections" :key="section.title" class="mt-2">
        <p class="text-xs font-medium uppercase tracking-wide text-fg-muted">
          {{ section.title }}
        </p>
        <ul class="mt-1 list-disc space-y-0.5 pl-5 text-xs text-fg">
          <li v-for="(item, index) in section.items" :key="index">
            <strong v-if="item.scope">{{ item.scope }}:</strong> {{ item.text }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
