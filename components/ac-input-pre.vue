<template>
  <span :class="`${prefixCls}`">
    <pre
      ref="placeholder"
      :class="`${prefixCls}-placeholder`"
      ><b>{{placeholder}}</b></pre>
    <pre
      ref="input"
      :class="`${prefixCls}-input`"
      @keydown.enter="Enter"
      @keydown.tab="Tab"
      @keydown.up.prevent="ArrowUp"
      @keydown.down.prevent="ArrowDown"
      @keydown.right="ArrowRight"
      @keydown.left="ArrowLeft"
      @focus="onFocus($event)"
      @blur="onBlur($event)"
      @click="onCursorChange($event);"
      @keyup="onCursorChange($event);"
      @input="input"
      contenteditable="true"
    ></pre>
  </span>
</template>

<script>
const prefixCls = 'ac-input-pre'
import _ from 'lodash'
const {DateTime} = require('luxon')
import pinyin4js from 'pinyin4js'
import dropdown from './dropdown'
import equal from 'deep-equal'

/* TODO
1. pinyin modual
2. input data format [...]
   two array:
     * values
     * showValues
*/
export default {
  name: 'ac-input-pre',
  components: {dropdown},
  props: {
    // basic for a input
    value: { type: String, default: '', index: null, },
    placeholder: { type: [String], default: 'value' },
    disabled: { type: Boolean, default: false },
  },
  data () {
    return {
      prefixCls,
      status: {
        drop: false
      },
      cursorPosition: 0,
      timer: {},
    }
  },
  computed: {
    calculatorValue () {
      return this.value?this.value:this.placeholder
    },
  },
  created () {
  },
  mounted () {
    this.dropdownObj = this.$children[0]
    this.onSizeChange(this.rootSize)
    this.$watch('size', this.onSizeChange)
    this.onValueChange(this.value, '')
    this.$watch('value', this.onValueChange)
  },
  methods: {
    onSizeChange () {
      let el = this.$refs.input.getBoundingClientRect()
      this.$el.style.width  =  el.width + 'px'
      this.$el.style.height = el.height + 'px'
    },
    onValueChange (newValue, oldValue) {
      console.log({newValue, oldValue})
      if (!newValue) {
        this.$refs.placeholder.style.removeProperty('visibility')
        let {width, height} = this.$refs.placeholder.getBoundingClientRect()
        this.$refs.input.style.width  = width + 'px'
        this.$refs.input.style.height = height + 'px'
      } else {
        if (!oldValue) {
          this.$refs.placeholder.style.visibility = 'hidden'
          this.$refs.input.style.removeProperty('width')
          this.$refs.input.style.removeProperty('height')
        }
      }
      this.onSizeChange()
    },
    ArrowUp () {
      this.dropdownObj.up()
    },
    ArrowDown () {
      this.dropdownObj.down()
    },
    ArrowLeft () {
      console.log('left')
    },
    ArrowRight () {
      console.log('right')
    },
    Tab (event) {
      console.log('tab')
    },
    Enter (event) {
      if (event.ctrlKey) {
        document.execCommand('insertText', false, '\n');
      } else {
        event.preventDefault()
        console.log('enter')
      }
    },
    onFocus () {
    },
    onBlur () {
    },
    input (event) {
      let value = event.target.innerText
      this.$emit('input', value)
    },
    onCursorChange (event) {
    },
    updateDropdown () {
      // when call this function, this.dataCal and this.matchStr has been updated
    },
  }
}
</script>

<style lang="scss">
$pre: ac-input-pre;
$fontFamily: 'Courier New';
[contenteditable]:focus {
    outline: 0px solid transparent;
}
.#{$pre} {
  font-family: #{$fontFamily};
  position: relative;
  display: inline-block;
  border-style: solid;
  border-width: thin;
}
.#{$pre}-placeholder {
  font-family: inherit;
  font-size: inherit;
  position: absolute;
  top:0;
  left:0;
  pointer-events: none;
  margin: 0px;
  padding: 2px;
  padding-right: 3px;
  color: darkgray;
}
.#{$pre}-input {
  font-family: inherit;
  font-size: inherit;
  position: absolute;
  top:0;
  left:0;
  margin: 0px;
  padding: 2px;
  padding-right: 3px;
}
.#{$pre}-dropdown-wrapper {
  position: relative;
}
.#{$pre}-calculator {
  position: absolute;
  visibility: hidden;
  font-family: inherit;
  color: gray;
  font-size: inherit;
}
</style>
