import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify' // 1. 引入插件

export default defineConfig({
    plugins: [
        vue(),
    ],
    server: {
        port: 5173,
        open: false,
        host: 'localhost'
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vue: ['vue', 'vue-router']
                }
            }
        }
    },
    resolve: {
        alias: {
            '@': '/src'
        }
    }
})
