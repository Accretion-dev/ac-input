import peg from 'pegjs'
import test from 'ava'
import path from 'path'
console.log('new run')

test('test complex parser', t => {
  let {SyntaxError, parse} = require(path.resolve(__dirname, './complex.js'))
  let result
  let tracer = {level: 0}
  let blanktracer = {}
  blanktracer.trace = _ => {}
  tracer.formatInt = function (int, width) {
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
  tracer.trace = function (input) {
    let {type, rule, location, result} = input
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
    let start = location.start.offset
    let end = location.end.offset
    let sStr = this.formatInt(start, 3)
    let eStr = this.formatInt(end, 3)
    if (result) {
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
    if (type === 'rule.enter') {
      this.level += 1
    }
  }
  function d (str) {
    let result = parse(str, {tracer})
    console.log(str)
    console.log('    ====>')
    console.log(JSON.stringify(result, null, 2))
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
  d(
    `title|startsWith: 'foo bar' || tags|elemMatch:{tagname|startsWith: astro, time|lt: '2018'} || tags.tag_name: 'good' && tags.time|lt: '2018'`,
  )
  sameD([
    `title|startsWith: 'foo bar' || tags|elemMatch:{tagname|startsWith: astro, time|lt: '2018'} || tags.tag_name: 'good' && tags.time|lt: '2018'`,
  ], {$or: [
    {title: {$startsWith: 'foo bar'}},
    {tags: {$elemMatch: {
      tagname: {$startsWith: 'astro'},
      time: {$lt: '2018'}
    }}},
    {$and: [
      {'tags.tag_name': 'good'},
      {'tags.time': {$lt: '2018'}},
    ]}
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
