<template>
  <transition
    :name="transitionName"
    :mode="mode"
    @before-enter="beforeEnter"
    @enter="enter"
    @after-enter="afterEnter"
    @before-leave="beforeLeave"
    @leave="leave"
    @after-leave="afterLeave"
  >
    <slot />
  </transition>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  transitionName: {
    type: String,
    default: 'fade'
  },
  mode: {
    type: String,
    default: 'out-in'
  }
})

const beforeEnter = (el) => {
  el.style.opacity = 0
  el.style.transform = 'translateX(20px)'
}

const enter = (el, done) => {
  el.style.transition = 'all 0.3s ease-out'
  setTimeout(() => {
    el.style.opacity = 1
    el.style.transform = 'translateX(0)'
    done()
  }, 10)
}

const afterEnter = (el) => {
  el.style.transition = ''
  el.style.transform = ''
}

const beforeLeave = (el) => {
  el.style.opacity = 1
  el.style.transform = 'translateX(0)'
}

const leave = (el, done) => {
  el.style.transition = 'all 0.3s ease-in'
  setTimeout(() => {
    el.style.opacity = 0
    el.style.transform = 'translateX(-20px)'
    done()
  }, 10)
}

const afterLeave = (el) => {
  el.style.transition = ''
  el.style.transform = ''
}
</script>

<style scoped>
/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Scale transition */
.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s ease;
}

.scale-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.scale-leave-to {
  opacity: 0;
  transform: scale(1.05);
}
</style>
