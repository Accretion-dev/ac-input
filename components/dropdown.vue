<template>
  <span v-if="drop" :class="{[prefixCls]: true}">
    <template v-if="match || alwaysDrop"> <!--show match info-->
      <div :class="{[`${prefixCls}-wrapper`]: true}">
        <div v-for="({show, cls, group, index, count}, key) of items"
             :key="key"
             :class="{[cls]: true, [`${prefixCls}-selected`]: count===selectIndex}
        ">
          {{ show }}
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
    drop: { type: Boolean, default: false, },
    data: { type: Array, default () {return []}, },
    match: { type: String, default: "", },
    maxDrop: { type: Number, default: "", }
  },
  data () {
    return {
      prefixCls,
      processedData: [],
      selectIndex: -1,
    }
  },
  computed: {
    alwaysDrop () {
      return true
    },
    items () {
      let items = []
      let count = 0
      for (let eachgroup of this.processedData) {
        let group = eachgroup.group
        let data = eachgroup.data
        if (data&&data.length) {
          if (group) {
            items.push({
              show: `${group} (${eachgroup.filteredCount})/(${eachgroup.totalCount})`,
              cls: `${prefixCls}-item-group`,
              count,
              type:'group'
            })
            count += 1
          }
          for (let {value, index} of data) {
            items.push({show:value, group, cls: `${prefixCls}-item`, index, count})
            count += 1
          }
          if (eachgroup.cut) {
            items.push({
              show:`...(${eachgroup.showCount})/(${eachgroup.filteredCount})`,
              group,
              cls: `${prefixCls}-item`,
              index,
              count,
              type:'last'
            })
            count += 1
          }
        } else { // have no data
          if (eachgroup.always&&group) {
            items.push({show: group, cls: `${prefixCls}-item-group`, count, type:'group'})
            count += 1
          }
        }
      }
      return items
    },
  },
  created () {
    this.$watch('match', this.onChange)
    this.$watch('data', this.onChange)
  },
  mounted () {
  },
  methods: {
    down () {
      if (!this.items.length) return
      this.selectIndex += 1
      if (this.selectIndex >= this.items.length) this.selectIndex = 0
      let item = this.items[this.selectIndex]
      if (item.type) this.selectIndex += 1
    },
    up () {
      if (!this.items.length) return
      this.selectIndex -= 1
      if (this.selectIndex < 0) this.selectIndex = this.items.length - 1
      let item = this.items[this.selectIndex]
      if (item.type) this.selectIndex -= 1
      if (this.selectIndex < 0) this.selectIndex = this.items.length - 1
    },
    onMatchChange () {
      this.selectIndex = -1
      if (!this.match) { // show all
        this.processedData = []
        for (let eachgroup of this.data) {
          let maxDrop = eachgroup.maxDrop || this.maxDrop
          if (maxDrop) {
            this.processedData.push(
              Object.assign({
                  totalCount: eachgroup.data.length,
                  filteredCount:eachgroup.data.length,
                  showCount: maxDrop,
                  cut: eachgroup.data.length>maxDrop
                },
                eachgroup,
                {data: eachgroup.data.slice(maxDrop)}
              )
            )
          } else {
            this.processedData.push(
              Object.assign({
                  total: eachgroup.data.length,
                  filteredCount:eachgroup.data.length,
                  showCount: eachgroup.data.length,
                  cut: false,
                },
                eachgroup,
              )
            )
          }
        }
      } else { // filter with match
        this.processedData = []
        for (let eachgroup of this.data) {
          let maxDrop = eachgroup.maxDrop || this.maxDrop
          let score = eachgroup.score || 0.7
          let thisdata = eachgroup.data
          thisdata.forEach(_ => {
            if (Array.isArray(_.match)) {
              _.score = _.max(_.match.map(__ => LiquidMetal.score(__, this.match)))
            } else {
              _.score = LiquidMetal.score(_, this.match)
            }
          })
          thisdata = thisdata.filter(_ => _.score>score)
          thisdata = _.sortBy(thisdata, _ => _.score)
          thisdata.reverse()
          if (maxDrop) {
            this.processedData.push(
              Object.assign({
                  total: eachgroup.data.length,
                  filteredCount:thisdata.length,
                  showCount: maxDrop,
                  cut: thisdata.length > maxDrop
                },
                eachgroup,
                {data: thisdata.slice(maxDrop)}
              )
            )
          } else {
            this.processedData.push(
              Object.assign({
                  total: eachgroup.data.length,
                  filteredCount:thisdata.length,
                  showCount: thisdata.length,
                  cut: false,
                },
                eachgroup,
                {data: thisdata}
              )
            )
          }
        }
      }
    },
    doStatistic (__) {
      // not use, dev in furture
      let {data, type} = __
      this.selectIndex = -1
      if (format === 'string') {
        this.statistic = {
          total: data.length
        }
      } else if (format === 'date') {
        let values = data.map(_ => _.value.toMillis())
        let max = Math.max(...values)
        let min = Math.min(...values)
        let p50 = percentile(50, values)
        let p25 = percentile(25, values)
        let p75 = percentile(75, values)
        this.statistic = {
          num: data.length,
          min: (DateTime.fromMillis(Number(min))).toISO(),
          p25: (DateTime.fromMillis(Number(p25))).toISO(),
          p50: (DateTime.fromMillis(Number(p50))).toISO(),
          p75: (DateTime.fromMillis(Number(p75))).toISO(),
          max: (DateTime.fromMillis(Number(max))).toISO(),
        }
      } else if (format === 'number') {
        let values = data.map(_ => _.value)
        let max = Math.max(...values)
        let min = Math.min(...values)
        let p50 = percentile(50, values)
        let p25 = percentile(25, values)
        let p75 = percentile(75, values)
        this.statistic = {
          num: data.length,
          min, p25, p50, p75, max,
        }
      }
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
