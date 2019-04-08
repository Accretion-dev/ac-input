
<template>
  <div>
    dropdown
  </div>
</template>

<script>
const prefixCls = 'ac-input-dropdown'
import _ from 'lodash'

export default {
  name: 'ac-input-dropdown',
  props: {
    value: {
      type: String,
      default: '',
      index: null,
    },
  },
  data () {
    return {
      prefixCls,
    }
  },
  computed: {
  },
  created () {
  },
  mounted () {
    this.$watch('value', this.onValueChange)
    this.onValueChange(this.value, '')
  },
  methods: {
  }
}
</script>

<style lang="scss" scoped>
$pre: ac-input-dropdown;
</style>
