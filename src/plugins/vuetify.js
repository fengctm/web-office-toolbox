import {createVuetify} from 'vuetify'


import 'vuetify/styles'
import {aliases, mdi} from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'


import {mdi as mdiSvg} from 'vuetify/iconsets/mdi-svg'


export const vuetify = createVuetify({
    components,
    directives,
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
