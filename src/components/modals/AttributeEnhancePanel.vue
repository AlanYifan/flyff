<template>
  <EnhancePanel
    :is-visible="isVisible"
    :player="player"
    :add-battle-log="addBattleLog"
    initial-mode="attribute"
    locked-mode="attribute"
    @close="emit('close')"
    @enhance-success="payload => emit('enhance-success', payload)"
    @enhance-failure="payload => emit('enhance-failure', payload)"
    @enhance-apply="payload => emit('enhance-apply', payload)"
  />
</template>

<script setup>
import EnhancePanel from '@/components/modals/EnhancePanel.vue'

defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  player: {
    type: Object,
    required: true
  },
  addBattleLog: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['close', 'enhance-success', 'enhance-failure', 'enhance-apply'])
</script>
