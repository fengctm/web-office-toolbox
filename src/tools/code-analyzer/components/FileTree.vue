<template>
  <v-card elevation="1" rounded="lg">
    <v-card-title class="text-subtitle-1 font-weight-medium d-flex align-center">
      <span>文件树</span>
      <v-spacer />
      <v-btn variant="text" color="teal" size="small" @click="toggleAll">
        {{ allExpanded ? '折叠全部' : '展开全部' }}
      </v-btn>
    </v-card-title>
    <v-divider />
    <v-card-text class="pa-1" style="max-height: 500px; overflow-y: auto;">
      <template v-if="treeData && Object.keys(treeData).length > 0">
        <TreeNode
          v-for="entry in sortedEntries(treeData)"
          :key="entry.name"
          :name="entry.name"
          :info="entry.info"
          :depth="0"
          :expanded-ids="expandedIds"
          :exclusions="exclusions"
          @toggle="handleToggle"
          @copy="(text) => $emit('copy', text)"
          @toggle-exclude="(name) => $emit('toggle-exclude', name)"
        />
      </template>
      <div v-else class="text-center text-medium-emphasis py-4">暂无文件数据</div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import TreeNode from './TreeNode.vue'

const props = defineProps({
  treeData: { type: Object, default: () => ({}) },
  exclusions: { type: Array, default: () => [] },
})

defineEmits(['copy', 'toggle-exclude'])

const expandedIds = ref(new Set())
const nodeIdCounter = ref(0)
const allNodeIds = ref([])

function sortedEntries(node) {
    return Object.entries(node)
        .sort((a, b) => {
            const aDir = !a[1]._file
            const bDir = !b[1]._file
            if (aDir !== bDir) return aDir ? -1 : 1
            return a[0].localeCompare(b[0])
        })
        .map(([name, info]) => ({ name, info }))
}

function handleToggle(id) {
    if (expandedIds.value.has(id)) {
        expandedIds.value.delete(id)
    } else {
        expandedIds.value.add(id)
    }
}

const allExpanded = computed(() => {
    return allNodeIds.value.length > 0 && expandedIds.value.size >= allNodeIds.value.length
})

function toggleAll() {
    if (allExpanded.value) {
        expandedIds.value.clear()
    } else {
        collectAllIds(props.treeData)
        allNodeIds.value.forEach(id => expandedIds.value.add(id))
    }
}

function collectAllIds(node) {
    allNodeIds.value = []
    _collect(node)
}

function _collect(node) {
    for (const [, info] of Object.entries(node)) {
        if (!info._file) {
            const id = 'n' + (++nodeIdCounter.value)
            allNodeIds.value.push(id)
            _collect(info._children)
        }
    }
}
</script>
