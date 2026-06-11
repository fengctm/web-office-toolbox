<template>
  <v-card elevation="1" rounded="lg">
    <v-card-title class="text-subtitle-1 font-weight-medium d-flex align-center">
      <span>文件行数排行</span>
      <v-spacer />
      <v-text-field
        v-model="search"
        density="compact"
        variant="outlined"
        placeholder="搜索文件路径..."
        prepend-inner-icon="mdi-magnify"
        hide-details
        style="max-width: 240px;"
        class="mr-2"
      />
      <v-btn
        variant="text"
        color="teal"
        size="small"
        @click="showAll = !showAll"
      >
        {{ showAll ? `显示前50 (${total} 个)` : `显示全部 (${total} 个)` }}
      </v-btn>
    </v-card-title>

    <v-divider />

    <v-table density="compact" hover>
      <thead>
        <tr>
          <th class="text-center" style="width: 48px;">#</th>
          <th class="cursor-pointer" @click="toggleSort('path')">
            文件路径
            <v-icon v-if="sortField === 'path'" size="small">
              {{ sortAsc ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
            </v-icon>
          </th>
          <th class="text-right cursor-pointer" @click="toggleSort('lines')">
            行数
            <v-icon v-if="sortField === 'lines'" size="small">
              {{ sortAsc ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
            </v-icon>
          </th>
          <th class="text-right" style="width: 80px;">占比</th>
          <th style="width: 40px;"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(f, i) in displayFiles" :key="f.path">
          <td class="text-center text-teal font-weight-medium">{{ i + 1 }}</td>
          <td class="path-cell" :title="f.path" @click="copy(f.path)">
            {{ f.path }}
          </td>
          <td class="text-right" style="font-variant-numeric: tabular-nums;">{{ f.lines.toLocaleString('zh-CN') }}</td>
          <td class="text-right text-medium-emphasis">{{ pct(f.lines) }}%</td>
          <td>
            <v-btn icon size="x-small" variant="text" @click="copy(f.path)">
              <v-icon size="small">mdi-content-copy</v-icon>
            </v-btn>
          </td>
        </tr>
        <tr v-if="displayFiles.length === 0">
          <td colspan="5" class="text-center text-medium-emphasis py-4">无匹配文件</td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  files: { type: Array, default: () => [] },
  totalLines: { type: Number, default: 0 },
})

const emit = defineEmits(['copy'])

const search = ref('')
const showAll = ref(false)
const sortField = ref('lines')
const sortAsc = ref(false)

const total = computed(() => filtered.value.length)

const filtered = computed(() => {
    let list = props.files
    if (search.value) {
        const q = search.value.toLowerCase()
        list = list.filter(f => f.path.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => {
        let va, vb
        if (sortField.value === 'path') {
            va = a.path
            vb = b.path
            return sortAsc.value ? va.localeCompare(vb) : vb.localeCompare(va)
        }
        va = a.lines
        vb = b.lines
        return sortAsc.value ? va - vb : vb - va
    })
})

const displayFiles = computed(() => showAll.value ? filtered.value : filtered.value.slice(0, 50))

function pct(lines) {
    return props.totalLines > 0 ? (lines / props.totalLines * 100).toFixed(1) : '0.0'
}

function toggleSort(field) {
    if (sortField.value === field) {
        sortAsc.value = !sortAsc.value
    } else {
        sortField.value = field
        sortAsc.value = false
    }
}

function copy(text) {
    emit('copy', text)
}
</script>

<style scoped>
.path-cell {
    max-width: 500px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
}
.path-cell:hover {
    color: rgb(var(--v-theme-teal));
}
.cursor-pointer {
    cursor: pointer;
    user-select: none;
}
.cursor-pointer:hover {
    color: rgb(var(--v-theme-teal));
}
</style>
