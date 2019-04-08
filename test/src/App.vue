<template>
  <div id="app">
    <h1> Test enviroment for ac-input</h1>
    <test-block title="All tests" name="all">
      <p class="test-title"> All tests: <test name="all" text="Run"/> </p>
      <ul>
        <li> <p class="test-title"> Test auto stretch: <test name="stretch" text="Run"/> </p> </li>
      </ul>
    </test-block>
    <test-block title="Test auto stretch" name="stretch">
      <div>
        <ac-input v-model="values[0]" placeholder="value"/>
        <p> value1: "{{values[0]}}" </p>
      </div>
    </test-block>
  </div>
</template>

<script>
import testBlock from './components/test-block.vue'
import test from './components/test.vue'

export default {
  name: 'app',
  components: {testBlock, test},
  data () {
    return {
      values: [...Array(10).keys()].map(_ => '')
    }
  }
}
</script>

<style>
h1 {
  text-align: center;
}
.test-title {
  font-weight: bolder;
}
</style>
