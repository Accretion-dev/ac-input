<template>
  <span :class="`${prefixCls}-root`">
    <input
      ref="input"
      :value="value"
      :class="prefixCls"
      :placeholder="placeholder"
      :disabled="disabled"
      @keydown.enter.prevent="Enter"
      @keydown.tab="Tab"
      @keydown.up.prevent="ArrowUp"
      @keydown.down.prevent="ArrowDown"
      @keydown.right="ArrowRight"
      @keydown.left="ArrowLeft"
      @focus="onFocus($event);onCursorChange($event);"
      @click="onCursorChange($event);"
      @keyup="onCursorChange($event);"
      @blur="onBlur"
      @input="onInput"
    />
    <pre ref="calculator" :class="`${prefixCls}-calculator`">{{ calculatorValue }}</pre>
    <div :class="{[`${prefixCls}-dropdown-wrapper`]: true}">
      <dropdown :drop="status.drop" :match="matchStr" :data="dataCal" :configs="config2use" />
    </div>
  </span>
</template>

<script>
const prefixCls = 'ac-input'
import _ from 'lodash'
const {DateTime} = require('luxon')
import pinyin4js from 'pinyin4js'
import dropdown from './dropdown'

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
    // basic for a input
    value: { type: String, default: '', index: null, },
    placeholder: { type: [String], default: '' },
    disabled: { type: Boolean, default: false },
    data: { type: [Object, Array, null], default () { return null }, },
    configs: { type: Object, default () {return {}} },
  },
  data () {
    return {
      prefixCls,
      status: {
        drop: false
      },
      input: '',
      cursorPosition: 0,
      timer: {},
      matchStr: '',
      dataCal: null,
      config2use: {}
    }
  },
  computed: {
    calculatorValue () {
      return this.value?this.value:this.placeholder
    },
    inputConfigs () {
      const defaultData = {
        focusSelectAllText: false,
        reportCursorDebounce: 100,
        matchDebounce: 100,
        droppable: false,
        maxDrop: 30,
        pinyin: true,
        type: 'input', // could be input, select or reference
        datatype: null,
        matchStrGet: _ => _,
        matchStrSet: null,
        changeData: _ => null,
        validator: _ => true,
        groupOrder: null,
      }
      return Object.assign({}, defaultData, this.configs)
    }
  },
  created () {
  },
  mounted () {
    this.onDataUpdate(true)
    this.onValueChange(this.value, '')
    this.$watch('value', this.onValueChange)
    this.$watch('data', this.onDataUpdate)
    this.$watch('configs', this.onDataUpdate)
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
      if (this.config2use.focusSelectAllText) {
        let input = this.$refs.input
        input.selectionStart = 0
        input.selectionEnd = input.value.length
      }
      if (this.config2use.droppable) {
        this.status.drop = true
      }
    },
    onBlur () {
      if (this.config2use.droppable) {
        this.status.drop = false
      }
    },
    onInput (event) {
      this.$emit('input', event.target.value)
    },
    onDataUpdate (init) {
      let data
      for (let eachKey of Object.keys(this.inputConfigs)) {
        this.$set(this.config2use, eachKey, this.inputConfigs[eachKey])
      }
      if (this.data) {
        if (Array.isArray(this.data)) {
          data = this.data
        } else if (typeof(this.data) === 'object') {
          if (this.data.matchStrGet && !this.data.matchStrSet) {
            throw Error('if you provide matchStrGet, you must also provide matchStrSet')
          }
          for (let eachKey of Object.keys(this.inputConfigs)) {
            if (this.data[eachKey]) {
              this.$set(this.config2use, eachKey, this.data[eachKey])
            }
          }
          if (!this.data.data) throw Error('should provide data.data if your data is a Object')
          data = this.data.data
          // notice that all configs will be overwrite by the last data
          // be caution when you will change the data multiple times
        }
        // process data
        if (!this.config2use.datatype) {
          let sample = data[0]
          if (sample === undefined) {
            // to be process by if(!data.length)
          } else if (typeof(sample) === 'object') {
            if (sample instanceof Date) {
              this.config2use.datatype = 'date'
            } else {
              this.dataCal = []
              throw Error(`unsupported datatype: data[0]=${sample}`)
            }
          } else if (typeof(sample) === 'string') {
            this.config2use.datatype = 'string'
          } else if (typeof(sample) === 'number') {
            this.config2use.datatype = 'number'
          } else {
            this.dataCal = []
            throw Error(`unsupported datatype: data[0]=${sample}`)
          }
        }
        if (!data.length) {
          this.dataCal = []
        } else if (this.config2use.datatype === 'date') {
          this.dataCal = data.map(_ => {
            let formated = DateTime.fromMillis(Number(_))
            // console.log({raw: _.toISOString(), format: formated.toISO()})
            return {
              match: formated.toISO(),
              show: formated.toISO(),
              value: formated,
            }
          })
        } else if (this.config2use.datatype === 'string') {
          this.dataCal = data.map(_ => {
            return {
              match: _,
              show: _,
              value: _,
            }
          })
        } else if (this.config2use.datatype === 'number') {
          this.dataCal = data.map(_ => {
            return {
              match: String(_),
              show: String(_),
              value: _,
            }
          })
        } else {
          this.dataCal = this.data.data
        }
        this.dataCal.forEach((_, index) => {
          _.index = index
          _.group = []
        })
        if (this.data.getGroup) {
          this.config2use.getGroup = this.data.getGroup
          this.dataCal.forEach(_ => {
            let group = this.data.getGroup(_.value)
            if (group.length) {
              _.group = [..._.group, ...group]
            }
          })
        } else {
          this.dataCal.forEach((_, index) => {
            _.group.push('default')
          })
        }
        if (this.pinyin && this.datatype === 'string') {
          this.dataCal.forEach(_ => {
            this.addPinyin(_)
          })
        }
      }

      if (!init) {
        this.updateDropdown()
      }
    },
    onValueChange (newValue, oldValue) {
      this.$refs.input.style.width = this.$refs.calculator.offsetWidth + 5 +"px"
      if (this.data) {
        let matchStrGet = this.config2use.matchStrGet
        let matchStr = matchStrGet(newValue)
        if (matchStr !== this.matchStr) {
          this.matchStr = matchStr
          if (this.changeData) { // report the parent to change the data
            if (this.changeData(this.matchStr, this.value)) {
              this.$emit('data', this.changeData(this.matchStr, this.value))
            }
          }
          clearTimeout(this.timer.match)
          this.timer.match = setTimeout(() => {
            this.$emit('match', this.matchStr)
            this.updateDropdown()
          }, this.matchDebounce)
        }
      }
    },
    onCursorChange (event) {
      let pos = event.target.selectionStart
      if (pos !== this.cursorPosition) {
        this.cursorPosition = pos
        clearTimeout(this.timer.cursor)
        this.timer.cursor = setTimeout(() => {
          this.$emit('cursor', this.cursorPosition)
        }, this.reportCursorDebounce)
      }
    },
    updateDropdown () {
      // when call this function, this.dataCal and this.matchStr has been updated

    },
    addPinyin (dict) {
      if (!dict.show.match(/[\u3400-\u9FBF]/)) return
      let pinyin = pinyin4js.convertToPinyinString(dict.show, '', pinyin4js.WITHOUT_TONE)
      if (typeof(dict.match) === 'string') {
        dict.match = [dict.match, pinyin]
      } else {
        dict.match = [...dict.match, pinyin]
      }
    }
  }
}
</script>

<style lang="scss">
$pre: ac-input;
$fontFamily: 'Courier New';
.#{$pre}-root {
  font-family: #{$fontFamily};
  display: inline-flex;
  flex-direction: column;
}
.#{$pre} {
  font-family: inherit;
  font-size: inherit;
  text-align: left;
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
