<template>
  <v-menu location="bottom">
    <template #activator="{ props }">
      <v-avatar
        size="40"
        class="user-avatar"
        :color="avatarColor"
        v-bind="props"
      >
        {{ userInitials }}
      </v-avatar>
    </template>
    <v-list density="compact">
      <v-list-item title="个人资料" prepend-icon="mdi-account" />
      <v-list-item title="退出登录" prepend-icon="mdi-logout" />
    </v-list>
  </v-menu>
</template>

<script setup>
import { computed } from 'vue'

const userInitials = computed(() => 'U')
const avatarColor = computed(() => 'primary')
</script>

<style scoped>
.user-avatar {
  cursor: pointer;
}
</style>