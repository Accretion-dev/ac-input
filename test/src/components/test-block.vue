<template>
  <div style="background:#eee;padding: 20px">
    <Card :bordered="false">
      <p slot="title">
        {{ title }}: <test :name="name" text="Run"/>
      </p>
      <slot> </slot>
    </Card>
  </div>
</template>

<script>
import test from './test.vue'
export default {
  name: 'test-block',
  components: {test},
  props: {
    name: {
      required: true,
      type: String,
    },
    title: {
      required: true,
      type: String,
    },
  },
}
</script>

<style>
</style>
