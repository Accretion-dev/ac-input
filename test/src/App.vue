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
          <div>
            <ac-input v-model="values[0]" placeholder="value0" :focusSelectAllText="true"/>
            <ac-input v-model="values[1]" placeholder="value1" />
            <ac-input v-model="values[2]" placeholder="value2" :focusSelectAllText="true"/>
            <ac-input v-model="values[0]" placeholder="disabled" :disabled="true"/>
          </div>
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
            <span> cur3: {{ cursors[3] }} </span>
            <span> cur4: {{ cursors[4] }} </span>
            <span> cur5: {{ cursors[5] }} </span>
          </p>
          <ac-input v-model="values[3]" placeholder="value3" :cursor.sync="cursors[3]"/>
          <ac-input v-model="values[4]" placeholder="value4" :cursor.sync="cursors[4]"/>
          <ac-input v-model="values[5]" placeholder="value5" :cursor.sync="cursors[5]"/>
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
            <span> matchStr: {{ matchStr }} </span>
          </p>
          <ac-input v-model="values[6]" :data="datas.simpleString" placeholder="simpleString" :cursor.sync="cursors[6]" @match="matchStr = $event" />
          <ac-input v-model="values[7]" :data="datas.string"       placeholder="string"       :cursor.sync="cursors[7]" @match="matchStr = $event" />
          <ac-input v-model="values[8]" :data="datas.number"       placeholder="number"       :cursor.sync="cursors[8]" @match="matchStr = $event" />
          <ac-input v-model="values[9]" :data="datas.date"         placeholder="date"         :cursor.sync="cursors[9]" @match="matchStr = $event" />
          <ac-input v-model="values[15]" :data="fulldata"          placeholder="full"         :cursor.sync="cursors[15]" @match="matchStr = $event" :max-drop="5"/>
          <p>
            <span> value0: "{{values[6]}}" </span>
            <span> value1: "{{values[7]}}" </span>
            <span> value2: "{{values[8]}}" </span>
            <span> value3: "{{values[9]}}" </span>
            <span> value4: "{{values[15]}}" </span>
          </p>
        </div>
      </test-block>
      <test-block title="Test highlight" name="highlight" id="hihlight">
        <div>
          <input v-model="cursors[10]" style="width: 30px;"/>
          <button @click="$set(cursors, 10, Number(cursors[10]) - 1)"> - </button>
          <button @click="$set(cursors, 10, Number(cursors[10]) + 1)"> + </button>
        </div>
        <div>
          <span>
            start:
            <input v-model="highlights[0].start" style="width: 30px;"/>
            <button @click="$set(highlights[0], 'start', Number(highlights[0].start) - 1)"> - </button>
            <button @click="$set(highlights[0], 'start', Number(highlights[0].start) + 1)"> + </button>
            end:
            <input v-model="highlights[0].end" style="width: 30px;"/>
            <button @click="$set(highlights[0], 'end', Number(highlights[0].end) - 1)"> - </button>
            <button @click="$set(highlights[0], 'end', Number(highlights[0].end) + 1)"> + </button>
          </span>
          <span>
            start:
            <input v-model="highlights[1].start" style="width: 30px;"/>
            <button @click="$set(highlights[1], 'start', Number(highlights[1].start) - 1)"> - </button>
            <button @click="$set(highlights[1], 'start', Number(highlights[1].start) + 1)"> + </button>
            end:
            <input v-model="highlights[1].end" style="width: 30px;"/>
            <button @click="$set(highlights[1], 'end', Number(highlights[1].end) - 1)"> - </button>
            <button @click="$set(highlights[1], 'end', Number(highlights[1].end) + 1)"> + </button>
          </span>
        </div>
        <div>
          <ac-input v-model="values[10]" placeholder="value-pre" ref='input10' :cursor.sync="cursors[10]" :highlights="[highlights[0], highlights[1]]"/>
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
      highlights: [...Array(20).keys()].map((_,index) => ({start:0, end:17, color: 'rgba(0,255,0,0.5)', message:`index:${index}`})),
      cursorPos: 0,
      matchStr: '',
      fulldata: {
        data: [
          {
            group: 'number',
            data:[
              132,456,75,243,98079,875,653,1243,2345,675,768245,657,6588,54,123,546,476,243,3523,65234,34234,
              13241,24343,5624,54576,45,24,3,775,979,6,87245,253,75,8,675,53,24,134,125,43577786,645,24,
              1234,536,32456,876,1234,536,4576,2435,671234,365,7585,24352,7585,12432,467,86867,3653,12432,
            ],
          },
          {
            group: 'string',
            data:[
              'accretion', 'define', 'database', 'management', '天文', '贝叶斯', '物理','galaxy','quasar','blackhole',
              'star','mathematics','数学','blabla','telescope','foooooo', 'barbarbar','great','good','nice','test',
              'unittest','data','data release','space telescope', '测试', '拼音', '这个', '那个', '编不出来了', '23333'
            ],
          },
          {
            group: 'date',
            data: [...Array(30).keys()].map(_ => {
              let dh = Number(((Math.random()-0.5) * 10000).toFixed(0))
              let dm = Number(((Math.random()) * 60).toFixed(0))
              let dur = Duration.fromObject({hours: dh, minutes: dm})
              let now = DateTime.local().plus(dur)
              return new Date(now.toISO())
            })
          },
          {
            group: 'always exists, without data',
            always: true,
          },
          {
            group: 'always exists, withsome data',
            always: true,
            data: [
              'random', 'data', 'for', 'blabla', 123, 1231, 3423
            ]
          },
          {
            data: [
              'some', 'special', 'data', 'without', 'group', 'aaaaa'
            ]
          }
        ]
      },
      datas: {
        simpleString: [
          'accretion', 'define', 'database', 'management', '天文', '贝叶斯', '物理','galaxy','quasar','blackhole',
          'star','mathematics','数学','blabla','telescope','foooooo', 'barbarbar','great','good','nice','test',
          'unittest','data','data release','space telescope', '测试', '拼音', '这个', '那个', '编不出来了', '23333'
        ],
        number: {
          data: [
            {
              group: 'number',
              always: true,
              data:[
                132,456,75,243,98079,875,653,1243,2345,675,768245,657,6588,54,123,546,476,243,3523,65234,34234,
                13241,24343,5624,54576,45,24,3,775,979,6,87245,253,75,8,675,53,24,134,125,43577786,645,24,
                1234,536,32456,876,1234,536,4576,2435,671234,365,7585,24352,7585,12432,467,86867,3653,12432,
              ],
            }
          ]
        },
        string: {
          data: [
            {
              group: 'string',
              data:[
                'accretion', 'define', 'database', 'management', '天文', '贝叶斯', '物理','galaxy','quasar','blackhole',
                'star','mathematics','数学','blabla','telescope','foooooo', 'barbarbar','great','good','nice','test',
                'unittest','data','data release','space telescope', '测试', '拼音', '这个', '那个', '编不出来了', '23333'
              ],
            }
          ]
        },
        date: {
          data: [
            {
              group: 'date',
              data: [...Array(30).keys()].map(_ => {
                let dh = Number(((Math.random()-0.5) * 10000).toFixed(0))
                let dm = Number(((Math.random()) * 60).toFixed(0))
                let dur = Duration.fromObject({hours: dh, minutes: dm})
                let now = DateTime.local().plus(dur)
                return new Date(now.toISO())
              })
            }
          ],
        },
      }
    }
  },
  computed: {
  },
  methods: {
    onCursorChange (pos) {
      this.cursorPos = pos
    }
  },
  created () {
    this.values[10] = '0123456789\n0123456789\n0123456789\n'
    this.highlights[1].start = 14
    this.highlights[1].end = 25
    this.highlights[1].color = 'rgba(255,255,0,0.5)'
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
