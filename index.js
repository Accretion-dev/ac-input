import ACInput from './components/ac-input.vue'
import ACInputPre from './components/ac-input-pre.vue'
const plugin = {
  install (Vue, options) {
    Vue.component('ac-input', ACInput)
    Vue.component('ac-input-pre', ACInputPre)
  }
}

export default plugin
