<template>
  <v-card class="score-calculator-tool" elevation="2">
    <v-card-item>
      <v-card-title class="d-flex align-center">
        <v-icon color="teal" class="mr-2">mdi-calculator</v-icon>
        分数计算
      </v-card-title>
      <v-card-subtitle>
        支持分数运算、转换和化简
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <div class="text-center pa-4 text-grey">
        <v-icon size="64" icon="mdi-math-compass" class="mb-3"></v-icon>
        <div>分数计算工具</div>
        <div class="text-caption mt-2">功能开发中...</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
// 空壳工具 - 待开发
</script>

<style scoped>
.score-calculator-tool {
  border-radius: 12px;
  overflow: hidden;
}
</style>