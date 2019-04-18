import peg from 'pegjs'
import test from 'ava'
import path from 'path'
console.log('new run')

function Tracer ({content, full, simple, result}) {
  this.level = 0
  this.history = []
  this.full = full
  this.simple = simple
  if (content === undefined) {
    throw Error('should give content')
  }
  this.content = content
}
Tracer.prototype.formatInt = function (int, width) {
  let rawint = int
  let digit
  if (!int) {
    digit = 1
  } else {
    digit = 0
    while (int >= 1) {
      int = int / 10
      digit += 1
    }
  }
  if (digit >= width) {
    return String(rawint)
  } else {
    return " ".repeat(width - digit) + String(rawint)
  }
}
Tracer.prototype.getAutocompleteType = function (cursor, debug, detail) {
  let length = this.content.lenth
  if (cursor<0 || cursor > length) throw Error(`bad cursor position: should be within [0, ${length}]`)

  let related = this.traceInfo.filter(_ => _.location.start.offset<=cursor && _.location.end.offset>=cursor && _.result)
  let thisStruct = null
  let prefix, suffix
  let value
  let output

  let state
  let stateStack = []
  let parent = 'block'
  const structRules = ['PairComplete', 'PairIncomplete', 'Key', 'ValuePair', 'ValueArray', 'ValueObject']
  const valueTypes = [ 'true', 'false', 'null', 'String', 'SimpleString', 'Number' ]
  // get structure for this object
  for (let each of related) {
    let {rule:type, location, result} = each
    let start = location.start.offset
    let end = location.end.offset
    if (type === 'PairComplete') {
      stateStack.push({ type, start, end, result, keys: each.keys, })
      state = type
    } else if (type === 'PairIncomplete') {
      stateStack.push({ type, start, end, result, keys: each.keys, })
      state = type
    } else if (type === 'Object') {
      stateStack.push({ type, start, end, result })
      state = type
    } else if (type === 'Array') {
      stateStack.push({ type, start, end, result })
      state = type
    }
  }

  // get value, do immediately return for ws*
  for (let each of related.reverse()) {
    let {rule:type, location, result} = each
    let start = location.start.offset
    let end = location.end.offset
    if (!value) {
      if (valueTypes.includes(type)) {
        value = {
          type: each.rule,
          start, end,
          result: each.result,
          level: each.level,
        }
        if (type === "String") {
          value.quote = this.content[each.location.start.offset]
        }
        continue
      }
    }
    if (type === 'ws00' && (start<cursor && cursor<end)) {
      // select field, complete: insert into cursor position, extract: ""
      output = {type: 'fieldKey', complete: 'insert', start: cursor, end:cursor, extract:""}
      break
    } else if (type === 'ws01' && (start<cursor && cursor<=end)) {
      // select field, complete: insert into cursor position, extract: ""
      output = {type: 'fieldKey', complete: 'insert', start: cursor, end:cursor, extract:""}
      break
    } else if (type === 'ws10' && (start<=cursor && cursor<end)) {
      // select field, complete: insert into cursor position, extract: ""
      output = {type: 'fieldKey', complete: 'insert', start: cursor, end:cursor, extract:""}
      break
    } else if (type === 'ws10Object' && (start<=cursor && cursor<end)) {
      output = {type: 'objectKey', complete: 'insert', start: cursor, end:cursor, extract:"", stateStack}
      break
    } else if (type === 'ws01Object' && (start<cursor && cursor<=end)) {
      output = {type: 'objectKey', complete: 'insert', start: cursor, end:cursor, extract:"", stateStack}
      break
    } else if (type === 'ws10Array' && (start<=cursor && cursor<end)) {
      output = {type: 'arrayValue', complete: 'insert', start: cursor, end:cursor, extract:"", stateStack}
      break
    } else if (type === 'ws01Array' && (start<cursor && cursor<=end)) {
      output = {type: 'arrayValue', complete: 'insert', start: cursor, end:cursor, extract:"", stateStack}
      break
    } else if (type === 'ValueBlock') {
      output = {
        type: 'fieldKey',
        complete: 'replace',
        start: value.start,
        end: value.end,
        extract:String(value.result), // string
        valueType: value.type,
        value,
        stateStack,
      }
      break
    } else if (type === 'ValueObject') { // unfinished object
      output = {
        type: 'objectKey',
        complete: 'replace',
        start: value.start,
        end: value.end,
        extract:String(value.result), // string
        valueType: value.type,
        value,
        stateStack
      }
      break
    } else if (type === 'ws01PS'&& (start<cursor && cursor<=end)) { // unfinished object
      output = { type: 'objectValue', complete: 'insert', start: cursor, end: cursor, extract:"", stateStack}
      break
    } else if (type === 'ValueArray') { // unfinished object
      output = {
        type: 'arrayValue',
        complete: 'replace',
        start: value.start,
        end: value.end,
        extract:String(value.result), // string
        valueType: value.type,
        value,
        stateStack
      }
      break
    } else if (type === 'Key') { // no more level under key
      value = each
      let keyString = this.content.slice(start, end+1)
      if (each.result.length !== keyString.split('|').length) {
        throw Error('should not be here, need debug')
      }
      let keyIndex = 0
      let lastEnd = 0
      for (let index=start+1; index<=cursor; index++) {
        if (this.content[index-1] === '|') {
          keyIndex += 1
          lastEnd = index-1
        }
      }
      output = {
        type: 'key',
        complete: 'replace',
        start,
        end,
        lastEnd, // when do replace, keep [start~lastStart], delete [lastStart+1 ~ end] and replace with autocomplete
        extract:each.result.slice(0, keyIndex+1), // array
        valueType: 'key',
        value,
        stateStack,
      }
      break
    } else if (type === 'ValuePair') { // no more level under key
      output = {
        type: 'pairValue',
        complete: 'replace',
        start: value.start,
        end: value.end,
        extract:String(value.result), // string
        valueType: value.type,
        value,
        stateStack
      }
      break
    } else if (type === 'Object') {
      output = {
        type: 'edge',
        complete: null,
        start,
        end,
        value,
        stateStack
      }
      break
    } else if (type === 'Array') {
      output = {
        type: 'edge',
        complete: null,
        start,
        end,
        value,
        stateStack
      }
      break
    }
  }

  if (debug) {
    console.log(`===========cursor position: ${cursor}===========`)
    let newContent = `${this.content.slice(0,cursor)}◼️${this.content.slice(cursor)}`
    if (output) {
      let {type, start, end, complete} = output
      if (complete === 'insert') {
        let toPrint = `${this.content.slice(0,cursor)}%c◼️%c${this.content.slice(cursor)}`
        console.log(JSON.stringify(output))
        console.log(toPrint, "color:red;", "")
      } else {
        if (cursor < start) start += 1
        if (cursor < end) end += 1
        let head = newContent.slice(0, start)
        let middle = newContent.slice(start, end+1)
        let tail = newContent.slice(end+1,)
        let toPrint =  `${head}%c${middle}%c${tail}`
        console.log(JSON.stringify(output))
        console.log(toPrint, "background-color:#41ff418c;", "")
        if (type==='key') {
          let {type, start, lastEnd: end, complete} = output
          if (cursor < start) start += 1
          if (cursor < end) end += 1
          let head = newContent.slice(0, start)
          let middle = newContent.slice(start, end+1)
          let tail = newContent.slice(end+1,)
          if (middle) {
            let toPrint =  `${head}%c${middle}%c${tail}`
            console.log(toPrint, "background-color:#41ff418c;", "")
          } else {
            console.log(newContent)
          }
        }
      }
      if (output.type === 'edge') {
        for (let each of related) {
          this.retrace(each)
        }
      }
    } else {
      console.log(newContent)
      for (let each of related) {
        this.retrace(each)
      }
    }
    if (detail) {
      for (let each of related) {
        this.retrace(each)
      }
    }
  }

  return output
}
Tracer.prototype.traceback = function () {
  let stack = []
  let topObj
  this.traceInfo = []
  const stopRules = [
    'ws10', 'ws01', 'ws00', 'Key', 'String', 'SimpleString',
    'ws01Object', 'ws10Object', 'ws01Array', 'ws10Array',
    'ws01PS',
  ]
  let stop = false
  let failed = false
  let slevel = 0
  for (let each of this.history.reverse()) {
    let {type, rule, location, result, level} = each
    if (type === 'rule.match') {
      if (stop || failed) continue
      if (stopRules.includes(rule)) {
        stop = true
        slevel = level
      }
      stack.push(each)
    } else if (type === 'rule.fail') {
      if (stop || failed) continue
      failed = true
      slevel = level
    } else if (type === 'rule.enter') {
      if (stop || failed) {
        if (slevel === level) {
          if (failed) {
            failed = false
          } else if (stop) {
            stop = false
            topObj = stack.pop()
            this.traceInfo.push(topObj)
          }
        }
      } else {
        topObj = stack.pop()
        this.traceInfo.push(topObj)
      }
    }
  }
  this.traceInfo = this.traceInfo.reverse()
}
Tracer.prototype.retrace = function (event) {
  let {type, rule, location, result, level} = event
  let action
  if (type === 'rule.enter') {
    action = type
  } else if (type === 'rule.match') {
    action = type
  } else if (type === 'rule.fail') {
    action = type + ' '
  }
  let start = location.start.offset
  let end = location.end.offset
  let sStr = this.formatInt(start, 3)
  let eStr = this.formatInt(end, 3)
  if (result !== undefined) {
    let rstr
    try {
      rstr = JSON.stringify(result)
    } catch (e) {
      rstr = String(result)
    }
    console.log(`${sStr}-${eStr} ${level} ${action} ${" ".repeat(level*2)} ${rule} ====> ${rstr}`)
  } else {
    console.log(`${sStr}-${eStr} ${level} ${action} ${" ".repeat(level*2)} ${rule}`)
  }
}
Tracer.prototype.trace = function (event, second) {
  let {type, rule, location, result} = event
  let action
  if (type === 'rule.enter') {
    action = type
  } else if (type === 'rule.match') {
    this.level -= 1
    action = type
  } else if (type === 'rule.fail') {
    this.level -= 1
    action = type + ' '
  }
  this.history.push(Object.assign({}, event, {level: this.level}))
  if (this.full) {
    let start = location.start.offset
    let end = location.end.offset
    let sStr = this.formatInt(start, 3)
    let eStr = this.formatInt(end, 3)
    if (result !== undefined) {
      let rstr
      try {
        rstr = JSON.stringify(result)
      } catch (e) {
        rstr = String(result)
      }
      console.log(`${sStr}-${eStr} ${this.level} ${action} ${" ".repeat(this.level*2)} ${rule} ====> ${rstr}`)
    } else {
      console.log(`${sStr}-${eStr} ${this.level} ${action} ${" ".repeat(this.level*2)} ${rule}`)
    }
  }
  if (type === 'rule.enter') {
    this.level += 1
  }
  if (rule === 'start' && type === 'rule.match') {
    this.traceback()
    if (this.simple) {
      console.log('===============simple log================')
      for (let each of this.traceInfo) {
        this.retrace(each)
      }
    }
  }
}

function range(start,end,step) {
  // for some reason,  [...Array(20).keys()] do not work
  let result = []
  step = step || 1
  if (end === undefined) {
    for (let i=0; i<start; i+=step) {
      result.push(i)
    }
  } else {
    for (let i=start; i<end; i+=step) {
      result.push(i)
    }
  }

  return result
}

test('test complex parser', t => {
  let {SyntaxError, parse} = require(path.resolve(__dirname, './complex.js'))
  let result
  let blanktracer = {}
  blanktracer.trace = _ => {}
  parse.debug = function (str, offset) {
    let tracer = new Tracer({content: str, simple: true})
    let result = this(str, {tracer})
    console.log(str)
    console.log('    ====>')
    console.log(JSON.stringify(result, null, 2))
    if (offset !== undefined) {
      if (Array.isArray(offset)) {
        for (let each of offset) {
          tracer.getAutocompleteType(each, true)
        }
      } else {
        tracer.getAutocompleteType(offset, true)
      }
    }
  }
  function same (todo, value) {
    let result
    for (let each of todo) {
      result = parse(each, {tracer:blanktracer})
      t.is(result, value)
      result = parse(" "+each, {tracer:blanktracer})
      t.is(result, value)
      result = parse(each+" ", {tracer:blanktracer})
      t.is(result, value)
      result = parse(" "+each+" ", {tracer:blanktracer})
      t.is(result, value)
    }
  }
  function sameD (todo, value) {
    let result
    for (let each of todo) {
      result = parse(each, {tracer:blanktracer})
      t.deepEqual(result, value)
      result = parse(" "+each, {tracer:blanktracer})
      t.deepEqual(result, value)
      result = parse(each+" ", {tracer:blanktracer})
      t.deepEqual(result, value)
      result = parse(" "+each+" ", {tracer:blanktracer})
      t.deepEqual(result, value)
    }
  }
  // numbers
  let numbers = [
    0, '-0', 1, 11, -12, 121.223, -121.223, 131e1, -131e1, 123.123e-1, -123.123e-1
  ]
  for (let each of numbers) {
    result = parse(String(each), {tracer: blanktracer})
    t.is(Number(each), result)
    result = parse(" "+String(each), {tracer: blanktracer})
    t.is(Number(each), result)
    result = parse(String(each)+" ", {tracer: blanktracer})
    t.is(Number(each), result)
    result = parse(" "+String(each)+" ", {tracer: blanktracer})
    t.is(Number(each), result)
  }
  // strings
  same(['hehehe', `'hehehe'`, `"hehehe"`], 'hehehe')
  same([`'he\thehe'`, `"he\thehe"`], 'he\thehe')
  same([`'he\\\\hehe'`, `"he\\\\hehe"`], 'he\\hehe')
  same([`'2018-01-01T00:00:00'`, `"2018-01-01T00:00:00"`], '2018-01-01T00:00:00')
  // Block
  sameD([
    `good:good`,
    `good  :  good`,
    `'good'  :  good`,
    `'good'  :  'good'`,
    `good  :  'good'`,
  ], {good: "good"})
  sameD([
    `good:`,
    `good  :  `,
    `'good'  :  `,
    `'good'  :  `,
    `good  : `,
  ], {good: null})
  sameD([
    `$good:good`,
    `$good  :  good`,
    `'$good'  :  good`,
    `'$good'  :  'good'`,
    `$good  :  'good'`,
  ], {$good: "good"})
  sameD([
    `$good| in:good`,
    `$good |in  :  good`,
    `'$good' | in  :  good`,
    `'$good' | in  :  'good'`,
    `$good|in  :  'good'`,
  ], {$good: {$in: "good"}})
  sameD([
    `$good| in:`,
    `$good |in  :  `,
    `'$good' | in  :  `,
    `'$good' | in  :  `,
    `$good|in  :  `,
  ], {$good: {$in: null}})
  sameD([
    `good:[asd , 123, 123.456, 'asdf\\\\fd', '(*&)""']`,
    `'good'  :  ['asd' , 123 , 1.23456e2, 'asdf\\\\fd', "(*&)\\"\\""]`,
  ], {good: ['asd', 123, 123.456, 'asdf\\fd', '(*&)""']})
  sameD([
    `good:{1:asd , asd:123, 'haha':123.456, "he\\"he":'asdf\\\\fd', $foo:'(*&)""'}`,
    `'good'  :  {1:'asd' , 'asd':123 , "haha":1.23456e2, 'he\\"he':'asdf\\\\fd', "$foo":"(*&)\\"\\""}`,
  ], {good: {1:'asd', asd:123, haha:123.456, 'he"he':'asdf\\fd', $foo:'(*&)""'}})
  sameD([
    `good:{1:[ asd, 'fd\\\\a', 321.123, {b:1}] , asd:{a:123, b:{a:321, b:['haha', 321, '321']}}, 'haha':123.456, "he\\"he":'asdf\\\\fd', $foo:'(*&)""'}`,
  ], { good:{1:[ 'asd', 'fd\\a', 321.123, {b:1}] , asd:{a:123, b:{a:321, b:['haha', 321, '321']}}, 'haha':123.456, 'he"he':'asdf\\fd', $foo:'(*&)""'} })
  sameD([
    `good:good bad:bad`,
    `good  :  'good' bad : bad`,
    `good  :  good 'bad' : bad`,
    `good  :  good && 'bad' : bad`,
    `good  :  "good"  'bad' : 'bad'`,
  ], {$and: [{good:'good'}, {bad:'bad'}]})
  sameD([
    `good:good bad:bad nice:nice`,
    `good  :  'good' bad : bad && nice:'nice'`,
    `good  :  good 'bad' : bad && nice:"nice"`,
    `good  :  good && 'bad' : bad && "nice":nice`,
    `good  :  "good" 'bad' : 'bad' "nice":nice`,
  ], {$and: [{good:'good'}, {bad:'bad'}, {nice: 'nice'}]})
  sameD([
    `good:good bad:bad nice:'nice nice' fine:fine`,
  ], {$and: [{good:'good'}, {bad:'bad'}, {nice: 'nice nice'}, {fine:'fine'}]})
  sameD([
    `good:good bad:bad || nice:'nice nice' fine:fine`,
  ], {$or: [{$and: [{good:'good'}, {bad:'bad'}]},{$and:[{nice: 'nice nice'}, {fine:'fine'}]}]})
  sameD([
    `good:good (bad:bad nice:'nice nice') fine:fine`,
  ], {$and: [{good:'good'}, {$and: [{bad:'bad'}, {nice: 'nice nice'}]}, {fine:'fine'}]})
  sameD([
    `good:good (bad:bad || nice:'nice nice') fine:fine`,
  ], {$and: [{good:'good'}, {$or: [{bad:'bad'}, {nice: 'nice nice'}]}, {fine:'fine'}]})
  sameD([
    `good:good && good1:good1 || bad:bad bad1: bad1 || nice:'nice nice' nice1: nice1 || fine:fine fine1: fine1`,
  ], {$or: [
    {$and:[{good:'good'},{good1:'good1'}]},
    {$and:[{bad:'bad'}, {bad1:'bad1'}]},
    {$and:[{nice:'nice nice'},{nice1:'nice1'}]},
    {$and:[{fine:'fine'},{fine1:'fine1'}]},
  ]})
  sameD([
    `good:good && good1:good1 || ( bad:bad (bad1: bad1 || nice:'nice nice') nice1: nice1 ) || fine:fine fine1: fine1`,
  ], {$or: [
    {$and:[{good:'good'},{good1:'good1'}]},
    {$and: [{bad:'bad'}, {$or:[{bad1:'bad1'}, {nice: 'nice nice'}]}, {nice1: 'nice1'}]},
    {$and:[{fine:'fine'},{fine1:'fine1'}]},
  ]})
  sameD([
    `good: && good1: || ( bad: (bad1: || nice:) nice1:) || fine: && fine1: `,
  ], {$or: [
    {$and:[{good:null},{good1:null}]},
    {$and: [{bad:null}, {$or:[{bad1:null}, {nice: null}]}, {nice1: null}]},
    {$and:[{fine:null},{fine1:null}]},
  ]})
  let todo
  todo = `
    title|startsWith: 'foo bar' ||
    tags|elemMatch:{tagname|startsWith: astro, time|lt: } ||
    tags.tag_name: 'good' && ~(tags.time|lt: '2018') ||
    tags.tag_name|in:[
      foo, bar, 'a\\'b',
    ] ||
    halftype: ||
    flags|:flag  ||
    simple|level1|level2|level3 : s123 ||
    simple|level1|level2| : s12$ ||
    simple|level1|level2| : ||
    ( (unfinished0) unfinished1) ||
    'unfinished2' ||
    unfinished3: {
      unfinished4,
      'undefined%5',
      unfinished6: ,
      unfinished7|op8|:,
      level1|in: { level2|in|in: { level3|in|in|in: good}},
    }
  `
  let cursors = range(0, 581)
  parse.debug(todo, cursors)
  sameD([
    `title|startsWith: 'foo bar' || tags|elemMatch:{tagname|startsWith: astro, time|lt: } || tags.tag_name: 'good' && ~(tags.time|lt: '2018') || tags.tag_name|in:[foo, bar, 'a\\'b'] || halftype`,
  ], {$or: [
    {title: {$startsWith: 'foo bar'}},
    {tags: {$elemMatch: {
      tagname: {$startsWith: 'astro'},
      time: {$lt: null}
    }}},
    {$and: [
      {'tags.tag_name': 'good'},
      {$not: {'tags.time': {$lt: '2018'}}},
    ]},
    {'tags.tag_name':{$in:['foo', 'bar', 'a\'b']}},
    'halftype',
  ]})
  sameD([
    todo
  ], {$or: [
    {title: {$startsWith: 'foo bar'}},
    {tags: {$elemMatch: {
      tagname: {$startsWith: 'astro'},
      time: {$lt: null}
    }}},
    {$and: [
      {'tags.tag_name': 'good'},
      {$not: {'tags.time': {$lt: '2018'}}},
    ]},
    {'tags.tag_name':{$in:['foo', 'bar', 'a\'b']}},
    {halftype: null},
    {flags:{$:'flag'}},
    {simple:{$level1:{$level2:{$level3: 's123'}}}},
    {simple:{$level1:{$level2:{$: 's12$'}}}},
    {simple:{$level1:{$level2:{$: null}}}},
    {$and: ['unfinished0', 'unfinished1']},
    'unfinished2',
    {unfinished3: {
      unfinished4: null, 'undefined%5': null, unfinished6: null, unfinished7: {$op8: {$: null}},
      level1: {
        $in:{
          level2: {
            $in:{
              $in:{
                level3: {$in:{$in:{$in: 'good' }}}
              }
            }
          }
        }
      },
    }},
  ]})

	t.pass()
})

/*
test string

tags: good
  => {'tags': 'good'}
'tags': good
  => {'tags': 'good'}
'tags': 'good'
  => {'tags': 'good'}
tags: 'good'
  => {'tags': 'good'}

tags:good, title:'bad apple'
  => {'tags': 'good', title: 'bad apple'}

tags|in:[good, bad], title:'bad apple'
  => {'tags': {$in: ['good', 'bad']}, title: 'bad apple'}

tags|in:[good, bad] & title:'bad apple'
  => {$and: [{'tags': {$in: ['good', 'bad']}}, {title: 'bad apple'}]}
tags|in:[good, bad] title:'bad apple'
  => {$and: [{'tags': {$in: ['good', 'bad']}}, {title: 'bad apple'}]}

*/



/*
// tests
* empty: ctype="fields"
``
* word: ctype="fields"
`goo` => [good, goodday, ...]
* word, exact match: ctype="fields + field| + field:"
`good` => [good, good:, good|, goodday, ...]
* wordop exact match: ctype="field|*"
`good|` => [good|in, good|>, good|<, ...]
* word: exact match: ctype="field|*"
`good:` => [good:{}]
*/
