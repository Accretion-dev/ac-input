<template>
  <div>
    <div>
      {{cursorStart}} {{"=>"}} {{cursor}}
    </div>
    <ac-input-cursor v-model="value"
              placeholder="query"
              ref='query'
              :cursor.sync="cursor"
              :cursor-start.sync="cursorStart"
              :data="data"
              :tab="tabFunction"
    />
  </div>
</template>

<script>
import {Parser} from 'mongodb-simple-query-syntax'
const prefixCls = 'mongodb-input'

//TODO: * selectAll
const testData = `
title: haha ||
title: 'hehe' ||
title: {$gt:'123', $in:[1,2]} ||
title|lt: foo  ||
title|in: [foo,"haha hehe"]  ||
title: [123] ||
ctime: "2018" ||
ctime|lt: "2018" ||
ctime: {$gt:'2018', $lt:'2018'} ||
ctime: [foo,bar] ||
flags|exists: true ||
flags: {debug: true} ||
flags.debug: true ||
flags.count|gt: 10 ||
flags.count|in: [10, 20] ||
tag:{unexists:1} ||
tag:{$exists:1} ||
tag|exists: ture ||
tags: foo ||
tags: /foo/ ||
tags.tag_name: "foo" ||
tags: {$in:[good,/123/], $el:{tag_name|in:[foo, bar], $and:[ctime|gt:'2018', tag_id|gt:10]}} ||
tags: [foo, bar] ||
tags|len: 5 ||
tags|len|gt: 5 ||
tags|len: {$gt:5, $lt:10} ||
tags|lt:foo ||
tags|in: [foo, bar] ||
tags|el: {tag_id: 10, tag_name|in:[foo, bar], $and:[ctime|gt:'2018', tag_id|gt:10]} ||
tags|el|or: [tag_id: 10, tag_name|in:[foo, bar], $and:[ctime|gt:'2018', tag_id|gt:10]] ||
metadatas: [foo, bar] ||
metadatas|in: [foo, bar] ||
metadatas.metadata_name|in: [foo, bar] ||
$and:[$or:[tags: foo, tags: /foo/], $or:[tags|lt:foo, tags|in:[foo, bar]]] ||
$where: "blablabla" ||
$text: {$search: good} ||
$text|search: "good" ||
$expr:{$and:[$gt:["$title", $abs:"$field"]]} ||
$expr|and: [$or:[$lt:[$hour:"$ctime",10]],$eq:["$title", /foo/]] ||
$unwind:"$relations" ||
$addFields:{blabla:1} ||
last "search template" -gg
`

const dbstruct = {
  Article:{"type":"object","fields":{"title":{"path":"title","type":"string"},"author":{"path":"author","type":"string"},"editor":{"path":"editor","type":"string"},"abstract":{"path":"abstract","type":"string"},"type":{"path":"type","type":"string"},"content":{"path":"content","type":"string"},"tags":{"type":"object","fields":{"tag_id":{"path":"tags.tag_id","type":"number"},"tag_name":{"path":"tags.tag_name","type":"string"},"_id":{"path":"tags._id","type":"string"},"flags":{"path":"tags.flags","type":"object"},"id":{"path":"tags.id","type":"number"},"comment":{"path":"tags.comment","type":"string"},"origin":{"path":"tags.origin","array":true,"type":"object"},"ctime":{"path":"tags.ctime","type":"date"},"mtime":{"path":"tags.mtime","type":"date"}},"path":"tags","array":true,"primary_key":"tag_name"},"catalogues":{"type":"object","fields":{"catalogue_id":{"path":"catalogues.catalogue_id","type":"number"},"catalogue_name":{"path":"catalogues.catalogue_name","type":"string"},"_id":{"path":"catalogues._id","type":"string"},"flags":{"path":"catalogues.flags","type":"object"},"id":{"path":"catalogues.id","type":"number"},"comment":{"path":"catalogues.comment","type":"string"},"origin":{"path":"catalogues.origin","array":true,"type":"object"},"ctime":{"path":"catalogues.ctime","type":"date"},"mtime":{"path":"catalogues.mtime","type":"date"}},"path":"catalogues","array":true,"primary_key":"catalogue_name"},"relations":{"type":"object","fields":{"relation_id":{"path":"relations.relation_id","type":"number"},"relation_name":{"path":"relations.relation_name","type":"string"},"parameter":{"path":"relations.parameter","type":"object"},"from_model":{"path":"relations.from_model","type":"string"},"from_id":{"path":"relations.from_id","type":"number"},"to_model":{"path":"relations.to_model","type":"string"},"to_id":{"path":"relations.to_id","type":"number"},"other_model":{"path":"relations.other_model","type":"string"},"other_id":{"path":"relations.other_id","type":"number"},"aorb":{"path":"relations.aorb","type":"string"},"other_aorb":{"path":"relations.other_aorb","type":"string"},"_id":{"path":"relations._id","type":"string"},"flags":{"path":"relations.flags","type":"object"},"id":{"path":"relations.id","type":"number"},"comment":{"path":"relations.comment","type":"string"},"origin":{"path":"relations.origin","array":true,"type":"object"},"ctime":{"path":"relations.ctime","type":"date"},"mtime":{"path":"relations.mtime","type":"date"}},"path":"relations","array":true,"primary_key":"relation_name"},"fathers":{"type":"object","fields":{"id":{"path":"fathers.id","type":"number"},"_id":{"path":"fathers._id","type":"string"},"origin":{"path":"fathers.origin","array":true,"type":"object"}},"path":"fathers","array":true},"children":{"type":"object","fields":{"id":{"path":"children.id","type":"number"},"_id":{"path":"children._id","type":"string"},"origin":{"path":"children.origin","array":true,"type":"object"}},"path":"children","array":true},"metadatas":{"type":"object","fields":{"metadata_id":{"path":"metadatas.metadata_id","type":"number"},"metadata_name":{"path":"metadatas.metadata_name","type":"string"},"value":{"path":"metadatas.value","type":"object"},"_id":{"path":"metadatas._id","type":"string"},"flags":{"path":"metadatas.flags","type":"object"},"id":{"path":"metadatas.id","type":"number"},"comment":{"path":"metadatas.comment","type":"string"},"origin":{"path":"metadatas.origin","array":true,"type":"object"},"ctime":{"path":"metadatas.ctime","type":"date"},"mtime":{"path":"metadatas.mtime","type":"date"}},"path":"metadatas","array":true,"primary_key":"metadata_name"},"flags":{"path":"flags","type":"object"},"user":{"path":"user","fields":{"username":{"path":"user.username","type":"string"}},"type":"object"},"id":{"path":"id","type":"number"},"comment":{"path":"comment","type":"string"},"origin":{"path":"origin","array":true,"type":"object"},"ctime":{"path":"ctime","type":"date"},"mtime":{"path":"mtime","type":"date"},"mmtime":{"path":"mmtime","type":"date"},"mctime":{"path":"mctime","type":"date"},"_id":{"path":"_id","type":"string"}},"root":"Article","searchKey":["title","author","editor","abstract","tags.tag_name","catalogues.catalogue_name","relations.relation_name","metadatas.metadata_name","comment"]},
  Tag:{"type":"object","fields":{"name":{"path":"name","type":"string"},"type":{"path":"type","type":"string"},"description":{"path":"description","type":"string"},"display_name":{"path":"display_name","type":"string"},"relations":{"type":"object","fields":{"relation_id":{"path":"relations.relation_id","type":"number"},"relation_name":{"path":"relations.relation_name","type":"string"},"parameter":{"path":"relations.parameter","type":"object"},"from_model":{"path":"relations.from_model","type":"string"},"from_id":{"path":"relations.from_id","type":"number"},"to_model":{"path":"relations.to_model","type":"string"},"to_id":{"path":"relations.to_id","type":"number"},"other_model":{"path":"relations.other_model","type":"string"},"other_id":{"path":"relations.other_id","type":"number"},"aorb":{"path":"relations.aorb","type":"string"},"other_aorb":{"path":"relations.other_aorb","type":"string"},"_id":{"path":"relations._id","type":"string"},"flags":{"path":"relations.flags","type":"object"},"id":{"path":"relations.id","type":"number"},"comment":{"path":"relations.comment","type":"string"},"origin":{"path":"relations.origin","array":true,"type":"object"},"ctime":{"path":"relations.ctime","type":"date"},"mtime":{"path":"relations.mtime","type":"date"}},"path":"relations","array":true,"primary_key":"relation_name"},"fathers":{"type":"object","fields":{"id":{"path":"fathers.id","type":"number"},"_id":{"path":"fathers._id","type":"string"},"origin":{"path":"fathers.origin","array":true,"type":"object"}},"path":"fathers","array":true},"children":{"type":"object","fields":{"id":{"path":"children.id","type":"number"},"_id":{"path":"children._id","type":"string"},"origin":{"path":"children.origin","array":true,"type":"object"}},"path":"children","array":true},"metadatas":{"type":"object","fields":{"metadata_id":{"path":"metadatas.metadata_id","type":"number"},"metadata_name":{"path":"metadatas.metadata_name","type":"string"},"value":{"path":"metadatas.value","type":"object"},"_id":{"path":"metadatas._id","type":"string"},"flags":{"path":"metadatas.flags","type":"object"},"id":{"path":"metadatas.id","type":"number"},"comment":{"path":"metadatas.comment","type":"string"},"origin":{"path":"metadatas.origin","array":true,"type":"object"},"ctime":{"path":"metadatas.ctime","type":"date"},"mtime":{"path":"metadatas.mtime","type":"date"}},"path":"metadatas","array":true,"primary_key":"metadata_name"},"flags":{"path":"flags","type":"object"},"user":{"path":"user","fields":{"username":{"path":"user.username","type":"string"}},"type":"object"},"id":{"path":"id","type":"number"},"comment":{"path":"comment","type":"string"},"origin":{"path":"origin","array":true,"type":"object"},"ctime":{"path":"ctime","type":"date"},"mtime":{"path":"mtime","type":"date"},"mmtime":{"path":"mmtime","type":"date"},"mctime":{"path":"mctime","type":"date"},"r":{"path":"r","fields":{"Article":{"path":"r.Article","array":true,"type":"string"},"Website":{"path":"r.Website","array":true,"type":"string"},"File":{"path":"r.File","array":true,"type":"string"}},"type":"object"},"_id":{"path":"_id","type":"string"}},"root":"Tag","searchKey":["name","relations.relation_name","metadatas.metadata_name","comment"]},
  Catalogue:{"type":"object","fields":{"name":{"path":"name","type":"string"},"type":{"path":"type","type":"string"},"description":{"path":"description","type":"string"},"fathers":{"type":"object","fields":{"id":{"path":"fathers.id","type":"number"},"_id":{"path":"fathers._id","type":"string"},"origin":{"path":"fathers.origin","array":true,"type":"object"}},"path":"fathers","array":true},"children":{"type":"object","fields":{"id":{"path":"children.id","type":"number"},"_id":{"path":"children._id","type":"string"},"origin":{"path":"children.origin","array":true,"type":"object"}},"path":"children","array":true},"metadatas":{"type":"object","fields":{"metadata_id":{"path":"metadatas.metadata_id","type":"number"},"metadata_name":{"path":"metadatas.metadata_name","type":"string"},"value":{"path":"metadatas.value","type":"object"},"_id":{"path":"metadatas._id","type":"string"},"flags":{"path":"metadatas.flags","type":"object"},"id":{"path":"metadatas.id","type":"number"},"comment":{"path":"metadatas.comment","type":"string"},"origin":{"path":"metadatas.origin","array":true,"type":"object"},"ctime":{"path":"metadatas.ctime","type":"date"},"mtime":{"path":"metadatas.mtime","type":"date"}},"path":"metadatas","array":true,"primary_key":"metadata_name"},"flags":{"path":"flags","type":"object"},"user":{"path":"user","fields":{"username":{"path":"user.username","type":"string"}},"type":"object"},"id":{"path":"id","type":"number"},"comment":{"path":"comment","type":"string"},"origin":{"path":"origin","array":true,"type":"object"},"ctime":{"path":"ctime","type":"date"},"mtime":{"path":"mtime","type":"date"},"mmtime":{"path":"mmtime","type":"date"},"mctime":{"path":"mctime","type":"date"},"r":{"path":"r","fields":{"Article":{"path":"r.Article","array":true,"type":"string"},"Website":{"path":"r.Website","array":true,"type":"string"},"File":{"path":"r.File","array":true,"type":"string"}},"type":"object"},"_id":{"path":"_id","type":"string"}},"root":"Catalogue","searchKey":["name","metadatas.metadata_name","comment"]},
}

function inputParser (value) {
  let parser = new Parser({
    struct:dbstruct.Article,
    //options:{print: true, logFull: false, logSimple: this.debuglog}
  })
  if (!value.length) { // value is empty, not use parser
    return {
      cursor (cursor) {
        return {extract: value, range: null}
      },
      complete (cursor, oldValue, newValue) {
        return {value: newValue, cursor:cursor-oldValue.length + newValue.length}
      },
      result:null,
      keyPositions:[]
    }
  } else { // use parser
    let result
    let error
    try {
      result = parser.parse({content: value})
    } catch (e) {
      error = e
      console.error(e)
      return {
        cursor (cursor) {
          return {extract: value, range: null}
        },
        complete (cursor, oldValue, newValue) {
          return {value: newValue, cursor:cursor-oldValue.length + newValue.length}
        },
        result:null,
        keyPositions:[],
        error,
      }
    }
    let keyPositions = parser.tracer.keyPositions
    if (keyPositions.length && keyPositions[0].type.startsWith('ws')) {
      keyPositions = keyPositions.slice(1)
    }
    let state = {}
    return {
      selectAll(start, end) {
        let each
        for (each of state.selfKeyPositions) {
          let estart = each.start
          let eend = each.end
          if (estart<start || eend<end) break
        }
        return {start: each.start, end: each.end}
      },
      cursor (cursor) {
        let result = parser.analysis(cursor)
        // console.log('cursor:', cursor, result)
        let {start, end, lastEnd, output, complete, string, selfKeyPositions} = result.autocomplete
        Object.assign(state, {start, end, lastEnd, output, complete, string, selfKeyPositions})
        return {
          extract: string,
          range: {start, end: end-1, color: 'rgba(0,255,0,0.5)'},
          completeData: output
        }
      },
      complete (cursor, oldValue, newValue, cursorOffset) {
        let offset = cursorOffset === undefined ? 0 : cursorOffset
        let {start, end, lastEnd, complete} = state
        if (complete === 'insert' && start !== end) {
          let middle = start+1
          start = end = middle
        }
        start = lastEnd!==undefined?lastEnd+1:start
        let head = oldValue.slice(0,start)
        let tail = oldValue.slice(end)
        let newFullValue = `${head}${newValue}${tail}`
        return {value: newFullValue, cursor:start + newValue.length + offset}
      },
      result,
      keyPositions,
    }
  }
}

export default {
  name: 'mongodb-input',
  props: {
  },
  data () {
    return {
      cursor:0,
      cursorStart:0,
      value:'',
      data: {
        parser: inputParser,
        data: [ ]
      }
    }
  },
  computed: {
  },
  methods: {
    tabFunction (vm, event) {
      event.preventDefault()
      if (vm.parser && vm.parser.keyPositions && vm.parser.keyPositions.length) {
        let k = vm.parser.keyPositions
        let mod = event.shiftKey
        let cursor = vm.cursor
        let find
        if (!mod) { // next
          find = k.find(_ => _.start>=cursor)
          if (!find) find = k[0]
        } else { // previous
          find = k.slice().reverse().find(_ => _.end<cursor)
          if (!find) find = k[k.length-1]
        }
        vm.setCursor(find.end)
      }
    }
  },
  created () {
  }
}
</script>

<style>
$pre: mongodb-input;

</style>
