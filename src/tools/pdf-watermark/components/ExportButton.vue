<template>
  <div class="export-button">
    <v-btn
        v-if="pdfFile"
        prepend-icon="mdi-download"
        variant="flat"
        color="teal-accent-4"
        class="mr-2"
        @click="handleExport"
        :loading="loading"
        :disabled="loading"
    >
      导出 PDF
    </v-btn>
  </div>
</template>

<script setup>
const props = defineProps({
  pdfFile: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['export'])

const handleExport = () => {
  emit('export')
}
</script>

<style scoped>
.export-button {
  display: inline-block;
}

/* 深色模式适配 */
:root[data-theme="dark"] .export-button .v-btn {
  background-color: #00897b !important;
  color: #ffffff !important;
}

:root[data-theme="dark"] .export-button .v-btn:disabled {
  background-color: #263238 !important;
  color: #757575 !important;
}
</style>
