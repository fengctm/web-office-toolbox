import {createApp} from 'vue'
import App from './App.vue'
import router from './router.js'

// 导入 Vuetify 配置
import { vuetify } from './plugins/vuetify'

// 创建应用
const app = createApp(App)

// 使用插件
app.use(router)
app.use(vuetify)

// 挂载应用
app.mount('#app')
