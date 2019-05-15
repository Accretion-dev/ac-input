<template>
  <span v-if="droppable && drop"
        :class="{[prefixCls]: true}"
        @keydown="keydown"
  >
    <template v-if="match || alwaysDrop"> <!--show match info-->
      <div :class="{[`${prefixCls}-item-wrapper`]: true}"
           :style="{'max-height':maxHeight}"
           @keydown="keydown"
           >
        <div v-for="{show, type, group, index, count} of items"
             v-show="!(type==='group'&&!show)"
             :key="count"
             :index="count"
             :class="{
               [`${prefixCls}-item-group`]: type==='group',
               [`${prefixCls}-item-last`]: type==='last',
               [`${prefixCls}-selected`]: count===selectIndex,
              }"
             @mousedown.prevent="onClick"
             @keydown="keydown"
        >{{ show }}</div>
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
    droppable: { type: Boolean, default: true, },
    data: { type: Array, default () {return []}, },
    match: { type: String, default: "", },
    maxDrop: { type: Number, default: 0, },
    height: {type: Number, default: 500},
    minScore: {type: Number, default: 0.4},
    autoSelect: {type: Boolean, default: true},
  },
  data () {
    return {
      prefixCls,
      processedData: [],
      selectIndex: -1,
    }
  },
  computed: {
    maxHeight () {
      return this.height + 'px'
    },
    alwaysDrop () {
      return true
    },
    value () {
      if (!this.itemCount) return null
      let item = this.items[this.selectIndex]
      if (!item) return null
      return item.show
    },
    items () {
      return this.calItem.items
    },
    goodIndex () {
      return this.calItem.goodIndex
    },
    itemCount () {
      return this.calItem.itemCount
    },
    calItem () {
      let items = []
      let count = 0
      let itemCount = 0
      let goodIndex = []
      for (let eachgroup of this.processedData) {
        let group = eachgroup.group
        let data = eachgroup.data
        if (data&&data.length) {
          if (group) {
            items.push({
              show: `${group} (${eachgroup.filteredCount})/(${eachgroup.totalCount})`,
              count,
              type:'group'
            })
            count += 1
          }
          for (let {value, index} of data) {
            items.push({show:value, group, index, count})
            goodIndex.push(count)
            count += 1
            itemCount += 1
          }
          if (eachgroup.cut) {
            items.push({
              show:`...(${eachgroup.showCount})/(${eachgroup.filteredCount})`,
              group,
              count,
              type:'last'
            })
            count += 1
          }
        } else { // have no data
          if (eachgroup.always&&group) {
            if (eachgroup.data) {
              items.push({
                show: `${group} (${eachgroup.filteredCount})/(${eachgroup.totalCount})`,
                count,
                type:'group'
              })
            } else {
              items.push({show: group, count, type:'group'})
            }
            count += 1
          }
        }
      }
      return {items, goodIndex, itemCount}
    },
  },
  created () {
    this.$watch('match', this.onChange)
    this.$watch('data', this.onChange)
    this.onChange()
  },
  mounted () {
  },
  methods: {
    Tab () {
      if (!this.itemCount) {
        return true
      } else if (this.value === this.match){
        return true
      } else if (this.selectIndex === -1) {
        this.selectIndex = this.goodIndex[0]
      } else { // do autoComplete
        this.complete()
      }
      return false
    },
    Enter () {
      if (!this.itemCount) {
        return true
      } else if (this.value === this.match){
        return true
      } else if (this.selectIndex === -1) {
        this.selectIndex = this.goodIndex[0]
      } else { // do autoComplete
        this.complete()
      }
      return false
    },
    complete (index) {
      if (index!== undefined) {
        this.$emit('cosdfmplete', this.items[index].show)
      } else {
        this.$emit('complete', this.items[this.selectIndex].show)
      }
    },
    onClick(event) {
      let target = event.target
      let index = Number(target.getAttribute('index'))
      let item = this.items[index]
      if (!item || !item.type) {
        console.log('here')
        this.selectIndex = index
        this.complete()
      }
    },
    keydown (event) {
    },
    updateScroll() {
      let query = `.${prefixCls}-item-wrapper>div[index="${this.selectIndex}"]`
      let el = this.$el.querySelector(query)
      if (el) {
        el.scrollIntoViewIfNeeded(true)
      }
    },
    navigation(name) {
      if (!this.goodIndex.length) return
      if (name === 'ArrowUp') {
        let nextIndex = this.selectIndex - 1
        let nextGoodIndex = this.goodIndex.slice().reverse().find(_ => _<=nextIndex)
        if (nextGoodIndex === undefined) {
          nextGoodIndex = this.goodIndex[this.goodIndex.length-1]
        }
        this.selectIndex = nextGoodIndex
        this.updateScroll()
      } else if (name === 'ArrowDown') {
        let nextIndex = this.selectIndex + 1
        let nextGoodIndex = this.goodIndex.find(_ => _>=nextIndex)
        if (nextGoodIndex === undefined) {
          nextGoodIndex = this.goodIndex[0]
        }
        this.selectIndex = nextGoodIndex
        this.updateScroll()
      } else if (name === 'PageUp') {
        console.log(name)
      } else if (name === 'PageDown') {
        console.log(name)
      }
    },
    onChange () {
      let goodCount = 0
      if (!this.data || !this.data.length) {
        this.processedData = []
        return
      }
      if (!this.match) { // show all
        this.processedData = []
        for (let eachgroup of this.data) {
          let maxDrop = eachgroup.maxDrop || this.maxDrop
          let length = eachgroup.data?eachgroup.data.length:0
          if (eachgroup.data) {
            goodCount += eachgroup.data.length
            if (maxDrop) {
              this.processedData.push(
                Object.assign({
                    totalCount: length,
                    filteredCount:length,
                    showCount: maxDrop,
                    cut: length>maxDrop
                  },
                  eachgroup,
                  {data: eachgroup.data.slice(0,maxDrop)}
                )
              )
            } else {
              this.processedData.push(
                Object.assign({
                    totalCount: length,
                    filteredCount:length,
                    showCount: length,
                    cut: false,
                  },
                  eachgroup,
                )
              )
            }
          } else {
            this.processedData.push(
              Object.assign({
                  totalCount: 0,
                  filteredCount:0,
                  showCount: 0,
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
          let score = eachgroup.score || this.minScore
          let thisdata = eachgroup.data
          if (thisdata) {
            thisdata.forEach(data => {
              if (Array.isArray(data.match)) {
                data.score = _.max(data.match.map(__ => LiquidMetal.score(__, this.match)))
              } else {
                data.score = LiquidMetal.score(data.match, this.match)
              }
            })
            thisdata = thisdata.filter(_ => _.score>score)
            thisdata = _.sortBy(thisdata, _ => _.score)
            thisdata.reverse()
            goodCount += thisdata.length
            if (maxDrop) {
              this.processedData.push(
                Object.assign({
                    totalCount: eachgroup.data.length,
                    filteredCount:thisdata.length,
                    showCount: maxDrop,
                    cut: thisdata.length > maxDrop
                  },
                  eachgroup,
                  {data: thisdata.slice(0,maxDrop)}
                )
              )
            } else {
              this.processedData.push(
                Object.assign({
                    totalCount: eachgroup.data.length,
                    filteredCount:thisdata.length,
                    showCount: thisdata.length,
                    cut: false,
                  },
                  eachgroup,
                  {data: thisdata}
                )
              )
            }
          } else {
            this.processedData.push(
              Object.assign({
                  totalCount: 0,
                  filteredCount:0,
                  showCount: 0,
                  cut: false,
                },
                eachgroup,
              )
            )
          }
        }
      }
      if (goodCount>0 && this.autoSelect) {
        this.selectIndex = 1
      } else {
        this.selectIndex = -1
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

<style lang="scss">
$pre: ac-input-dropdown;
.#{$pre} {
  background-color: #f2f2f2;
  position: absolute;
  width: max-content;
}
.#{$pre}-item-wrapper {
  position: relative;
  z-index: 999;
  overflow: auto;
  width: max-content;
}
.#{$pre}-item-group {
  font-weight: 600;
  border-width: 1px 1px 0px 1px;
}
.#{$pre}-item-last {
  font-weight: 600;
  font-size: 80%;
  border-width: 0px 1px 1px 1px !important;
}
.#{$pre}-item-wrapper > div {
  padding: 0px 3px;
  border-style: dashed;
  border-width: 0px 1px;
  cursor: default;
}
.#{$pre}-item-wrapper > div:hover {
  background-color: #ddffd5;
}
.#{$pre}-item-wrapper:last-child {
  border-width: 0px 1px 1px 1px;
}
.#{$pre}-selected {
  background-color: #a9ff96;
}
</style>
