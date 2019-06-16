<template>
  <span>
    <ac-input-cursor
      v-model="value"
      :highlights="highlights"
      :data="data"
      :placeholder="placeholder"
      :max-drop="maxDrop"
      :droptype="droptype"
      :get-cursor-delay="null"
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
      @input="input"
    />
  </span>
</template>
<script>


export default {
  name: 'ac-input-simple',
  props: {
    // sync bind values
    outervalue: { type: String, default: '' },
    // data
    highlights: {type: Array, default: _ => ([])},
    data: {type: [Object, Array], default: _=> ([])},
    // properties
    placeholder: { type: [String], default: 'value' },
    maxDrop: {type: Number, default: 0},
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
  },
  data () {
    return {
      value: "",
    }
  },
  watch: {
    outervalue (value) {
      this.value = value
    }
  },
  methods: {
    input (value) {
      this.$emit('input', value)
    }
  }
}
</script>

<style lang="scss">
</style>
