<template>
  <v-card class="lan-transfer-tool" elevation="2">
    <!-- 顶部工具栏 -->
    <v-toolbar class="app-bar-blur" density="comfortable" flat>
      <!-- 用户信息 -->
      <div class="d-flex align-center">
        <v-avatar class="ml-2 mr-3" color="teal" size="36">
          <span class="text-white font-weight-bold">{{
              currentUser.name ? currentUser.name[0].toUpperCase() : 'ME'
            }}</span>
        </v-avatar>
        <div>
          <v-toolbar-title class="text-subtitle-1 font-weight-bold toolbar-title">
            {{ currentUser.name || '我的设备' }}(测试数据)
          </v-toolbar-title>
          <div class="text-caption text-medium-emphasis" style="font-size: 10px;">
            IP: {{ currentUser.ip || 'Scanning...' }} | {{ currentUser.status }}
          </div>
        </div>
      </div>

      <v-spacer></v-spacer>

      <v-btn :loading="isScanning" icon="mdi-refresh" variant="text" @click="refreshUsers"></v-btn>
    </v-toolbar>

    <v-divider class="divider-opacity"></v-divider>

    <v-card-text class="pa-0 content-container">
      <div class="main-stage pa-6">

        <!-- 阶段 1: 局域网用户仪表盘 -->
        <transition mode="out-in" name="slide-up">
          <div v-if="appState === 'discovery'" key="discovery">
            <div class="mb-4 d-flex justify-space-between align-center">
              <h3 class="text-h6 font-weight-bold">局域网在线用户</h3>
              <v-chip color="teal" size="x-small" variant="outlined">
                {{ usersList.length }} 台设备在线
              </v-chip>
            </div>

            <!-- 正在扫描空状态 -->
            <div v-if="isScanning && usersList.length === 0" class="text-center pa-10">
              <v-progress-circular color="teal" indeterminate size="48"></v-progress-circular>
              <div class="text-body-2 text-medium-emphasis mt-4">正在扫描局域网设备...</div>
            </div>

            <!-- 用户网格 -->
            <v-row v-else dense>
              <v-col
                  v-for="user in usersList"
                  :key="user.id"
                  cols="12"
                  md="4"
                  sm="6"
              >
                <v-card
                    class="user-card transition-card"
                    hover
                    @click="selectUser(user)"
                >
                  <div class="d-flex pa-3 align-center">
                    <v-avatar :color="getAvatarColor(user.name)" size="48">
                      {{ user.name[0].toUpperCase() }}
                    </v-avatar>

                    <div class="ml-3 overflow-hidden">
                      <div class="text-subtitle-2 font-weight-bold text-truncate">{{ user.name }}</div>
                      <div class="text-caption text-medium-emphasis text-truncate">
                        <v-icon size="12" start>mdi-laptop</v-icon>
                        {{ user.device }}
                      </div>
                    </div>

                    <v-spacer></v-spacer>

                    <!-- 传输按钮 -->
                    <v-btn
                        color="teal-darken-1"
                        icon="mdi-file-send-outline"
                        variant="text"
                    ></v-btn>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- 阶段 2: 已连接，等待操作 -->
          <div v-else-if="appState === 'connected'" key="connected" class="stage-box text-center">
            <div class="connected-success mb-4 anim-pop-bounce">
              <v-avatar color="success" size="80">
                <v-icon color="white" size="48">mdi-check-all</v-icon>
              </v-avatar>
            </div>

            <h3 class="text-h5 font-weight-bold mb-2">与 {{ targetUser?.name }} 已连接</h3>
            <p class="text-caption text-medium-emphasis mb-8">
              P2P 高速通道已建立 · 延迟 {{ ping }}ms
            </p>

            <v-btn
                block
                color="teal"
                prepend-icon="mdi-paperclip"
                size="large"
                variant="flat"
                @click="triggerFileSelect"
            >
              选择文件发送
            </v-btn>
            <input ref="fileInput" hidden type="file" @change="handleFileSelected">

            <v-btn
                class="mt-4"
                color="grey"
                variant="text"
                @click="disconnect"
            >
              断开连接
            </v-btn>
          </div>
        </transition>
      </div>

      <!-- 传输进度遮罩层 (Apple 风格) -->
      <transition name="apple-blur">
        <div v-if="transferring" class="transfer-overlay">
          <div class="loader-content text-center w-100 px-10">
            <div class="mb-4">
              <v-icon :color="isSender ? 'teal' : 'blue-grey'" size="56">
                {{ isSender ? 'mdi-cloud-upload' : 'mdi-cloud-download' }}
              </v-icon>
            </div>
            <div class="text-h5 font-weight-bold mb-1">{{ isSender ? '高速发送中' : '高速接收中' }}</div>
            <div class="text-caption text-medium-emphasis mb-4 text-truncate">
              {{ currentFileName }}
              <span class="ml-2 font-weight-bold text-teal">{{ transferRate }}</span>
            </div>

            <v-progress-linear
                v-model="transferProgress"
                color="teal"
                height="28"
                rounded
            >
              <template v-slot:default="{ value }">
                <strong class="text-white">{{ Math.ceil(value) }}%</strong>
              </template>
            </v-progress-linear>

            <div class="mt-4 d-flex justify-center text-caption text-grey">
              <span v-if="isSender">多线程上传中...</span>
              <span v-else>正在合并数据包...</span>
            </div>
          </div>
        </div>
      </transition>

    </v-card-text>
  </v-card>
</template>

<script setup>
import {computed, onUnmounted, ref} from 'vue'
import {Peer} from 'peerjs'
import {useTheme} from 'vuetify'

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

// --- 状态 ---
const appState = ref('discovery') // 'discovery' (仪表盘), 'connected' (连接后)
const isScanning = ref(false)
const currentUser = ref({name: '我的设备', ip: '192.168.1.5', status: 'Online'})
const usersList = ref([]) // 从后端获取的用户列表
const targetUser = ref(null) // 当前连接的用户
const ping = ref(0)

// PeerJS 实例
const peer = ref(null)
const conn = ref(null)

// 传输相关
const transferring = ref(false)
const transferProgress = ref(0)
const transferRate = ref('0 MB/s')
const currentFileName = ref('')
const fileInput = ref(null)
const isSender = computed(() => true) // 当前设计主动点击即为发送端

// --- 1. 用户发现与后端接口预留 ---

/**
 * TODO [BACKEND]:
 * 1. 用户打开页面时，前端调用 POST /api/lan/announce 上报自己的设备信息 (Name, Avatar)。
 * 2. 轮询 GET /api/lan/users 获取局域网内所有在线用户。
 * 3. 或者使用 WebSocket 保持长连接。
 */

// 模拟获取在线用户列表
const refreshUsers = async () => {
  isScanning.value = true
  try {
    // TODO [BACKEND]: 替换为真实后端请求
    // const response = await fetch('/api/lan/users')
    // const data = await response.json()

    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 800))

    // 模拟数据
    usersList.value = [
      {id: 'peer-001', name: 'MacBook Pro', device: 'Apple macOS', status: 'Idle'},
      {id: 'peer-002', name: 'Windows Server', device: 'Windows 11', status: 'Busy'},
      {id: 'peer-003', name: 'Xiaomi TV', device: 'Android TV', status: 'Online'},
    ]
  } catch (error) {
    console.error('获取用户列表失败', error)
  } finally {
    isScanning.value = false
  }
}

// 初始化时刷新一次
refreshUsers()

// --- 2. 连接逻辑 (点击用户图标) ---

const selectUser = (user) => {
  targetUser.value = user
  initPeerConnection(user.id)
}

const initPeerConnection = (targetId) => {
  // 1. 初始化自己的 Peer ID (生产环境应由后端分配或生成并注册)
  peer.value = new Peer(`user-${currentUser.value.ip.split('.').pop()}`, {debug: 2})

  peer.value.on('open', (id) => {
    console.log('My Peer ID is: ' + id)
    // 连接到目标用户
    connectToTarget(targetId)
  })

  peer.value.on('error', (err) => {
    console.error(err)
    alert('P2P 连接失败: ' + err.type)
    appState.value = 'discovery'
  })

  // 监听对方连接 (被动接收)
  peer.value.on('connection', (connection) => {
    conn.value = connection
    setupConnectionHandlers(connection, userFromRemoteId(connection.peer))
  })
}

const connectToTarget = (id) => {
  conn.value = peer.value.connect(id)
  setupConnectionHandlers(conn.value, targetUser.value)
}

const userFromRemoteId = (peerId) => {
  // 简单的反向查找名字
  return usersList.value.find(u => u.id === peerId) || {name: 'Unknown'}
}

const setupConnectionHandlers = (connection, user) => {
  connection.on('open', () => {
    appState.value = 'connected'
    targetUser.value = user
    console.log('Connected to:', user.name)
    ping.value = Math.floor(Math.random() * 5) + 1 // 模拟 Ping
  })

  connection.on('data', (data) => {
    handleIncomingData(data)
  })

  connection.on('close', () => {
    alert('连接已断开')
    disconnect()
  })
}

const disconnect = () => {
  if (conn.value) conn.value.close()
  if (peer.value) peer.value.destroy()
  conn.value = null
  peer.value = null
  appState.value = 'discovery'
  targetUser.value = null
}

// --- 3. 多线程/并发传输协议 ---

// 触发选择文件
const triggerFileSelect = () => fileInput.value.click()

const handleFileSelected = (e) => {
  const file = e.target.files[0]
  if (!file || !conn.value) return
  sendFileWithConcurrency(file)
}

/**
 * 核心传输逻辑：
 * 采用并发发送策略，而不是传统的串行。
 * 我们在内存中同时维护最多 N 个待发送块，以填满 TCP/WebRTC 的发送缓冲区，
 * 从而充分利用局域网带宽。
 */
const sendFileWithConcurrency = (file) => {
  transferring.value = true
  currentFileName.value = file.name
  transferProgress.value = 0
  const startTime = Date.now()
  const startTimeSize = 0

  const CHUNK_SIZE = 64 * 1024 // 64KB 每块
  const MAX_CONCURRENT = 8 // 并发发送块数 (模拟多线程)

  // 1. 发送元数据
  conn.value.send({
    type: 'metadata',
    name: file.name,
    size: file.size,
    fileType: file.type
  })

  let offset = 0
  let activeWorkers = 0
  const fileEnd = file.size

  // 辅助函数：读取并发送单个块
  const readAndSendChunk = (o) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        conn.value.send({
          type: 'chunk',
          index: o, // 序号，用于接收端排序（虽然 WebRTC 有序，但加上更稳健）
          data: e.target.result
        })
        resolve()
      }
      reader.onerror = reject

      const slice = file.slice(o, Math.min(o + CHUNK_SIZE, fileEnd))
      reader.readAsArrayBuffer(slice)
    })
  }

  // 主循环：滑动窗口发送
  const pump = async () => {
    // 当未发送完毕，且当前并发数未达到上限
    while (offset < fileEnd && activeWorkers < MAX_CONCURRENT) {
      const currentOffset = offset
      offset += CHUNK_SIZE // 移动指针

      // 模拟“线程”计数
      activeWorkers++

      readAndSendChunk(currentOffset).then(() => {
        activeWorkers-- // “线程”结束
        pump() // 尝试填充下一个
      }).catch(err => {
        console.error('Chunk send error:', err)
        activeWorkers--
        pump()
      })

      // 更新 UI 进度
      if (offset % (CHUNK_SIZE * 4) === 0) { // 每发4个块更新一次 UI，避免卡顿
        transferProgress.value = (Math.min(offset, fileEnd) / fileEnd) * 100
        calculateSpeed(startTime, offset, fileEnd)
      }
    }

    // 如果发送完了，等待所有 worker 完成
    if (offset >= fileEnd && activeWorkers === 0) {
      conn.value.send({type: 'end'})
      transferProgress.value = 100
      setTimeout(() => {
        transferring.value = false
        alert('文件发送完成！')
        fileInput.value.value = ''
      }, 500)
    }
  }

  pump() // 启动泵
}

// 计算传输速度
const calculateSpeed = (startTime, offset, total) => {
  const now = Date.now()
  const seconds = (now - startTime) / 1000
  if (seconds < 1) return // 刚开始不计算

  const mb = (offset / 1024 / 1024).toFixed(2)
  const speed = (mb / seconds).toFixed(1)
  transferRate.value = `${speed} MB/s`
}

// --- 4. 接收逻辑 ---

const receivedChunks = []
const receivedSet = new Set() // 去重，防止重发
let fileInfo = null
let receivedSize = 0

const handleIncomingData = (data) => {
  if (data.type === 'metadata') {
    fileInfo = data
    transferring.value = true
    currentFileName.value = data.name
    receivedChunks.length = 0
    receivedSet.clear()
    receivedSize = 0
    transferProgress.value = 0
  } else if (data.type === 'chunk') {
    // 简单去重逻辑
    if (!receivedSet.has(data.index)) {
      receivedChunks.push(data.data)
      receivedSet.add(data.index)
      receivedSize += data.data.byteLength
      transferProgress.value = (receivedSize / fileInfo.size) * 100
    }
  } else if (data.type === 'end') {
    // 按 index 排序（虽然 WebRTC 是有序的，但如果是多线程传输，为了保险）
    receivedChunks.sort((a, b) => (a.index || 0) - (b.index || 0))

    // 组装文件
    const blob = new Blob(receivedChunks, {type: fileInfo.fileType})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileInfo.name
    a.click()

    setTimeout(() => {
      transferring.value = false
      alert('文件接收完成！')
    }, 500)
  }
}

// --- 辅助函数 ---
const getAvatarColor = (name) => {
  const colors = ['red', 'pink', 'purple', 'deep-purple', 'indigo', 'blue', 'teal', 'green', 'orange', 'grey']
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

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

// 工具栏
.app-bar-blur {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

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

// 主内容
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
  overflow-y: auto;
  padding: 20px;
}

// 用户卡片
.user-card {
  border: 1px solid rgba(var(--v-border-color), 0.2);
  cursor: pointer;
  transition: all 0.3s $apple-ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border-color: var(--v-theme-primary);
  }
}

// 传输遮罩 (Apple 风格毛玻璃)
.transfer-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(24px) saturate(180%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.v-theme--dark .transfer-overlay {
  background: rgba(0, 0, 0, 0.85);
}

// 动画
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
    transform: scale(1.15);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.apple-blur-enter-active, .apple-blur-leave-active {
  transition: opacity 0.5s ease;
}

.apple-blur-enter-from, .apple-blur-leave-to {
  opacity: 0;
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

.connected-success {
  margin: 0 auto 20px auto;
}

.stage-box {
  max-width: 500px;
  margin: 0 auto;
}

</style>