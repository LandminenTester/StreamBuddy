<script setup lang="ts">
import { onMounted } from 'vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import { useShoutoutStore } from '@renderer/stores/shoutout.store'

const store = useShoutoutStore()

onMounted(() => {
  void store.fetchEnabled()
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-semibold tracking-tight text-fg">
      {{ $t('setup.shoutout.title') }}
    </h1>
    <p class="mt-3 max-w-lg text-sm text-fg-muted">
      {{ $t('setup.shoutout.description') }}
    </p>

    <div class="mt-8 max-w-xl border-t border-line py-4">
      <AppToggle
        :model-value="store.autoShoutoutEnabled"
        :label="$t('setup.shoutout.toggle')"
        :description="$t('setup.shoutout.toggleHint')"
        @update:model-value="store.setEnabled"
      />
      <p class="mt-4 text-xs leading-5 text-fg-muted">
        {{ $t('setup.shoutout.scopeHint') }}
      </p>
    </div>
  </div>
</template>
