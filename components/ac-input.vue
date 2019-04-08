<template>
  <span>
    <input
      ref="input"
      :value="value"
      :class="prefixCls"
      :placeholder="placeholder"
      @keydown.enter.prevent="Enter"
      @keydown.tab="Tab"
      @keydown.up.prevent="ArrowUp"
      @keydown.down.prevent="ArrowDown"
      @keydown.right="ArrowRight"
      @keydown.left="ArrowLeft"
      @focus="onFocus"
      @blur="onBlur"
      @input="$emit('input', $event.target.value)"
    />
    <pre ref="calculator" :class="`${prefixCls}-calculator`">{{ calculatorValue }}</pre>
  </span>
</template>

<script>
const prefixCls = 'ac-input'
import LiquidMetal from 'liquidmetal'
import dropdown from './dropdown'
import _ from 'lodash'

/* TODO
1. pinyin modual
2. input data format [...]
   two array:
     * values
     * showValues
*/
export default {
  name: 'ac-input',
  components: {dropdown},
  props: {
    value: {
      type: String,
      default: '',
      index: null,
    },
    data: {
      type: Object,
      default () { return {} }
    },
    drop: {
      type: Boolean,
      default: true
    },
    select: {
      type: Boolean,
      default: true
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
    calculatorValue () {
      return this.value?this.value:this.placeholder
    }
  },
  created () {
  },
  mounted () {
    this.$watch('value', this.onValueChange)
    this.onValueChange(this.value, '')
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
    Tab (event) {
      let input = this.$refs.input
      if (!(input.selectionStart === input.value.length || input.selectionEnd === input.value.length)) {
        event.preventDefault()
      }
    },
    Enter (event) {
      console.log('enter')
    },
    onFocus () {
      let input = this.$refs.input
      input.selectionStart = 0
      input.selectionEnd = input.value.length
    },
    onBlur () {
      console.log('blur')
    },
    async onValueChange (newValue, oldValue) {
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
