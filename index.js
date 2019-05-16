import ACInput from './components/ac-input.vue'
import ACInputCursor from './components/ac-input-cursor.vue'
const plugin = {
  install (Vue, options) {
    Vue.component('ac-input', ACInput)
    Vue.component('ac-input-cursor', ACInputCursor)
  }
}

export default plugin
