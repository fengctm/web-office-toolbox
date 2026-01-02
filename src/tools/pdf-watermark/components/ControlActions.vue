<template>
  <v-divider></v-divider>
  <v-card-actions class="pa-4">
    <v-btn
      block
      size="large"
      color="teal"
      variant="elevated"
      :disabled="!fileUploaded"
      :loading="processing"
      @click="$emit('process')"
    >
      <v-icon start>mdi-download</v-icon>
      保存并下载 PDF
    </v-btn>
    <v-btn
      v-if="fileUploaded"
      block
      size="large"
      variant="outlined"
      class="mt-2"
      @click="$emit('reset')"
    >
      重置
    </v-btn>
  </v-card-actions>
</template>

<script setup>
defineProps({
  fileUploaded: Boolean,
  processing: Boolean
})
</script>
