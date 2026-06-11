<template>
  <div>
    <div
      class="tree-node d-flex align-center"
      :style="{ paddingLeft: (depth * 20 + 8) + 'px' }"
      @click="isDir && toggle()"
    >
      <v-icon v-if="isDir" size="small" class="mr-1 expand-icon" :class="{ expanded: isExpanded }">
        mdi-chevron-right
      </v-icon>
      <v-icon v-else size="small" class="mr-1" :color="fileIconColor">
        {{ fileIcon }}
      </v-icon>
      <span class="tree-name text-body-2">{{ name }}</span>
      <span class="tree-lines text-caption text-medium-emphasis ml-auto">
        {{ (info._lines || 0).toLocaleString('zh-CN') }}
      </span>
    </div>
    <div v-if="isDir && isExpanded">
      <TreeNode
        v-for="(child, childName) in sortedChildren"
        :key="childName"
        :name="childName"
        :info="child"
        :depth="depth + 1"
        :expanded-ids="expandedIds"
        @toggle="(id) => $emit('toggle', id)"
        @copy="(text) => $emit('copy', text)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  info: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  expandedIds: { type: Object, required: true },
})

const emit = defineEmits(['toggle', 'copy'])

const nodeId = ref('')

const isDir = computed(() => !props.info._file)

const isExpanded = computed(() => props.expandedIds.has(nodeId.value))

const sortedChildren = computed(() => {
    if (!isDir.value) return {}
    const entries = Object.entries(props.info._children)
    entries.sort((a, b) => {
        const aDir = !a[1]._file
        const bDir = !b[1]._file
        if (aDir !== bDir) return aDir ? -1 : 1
        return a[0].localeCompare(b[0])
    })
    return Object.fromEntries(entries)
})

const extIconMap = {
    '.js': { icon: 'mdi-language-javascript', color: '#F7DF1E' },
    '.ts': { icon: 'mdi-language-typescript', color: '#3178C6' },
    '.jsx': { icon: 'mdi-react', color: '#61DAFB' },
    '.tsx': { icon: 'mdi-react', color: '#61DAFB' },
    '.vue': { icon: 'mdi-vuejs', color: '#4FC08D' },
    '.py': { icon: 'mdi-language-python', color: '#3776AB' },
    '.java': { icon: 'mdi-language-java', color: '#ED8B00' },
    '.go': { icon: 'mdi-language-go', color: '#00ADD8' },
    '.rs': { icon: 'mdi-language-rust', color: '#CE412B' },
    '.html': { icon: 'mdi-language-html5', color: '#E34F26' },
    '.css': { icon: 'mdi-language-css3', color: '#1572B6' },
    '.scss': { icon: 'mdi-sass', color: '#CC6699' },
    '.json': { icon: 'mdi-code-json', color: '#292929' },
    '.md': { icon: 'mdi-language-markdown', color: '#083FA1' },
    '.yaml': { icon: 'mdi-file-code', color: '#CB171E' },
    '.yml': { icon: 'mdi-file-code', color: '#CB171E' },
    '.sh': { icon: 'mdi-bash', color: '#4EAA25' },
    '.sql': { icon: 'mdi-database', color: '#336791' },
}

const fileIcon = computed(() => {
    if (isDir.value) return 'mdi-folder'
    const ext = props.info._ext
    return extIconMap[ext]?.icon || 'mdi-file-code'
})

const fileIconColor = computed(() => {
    if (isDir.value) return '#5C9AE5'
    const ext = props.info._ext
    return extIconMap[ext]?.color || '#909099'
})

function toggle() {
    emit('toggle', nodeId.value)
}

onMounted(() => {
    if (isDir.value) {
        nodeId.value = 'tn' + Math.random().toString(36).slice(2, 8)
    }
})
</script>

<style scoped>
.tree-node {
    padding: 3px 8px;
    border-radius: 4px;
    cursor: pointer;
    white-space: nowrap;
    min-height: 28px;
}
.tree-node:hover {
    background: rgba(0, 150, 136, 0.06);
}
.v-theme--dark .tree-node:hover {
    background: rgba(0, 150, 136, 0.12);
}
.tree-name {
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
}
.tree-lines {
    flex-shrink: 0;
    padding-left: 8px;
}
.expand-icon {
    transition: transform 0.15s;
}
.expand-icon.expanded {
    transform: rotate(90deg);
}
</style>
