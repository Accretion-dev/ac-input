<template>
  <div style="background:#eee;padding: 20px">
    <Card :bordered="false">
      <div slot="title">
        <p> {{ title }}: <test :name="name" text="Run"/> </p>
        <p>
          <template v-if="running">
            <clip-loader loading="true" color="green" size="20px" style="float: left;"/>
            &nbsp;&nbsp;&nbsp;
          </template>
          <span class='comment' ref='comment'> </span>
        </p>
      </div>
      <slot> </slot>
    </Card>
  </div>
</template>

<script>
import test from './test.vue'
import ClipLoader from 'vue-spinner/src/ClipLoader.vue'
export default {
  name: 'test-block',
  components: {test, ClipLoader},
  data () {
    return {
      running: false,
      loading: true,
    }
  },
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
  mounted () {
    const MutationObserverConfig={
      childList: true,
      subtree: true,
      characterData: true
    }
    this.mo = new MutationObserver((mutations) => {
      if (this.$refs.comment.textContent) {
        this.running = true
      } else {
        this.running = false
      }
    })
    this.mo.observe(this.$refs.comment, MutationObserverConfig)
  }
}
</script>

<style scoped>
.comment {
  font-weight: initial;
}
</style>
