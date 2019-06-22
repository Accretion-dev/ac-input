<template>
  <ac-input-cursor
    ref="input"
    v-model="innerValue"
    :highlights="highlights"
    :data="processedData"
    :placeholder="placeholder"
    :max-drop="maxDrop"
    :droptype="droptype"
    :show-message-delay="showMessageDelay"
    :droppable="droppable"
    :focus-select-all-text="focusSelectAllText"
    :auto-select="autoSelect"
    :disabled="disabled"
    :new-line-with-enter="newLineWithEnter"
    :pinyin="pinyin"
    :calculate-cursor-position="calculateCursorPosition"
    :tab="tab"
    :enter="enter"
    :cursor.sync="cursor"
    :cursor-start.sync="cursorStart"
    @parserUpdate="onparser"
    @report="report"
  />
</template>
<script>


export default {
  name: 'ac-input-simple',
  props: {
    // sync bind values
    // eslint-disable-next-line
    value: { default: '' },
    type: { type: String, default: 'string' },
    // data
    highlights: {type: Array, default: _ => ([])},
    data: {type: [Object, Array], default: _=> ([])},
    // properties
    placeholder: { type: [String], default: 'value' },
    maxDrop: {type: Number, default: 99},
    droptype: {type: String, default: 'normal'},
    // timeouts and time delays
    showMessageDelay: { type: Number, default: 0},
    // some switchers
    droppable: { type: Boolean, default: true},
    focusSelectAllText: { type: Boolean, default: false},
    autoSelect: {type: Boolean, default: true},
    disabled: { type: Boolean, default: false },
    newLineWithEnter: { type: Boolean, default: false},
    pinyin: {type: Boolean, default: true},
    calculateCursorPosition: { type: Boolean, default: true},
    // outer function
    tab: {type: Function, default:null},
    enter: {type: Function, default:null},
    // Validate
    validator: {type: Function, default: null},
    reportDelay: {type: Number, default: 0},
  },
  data () {
    return {
      innerValue: "",
      lastGoodValue: "",
      cursor: 0,
      cursorStart: 0,
      timers: {
        retport: null
      }
    }
  },
  computed: {
    parser () {
      let validator = this.validator
      let result = (value) => {
        let result = {
          cursor (cursor) {
            return {extract: value, range: null}
          },
          complete (cursor, oldValue, newValue) {
            return {value: newValue, cursor:cursor-oldValue.length + newValue.length}
          },
        }
        if (validator) {
          let error = validator(value)
          if (error) {
            result.error = new Error(error)
          }
        }
        return result
      }
      return result
    },
    processedData () {
      let result
      if (Array.isArray(this.data)) {
        let simpleType
        result = {
          parser: this.parser,
          data: this.data,
          simpleType: this.type,
        }
      } else {
        result = Object.assign({}, {parser: this.parser}, this.data)
      }
      return result
    }
  },
  watch: {
    value (value, oldValue) {
      if (value !== oldValue) {
        this.innerValue = String(value)
      }
    }
  },
  created () {
    this.innerValue = String(this.value)
  },
  methods: {
    setError (value) {
      this.$refs.input.setError(value)
    },
    report (value) {
      this.$emit('report', value)
    },
    focus () {
      this.$refs.input.focus()
    },
    blur () {
      this.$refs.input.blur()
    },
    onparser ({value, parser, data}) {
      clearTimeout(this.timers.report)
      this.timers.report = setTimeout(() => {
        if (!parser.error) {
          if (this.lastGoodValue !== value) {
            this.lastGoodValue = value
            if (this.type==='number') {
              value = Number(value)
            } else if (this.type === 'boolean') {
              if (value === 'true' || value === '1') {
                value = true
              } else if (value === 'false' || value === '0') {
                value = false
              } else {
                value = Boolean(value)
              }
            }
            this.$emit('input', value)
          }
        }
      }, this.reportDelay)
    }
  }
}
</script>

<style lang="scss">
</style>
