import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// 创建 Vuetify 实例
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#009688', // Teal
          secondary: '#00796b', // Teal Dark
          accent: '#26a69a',
          error: '#f44336',
          warning: '#ff9800',
          info: '#2196f3',
          success: '#4caf50',
          background: '#f5f7fa',
          surface: '#ffffff'
        }
      },
      dark: {
        colors: {
          primary: '#26a69a',
          secondary: '#00897b',
          accent: '#4db6ac',
          error: '#ef5350',
          warning: '#ffb74d',
          info: '#42a5f5',
          success: '#66bb6a',
          background: '#121212',
          surface: '#1e1e1e'
        }
      }
    }
  },
  defaults: {
    VBtn: {
      color: 'primary',
      variant: 'tonal'
    },
    VCard: {
      elevation: 2
    },
    VTextField: {
      density: 'comfortable',
      variant: 'outlined'
    },
    VSelect: {
      density: 'comfortable',
      variant: 'outlined'
    },
    VSlider: {
      density: 'comfortable'
    }
  }
})

// 创建应用
const app = createApp(App)

// 使用插件
app.use(router)
app.use(vuetify)

// 挂载应用
app.mount('#app')
