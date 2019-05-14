<template>
  <div id="app">
    <h1> Test enviroment for ac-input</h1>
    <test-env>
      <test-block title="All tests" name="all">
        <ul>
          <li> <p class="test-title"> Test auto stretch: <test-button name="stretch" :running="false"/> </p> </li>
        </ul>
      </test-block>
      <test-block title="Test auto stretch" name="stretch" id="stretch">
        <ul>
          <li>The field should auto stretch with change of input content</li>
          <li>test the focusSelectAllText config: the middle input is set to false, other two inputs set to true</li>
        </ul>
        <div>
          <ac-input v-model="values[0]" placeholder="value0" :configs="{focusSelectAllText: true}"/>
          <ac-input v-model="values[1]" placeholder="value1" />
          <ac-input v-model="values[2]" placeholder="value2" :configs="{focusSelectAllText: true}"/>
          <ac-input v-model="values[0]" placeholder="disabled" :disabled="true"/>
          <p>
            <span> value0: "{{values[0]}}" </span>
            <span> value1: "{{values[1]}}" </span>
            <span> value2: "{{values[2]}}" </span>
          </p>
        </div>
      </test-block>
      <test-block title="Test cursor position" name="cursor" id="cursor">
        <ul>
          <li>should report cursor position on event keyup, click and focus</li>
          <li>reportCursorDebounce = 200 by default</li>
        </ul>
        <div>
          <p>
            cursorPos: {{ cursorPos }}
          </p>
          <ac-input v-model="values[3]" placeholder="value0" @cursor="onCursorChange"/>
          <ac-input v-model="values[4]" placeholder="value1" @cursor="onCursorChange"/>
          <ac-input v-model="values[5]" placeholder="value2" @cursor="onCursorChange"/>
          <p>
            <span> value0: "{{values[3]}}" </span>
            <span> value1: "{{values[4]}}" </span>
            <span> value2: "{{values[5]}}" </span>
          </p>
        </div>
      </test-block>
      <test-block title="Test basic match" name="match" id="match">
        <ul>
          <li>...</li>
        </ul>
        <div>
          <p>
            <span> cursorPos: {{ cursorPos }} </span>
            <span> matchStr: {{ matchStr }} </span>
          </p>
          <ac-input v-model="values[6]" :data="datas[0]" placeholder="value0" @cursor="onCursorChange" @match="matchStr = $event" :configs="{droppable: true}" />
          <ac-input v-model="values[7]" :data="datas[1]" placeholder="value1" @cursor="onCursorChange" @match="matchStr = $event" :configs="{droppable: true}" />
          <ac-input v-model="values[8]" :data="datas[2]" placeholder="value2" @cursor="onCursorChange" @match="matchStr = $event" :configs="{droppable: true}" />
          <p>
            <span> value0: "{{values[6]}}" </span>
            <span> value1: "{{values[7]}}" </span>
            <span> value2: "{{values[8]}}" </span>
          </p>
        </div>
      </test-block>
      <test-block title="Test pre" name="pre" id="pre">
        <div>
          <input v-model="cursors[9]" style="width: 30px;"/>
          <button @click="$set(cursors, 9, Number(cursors[9]) - 1)"> - </button>
          <button @click="$set(cursors, 9, Number(cursors[9]) + 1)"> + </button>
        </div>
        <div>
          <ac-input-pre v-model="values[9]" placeholder="value-pre" ref='input9' :cursor.sync="cursors[9]"/>
          <p>
            <span> value: "{{values[9]}}" </span>
          </p>
        </div>
        <div>
          <ac-input-pre v-model="values[10]" placeholder="value-pre" ref='input10' :cursor.sync="cursors[10]"/>
          <p>
            <span> value: "{{values[10]}}" </span>
          </p>
        </div>
      </test-block>
    </test-env>
  </div>
</template>

<script>
const {DateTime, Duration} = require('luxon')
function groupNumber (data) {
  if (data < 100) {
    return ['default']
  } else if (data < 1000) {
    return ['<1000']
  } else if (data < 10000) {
    return ['<10000']
  } else {
    return ['>=10000']
  }
}
function groupDate (data) {
  let now = new Date()
  if (data < now ) {
    return ['pass']
  } else {
    return ['future']
  }
}

export default {
  name: 'app',
  data () {
    return {
      values:  [...Array(20).keys()].map(_ => ''),
      cursors: [...Array(20).keys()].map(_ => 0),
      cursorPos: 0,
      matchStr: '',
      datas: [
        {data:[
          132,456,75,243,98079,875,653,1243,2345,675,768245,657,6588,54,123,546,476,243,3523,65234,34234,
          13241,24343,5624,54576,45,24,3,775,979,6,87245,253,75,8,675,53,24,134,125,43577786,645,24,
          1234,536,32456,876,1234,536,4576,2435,671234,365,7585,24352,7585,12432,467,86867,3653,12432,
        ], getGroup: groupNumber, groupOrder: ['default', '<1000', '<10000', '>=10000']},
        {data:[
          'accretion', 'define', 'database', 'management', '天文', '贝叶斯', '物理','galaxy','quasar','blackhole',
          'star','mathematics','数学','blabla','telescope','foooooo', 'barbarbar','great','good','nice','test',
          'unittest','data','data release','space telescope', '测试', '拼音', '这个', '那个', '编不出来了', '23333'
        ]},
        {data: [...Array(30).keys()].map(_ => {
          let dh = Number(((Math.random()-0.5) * 10000).toFixed(0))
          let dm = Number(((Math.random()) * 60).toFixed(0))
          let dur = Duration.fromObject({hours: dh, minutes: dm})
          let now = DateTime.local().plus(dur)
          return new Date(now.toISO())
        })},
      ]
    }
  },
  methods: {
    onCursorChange (pos) {
      this.cursorPos = pos
    }
  },
  created () {
    this.values[9] = '0123456789\n0123456789\n0123456789\n'
  }
}
</script>

<style>
h1 {
  text-align: center;
}
.test-title {
  font-weight: bolder;
}
</style>
