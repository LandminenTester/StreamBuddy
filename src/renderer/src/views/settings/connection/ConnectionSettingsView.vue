<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Eye, EyeOff } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import AppBadge from '@renderer/components/ui/AppBadge.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import DefinitionList, { type DefinitionItem } from '@renderer/components/ui/DefinitionList.vue'
import { useAuthStore } from '@renderer/stores/auth.store'
import { useChatStore } from '@renderer/stores/chat.store'

const { t } = useI18n()
const authStore = useAuthStore()
const chatStore = useChatStore()

const isClientIdVisible = ref(false)
const clientIdModalOpen = ref(false)
const channelModalOpen = ref(false)
const clientIdDraft = ref('')
const channelDraft = ref('')

const maskedClientId = computed(() => {
  if (!authStore.clientId) return undefined
  return isClientIdVisible.value ? authStore.clientId : '•'.repeat(authStore.clientId.length)
})

const twitchItems = computed<DefinitionItem[]>(() => [
  { key: 'account', label: t('settings.connection.account') },
  { key: 'clientId', label: t('settings.connection.clientId') }
])

const chatItems = computed<DefinitionItem[]>(() => [
  { key: 'channel', label: t('settings.connection.channel') },
  { key: 'status', label: t('settings.connection.chatStatus') },
  { key: 'autoConnect', label: t('settings.connection.autoConnect') }
])

function openClientIdModal(): void {
  clientIdDraft.value = authStore.clientId
  clientIdModalOpen.value = true
}

async function saveClientId(): Promise<void> {
  const value = clientIdDraft.value.trim()
  if (!value) return
  await authStore.saveClientId(value)
  clientIdModalOpen.value = false
}

function openChannelModal(): void {
  channelDraft.value = chatStore.targetChannel
  channelModalOpen.value = true
}

async function saveChannel(): Promise<void> {
  const value = channelDraft.value.trim()
  if (!value) return
  await chatStore.saveTargetChannel(value)
  channelModalOpen.value = false
}
</script>

<template>
  <div class="space-y-8">
    <PageSection
      :title="$t('settings.connection.twitchTitle')"
      :description="$t('settings.connection.twitchDescription')"
      :divided="false"
    >
      <template #actions>
        <AppButton
          v-if="!authStore.status.connected"
          variant="primary"
          size="sm"
          :loading="authStore.isConnecting"
          :disabled="!authStore.clientId"
          @click="authStore.connect()"
        >
          {{
            authStore.isConnecting
              ? $t('settings.connection.connecting')
              : $t('settings.connection.connect')
          }}
        </AppButton>
        <AppButton v-else variant="danger" size="sm" @click="authStore.disconnect()">
          {{ $t('settings.connection.disconnect') }}
        </AppButton>
      </template>

      <DefinitionList :items="twitchItems">
        <template #account>
          <AppBadge v-if="authStore.status.connected" variant="success" dot>
            {{ authStore.status.twitchLogin }}
          </AppBadge>
          <span v-else class="text-fg-muted">{{ $t('settings.connection.notConnected') }}</span>
        </template>

        <template #clientId>
          <div class="flex items-center gap-2">
            <span v-if="maskedClientId" class="break-all font-mono text-xs">
              {{ maskedClientId }}
            </span>
            <span v-else class="text-fg-subtle">
              {{ $t('settings.connection.clientIdNotSet') }}
            </span>
            <button
              v-if="authStore.clientId"
              type="button"
              class="shrink-0 rounded p-1 text-fg-subtle transition-colors hover:text-fg"
              :aria-label="
                isClientIdVisible
                  ? $t('settings.connection.hideClientId')
                  : $t('settings.connection.showClientId')
              "
              @click="isClientIdVisible = !isClientIdVisible"
            >
              <EyeOff v-if="isClientIdVisible" class="h-4 w-4" />
              <Eye v-else class="h-4 w-4" />
            </button>
            <AppButton size="sm" variant="ghost" @click="openClientIdModal">
              {{ $t('common.edit') }}
            </AppButton>
          </div>
        </template>
      </DefinitionList>

      <div
        v-if="authStore.isConnecting && authStore.deviceAuthPrompt"
        class="mt-6 rounded-md bg-accent/10 p-4 text-sm"
      >
        <p class="font-medium text-fg">{{ $t('setup.connection.deviceTitle') }}</p>
        <p class="mt-2 text-fg-muted">
          {{
            $t('setup.connection.deviceStep1', { url: authStore.deviceAuthPrompt.verificationUri })
          }}
        </p>
        <p class="mt-3 text-fg-muted">{{ $t('setup.connection.deviceStep2') }}</p>
        <code
          class="mt-1 inline-block rounded bg-surface px-3 py-1.5 font-mono text-lg font-semibold tracking-widest text-fg"
        >
          {{ authStore.deviceAuthPrompt.userCode }}
        </code>
        <p class="mt-3 text-xs text-fg-subtle">{{ $t('setup.connection.deviceWaiting') }}</p>
      </div>

      <div
        v-if="authStore.status.missingScopes.length > 0"
        class="mt-6 rounded-md bg-warning-bg p-4 text-sm text-warning"
      >
        <p>
          {{
            $t('settings.connection.missingScopes', {
              scopes: authStore.status.missingScopes.join(', ')
            })
          }}
        </p>
        <AppButton
          size="sm"
          class="mt-3"
          :loading="authStore.isConnecting"
          @click="authStore.connect()"
        >
          {{ $t('settings.connection.grantScopes') }}
        </AppButton>
      </div>
    </PageSection>

    <PageSection
      :title="$t('settings.connection.chatTitle')"
      :description="$t('settings.connection.chatDescription')"
    >
      <template #actions>
        <AppButton
          v-if="!chatStore.autoConnect"
          size="sm"
          :loading="chatStore.isConnecting"
          @click="chatStore.connectNow()"
        >
          {{ $t('settings.connection.connectNow') }}
        </AppButton>
      </template>

      <DefinitionList :items="chatItems">
        <template #channel>
          <div class="flex items-center gap-2">
            <span v-if="chatStore.targetChannel">#{{ chatStore.targetChannel }}</span>
            <span v-else class="text-fg-subtle">{{ $t('settings.connection.noChannel') }}</span>
            <AppButton size="sm" variant="ghost" @click="openChannelModal">
              {{ $t('common.edit') }}
            </AppButton>
          </div>
        </template>

        <template #status>
          <AppBadge :variant="chatStore.status.connected ? 'success' : 'neutral'" dot>
            {{
              chatStore.status.connected
                ? $t('settings.connection.connectedTo', { channel: chatStore.status.channel })
                : $t('settings.connection.disconnected')
            }}
          </AppBadge>
        </template>

        <template #autoConnect>
          <AppToggle
            :model-value="chatStore.autoConnect"
            :label="
              chatStore.autoConnect
                ? $t('settings.connection.autoConnectOn')
                : $t('settings.connection.autoConnectOff')
            "
            @update:model-value="chatStore.setAutoConnect($event)"
          />
        </template>
      </DefinitionList>
    </PageSection>

    <BaseModal
      v-if="clientIdModalOpen"
      :title="$t('settings.connection.editClientId')"
      @close="clientIdModalOpen = false"
    >
      <AppInput
        v-model="clientIdDraft"
        type="password"
        :label="$t('setup.connection.clientIdLabel')"
        :placeholder="$t('setup.connection.clientIdPlaceholder')"
        :hint="$t('setup.connection.clientIdHint')"
      />
      <template #footer>
        <AppButton variant="ghost" @click="clientIdModalOpen = false">
          {{ $t('common.cancel') }}
        </AppButton>
        <AppButton
          variant="primary"
          :loading="authStore.isSavingClientId"
          :disabled="!clientIdDraft.trim()"
          @click="saveClientId"
        >
          {{ $t('common.save') }}
        </AppButton>
      </template>
    </BaseModal>

    <BaseModal
      v-if="channelModalOpen"
      :title="$t('settings.connection.editChannel')"
      @close="channelModalOpen = false"
    >
      <AppInput
        v-model="channelDraft"
        :label="$t('setup.channel.label')"
        :placeholder="$t('setup.channel.placeholder')"
      />
      <template #footer>
        <AppButton variant="ghost" @click="channelModalOpen = false">
          {{ $t('common.cancel') }}
        </AppButton>
        <AppButton
          variant="primary"
          :loading="chatStore.isSaving"
          :disabled="!channelDraft.trim()"
          @click="saveChannel"
        >
          {{ $t('common.save') }}
        </AppButton>
      </template>
    </BaseModal>
  </div>
</template>
