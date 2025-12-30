import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [vue()],
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
                    vue: ['vue', 'vue-router'],
                    vuetify: ['vuetify', '@mdi/font']
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
