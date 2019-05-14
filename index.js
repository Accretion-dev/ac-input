import ACInput from './components/ac-input.vue'
const plugin = {
  install (Vue, options) {
    Vue.component('ac-input', ACInput)
  }
}

export default plugin
