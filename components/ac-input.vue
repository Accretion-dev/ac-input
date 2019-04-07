
<template>
  <span>
    <input
      ref="input"
      :value="value"
      :class="prefixCls"
      :placeholder="placeholder"
      @keydown.enter.prevent="Enter"
      @keydown.tab.prevent="Tab"
      @keydown.up.prevent="ArrowUp"
      @keydown.down.prevent="ArrowDown"
      @keydown.right="ArrowRight"
      @keydown.left="ArrowLeft"
      @input="$emit('input', $event.target.value)"
    >
      <pre ref="calculator" :class="`${prefixCls}-calculator`">{{ value?value:String(placeholder) }}</pre>
    </input>
  </span>
</template>

<script>
const prefixCls = 'ac-input'
import LiquidMetal from 'liquidmetal'
import _ from 'lodash'

export default {
  name: 'ac-input',
  props: {
    value: {
      type: String,
      default: '',
    },
    data: {
      type: Object,
      default () { return {} }
    },
    placeholder: {
      type: [String],
      default: ''
    },
  },
  data () {
    return {
      prefixCls,
      input: '',
      mo: null
    }
  },
  computed: {
    isBlank () {
      return !this.value
    }
  },
  created () {
  },
  mounted () {
    this.$watch('value', this.onChangeValue)
    this.onChangeValue(this.value, '')
  },
  methods: {
    ArrowUp () {
      console.log('up')

    },
    ArrowDown () {
      console.log('down')

    },
    ArrowLeft () {
      console.log('left')

    },
    ArrowRight () {
      console.log('right')

    },
    Tab () {
      console.log('tab')

    },
    Enter (event) {
      console.log('enter')
    },
    onChange (event) {
      // if (event.srcElement === this.$refs.input) return
      console.log(event.target.data, event)
    },
    async onChangeValue (newValue, oldValue) {
      this.$refs.input.style.width = this.$refs.calculator.offsetWidth + 1 +"px"
    }
  }
}
</script>

<style lang="scss" scoped>
$pre: ac-input;
$fontFamily: 'Courier New';
.#{$pre} {
  font-family: #{$fontFamily};
  font-size: inherit;
  text-align: left;
}
.#{$pre}-calculator {
  position: absolute;
  visibility: hidden;
  font-family: #{$fontFamily};
  color: gray;
  font-size: inherit;
}
</style>
