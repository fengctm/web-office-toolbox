<template>
  <transition
      :name="name"
      :mode="mode"
      @before-enter="beforeEnter"
      @enter="enter"
      @leave="leave"
  >
    <slot></slot>
  </transition>
</template>

<script setup>
const props = defineProps({
  name: {
    type: String,
    default: 'slide-fade'
  },
  mode: {
    type: String,
    default: 'out-in'
  }
})

const beforeEnter = (el) => {
  el.style.opacity = 0
  el.style.transform = 'translateX(30px)'
}

const enter = (el, done) => {
  el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  setTimeout(() => {
    el.style.opacity = 1
    el.style.transform = 'translateX(0)'
    done()
  }, 50)
}

const leave = (el, done) => {
  el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  el.style.opacity = 0
  el.style.transform = 'translateX(-30px)'
  setTimeout(done, 300)
}
</script>

<style scoped>
/* 滑动淡入淡出过渡 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 淡入淡出过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 缩放过渡 */
.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.scale-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.scale-leave-to {
  opacity: 0;
  transform: scale(1.1);
}
</style>
