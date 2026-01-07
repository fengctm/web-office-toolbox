import {createVuetify} from 'vuetify'

// 导入 Vuetify 样式
import 'vuetify/styles'

// 图标集
import {aliases, mdi} from 'vuetify/iconsets/mdi'
import {mdi as mdiSvg} from 'vuetify/iconsets/mdi-svg'
import '@mdi/font/css/materialdesignicons.css'

export const vuetify = createVuetify({
    icons: {
        defaultSet: 'mdi',
        aliases: {
            ...aliases,
            __svg__: ['svg', null],
        },
        sets: {
            mdi,
            svg: mdiSvg,
        },
    },
    theme: {
        defaultTheme: 'light',
        themes: {
            light: {
                colors: {
                    primary: '#009688',
                    background: '#f5f7fa',
                    surface: '#ffffff'
                }
            },
            dark: {
                colors: {
                    primary: '#26a69a',
                    background: '#121212',
                    surface: '#1e1e1e'
                }
            }
        }
    }
})
