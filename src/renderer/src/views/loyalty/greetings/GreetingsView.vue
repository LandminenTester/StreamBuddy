<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { MessageCircleMore, Trash2 } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import StringListInput from '@renderer/components/shared/StringListInput.vue'
import BlacklistEditor from '../blacklist/BlacklistEditor.vue'
import { useLoyaltyStore } from '@renderer/stores/loyalty.store'
import { useFollowersStore } from '@renderer/stores/followers.store'
import type { LoyaltyGreetingSettings, LoyaltyPersonalGreeting } from '@shared/types/loyalty'

const store = useLoyaltyStore()
const followersStore = useFollowersStore()
const savedMessage = ref<string | null>(null)
const form = ref<LoyaltyGreetingSettings>({
  greetNewViewers: false,
  newViewerTexts: [''],
  personalGreetings: []
})
const followerNameOptions = computed(() => {
  const seen = new Set<string>()
  return followersStore.followers
    .filter((follower) => {
      const login = follower.userLogin.trim().toLowerCase()
      if (!login || seen.has(login)) return false
      seen.add(login)
      return true
    })
    .sort((left, right) => left.userLogin.localeCompare(right.userLogin))
})

onMounted(() => {
  void Promise.all([store.fetchGreetingSettings(), followersStore.fetchAll()])
})

function cloneSettings(settings: LoyaltyGreetingSettings): LoyaltyGreetingSettings {
  return {
    greetNewViewers: settings.greetNewViewers,
    newViewerTexts: settings.newViewerTexts.length > 0 ? [...settings.newViewerTexts] : [''],
    personalGreetings: settings.personalGreetings.map((rule) => ({
      id: rule.id,
      userLogin: rule.userLogin,
      enabled: rule.enabled,
      texts: rule.texts.length > 0 ? [...rule.texts] : ['']
    }))
  }
}

watch(
  () => store.greetingSettings,
  (settings) => {
    form.value = cloneSettings(settings)
  },
  { immediate: true }
)

function createRule(): LoyaltyPersonalGreeting {
  return {
    id: `greeting-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userLogin: '',
    enabled: true,
    texts: ['']
  }
}

function addRule(): void {
  form.value.personalGreetings = [...form.value.personalGreetings, createRule()]
}

function removeRule(id: string): void {
  form.value.personalGreetings = form.value.personalGreetings.filter((rule) => rule.id !== id)
}

async function save(): Promise<void> {
  await store.setGreetingSettings(form.value)
  savedMessage.value = String(store.greetingSettings.personalGreetings.length)
  window.setTimeout(() => {
    savedMessage.value = null
  }, 2500)
}
</script>

<template>
  <PageSection
    :title="$t('loyalty.greetings.title')"
    :description="$t('loyalty.greetings.description')"
    :divided="false"
  >
    <div class="space-y-5">
      <div class="rounded-md border border-line bg-surface-subtle p-4">
        <AppToggle
          v-model="form.greetNewViewers"
          :label="$t('loyalty.greetings.newViewers')"
          :description="$t('loyalty.greetings.newViewersHint')"
        />
        <div class="mt-4">
          <p class="mb-2 text-xs font-medium uppercase text-fg-subtle">
            {{ $t('loyalty.greetings.texts') }}
          </p>
          <StringListInput
            v-model="form.newViewerTexts"
            :placeholder="$t('loyalty.greetings.textPlaceholder')"
          />
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-fg">{{ $t('loyalty.greetings.personalTitle') }}</h3>
          <p class="mt-1 text-xs text-fg-muted">{{ $t('loyalty.greetings.personalHint') }}</p>
        </div>
        <AppButton size="sm" @click="addRule">
          {{ $t('loyalty.greetings.addPersonal') }}
        </AppButton>
      </div>

      <EmptyState
        v-if="form.personalGreetings.length === 0"
        :title="$t('loyalty.greetings.personalEmpty')"
      >
        <template #icon><MessageCircleMore class="h-8 w-8" /></template>
      </EmptyState>

      <ul v-else class="space-y-3">
        <li
          v-for="rule in form.personalGreetings"
          :key="rule.id"
          class="rounded-md border border-line bg-surface p-3"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-52 flex-1">
              <AppInput
                v-model="rule.userLogin"
                :label="$t('loyalty.greetings.userLogin')"
                :placeholder="$t('loyalty.greetings.userPlaceholder')"
                list="greeting-follower-names"
              />
            </div>
            <div class="flex items-center gap-2 pt-6">
              <AppToggle v-model="rule.enabled" :label="$t('common.enabled')" />
              <button
                type="button"
                class="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface-subtle hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                :aria-label="$t('common.delete')"
                @click="removeRule(rule.id)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="mt-3">
            <p class="mb-2 text-xs font-medium uppercase text-fg-subtle">
              {{ $t('loyalty.greetings.personalTexts') }}
            </p>
            <p class="mb-2 text-xs text-fg-muted">
              {{ $t('loyalty.greetings.personalTextsHint') }}
            </p>
            <StringListInput
              v-model="rule.texts"
              :placeholder="$t('loyalty.greetings.personalTextPlaceholder')"
            />
          </div>
        </li>
      </ul>

      <datalist id="greeting-follower-names">
        <option
          v-for="follower in followerNameOptions"
          :key="follower.userId"
          :value="follower.userLogin"
        >
          {{ follower.displayName ?? follower.userLogin }}
        </option>
      </datalist>

      <div class="flex items-center justify-end gap-3 border-t border-line pt-4">
        <span v-if="savedMessage" class="text-xs text-fg-muted">
          {{ $t('loyalty.greetings.saved') }}
        </span>
        <AppButton variant="primary" @click="save">{{ $t('common.save') }}</AppButton>
      </div>
    </div>
  </PageSection>

  <BlacklistEditor divided />
</template>
