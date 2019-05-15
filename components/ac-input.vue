<template>
  <span :class="{[`${prefixCls}`]: true, [`${prefixCls}-disabled`]: disabled}"
    @mouseover="mouseOver"
    @mouseleave="mouseLeave"
  >
    <pre v-for="({head, middle, tail, color, message}, index) of highlightsData"
         ref="highlights"
         :key="index"
         :title="message"
         :class="`${prefixCls}-highlight-root`"
         @click="changeMessage(1)"
         @contextmenu.prevent="changeMessage(-1)"
    >{{ head }}<span :class="`${prefixCls}-highlight`" :style="{'background-color': color}">{{ middle }}</span>{{ tail }}</pre>
    <pre v-if="rangeCalculator"
         ref="rangeCalculator"
         :class="`${prefixCls}-rangeCalculator`"
    >{{ rangeCalculator.head }}<span ref="range">{{ rangeCalculator.middle }}</span>{{ rangeCalculator.tail }}</pre>
    <pre
      ref="placeholder"
      :class="`${prefixCls}-placeholder`"
      ><b>{{ placeholder }}</b></pre>
    <pre
      ref="input"
      :class="`${prefixCls}-input`"
      :contenteditable="!disabled"
      @keydown="keydown"
      @focus="onFocus($event)"
      @blur="onBlur($event)"
      @input="input"
      @click="getCursor"
    ></pre>
    <div :class="{[`${prefixCls}-dropdown-wrapper`]: true}" :style="dropdownPosition.style">
      <dropdown :drop.sync="status.drop"
                :droppable="dropSwitch"
                :match="matchStrRange.extract"
                :data="dropdownData"
                :max-drop="maxDrop"
                @complete="complete"
      />
    </div>
  </span>
</template>
<script>
const prefixCls = 'ac-input'
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
const defaultFunctions = {
  parser: value => {
    return {
      cursor (cursor) {
        // extract is for the dropdown to match
        // range gives the highlights
        return {extract: value, range: null}
      },
      complete (cursor, oldValue, newValue) {
        return {value: newValue, cursor:cursor-oldValue.length + newValue.length}
      },
    }
  },
}
const CHINESE = /[\u3400-\u9FBF]/

export default {
  name: 'ac-input',
  components: {dropdown},
  props: {
    // basic for a input
    value: { type: String, default: '' },
    cursorStart: { type: Number, default: 0 },
    cursor: { type: Number, default: 0 },
    placeholder: { type: [String], default: 'value' },
    disabled: { type: Boolean, default: false },
    highlights: {type: Array, default: _ => ([])},
    focusSelectAllText: { type: Boolean, default: false},
    droppable: { type: Boolean, default: true},
    getCursorDelay: { type: Number, default: 5},
    showMessageDelay: { type: Number, default: 0},
    calculateCursorPosition: { type: Boolean, default: true},
    data: {type: [Object, Array], default: _=> ([])},
    pinyin: {type: Boolean, default: true},
    maxDrop: {type: Number, default: 0},
    droptype:{type: String, default:'match'},
    tab: {type: Function, default:null},
    enter: {type: Function, default:null},
  },
  data () {
    return {
      prefixCls,
      status: {
        drop: false,
        showMessage: false,
        showMessageIndex: 0,
        width: 0,
        height: 0,
      },
      offsetStart: 0,
      offsetEnd: 0,
      timer: {
        cursor: null,
        showMessage: null,
        blur: null,
      },
      dropdownFunctions: {
        extract: null,
        range: null,
      },
      dropdownObj: null,
      dropSwitch: true,
      dropdownPosition: {style: ""},
      updater: {
        cursor: 1
      },
    }
  },
  computed: {
    rangeCalculator () {
      if (this.calculateCursorPosition && this.range) {
        let {start, end} = this.range
        //console.log('range:', {s:this.range.start,e:this.range.end})
        end += 1
        let string = this.value.replace(/[^\n]/g, ' ')
        let head = string.slice(0,start)
        let middle = string.slice(start,end+1)
        let tail = string.slice(end+1,)
        //console.log(`${head.length},${middle.length},${tail.length}`)
        return {head, middle, tail}
      } else {
        return null
      }
    },
    highlightsData () {
      let outer = this.highlights.map(this.getHighlightsData)
      let inner = []
      if (this.range) {
        if (Array.isArray(this.range)) {
          inner = [this.range.map(this.getHighlightsData)]
        } else {
          inner = [this.getHighlightsData(this.range)]
        }
      }
      return [...inner, ...outer]
    },
    dropdownData () {
      if (!this.data) {
        return []
      } else if (Array.isArray(this.data)) { // simple data
        return [{
            group: 'default',
            format: 'string',
            always: false,
            data:this.data.map(_ => {
              if (this.pinyin&&_.match(CHINESE)) {
                let pinyin = pinyin4js.convertToPinyinString(_, '', pinyin4js.WITHOUT_TONE)
                return {
                  value: _,
                  match:[pinyin, _],
                  description:'',
                }
              } else {
                return {
                  value: _,
                  match:_,
                  description:'',
                }
              }
            })
          }]
      } else {
        let data
        if (this.parserData) {
          data = this.parserData
        } else {
          data = this.data.data
        }
        if (!data) {
          throw Error(`should have data: ${this.data}`)
        }
        data.forEach(_ => {
          let data = _.data
          if (!_.format) {
            _.format = 'string'
          }
          if (_.data) {
            _.data = data.map(_ => {
              if (typeof(_)!=='object' || !('data' in _)) { // data is array of values
                let type = typeof(_)
                if (_ instanceof Date) {
                  _ = _.toISOString()
                } else {
                  _ = String(_)
                }
                if (this.pinyin && _.match(CHINESE)) {
                  let pinyin = pinyin4js.convertToPinyinString(_, '', pinyin4js.WITHOUT_TONE)
                  return {
                    data: _,
                    match:[pinyin, _],
                    description:'',
                  }
                } else {
                  return {
                    data: _,
                    match:_,
                    description:'',
                  }
                }
              } else { // data is and obj like {data, }
                if (!('match' in _)) _.match = _.data
                if (this.pinyin && _.data.match(CHINESE)) {
                  let pinyin = pinyin4js.convertToPinyinString(_.data, '', pinyin4js.WITHOUT_TONE)
                  if (typeof(_.match) === 'string') {
                    _.match = [pinyin, _.match]
                  } else {
                    _.match.push(pinyin)
                  }
                } else {
                  return _
                }
              }
            })
          }
        })
        return data
      }
    },
    parser () {
      if (typeof(this.data)==='object' && this.data.parser) {
        return this.data.parser(this.value)
      } else {
        return defaultFunctions.parser(this.value)
      }
    },
    parserData () {
      if (!this.data) return null
      if (!this.data.parser) return null
      if (this.matchStrRange.completeData) {
        return this.matchStrRange.completeData
      } else {
        return null
      }
    },
    range () {
      return this.matchStrRange.range
    },
    matchStrRange () {
      let result = this.parser.cursor(this.cursor)
      this.$emit('match', result.extract)
      return result
    },
  },
  created () {
  },
  mounted () {
    this.onSizeChange(this.rootSize)
    this.$watch('size', this.onSizeChange)
    this.onValueChange(this.value, '')
    this.$watch('value', this.onValueChange)
    this.$watch('cursor', this.onCursorChange)
    this.$watch('cursorStart', this.onCursorStartChange)
    this.dropdownObj = this.$children.find(_ => _.$options.name === 'ac-input-dropdown')
  },
  methods: {
    complete (autocomplete) {
      if (this.timer.blur) {
        clearTimeout(this.timer.blur)
      }
      let {completeValue, offset} = autocomplete
      let {cursor, value} = this.parser.complete(this.offsetEnd, this.value, completeValue, offset)
      this.$emit('input', value)
      setTimeout(() => {
        this.setCursor(cursor)
      })
    },
    getHighlightsData (data) {
      let {start, end, color, message} = data
      if (!color) color='yellow'
      if (!message) message=''
      let string = this.value.replace(/[^\n]/g, ' ')
      let head = string.slice(0,start)
      let middle = string.slice(start,end+1)
      let tail = string.slice(end+1,)
      return {head, middle, tail, color, message}
    },
    changeMessage(delta) {
      this.showMessage(this.status.showMessageIndex + delta)
    },
    mouseLeave(event) {
      if (this.showMessageDelay) {
        if (this.timer.showMessage !== null) {
          clearTimeout(this.timer.showMessage)
        }
        this.timer.showMessage = null
        if (this.status.showMessage) {
          this.showMessage(null)
        }
        this.status.showMessageIndex = 0
      }
    },
    mouseOver(event) {
      if (this.showMessageDelay) {
        if (this.timer.showMessage !== null) {
          clearTimeout(this.timer.showMessage)
        }
        this.timer.showMessage = setTimeout(()=>{
          this.showMessage(0)
        }, this.showMessageDelay)
      }
    },
    showMessage(state) {
      if (state!==null) {
        if (this.$refs.highlights) {
          let len = this.$refs.highlights.length
          if (state<0) {
            state += 10*len
          }
          this.status.showMessageIndex = state % len
          for (let each of this.$refs.highlights) {
            each.style['pointer-events'] = 'none'
            each.style.removeProperty('z-index')
          }
          let each = this.$refs.highlights[this.status.showMessageIndex]
          each.style['pointer-events'] = 'all'
          each.style['z-index'] = 999
          this.status.showMessage = true
        }
      } else {
        if (this.$refs.highlights) {
          for (let each of this.$refs.highlights) {
            each.style['pointer-events'] = 'none'
            each.style.removeProperty('z-index')
          }
          this.status.showMessage = false
        }
      }
    },
    selectAll() {
      if (this.range) {
        let {start,end} = this.range
        if (start===this.cursorStart && end===this.cursor) {
          this.select(0, this.value.length)
        } else {
          this.select(start, end)
        }
      } else {
        this.select(0, this.value.length)
      }
    },
    select (start, end) {
      if (start<0 || end<0 || start>this.value.length || end > this.value.length || start > end) {
        throw Error(`bad select range, should have: 0<= ${start} <= ${end} <=${this.value.length}-1`)
      } else {
        this.$emit('update:cursor', end)
        this.$emit('update:cursorStart', start)
      }
    },
    selectRange (cursor) {
      sel = window.getSelection()
      let {focusOffset, focusNode} = sel

      let line = 1
      let offset = 0
      let column = 0
      let node = null
      let thisoffset = 0
      let reset

      if (cursor===0) {
        node = this.$refs.input
      } else {
        let nodes = this.$refs.input
        for (let index in nodes.childNodes) {
          let thenode = nodes.childNodes[index]
          if (thenode.nodeType === 3) { // text
            if (offset + thenode.data.length >= cursor) { // get position in a text
              thisoffset = cursor - offset
              node = thenode
              offset += thisoffset
              break
            } else {
              offset += thenode.data.length
            }
          } else if (thenode.tagName === 'BR') {
            line += 1
            offset += 1
            if (offset === cursor) {
              if (Number(index) + 1 <= nodes.childNodes.length - 1) { // at start of the next line
                thisoffset = 0
                node = nodes.childNodes[Number(index)+1]
              } else { // at end of previous line
                this.$emit('update:cursor', offset-1)
                reset = offset-1
              }
              break
            }
          }
        }
        if (cursor > offset) {
          this.$emit('update:cursor', offset)
          reset = offset
        }
      }
      if (reset !== undefined) return
      let range = document.createRange()
      let sel = window.getSelection()
      this.offsetStart = cursor
      range.setStart(node, thisoffset)
      range.setEnd(focusNode, focusOffset)
      sel.removeAllRanges()
      sel.addRange(range)
      this.getCursor()
    },
    setCursor (cursor) {
      let line = 1
      let offset = 0
      let column = 0
      let node = null
      let thisoffset = 0
      let reset

      if (cursor<0) {
        this.$emit('update:cursor', 0)
        reset = 0
      } else if (cursor===0) {
        node = this.$refs.input
      } else {
        let nodes = this.$refs.input
        for (let index in nodes.childNodes) {
          let thenode = nodes.childNodes[index]
          if (thenode.nodeType === 3) { // text
            if (offset + thenode.data.length >= cursor) { // get position in a text
              thisoffset = cursor - offset
              node = thenode
              offset += thisoffset
              break
            } else {
              offset += thenode.data.length
            }
          } else if (thenode.tagName === 'BR') {
            line += 1
            offset += 1
            if (offset === cursor) {
              if (Number(index) + 1 <= nodes.childNodes.length - 1) { // at start of the next line
                thisoffset = 0
                node = nodes.childNodes[Number(index)+1]
              } else { // at end of previous line
                this.$emit('update:cursor', offset-1)
                reset = offset-1
              }
              break
            }
          }
        }
        if (cursor > offset) {
          this.$emit('update:cursor', offset)
          reset = offset
        }
      }
      if (reset !== undefined) return
      let range = document.createRange()
      let sel = window.getSelection()
      this.offsetEnd = cursor
      range.setStart(node, thisoffset)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
      this.getCursor()
    },
    getCursorSingle (node, inputOffset) {
      let line = 1
      let offset = 0
      let column = 0
      let maxLength = this.$refs.input.childNodes.length
      if (node === this.$refs.input) {
        maxLength = inputOffset
      }
      let nodes = Array.from(this.$refs.input.childNodes)
      for (let thenode of nodes.slice(0,maxLength)) {
        if (thenode === node) {
          column = inputOffset
          offset += column
          break
        }
        if (thenode.nodeType === 3) { // text
          offset += thenode.data.length
        } else if (thenode.tagName === 'BR') {
          line += 1
          offset += 1
        }
      }
      return {line, offset, column}
    },
    getCursorWrapper () {
      let sel = window.getSelection()
      let node = sel.focusNode
      let {line, offset, column} = this.getCursorSingle(node, sel.focusOffset)
      setTimeout(() => {
        this.updater.cursor += 1
      },1000)
      if (sel.anchorNode===node && sel.anchorOffset===self.focusOffset) { //
        if (this.cursor !== offset) {
          this.offsetStart = offset
          this.offsetEnd = offset
          this.$emit('update:cursorStart', offset)
          this.$emit('update:cursor', offset)
        }
      } else { // select a area
        this.offsetEnd = offset
        this.$emit('update:cursor', offset)
        let {line:sline, offset:soffset, column:scolumn} = this.getCursorSingle(sel.anchorNode, sel.anchorOffset)
        this.offsetStart = soffset
        this.$emit('update:cursorStart', soffset)
      }
      //console.log({line, column, offset, node})
    },
    getCursor() {
      clearTimeout(this.timer.cursor)
      this.timer.cursor = setTimeout(_ => {
        this.getCursorWrapper()
      }, this.getCursorDelay)
    },
    onCursorStartChange (newValue, oldValue) {
      if (newValue === this.offsetEnd) {
        return
      } else if (newValue<0 || newValue>this.offsetEnd) {
        this.offsetStart = this.offsetEnd
        this.$emit('update:cursorStart', this.offsetEnd)
      } else { // do select
        this.offsetStart = newValue
        this.selectRange(newValue)
      }
    },
    onCursorChange (newValue, oldValue) {
      if (newValue !== this.offsetEnd) {
        this.setCursor(newValue)
      }
      this.$nextTick(() => {
        let dropdownPosition
        if (this.range && this.$refs.range) {
          let {x:px,y:py} = this.$refs.rangeCalculator.getBoundingClientRect()
          let {x,y,width,height} = this.$refs.range.getBoundingClientRect()
          //console.log('pos:  ', {s:this.range.start,e:this.range.end, x})
          dropdownPosition = {style:{left:x-px+'px', top:y-py+height+'px'}}
        } else {
          let x = this.status.width
          let y = this.status.height
          dropdownPosition = {style:{left:'0px', top:y+'px'}}
        }
        this.dropdownPosition = dropdownPosition
      })
    },
    changeHighlightSize ({width, height}) {
      if (this.$refs.highlights) {
        for (let each of this.$refs.highlights) {
          each.style.width  = width + 'px'
          each.style.height = height + 'px'
        }
      }
    },
    onSizeChange () {
      let el = this.$refs.input.getBoundingClientRect()
      this.$el.style.width  =  el.width + 'px'
      this.$el.style.height = el.height + 'px'
      this.status.width = el.width
      this.status.height = el.height
      this.changeHighlightSize({width:el.width, height:el.height})
    },
    onValueChange (newValue, oldValue) {
      if (this.$refs.input.innerText!==newValue) {
        this.$refs.input.innerText = newValue
        this.getCursor()
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
        case 'ArrowUp': case 'ArrowDown': case 'PageUp': case 'PageDown':
          this.navigation(event); break;
        case 'Escape':
          this.dropSwitch = !this.dropSwitch; break;
        case 'a':
          if (event.ctrlKey) {
            event.preventDefault()
            this.selectAll()
          }
          break;
        case '/': case '"': case "'":
          this.doubleInput(event.key, event.key, event); break
        case '[':
          this.doubleInput(event.key, ']', event); break
        case '(':
          this.doubleInput(event.key, ')', event); break
        case '{':
          this.doubleInput(event.key, '}', event); break
        case 'Backspace':
          this.doubleDelete(event); break
      }
      if (!['Control', 'ModeChange', 'Shift'].includes(event.key)) {
        this.getCursor()
      }
    },
    doubleInput (key,keymatch,event) {
      let cursor = this.cursor
      let before = this.value[cursor-1]
      if (before !== keymatch) {
        event.preventDefault()
        let head = this.value.slice(0,cursor)
        let tail = this.value.slice(cursor)
        this.$emit('input', `${head}${key}${keymatch}${tail}`)
        setTimeout(() => {
          this.$emit('update:cursor', cursor + 1)
        },0)
      }
    },
    doubleDelete (event) {
      let cursor = this.cursor
      let before = this.value[cursor-1]
      let after  = this.value[cursor]
      if ( before==='/' && after==='/' ||
           before==='"' && after==='"' ||
           before==="'" && after==="'" ||
           before==="[" && after==="]" ||
           before==="{" && after==="}" ||
           before==="(" && after===")" ) {
        event.preventDefault()
        let head = this.value.slice(0,cursor-1)
        let tail = this.value.slice(cursor+1)
        this.$emit('input', `${head}${tail}`)
        setTimeout(() => {
          this.$emit('update:cursor', cursor - 1)
        },0)
      }
    },
    Tab (event) {
      if (this.status.drop) {
        let complete = this.dropdownObj.Tab()
        if (!complete) {
          event.preventDefault()
        } else {
          if (this.tab) { this.tab(this, event) }
        }
      } else {
        if (this.tab) { this.tab(this, event) }
      }
    },
    Enter (event) {
      if (event.ctrlKey) {
        let sel = window.getSelection()
        let node = sel.baseNode
        let offset = sel.baseOffset
        if (node === this.$refs.input) {
          let nodes = Array.from(this.$refs.input.childNodes)
          node = nodes[offset]
          let next = nodes[offset+1]
          if (!node || node.tagName==='BR' && !next) {
            document.execCommand('insertHtml', false, '<br><br>')
          } else if (node.tagName==='BR' && (next && next.tagName==='BR')) {
            document.execCommand('insertHtml', false, '<br><br>')
            this.$nextTick(() => { // move cursor back
              let range = document.createRange()
              let sel = window.getSelection()
              range.setStart(this.$refs.input, offset+1)
              range.collapse(true)
              sel.removeAllRanges()
              sel.addRange(range)
            })
          } else if (node.tagName==='BR' && (next && next.tagName!=='BR')){
            document.execCommand('insertHtml', false, '<br><br>')
            this.$nextTick(() => { // move cursor back
              let range = document.createRange()
              let sel = window.getSelection()
              range.setStart(this.$refs.input, offset+1)
              range.collapse(true)
              sel.removeAllRanges()
              sel.addRange(range)
            })
          } else {
            document.execCommand('insertHtml', false, '<br>')
          }
        } else if (node.nodeType === 3) {
          if (offset !== node.data.length) {
            document.execCommand('insertHtml', false, '<br>') // enter at middle of string
            return
          } else { // enter at end of a string
            let nodes = Array.from(this.$refs.input.childNodes)
            offset = nodes.findIndex(_ => _===node)
            let next = nodes[offset+1]
            let next2 = nodes[offset+2]
            if (!next || (next.tagName==='BR' && (!next2))) { // end of strin
              document.execCommand('insertHtml', false, '<br><br>')
            } else if (next && next.tagName === 'BR') {
              document.execCommand('insertHtml', false, '<br><br>')
              this.$nextTick(() => { // move cursor back
                let range = document.createRange()
                let sel = window.getSelection()
                range.setStart(this.$refs.input, offset+2)
                range.collapse(true)
                sel.removeAllRanges()
                sel.addRange(range)
              })
            } else {
              document.execCommand('insertHtml', false, '<br>')
            }
          }
        } else {
          debugger
        }
      } else {
        if (this.status.drop) {
          let complete = this.dropdownObj.Enter()
          if (!complete) {
            event.preventDefault()
          } else {
            event.preventDefault()
            if (this.enter) { this.enter(this, event) }
          }
        } else {
          event.preventDefault()
          if (this.enter) { this.enter(this, event) }
        }
      }
    },
    navigation (event) {
      if (this.status.drop && this.dropdownObj.itemCount>0) { // move dropdown
        event.preventDefault()
        this.dropdownObj.navigation(event.key)
      }
    },
    onFocus () {
      if (this.focusSelectAllText) {
        setTimeout(_ => {
          let input = this.$refs.input
          if (input.hasChildNodes()) {
            let range = document.createRange()
            let sel = window.getSelection()
            range.selectNodeContents(input)
            sel.removeAllRanges()
            sel.addRange(range)
          }
        },0)
      }
      this.status.drop = true
    },
    onBlur (event) {
      //this.timer.blur = setTimeout(() => {
      //  this.status.drop = false
      //}, 0)
    },
    input (event) {
      let value = event.target.innerText
      // there is a known bug: the value must not be "\n", so if it is '\n', set to ""
      if (value === '\n') {
        event.target.innerText = ""
        value = ""
      }
      this.$emit('input', value)
    },
  }
}
</script>

<style lang="scss">
$pre: ac-input;
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
.#{$pre}-disabled {
  background-color: #ebebeb;
  color: gray;
}
@mixin ac-input-pre-common {
  font-family: inherit;
  font-size: inherit;
  position: absolute;
  top:0;
  left:0;
  margin: 0px;
  padding: 2px;
  padding-right: 3px;
}
.#{$pre}-placeholder {
  @include ac-input-pre-common;
  pointer-events: none;
  color: darkgray;
}
.#{$pre}-input {
  @include ac-input-pre-common;
}
.#{$pre}-highlight-root {
  @include ac-input-pre-common;
  pointer-events: none;
}
.#{$pre}-rangeCalculator {
  @include ac-input-pre-common;
  visibility: hidden;
  pointer-events: none;
}
.#{$pre}-highlight {
}
//.#{$pre}-input:after{
//  content:'\0200B'
//}

.#{$pre}-dropdown-wrapper {
  position: relative;
  z-index: 999;
}
</style>
