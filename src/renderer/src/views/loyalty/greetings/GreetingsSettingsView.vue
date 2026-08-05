<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { MessageCircleMore, Pencil, Trash2 } from 'lucide-vue-next'
import AppBadge from '@renderer/components/ui/AppBadge.vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import Pagination from '@renderer/components/ui/Pagination.vue'
import StringListInput from '@renderer/components/shared/StringListInput.vue'
import GreetingEditModal from '@renderer/components/loyalty/GreetingEditModal.vue'
import { useLoyaltyStore } from '@renderer/stores/loyalty.store'
import { useFollowersStore } from '@renderer/stores/followers.store'
import type { LoyaltyGreetingSettings, LoyaltyPersonalGreeting } from '@shared/types/loyalty'

const store = useLoyaltyStore()
const followersStore = useFollowersStore()
const savedMessage = ref<string | null>(null)
const editingRule = ref<LoyaltyPersonalGreeting | null>(null)
const form = ref<LoyaltyGreetingSettings>({
  greetNewViewers: false,
  newViewerTexts: [''],
  personalGreetings: []
})

const userLoginOptions = computed(() => {
  const seen = new Set<string>()
  return followersStore.followers
    .map((follower) => follower.userLogin.trim().toLowerCase())
    .filter((login) => {
      if (!login || seen.has(login)) return false
      seen.add(login)
      return true
    })
    .sort((left, right) => left.localeCompare(right))
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

const PAGE_SIZE = 10
const page = ref(1)
const pageCount = computed(() =>
  Math.max(1, Math.ceil(form.value.personalGreetings.length / PAGE_SIZE))
)
const paginatedGreetings = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return form.value.personalGreetings.slice(start, start + PAGE_SIZE)
})

watch(pageCount, (count) => {
  if (page.value > count) page.value = count
})

function createEmptyRule(): LoyaltyPersonalGreeting {
  return {
    id: `greeting-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userLogin: '',
    enabled: true,
    texts: ['']
  }
}

function openCreateModal(): void {
  editingRule.value = createEmptyRule()
}

function openEditModal(rule: LoyaltyPersonalGreeting): void {
  editingRule.value = rule
}

function removeRule(id: string): void {
  form.value.personalGreetings = form.value.personalGreetings.filter((rule) => rule.id !== id)
}

async function saveRule(rule: LoyaltyPersonalGreeting): Promise<void> {
  const index = form.value.personalGreetings.findIndex((entry) => entry.id === rule.id)
  if (index === -1) {
    form.value.personalGreetings = [...form.value.personalGreetings, rule]
  } else {
    form.value.personalGreetings = form.value.personalGreetings.map((entry) =>
      entry.id === rule.id ? rule : entry
    )
  }
  editingRule.value = null
  await save()
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
  <PageSection :divided="false">
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
        <div class="mt-4 flex justify-end">
          <AppButton variant="primary" @click="save">{{ $t('common.save') }}</AppButton>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-fg">{{ $t('loyalty.greetings.personalTitle') }}</h3>
          <p class="mt-1 text-xs text-fg-muted">{{ $t('loyalty.greetings.personalHint') }}</p>
        </div>
        <AppButton size="sm" @click="openCreateModal">
          {{ $t('loyalty.greetings.addPersonal') }}
        </AppButton>
      </div>

      <EmptyState
        v-if="form.personalGreetings.length === 0"
        :title="$t('loyalty.greetings.personalEmpty')"
      >
        <template #icon><MessageCircleMore class="h-8 w-8" /></template>
      </EmptyState>

      <ul v-else class="divide-y divide-line border-t border-line">
        <li
          v-for="rule in paginatedGreetings"
          :key="rule.id"
          class="flex items-center justify-between gap-3 py-2.5 text-sm"
        >
          <div class="flex min-w-0 items-center gap-2">
            <span class="truncate text-fg">{{ rule.userLogin }}</span>
            <AppBadge :variant="rule.enabled ? 'success' : 'neutral'" dot>
              {{ rule.enabled ? $t('common.enabled') : $t('common.disabled') }}
            </AppBadge>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <AppButton size="sm" variant="ghost" @click="openEditModal(rule)">
              <template #icon><Pencil class="h-3.5 w-3.5" /></template>
              {{ $t('common.edit') }}
            </AppButton>
            <button
              type="button"
              class="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface-subtle hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              :aria-label="$t('common.delete')"
              @click="
                () => {
                  removeRule(rule.id)
                  save()
                }
              "
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </li>
      </ul>

      <Pagination
        v-if="form.personalGreetings.length > 0"
        v-model:page="page"
        :page-count="pageCount"
      />

      <p v-if="savedMessage" class="text-right text-xs text-fg-muted">
        {{ $t('loyalty.greetings.saved') }}
      </p>
    </div>

    <GreetingEditModal
      v-if="editingRule"
      :initial="editingRule"
      :user-login-options="userLoginOptions"
      @close="editingRule = null"
      @submit="saveRule"
    />
  </PageSection>
</template>
