import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/main.css'
import drag from './directives/drag.js'
import resize from './directives/resize.js'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.directive('drag', drag)
app.directive('resize', resize)

app.mount('#app')
