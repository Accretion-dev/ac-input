import Vue from 'vue'
import App from './App.vue'
import ACInput from '../../index.js'

Vue.config.productionTip = false
Vue.use(ACInput)

new Vue({
  render: h => h(App),
}).$mount('#app')
