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
        vuetify({ autoImport: true })
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
    },
    define: {
        'process.env': {}
    }
})
