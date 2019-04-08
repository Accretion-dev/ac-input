import Vue from 'vue'
import App from './App.vue'
import ACInput from '../../index.js'
import iView from 'iview'
import 'iview/dist/styles/iview.css'

Vue.config.productionTip = false
Vue.use(iView)
Vue.use(ACInput)

new Vue({
  render: h => h(App),
}).$mount('#app')
