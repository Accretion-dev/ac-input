<template>
  <div id="app">
    <h1> Test enviroment for ac-input</h1>
    <div>
      <ac-input v-model="value1" placeholder="value1"/>
    </div>
    <div>
      <ac-input v-model="value2" placeholder="value2"/>
      <ac-input v-model="value3" placeholder="value3"/>
      <ac-input v-model="value4"/>
    </div>
    <div>
      <p> value1: "{{value1}}" </p>
      <p> value2: "{{value2}}" </p>
      <p> value3: "{{value3}}" </p>
      <p> value4: "{{value4}}" </p>
    </div>
  </div>
</template>

<script>

export default {
  name: 'app',
  data () {
    return {
      value1: '',
      value2: '',
      value3: '',
      value4: '',
      list1: [

      ]
    }
  }

}
</script>

<style>
</style>
