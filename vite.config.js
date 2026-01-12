import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
    plugins: [
        vue({
            script: {
                defineModel: true,
                propsDestructure: true
            }
        }),
        vuetify({
            autoImport: true  // 启用自动导入
        })
    ],
    server: {
        port: 5173,
        open: false,
        host: '0.0.0.0'
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vue: ['vue', 'vue-router'],
                    vuetify: ['vuetify']
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
