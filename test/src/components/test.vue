<template>
  <div>
    <button @click="doTest">
      {{ name }}
    </button>
  </div>
</template>

<script>
import testConfig from '../../testConfig.json'
import axios from 'axios'
const seleniumPort = testConfig.seleniumPort
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'


export default {
  name: 'app',
  props: {
    name: {
      required: true,
      type: String,
    }
  },
  data () {
    return {
    }
  },
  methods: {
    async doTest () {
      let result = await axios.get(`http://localhost:${seleniumPort}/${this.name}`, {
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        responseType: 'json',
      })
      console.log(result)
    }
  }
}
</script>

<style>
</style>
