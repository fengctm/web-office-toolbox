import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import {resolve} from 'path';

export default defineConfig({
    server: {
        port: 5172
    },
    plugins: [
        vue({
            script: {
                defineModel: true,
                propsDestructure: true
            }
        }),
        vuetify({
            autoImport: true  // 启用自动导入，保持与主配置一致
        })
    ],

    // Electron 主进程配置
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'main.js')
            },
            output: {
                format: 'es',
                entryFileNames: '[name].js',
                chunkFileNames: '[name]-[hash].js',
                assetFileNames: '[name].[ext]'
            },
            external: ['electron', 'fs', 'path', 'fs-extra', 'url']
        },
        outDir: 'dist-electron',
        emptyOutDir: true,
        target: 'node16'
    },

    resolve: {
        alias: {
            '@': resolve(__dirname, '../src')
        }
    }
});
