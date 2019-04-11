<template>
  <div id="app">
    <h1> Test enviroment for ac-input</h1>
    <test-env>
      <test-block title="All tests" name="all">
        <ul>
          <li> <p class="test-title"> Test auto stretch: <test-button name="stretch" :running="false"/> </p> </li>
        </ul>
      </test-block>
      <test-block title="Test auto stretch" name="stretch" id="stretch">
        <div>
          <ac-input v-model="values[0]" placeholder="value0"/>
          <ac-input v-model="values[1]" placeholder="value1"/>
          <ac-input v-model="values[2]" placeholder="value2"/>
          <p>
            <span> value0: "{{values[0]}}" </span>
            <span> value1: "{{values[1]}}" </span>
            <span> value2: "{{values[2]}}" </span>
          </p>
        </div>
      </test-block>
    </test-env>
  </div>
</template>

<script>
export default {
  name: 'app',
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
