<template>
  <v-card class="lan-transfer-tool" elevation="2">
    <!-- 顶部工具栏 -->
    <v-toolbar class="app-bar-blur" density="comfortable" flat>
      <v-icon class="ml-2 mr-2 icon-bounce" color="teal">mdi-network</v-icon>
      <v-toolbar-title class="text-subtitle-1 font-weight-bold toolbar-title">局域网 P2P 互传</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-chip :color="statusColor" size="x-small" variant="flat">
        {{ statusText }}
      </v-chip>
    </v-toolbar>

    <v-divider class="divider-opacity"></v-divider>

    <v-card-text class="pa-0 content-container">
      <div class="main-stage pa-6 text-center">

        <!-- 阶段 1: 选择角色 -->
        <transition mode="out-in" name="slide-up">
          <div v-if="appState === 'idle'" key="idle" class="stage-box">
            <div class="illustration mb-6">
              <v-icon color="teal-lighten-3" size="80">mdi-account-group-outline</v-icon>
            </div>
            <h3 class="text-h5 font-weight-bold mb-6">选择传输模式</h3>
            <v-row justify="center">
              <v-col cols="6">
                <v-btn
                    block
                    class="rounded-xl btn-micro-interaction"
                    color="teal-darken-1"
                    height="80"
                    variant="tonal"
                    @click="enterMode('host')"
                >
                  <v-icon size="large" start>mdi-server-network</v-icon>
                  <span class="text-body-1 font-weight-bold">我是发送端</span>
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn
                    :class="{ 'bg-grey-darken-4': isDark }"
                    block
                    class="rounded-xl text-grey-darken-2 btn-micro-interaction"
                    color="blue-grey-lighten-4"
                    height="80"
                    @click="enterMode('guest')"
                >
                  <v-icon size="large" start>mdi-laptop</v-icon>
                  <span class="text-body-1 font-weight-bold">我是接收端</span>
                </v-btn>
              </v-col>
            </v-row>
          </div>

          <!-- 阶段 2: 发送端 (等待连接) -->
          <div v-else-if="appState === 'host'" key="host" class="stage-box">
            <div class="avatar-circle mb-4 anim-pop-bounce">
              <v-icon size="48">mdi-server-network</v-icon>
            </div>
            <h3 class="text-h6 font-weight-bold">等待连接...</h3>
            <p class="text-caption text-medium-emphasis mb-6">请让接收端输入以下代码：</p>

            <v-card class="id-display-card mb-6" color="grey-lighten-4">
              <div class="text-h2 font-weight-black tracking-widest text-teal">{{ roomId || '...' }}</div>
              <v-btn
                  class="mt-2"
                  prepend-icon="mdi-content-copy"
                  size="x-small"
                  variant="text"
                  @click="copyRoomId"
              >
                复制 ID
              </v-btn>
            </v-card>

            <v-btn
                color="error"
                prepend-icon="mdi-close"
                variant="text"
                @click="resetApp"
            >
              取消
            </v-btn>
          </div>

          <!-- 阶段 3: 接收端 (输入 ID) -->
          <div v-else-if="appState === 'guest'" key="guest" class="stage-box">
            <div class="avatar-circle mb-4 anim-pop-bounce" style="background-color: rgba(100, 100, 100, 0.2);">
              <v-icon size="48">mdi-laptop</v-icon>
            </div>
            <h3 class="text-h6 font-weight-bold">加入房间</h3>
            <p class="text-caption text-medium-emphasis mb-6">请输入发送端提供的 ID：</p>

            <v-text-field
                v-model="inputId"
                class="mb-6"
                hide-details
                label="输入连接 ID"
                placeholder="例如: friendly-cat-123"
                variant="solo"
            ></v-text-field>

            <v-btn
                :loading="connecting"
                color="teal-darken-1"
                variant="flat"
                width="100%"
                @click="connectToHost"
            >
              连接
            </v-btn>

            <v-btn
                class="mt-4"
                variant="text"
                @click="resetApp"
            >
              返回
            </v-btn>
          </div>

          <!-- 阶段 4: 已连接，开始传输 -->
          <div v-else-if="appState === 'connected'" key="connected" class="stage-box">
            <div class="connected-success mb-4 anim-pop-bounce">
              <v-icon color="success" size="48">mdi-check-all</v-icon>
            </div>
            <h3 class="text-h6 font-weight-bold mb-1">连接成功</h3>
            <p class="text-caption text-medium-emphasis mb-8">P2P 通道已建立，可以直接传输</p>

            <!-- 只有发送端显示文件选择 -->
            <div v-if="mode === 'host'">
              <v-btn
                  block
                  color="teal"
                  prepend-icon="mdi-paperclip"
                  size="large"
                  variant="flat"
                  @click="triggerFileSelect"
              >
                选择文件开始发送
              </v-btn>
              <input ref="fileInput" hidden type="file" @change="handleFileSelected">
            </div>
            <!-- 接收端等待 -->
            <div v-else>
              <v-progress-linear color="teal-lighten-4" height="6" indeterminate></v-progress-linear>
              <div class="text-caption mt-2">等待对方发送文件...</div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 传输进度遮罩层 -->
      <transition name="apple-blur">
        <div v-if="transferring" class="transfer-overlay">
          <div class="loader-content text-center w-100 px-10">
            <div class="mb-4">
              <v-icon :color="isSender ? 'teal' : 'blue-grey'" size="48">
                {{ isSender ? 'mdi-upload' : 'mdi-download' }}
              </v-icon>
            </div>
            <div class="text-h6 font-weight-bold mb-2">{{ isSender ? '正在发送...' : '正在接收...' }}</div>
            <div class="text-caption text-medium-emphasis mb-4">{{ currentFileName }}</div>

            <v-progress-linear
                v-model="transferProgress"
                color="teal"
                height="24"
                rounded
            >
              <template v-slot:default="{ value }">
                <strong>{{ Math.ceil(value) }}%</strong>
              </template>
            </v-progress-linear>

            <v-btn
                v-if="!isSender"
                class="mt-4"
                color="teal"
                disabled
                size="small"
                variant="flat"
            >
              接收中...
            </v-btn>
          </div>
        </div>
      </transition>

    </v-card-text>
  </v-card>
</template>

<script setup>
import {computed, onUnmounted, ref, watchEffect} from 'vue'
import {Peer} from 'peerjs'
import {useTheme} from 'vuetify'

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

// --- 状态 ---
const appState = ref('idle') // idle, host, guest, connected
const mode = ref('') // 'host' or 'guest'
const peer = ref(null)
const conn = ref(null)
const roomId = ref('')
const inputId = ref('')
const connecting = ref(false)

// 传输相关
const transferring = ref(false)
const transferProgress = ref(0)
const currentFileName = ref('')
const fileInput = ref(null)
const isSender = computed(() => mode.value === 'host')

// UI 辅助
const statusText = computed(() => {
  switch (appState.value) {
    case 'idle':
      return '准备就绪'
    case 'host':
      return '等待连接'
    case 'guest':
      return '准备加入'
    case 'connected':
      return '已连接 (P2P)'
    default:
      return '未知'
  }
})
const statusColor = computed(() => {
  return appState.value === 'connected' ? 'success' : 'grey'
})

// --- 逻辑方法 ---

// 1. 初始化 Peer
const initPeer = (customId = null) => {
  // 使用 PeerJS 默认的云端服务器
  // 生产环境建议配置自己的 peer server
  peer.value = new Peer(customId, {
    debug: 2
  })

  peer.value.on('open', (id) => {
    if (customId) roomId.value = id
    console.log('My peer ID is: ' + id)
  })

  peer.value.on('error', (err) => {
    console.error(err)
    alert('连接错误: ' + err.type)
    connecting.value = false
  })
}

const enterMode = (selectedMode) => {
  mode.value = selectedMode
  if (selectedMode === 'host') {
    appState.value = 'host'
    // 发送端生成随机 ID
    const randomId = Math.floor(Math.random() * 10000).toString()
    initPeer(`transfer-${randomId}`)
  } else {
    appState.value = 'guest'
    initPeer() // 接收端 ID 不重要
  }
}

const copyRoomId = () => {
  if (roomId.value) {
    navigator.clipboard.writeText(roomId.value)
    alert('ID 已复制: ' + roomId.value)
  }
}

// 2. 连接逻辑
const connectToHost = () => {
  if (!inputId.value.trim() || !peer.value) return

  connecting.value = true
  // 尝试连接
  conn.value = peer.value.connect(inputId.value.trim())

  handleConnectionSetup(conn.value)
}

const handleConnectionSetup = (connection) => {
  connection.on('open', () => {
    appState.value = 'connected'
    connecting.value = false
    console.log('Connected to: ' + connection.peer)
  })

  connection.on('data', (data) => {
    handleIncomingData(data)
  })

  connection.on('close', () => {
    alert('连接已断开')
    resetApp()
  })

  connection.on('error', (err) => {
    console.error(err)
    connecting.value = false
    alert('连接失败')
  })
}

// 监听外部连接（仅 Host）
const setupHostListeners = () => {
  peer.value.on('connection', (connection) => {
    conn.value = connection
    handleConnectionSetup(connection)
  })
}

// 补：Host 初始化时需要监听连接
watchEffect(() => {
  if (mode.value === 'host' && peer.value && peer.value.id) {
    setupHostListeners()
  }
})

// 3. 文件传输逻辑 (核心：分片传输)

// 触发选择文件
const triggerFileSelect = () => fileInput.value.click()

const handleFileSelected = (e) => {
  const file = e.target.files[0]
  if (!file || !conn.value) return

  sendFile(file)
}

const sendFile = (file) => {
  transferring.value = true
  currentFileName.value = file.name
  transferProgress.value = 0

  const reader = new FileReader()
  const chunkSize = 16 * 1024 // 16KB chunks (Safe limit for PeerJS)

  // 1. 发送元数据
  conn.value.send({
    type: 'metadata',
    name: file.name,
    size: file.size,
    fileType: file.type
  })

  let offset = 0

  reader.onload = (e) => {
    // 注意：这里简化逻辑，为了不阻塞 UI，使用 requestAnimationFrame 或 timeout
    // 这是一个简单的实现，大文件建议使用 Web Worker
    const chunk = e.target.result
    conn.value.send({
      type: 'chunk',
      data: chunk
    })

    offset += chunk.byteLength
    transferProgress.value = (offset / file.size) * 100

    if (offset < file.size) {
      readSlice(offset)
    } else {
      // 发送结束
      conn.value.send({type: 'end'})
      setTimeout(() => {
        transferring.value = false
        transferProgress.value = 0
        alert('文件发送完成！')
        fileInput.value.value = '' // Reset input
      }, 500)
    }
  }

  const readSlice = (o) => {
    const slice = file.slice(o, o + chunkSize)
    reader.readAsArrayBuffer(slice)
  }

  readSlice(0)
}

// 接收逻辑
const receivedChunks = []
let receivedSize = 0
let fileInfo = null

const handleIncomingData = (data) => {
  if (data.type === 'metadata') {
    fileInfo = data
    transferring.value = true
    currentFileName.value = data.name
    receivedChunks.length = 0
    receivedSize = 0
    transferProgress.value = 0
  } else if (data.type === 'chunk') {
    receivedChunks.push(data.data)
    receivedSize += data.data.byteLength
    transferProgress.value = (receivedSize / fileInfo.size) * 100
  } else if (data.type === 'end') {
    // 组装文件
    const blob = new Blob(receivedChunks, {type: fileInfo.fileType})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileInfo.name
    a.click()

    setTimeout(() => {
      transferring.value = false
      transferProgress.value = 0
      alert('文件接收完成！')
    }, 500)
  }
}

const resetApp = () => {
  if (peer.value) {
    peer.value.destroy()
    peer.value = null
  }
  conn.value = null
  appState.value = 'idle'
  mode.value = ''
  roomId.value = ''
  inputId.value = ''
  transferring.value = false
  transferProgress.value = 0
}

// 生命周期清理
onUnmounted(() => {
  if (peer.value) peer.value.destroy()
})
</script>

<style lang="scss" scoped>
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);

.lan-transfer-tool {
  border-radius: 20px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--v-theme-background));
  transition: background-color 0.3s $apple-ease;
}

// 工具栏样式 (复用之前的)
.app-bar-blur {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s $apple-ease;

  .toolbar-title {
    color: #1d1d1f;
  }
}

.v-theme--dark {
  .app-bar-blur {
    background-color: rgba(30, 30, 30, 0.75);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    .toolbar-title {
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .divider-opacity {
    border-color: rgba(255, 255, 255, 0.12) !important;
  }
}

.icon-bounce {
  transition: transform 0.4s $apple-ease;
}

.icon-bounce:hover {
  transform: rotate(-10deg) scale(1.1);
}

.btn-micro-interaction {
  transition: transform 0.2s $apple-ease;
}

.btn-micro-interaction:active {
  transform: scale(0.95);
}

// 主舞台
.content-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.main-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
}

.stage-box {
  width: 100%;
  max-width: 500px;
}

.id-display-card {
  padding: 16px;
  border-radius: 16px;
  border: 2px dashed rgba(0, 150, 136, 0.3);
  transition: all 0.3s;
}

.avatar-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: rgba(0, 150, 136, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.connected-success {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: rgba(76, 175, 80, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

// 传输遮罩
.transfer-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.v-theme--dark .transfer-overlay {
  background: rgba(0, 0, 0, 0.85);
}

// 动画类
.anim-pop-bounce {
  animation: popBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  opacity: 0;
  transform: scale(0);
}

@keyframes popBounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.4s $apple-ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.apple-blur-enter-active, .apple-blur-leave-active {
  transition: opacity 0.5s ease;
}

.apple-blur-enter-from, .apple-blur-leave-to {
  opacity: 0;
}

</style>