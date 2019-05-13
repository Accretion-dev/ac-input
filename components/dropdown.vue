<template>
  <span v-if="drop" :class="{[prefixCls]: true}">
    <template v-if="match"> <!--show match info-->
      <div :class="{[`${prefixCls}-wrapper`]: true}">
        <div v-for="({show, cls, group, index, count}, key) of items" :key="key" :class="{[cls]: true, [`${prefixCls}-selected`]: count===selectIndex}">
          {{ show }}
        </div>
      </div>
    </template>
    <template v-else :class="{[`${prefixCls}-wrapper`]: true}"> <!--show statistic info-->
      <div :class="{[`${prefixCls}-wrapper`]: true}">
        <div :class="{[`${prefixCls}-item-group`]: true}">
          info of {{ configs.datatype }}s
        </div>
        <div v-for="{key, show} of statisticItems" :key="key" :class="{[`${prefixCls}-item`]: true}">
          {{ key }}: {{ show }}
        </div>
      </div>
    </template>
  </span>
</template>

<script>
const prefixCls = 'ac-input-dropdown'
import _ from 'lodash'
import percentile from 'percentile'
import LiquidMetal from 'liquidmetal'
const {DateTime} = require('luxon')

export default {
  name: 'ac-input-dropdown',
  props: {
    drop: {
      type: Boolean,
      default: false,
    },
    data: {
      type: Array,
      default () {return []},
    },
    configs: {
      type: Object,
      default () {return {}}
    },
    match: {
      type: String,
      default: "",
    },
  },
  data () {
    return {
      prefixCls,
      statistic: { },
      statisticItems: [],
      processedData: [],
      selectIndex: -1,
    }
  },
  computed: {
    items () {
      let items = []
      let count = 0
      for (let group of this.groupOrder) {
        let groupItem = this.groups[group]
        if (groupItem) {
          if (!(count===0 && group === 'default')) {
            items.push({show: group, cls: `${prefixCls}-item-group`, count})
            count += 1
          }
          for (let {show, index} of groupItem) {
            items.push({show, group, cls: `${prefixCls}-item`, index, count})
            count += 1
            if (this.configs.maxDrop && count >= this.configs.maxDrop) {
              return items
            }
          }
        }
      }
      return items
    },
    groups () {
      let groups = {}
      for (let each of this.processedData) {
        for (let g of each.group) {
          if (!groups[g]) groups[g] = []
          groups[g].push(each)
        }
      }
      return groups
    },
    groupOrder () {
      if (this.configs.groupOrder) {
        return this.configs.groupOrder
      } else {
        let groupNames = new Set()
        for (let each of this.data) {
          for (let g of each.group) {
            groupNames.add(g)
          }
        }
        return Array.from(groupNames)
      }
    }
  },
  created () {
    this.$watch('data', this.onDataChange)
    this.$watch('match', this.onMatchChange)
    this.onDataChange(this.data)
  },
  mounted () {
  },
  methods: {
    down () {
      if (!this.items.length) return
      this.selectIndex += 1
      if (this.selectIndex >= this.items.length) this.selectIndex = 0
      let item = this.items[this.selectIndex]
      if (item.cls.endsWith('group')) this.selectIndex += 1
    },
    up () {
      if (!this.items.length) return
      this.selectIndex -= 1
      if (this.selectIndex < 0) this.selectIndex = this.items.length - 1
      let item = this.items[this.selectIndex]
      if (item.cls.endsWith('group')) this.selectIndex -= 1
      if (this.selectIndex < 0) this.selectIndex = this.items.length - 1
    },
    onMatchChange (newValue, oldValue) {
      this.selectIndex = -1
      if (!newValue) return
      let type = this.configs.datatype
      if (type === 'number' || type === "date") {
        if (newValue.startsWith('>') || newValue.startsWith('<')) { // logical mod

          return
        }
      } else {

      }
      this.processedData = this.data
    },
    onDataChange (newValue, oldValue) {
      let type =this.configs.datatype
      this.selectIndex = -1
      if (type === 'string') {
        this.statistic = {
          total: newValue.length
        }
      } else if (type === 'date') {
        let values = newValue.map(_ => _.value.toMillis())
        let max = Math.max(...values)
        let min = Math.min(...values)
        let p50 = percentile(50, values)
        let p25 = percentile(25, values)
        let p75 = percentile(75, values)
        this.statistic = {
          num: newValue.length,
          min: (DateTime.fromMillis(Number(min))).toISO(),
          p25: (DateTime.fromMillis(Number(p25))).toISO(),
          p50: (DateTime.fromMillis(Number(p50))).toISO(),
          p75: (DateTime.fromMillis(Number(p75))).toISO(),
          max: (DateTime.fromMillis(Number(max))).toISO(),
        }
      } else if (type === 'number') {
        let values = newValue.map(_ => _.value)
        let max = Math.max(...values)
        let min = Math.min(...values)
        let p50 = percentile(50, values)
        let p25 = percentile(25, values)
        let p75 = percentile(75, values)
        this.statistic = {
          num: newValue.length,
          min, p25, p50, p75, max,
        }
      }
      this.statisticItems = Object.keys(this.statistic).map(key => {
        return { key, show: this.statistic[key] }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
$pre: ac-input-dropdown;
.#{$pre} {
  background-color: #f2f2f2;
  position: absolute;
  width: max-content;
}
.#{$pre}-item-wrapper {
}
.#{$pre}-item-group {
  font-weight: 600;
  padding: 0px 3px;
  border-style: dashed;
  border-width: 1px 1px 0px 1px;
}
.#{$pre}-item {
  padding: 0px 3px;
  border-style: dashed;
  border-width: 0px 1px;
}
.#{$pre}-item:last-child {
  border-width: 0px 1px 1px 1px;
}
.#{$pre}-selected {
  background-color: #a9ff96;
}
</style>
