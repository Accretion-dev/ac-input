const testConfig = require('./test-config.json')
// import backend from 'vue-selenium-unittest/backend.js'
import backend from 'vue-selenium-unittest/src/backend.js'
let normalKeys = '~!@#$%^&*()_+|}{POIUYTREWQASDFGHJKL:"?><MNBVCXZ"}'+"`1234567890-=\\][poiuytrewqasdfghjkl;'/.,mnbvcxz'"

let tests = {
  async all ({name, driver, Test, Key, By, until, Button, Origin}) {
    let keys = Object.keys(tests).filter(_ => _ !== 'all' && _ !== 'demo')
    for (let key of keys) {
      await tests[key]({name, driver, Test, Key, By, until, Button, Origin})
    }
  },
  demo: async ({name, driver, Test, Key, By, until, Button, Origin}) => {
    let data, keys, input
    let rootSelector = "#stretch"
    let interval = 0
    let app = await driver.findElement({id: 'app'})
    t = Test.block({name, rootSelector})
    await t.init()
    await t.initScroll()
    let root = await driver.findElement(By.css(rootSelector))
    let inputs = await root.findElements({tagName: 'input'})
    t.changeComment('test stretch (input and delete)', 500)
    input = inputs[0]
    await t.actions({actions: [], interval})

    t.changeComment('all done',500)
    t.changeComment('')
  },
  stretch: async ({name, driver, Test, Key, By, until, Button, Origin}) => {
    let data, keys, input
    let rootSelector = "#stretch"
    let interval = 0
    let app = await driver.findElement({id: 'app'})
    t = Test.block({name, rootSelector})
    await t.init()
    await t.initScroll()
    let root = await driver.findElement(By.css(rootSelector))
    let inputs = await root.findElements(By.css('.ac-input-input'))
    t.changeComment('test stretch (input and delete)', 500)
    input = inputs[0]
    await t.actions({actions: {click: input}})
    await t.actions({actions: [
      '!@#$%^&*()_',
      [Key.CONTROL, Key.ENTER],
      '+<>1234567890',
      [Key.CONTROL, Key.ENTER],
      '-=qwertyuiop[]\'\"'
    ], interval})
    keys = [...Array(20).keys()].map(_ => Key.BACK_SPACE)
    await t.actions({actions: keys, interval})

    input = inputs[1]
    await t.actions({actions: {click: input}})
    await t.actions({actions: [
      '!@#$%^&*()_',
      [Key.CONTROL, Key.ENTER],
      '+<>1234567890',
      [Key.CONTROL, Key.ENTER],
      '-=qwertyuiop[]\'\"'
    ], interval})
    keys = [...Array(30).keys()].map(_ => Key.BACK_SPACE)
    await t.actions({actions: keys, interval})

    input = inputs[2]
    await t.actions({actions: {click: input}})
    await t.actions({actions: [
      '!@#$%^&*()_',
      '+<>1234567890',
      '-=qwertyuiop[]\'\"'
    ], interval})
    keys = [...Array(35).keys()].map(_ => Key.BACK_SPACE)
    await t.actions({actions: keys, interval})

    t.changeComment('test tab and shift+tab to go next and previous', 500)
    input = inputs[0]
    await t.actions({actions: {click: input}})
    await t.actions({actions: [Key.TAB, Key.TAB], interval: 300, delay: 200})
    await t.actions({actions: [[Key.SHIFT, Key.TAB], [Key.SHIFT, Key.TAB]], interval: 300, delay: 200})

    t.changeComment('click input with text will select all', 500)
    input = inputs[1]
    await t.actions({actions: {click: input}})
    await t.actions({actions: [Key.BACK_SPACE], interval: 300, delay: 200})

    input = inputs[2]
    await t.actions({actions: {click: input}})
    await t.actions({actions: [Key.BACK_SPACE], interval: 300, delay: 200})

    input = inputs[0]
    await t.actions({actions: {click: input}})
    await t.actions({actions: [Key.BACK_SPACE], interval: 300, delay: 200})

    t.changeComment('clean up', 500)
    await t.actions({actions: [Key.TAB, Key.BACK_SPACE]})

    t.changeComment('all done',500)
    t.changeComment('')
  },
  cursor: async ({name, driver, Test, Key, By, until, Button, Origin}) => {
    let data, keys, input
    let rootSelector = "#cursor"
    let interval = 0
    let app = await driver.findElement({id: 'app'})
    t = Test.block({name, rootSelector})
    await t.init()
    await t.initScroll()
    let root = await driver.findElement(By.css(rootSelector))
    let inputs = await root.findElements(By.css('.ac-input-input'))
    t.changeComment('test stretch (input and delete)', 500)

    await t.actions({actions: [
      {click: inputs[0]}, "0123456789",
      {click: inputs[1]}, "0123456789",
      {click: inputs[2]}, "0123456789",
    ], interval})
    t.changeComment('by mouse', 1000)
    interval = 1000
    await t.actions({actions: [
      [{move: inputs[0], x:10, y:10}, {press:'left'}, {release: 'left'}],
      [{move: inputs[1], x:20, y:10}, {press:'left'}, {release: 'left'}],
      [{move: inputs[2], x:30, y:10}, {press:'left'}, {release: 'left'}],
      [{move: inputs[0], x:50, y:10}, {press:'left'}, {release: 'left'}],
      [{move: inputs[1], x:70, y:10}, {press:'left'}, {release: 'left'}],
    ], interval})
    t.changeComment('by keyboard', 500)
    await t.actions({actions: [
      [{click: inputs[1]}, {press:'left'}, {release: 'left'}],
      Key.LEFT,
      Key.LEFT,
      Key.LEFT,
      [...Array(10).keys()].map(_ => Key.RIGHT)
    ], interval})
    t.changeComment('clean up', 500)
    await t.actions({actions: [
      [{click: inputs[0]}, [Key.CONTROL, 'a'], Key.BACK_SPACE],
      [{click: inputs[1]}, [Key.CONTROL, 'a'], Key.BACK_SPACE],
      [{click: inputs[2]}, [Key.CONTROL, 'a'], Key.BACK_SPACE],
    ]})


    t.changeComment('all done',500)
    t.changeComment('')
  },
  mongodb: async ({name, driver, Test, Key, By, until, Button, Origin}) => {
    let data, keys
    let rootSelector = "#mongodb"
    let interval = 800
    let app = await driver.findElement({id: 'app'})
    t = Test.block({name, rootSelector})
    await t.init()
    await t.initScroll()
    let root = await driver.findElement(By.css(rootSelector))
    let input = await root.findElement(By.css('.ac-input-input'))
    t.changeComment('test autocomplete', 500)
    await t.actions({actions: [ {click: input}, ], interval: 100})
    let tab = Key.TAB
    let right = Key.RIGHT

    let actions = [ 500,
      {js: 'window.scrollBy(0,60)'},
      `title`, [Key.DOWN], [Key.TAB], ` `, `haha`, ` `,
      `title:'hehe`, Key.RIGHT, ` && `,
      `title:{gt`, Key.TAB, Key.TAB, `123`, Key.RIGHT, `, in`, Key.TAB, Key.TAB, `1,2`, Key.TAB, ` ||`, [Key.CONTROL, Key.ENTER],

      `(title`, Key.TAB, 'lt', Key.TAB, 'foo', Key.TAB, ` && `,
      `title`, Key.TAB, 'in', Key.TAB, 'foo, "haha hehe', Key.TAB, ` && `,
      `title`, Key.DOWN, Key.DOWN, Key.TAB, '123', Key.TAB, `||`, [Key.CONTROL, Key.ENTER],

      `cti`, Key.TAB, ':', Key.TAB, `2018`, Key.TAB, ` `,
      `cti`, Key.TAB, Key.TAB, 'lt', Key.TAB, `2018`, Key.TAB, ` `,
      `cti`, Key.TAB, ':', '{gt', Key.TAB, Key.TAB, '2018',Key.RIGHT, ',lt', Key.TAB, Key.TAB, '2018', Key.TAB, ` `,
      `cti`, Key.TAB, ':', '[foo,bar', Key.TAB, `||`, [Key.CONTROL, Key.ENTER],

      `fla`, Key.TAB, Key.TAB, 'ex', Key.TAB, Key.TAB, 'true', ` && `,
      `fla`, Key.TAB, ":", Key.TAB, 'debug: true', Key.TAB, `&&`,
      `fla`, Key.TAB, ".", 'debug: true', `||`, [Key.CONTROL, Key.ENTER],

      {js: 'window.scrollBy(0,84)'},

      `fla`, Key.TAB, ".", 'count|gt: 10', ` || `,
      `fla`, Key.TAB, ".", 'count|in: [10,20', Key.TAB, `||`, [Key.CONTROL, Key.ENTER],

      `tag:{unexists:1`, Key.TAB, `&&`,
      `tag:{ex`, Key.TAB, ':true', Key.TAB, `&&`,
      `tag|exists: true`, `||`, [Key.CONTROL, Key.ENTER],

      `ta`, Key.TAB, ':foo', ` || `,
      `ta`, Key.TAB, ':/foo', Key.TAB, ` || `,
      `ta`, Key.TAB, '.na', Key.TAB, ':', Key.TAB, 'foo', Key.TAB, `||`, [Key.CONTROL, Key.ENTER],

      `ta`, Key.TAB, ':{in', Key.TAB, Key.TAB, 'good,/123', Key.RIGHT, Key.RIGHT,
            ',el', Key.TAB, Key.TAB, 'name', Key.TAB, Key.TAB, 'in', Key.TAB, 'foo, bar', Key.RIGHT,
            ',and', Key.TAB, Key.TAB, 'cti', Key.TAB, Key.TAB, 'gt', Key.TAB, '2018', Key.RIGHT,
            ', tid', Key.TAB, Key.TAB, 'gt', Key.TAB, '10', Key.TAB, `||`, [Key.CONTROL, Key.ENTER],

      {js: 'window.scrollBy(0,84)'},

      `ta`, Key.TAB, ':[foo, bar', Key.TAB, `&&`,
      `ta`, Key.TAB, Key.TAB, 'len', Key.TAB, `5 && `,
      `ta`, Key.TAB, Key.TAB, 'len|gt', Key.TAB, `5 ||`, [Key.CONTROL, Key.ENTER],


      `ta`, Key.TAB, Key.TAB, 'len:{gt', Key.TAB, Key.TAB, `5, lt`, Key.TAB, Key.TAB, `10`, Key.TAB, ` && `,
      `ta`, Key.TAB, Key.TAB, 'lt', Key.TAB, 'foo', Key.TAB, ` && `,
      `ta`, Key.TAB, Key.TAB, 'in', Key.TAB, 'foo, bar', Key.TAB, `||`, [Key.CONTROL, Key.ENTER],

      `ta`, Key.TAB, Key.TAB, 'el', Key.TAB, 'ti', Key.TAB, ':10, name', Key.TAB, Key.TAB, 'in', Key.TAB, 'foo, bar', Key.RIGHT,
            `,and`, Key.TAB, Key.TAB, 'ct', Key.TAB, Key.TAB, 'gt', Key.TAB, '2018', Key.RIGHT, ',tid', Key.TAB, Key.TAB, 'gt', Key.TAB, '10',
            Key.TAB, `||`, [Key.CONTROL, Key.ENTER],
      `ta`, Key.TAB, Key.TAB, 'el|or', Key.TAB, 'ti', Key.TAB, ':10, name', Key.TAB, Key.TAB, 'in', Key.TAB, 'foo, bar', Key.RIGHT,
            `,and`, Key.TAB, Key.TAB, 'ct', Key.TAB, Key.TAB, 'gt', Key.TAB, '2018', Key.RIGHT, ',tid', Key.TAB, Key.TAB, 'gt', Key.TAB, '10',
            Key.TAB, `||`, [Key.CONTROL, Key.ENTER],

      {js: 'window.scrollBy(0,84)'},

      `meta`, Key.TAB, ':[foo, bar', Key.TAB, ` || `,
      `meta`, Key.TAB, Key.TAB, 'in', Key.TAB, 'foo, bar', Key.TAB, `||`, [Key.CONTROL, Key.ENTER],

      `meta`, Key.TAB, '.name', Key.TAB, Key.TAB, 'in', Key.TAB, 'foo, bar', Key.TAB, `||`, [Key.CONTROL, Key.ENTER],
      `and`, Key.TAB, Key.TAB, `or`, Key.TAB, Key.TAB, 'ta', Key.TAB, ': foo, ta', Key.TAB, ': /foo', Key.RIGHT, Key.RIGHT,
             `, or`, Key.TAB, Key.TAB, `ta`, Key.TAB, Key.TAB, 'lt', tab, 'foo', right, ', ta', tab, tab, 'in', tab, 'foo, bar', Key.TAB, `||`, [Key.CONTROL, Key.ENTER],

      {js: 'window.scrollBy(0,84)'},

      `where`, tab, tab, `blablabla`, tab, ` || `,
      `text`, tab, tab, tab, tab, 'good', tab, ` && `,
      `text`, tab, '|', tab, tab, 'good', tab, `||`, [Key.CONTROL, Key.ENTER],

      `exp`, tab, tab, `and`, tab, tab, 'gt', tab, tab, 'title', tab, ',abs', tab, tab, 'tags.id', tab, tab, `||`, [Key.CONTROL, Key.ENTER],
      `exp`, tab, '|and', tab, 'or', tab, tab, 'lt', tab, tab, 'hour', tab, tab, 'ctime', tab, ',10', right, ',eq', tab, tab, 'title', tab, ', /foo', tab, `||`, [Key.CONTROL, Key.ENTER],

      `unwi`, tab, tab, 'relation', tab, ` || `,
      `add`, tab, tab, 'blabla:title', tab, tab, ` || `,
      `last "search template`, tab, ` -gg`
    ]
    for (let each of actions) {
      if (typeof(each) === 'string') {
        await t.actions({actions: Array.from(each), interval})
      } else if (typeof(each) === 'number') {
        interval = each
      } else if (Array.isArray(each)) {
        await t.actions({actions: [each], interval})
      } else if (each.comment) {
        t.changeComment(each.comment, 500)
      } else if (each.js) {
        await t.actions({actions: each, interval})
      } else {
        await t.actions({actions: [each], interval})
      }
    }


    t.changeComment('all done',500)
    t.changeComment('')
  },
}

let t = new backend({options: testConfig, tests})
t.init()
