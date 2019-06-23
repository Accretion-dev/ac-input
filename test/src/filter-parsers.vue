<template>
  <div>
    <div>
      <h2> Test for json-filter </h2>
      <div>
        <button @click="jsonFilterParse(jsonFilter)" style="margin:0; padding:0;">
          parse
        </button>
        <button @click="changeJsonFilterData(1)" style="margin:0; padding:0;">
          +++
        </button>
        <button @click="changeJsonFilterData(-1)" style="margin:0; padding:0;">
          ---
        </button>
      </div>
      <div>
        <ac-input v-model="jsonFilter" placeholder="value" :border="false"/>
        <ac-input v-model="jsonFilter" placeholder="value" :border="false"/>
      </div>
    </div>
  </div>
</template>

<script>
import jsonFilterParser from 'mongodb-simple-query-syntax/pegjs/json-filter.js'

let todo = `
  $title|startsWith: 'foo bar' ||
  tags|elemMatch:{tagname|startsWith: astro, time|lt: } ||
  tags.tag_name: 'good' && (tags.time|lt: '2018') ||
  tags.tag_name|in:[
    foo, bar, 'a\\'b', {foo:bar},
  ] ||
  halftype: ||
  regtest: /^[\\u4E00-\\u9FA5A-Za-z0-9]+ [a-zA-Z0-9][-a-zA-Z0-9]{0,62}(.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+ \\w+([-+.]\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*$/ ||
  flags|:flag  ||
  simple|level1|level2|level3 : s123 ||
  simple|level1|level2| : s12$ ||
  simple|level1|level2| :||
  not|level|test|not| : ||
  test.more.than.extra|one|space| :    ||
  string.more.than.extra|one|space| :    ||
  (foo:foo && bar:bar || foobar:foobar && barfoo:barfoo) ||
  ( (unfinished0) (unfinished1 || unfinished11:)) ||
  'unfinished2' ||
  unfinished3: {
    part,
    partDot.,
    partOP|,
    partOP1|op|op|,
    partOP2.nice.good.great|op|op|,
    'u%5',
    u6: ,
    u7|op8|:,
    level1|in: { level2.stack|in|in: { level3|in|in|in: good}},
  } ||
  part||partgood:good||
  partDot. ||
  partOP| ||
  partOP1|op|op| ||
  partOP2.nice.good.great|op|op|: [
    123, {inner.region|in:[
      456, {inner.inner|in: 567}
    ]}
  ]
  last "several keys" are +search -keys
`
export default {
  name: 'filter-parsers',
  data () {
    return {
      jsonFilter: '',
      jsonFilterCount: 0,
      jsonFilterParser,
    }
  },
  computed: {
  },
  watch: {
    jsonFilter (value) {
      if (value) {
        this.jsonFilterParse(value)
      }
    }
  },
  methods: {
    changeJsonFilterData (delta) {
      this.jsonFilterCount = this.jsonFilterCount += 1
      if (this.jsonFilterCount<=1) this.jsonFilterCount = 1
      this.jsonFilter = todo.slice(0, this.jsonFilterCount)
    },
    jsonFilterParse (value) {
      let result = this.jsonFilterParser.parse(value)
      console.log(result)
      console.log(JSON.stringify(result, null, 2))
    }
  },
  created () {
  }
}
</script>

<style>
</style>
