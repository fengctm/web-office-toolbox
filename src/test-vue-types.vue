<template>
  <div class="test-vue-types">
    <h2>Vue 3 类型测试</h2>
    <p>Count: {{ count }}</p>
    <p>State Count: {{ state.count }}</p>
    <p>Doubled: {{ doubled }}</p>
    <button @click="increment">增加</button>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'

// 测试 ref
const count = ref(0)

// 测试 reactive
const state = reactive({
  count: 0,
  name: '测试组件'
})

// 测试 computed
const doubled = computed(() => count.value * 2)

// 测试 watch
watch(count, (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`)
})

// 测试 onMounted
onMounted(() => {
  console.log('组件已挂载')
})

// 测试函数
function increment() {
  count.value++
  state.count++
}
</script>

<style scoped>
.test-vue-types {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin: 10px;
}

button {
  background-color: #009688;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #00796b;
}
</style>
