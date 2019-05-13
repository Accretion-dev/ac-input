<template>
  <span :class="`${prefixCls}`">
    <pre
      ref="placeholder"
      :class="`${prefixCls}-placeholder`"
      ><b>{{ placeholder }}</b></pre>
    <pre
      ref="input"
      :class="`${prefixCls}-input`"
      contenteditable="true"
      @keydown="keydown"
      @focus="onFocus($event)"
      @blur="onBlur($event)"
      @input="input"
      @click="getCursor"
    >{{ value }}</pre>
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
  //components: {dropdown},
  props: {
    // basic for a input
    value: { type: String, default: '' },
    cursor: { type: Number, default: 0 },
    placeholder: { type: [String], default: 'value' },
    disabled: { type: Boolean, default: false },
  },
  data () {
    return {
      prefixCls,
      status: {
        drop: false
      },
      offset: 0,
      line: 0,
      column: 0,
      timer: {},
    }
  },
  computed: {
  },
  created () {
  },
  mounted () {
    this.dropdownObj = this.$children[0]
    this.onSizeChange(this.rootSize)
    this.$watch('size', this.onSizeChange)
    this.onValueChange(this.value, '')
    this.$watch('value', this.onValueChange)
    this.$watch('cursor', this.onCursorChange)
  },
  methods: {
    countSetCursor (cursor, nodes, data, level) {
      if (!level) level = 0
      if (cursor<0) {
        this.$emit('update:cursor', 0)
        data.reset = 0
        return false
      }
      for (let index in nodes.childNodes) {
        let thenode = nodes.childNodes[index]
        if (thenode.nodeType === 3) { // text
          if (data.offset + thenode.data.length >= cursor) { // get position in a text
            data.thisoffset = cursor - data.offset
            data.node = thenode
            return false
          } else {
            data.offset += thenode.data.length
          }
        } else if (thenode.tagName === 'DIV') {
          data.line += 1
          data.offset += 1
          if (data.offset === cursor) {
            data.thisoffset = 0
            data.node = thenode.childNodes[0]
            return false
          }
          let good = this.countSetCursor(cursor, thenode, data, level+1)
          if (!good) return false
        } else if (thenode.tagName === 'BR') {
          if (nodes.childNodes.length===1) {
            return true
          }
          data.line += 1
          data.offset += 1
          if (data.offset === cursor) {
            if (Number(index) + 1 <= nodes.childNodes.length - 1) { // at start of the next line
              data.thisoffset = 0
              data.node = nodes.childNodes[Number(index)+1]
              return false
            } else { // at end of previous line
              this.$emit('update:cursor', data.offset-1)
              data.reset = data.offset-1
              return false
            }
          }
        }
      }
      if (level==0) {
        if (cursor > data.offset) {
          this.$emit('update:cursor', data.offset)
          data.reset = data.offset
        }
      }
      return true
    },
    setCursor (cursor) {
      console.log(`set cursor to`, cursor)
      let data = {
        line:1,
        offset:0,
        column:0,
        node: null,
        thisoffset: 0,
      }
      this.countSetCursor(cursor, this.$refs.input, data)

      if (data.reset !== undefined) return
      let range = document.createRange()
      let sel = window.getSelection()
      this.offset = cursor
      range.setStart(data.node, data.thisoffset)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
      this.getCursor()
    },
    countCursor(node, nodes, data) {
      for (let thenode of nodes.childNodes) {
        if (thenode === node) {
          data.column = data.lastoffset
          data.offset += data.column
          return false
        }
        if (thenode.nodeType === 3) { // text
          data.offset += thenode.data.length
        } else if (thenode.tagName === 'DIV') {
          data.line += 1
          data.offset += 1
          let good = this.countCursor(node, thenode, data)
          if (!good) return false
        } else if (thenode.tagName === 'BR') {
          if (nodes.childNodes.length===1) {
            return true
          }
          data.line += 1
          data.offset += 1
        }
      }
      return true
    },
    getCursor () {
      let sel = window.getSelection()
      let node = sel.focusNode
      window.sel = sel
      let data = {
        line:1,
        offset:0,
        column:0,
        lastoffset: sel.focusOffset,
      }
      this.countCursor(node, this.$refs.input, data)
      let {line, column, offset} = data
      this.line = line
      this.column = column
      if (this.cursor !== offset) {
        this.offset = offset
        this.$emit('update:cursor', offset)
      }
      console.log({line, column, offset})
    },
    onCursorChange (newValue, oldValue) {
      console.log({newValue, oldValue, offset: this.offset})
      if (newValue !== this.offset) {
        this.setCursor(newValue)
      }
    },
    onSizeChange () {
      let el = this.$refs.input.getBoundingClientRect()
      this.$el.style.width  =  el.width + 'px'
      this.$el.style.height = el.height + 'px'
    },
    onValueChange (newValue, oldValue) {
      if (this.$refs.input.innerText!==newValue) {
        console.log(this.$refs.input.innerText, newValue, oldValue)
        this.$refs.input.innerText = newValue
      }
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
    keydown(event) {
      if (event.key === '=' && event.ctrlKey) {
        event.preventDefault()
        this.$emit('update:cursor', this.cursor + 1)
        return
      } else if (event.key === '-' && event.ctrlKey) {
        event.preventDefault()
        this.$emit('update:cursor', this.cursor - 1)
        return
      }

      switch (event.key) {
        case 'Tab':
          this.Tab(event); break;
        case 'Enter':
          this.Enter(event); break;
      }
      if (!['Control', 'ModeChange', 'Shift'].includes(event.key)) {
        setTimeout(()=>{
          this.getCursor()
        },0)
      }
    },
    Tab (event) {
      console.log('tab')
    },
    Enter (event) {
      if (event.ctrlKey) {
        //document.execCommand('insertHtml', false, '<br>')
        document.execCommand('insertText', false, '\n')
      } else {
        event.preventDefault()
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
