import { createApp } from 'vue'
import './assets/tailwind.css'
import App from './App.vue'

createApp(App)     // ✅ 挂载的是 root.vue
  .mount('#app')
