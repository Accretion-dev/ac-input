import http from 'http'
import chromedriver from 'chromedriver'
import webdriver from 'selenium-webdriver'
import kill from 'kill-port'
import tcpPortUsed from 'tcp-port-used'
import path from 'path'
import fs from 'fs'
import os from 'os'
const {Builder, By, Key, until, WebDriver} = require('selenium-webdriver')
const Http = require('selenium-webdriver/http')
const options = require('../testConfig.json')
let driver, t
let executor, sessionID

const modifierKeys = [
  Key.CONTROL,
  Key.ALT,
  Key.SHIFT,
  Key.META,
]
let keyPrintMap = new Map()
for (let each of Array.from('~!@#$%^&*()_+|}{POIUYTREWQASDFGHJKL:"?><MNBVCXZ"}'+"`1234567890-=\\][poiuytrewqasdfghjkl;'/.,mnbvcxz'")) {
  keyPrintMap.set(each, each)
}
let specialKeys = {

}


let tasks = {}
class Tester {
  constructor ({name, driver, rootSelector, commentSelector, keySelector}) {
    if (typeof(rootSelector)!=='string') throw Error('root selector must be a string')
    tasks[name] = this
    this.name = name
    this.driver = driver
    this.d = this.driver
    this.rootSelector = rootSelector
    let root = driver.findElement(By.css(rootSelector))
    this.root = root
    this.r = root
    this.commentSelector = commentSelector || 'span.selenium-comment'
    this.keySelector = keySelector || 'span.selenium-key'
    this.running = true
    let template=`
      if (!window.seleniumRoot) {
        window.seleniumRoot = new Map()
        window.seleniumComment = new Map()
        window.seleniumKey = new Map()
      }
      let root = document.querySelector("${this.rootSelector}")
      if (!root) { throw Error(\`no root element found with css(${this.rootSelector})\`) }
      window.seleniumRoot.set("${this.name}", root)
      let comment = root.querySelector("${this.commentSelector}")
      if (!comment) { throw Error(\`no comment element found with css(${this.commentSelector})\`) }
      window.seleniumComment.set("${this.name}", comment)
      let key = root.querySelector("${this.keySelector}")
      if (!key) { throw Error(\`no key element found with css(${this.commentSelector})\`) }
      window.seleniumKey.set("${this.name}", key)
    `
    let result = this.driver.executeScript(template)
  }
  setRunning (bool) {
    this.running = bool
  }
  async sendKeys({keys, interval, delay}) {
    if (!Array.isArray(keys)) {
      keys = Array.from(keys)
    }
    if (delay){
      await this.driver.sleep(delay)
    }
    for (let each of keys) {
      if (!this.running) {
        t.changeComment('', null, each)
        throw Error('Stop in sendKeys at sending:', each)
      }
      let actions = this.driver.actions()
      if (Array.isArray(each)) {
        let reversed = []
        for (let eacheach of each) {
          if (modifierKeys.includes(eacheach)) {
            actions = actions.keyDown(eacheach)
            reversed.push(eacheach)
          } else {
            actions = actions.sendKeys(eacheach)
          }
        }
        for (let eacheach of reversed.reverse()) {
          actions = actions.keyUp(eacheach)
        }
        await actions.perform()
      } else {
        await actions.sendKeys(each).perform()
      }
      if (interval) {
        await this.driver.sleep(interval)
      }
    }
  }
  async changeComment (comment, delay, stopMessage) {
    let stop
    let raw_comment = comment
    if (!stopMessage && !this.running) {
      comment = ''
      stop = true
    }
    if (!comment) {
      this.running = false
    }
    let template=`
      window.seleniumComment.get("${this.name}").textContent = \`${comment}\`
    `
    let result = this.driver.executeScript(template)
    if (stop) {
      throw Error('Stop in comment with comment:', raw_comment)
    }
    if (delay) {
      await this.driver.sleep(delay)
    }
  }
  async changeKey (key) {
    let template=`
      window.seleniumKey.get("${this.name}").textContent = \`${key}\`
    `
    let result = this.driver.executeScript(template)
  }
}

let tests = {
  async all () {
    console.log('all')
  },
  async stretch (name) {
    let data, keys, input
    let id = 'stretch'
    let interval = 0
    let app = await driver.findElement({id: 'app'})
    t = new Tester({name, driver, rootSelector: "#stretch"})
    let root = await driver.findElement({id})
    let inputs = await root.findElements({tagName: 'input'})
    debugger

    t.changeComment('test stretch (input and delete)', 500)
    input = inputs[0]
    await input.click()
    await t.sendKeys({keys: '!@#$%^&*()_+<>1234567890-=qwertyuiop[]\'\"', interval})
    keys = [...Array(50).keys()].map(_ => Key.BACK_SPACE)
    await t.sendKeys({keys, interval})
    input = inputs[1]
    await input.click()
    await t.sendKeys({keys: '!@#$%^&*()_+<>1234567890-=qwertyuiop[]\'\"', interval})
    keys = [...Array(30).keys()].map(_ => Key.BACK_SPACE)
    await t.sendKeys({keys, interval})
    input = inputs[2]
    await input.click()
    await t.sendKeys({keys: '!@#$%^&*()_+<>1234567890-=qwertyuiop[]\'\"', interval})
    keys = [...Array(30).keys()].map(_ => Key.BACK_SPACE)
    await t.sendKeys({keys, interval})

    t.changeComment('test tab and shift+tab to go next and previous', 500)
    input = inputs[0]
    await input.click()
    await t.sendKeys({keys: [Key.TAB, Key.TAB], interval: 300, delay: 200})
    await t.sendKeys({keys: [[Key.SHIFT, Key.TAB], [Key.SHIFT, Key.TAB]], interval: 300, delay: 200})

    t.changeComment('click input with text will select all', 500)
    input = inputs[1]
    await input.click()
    await t.sendKeys({keys: [Key.BACK_SPACE], interval: 300, delay: 200})

    input = inputs[2]
    await input.click()
    await t.sendKeys({keys: [Key.BACK_SPACE], interval: 300, delay: 200})

    input = inputs[0]
    await input.click()

    t.changeComment('all done',500)
    t.changeComment('')
  }
}


async function openChrome(url) {
  let browser = 'chrome'
  if (sessionID) {
    driver = await new WebDriver( sessionID, executor )
  } else {
    driver = await new Builder()
      .forBrowser(browser)
      .build()
    sessionID = await driver.getSession()
    sessionID = sessionID.id_
    executor = await driver.getExecutor()
  }
  await driver.get(url)
}
async function createHttpServer(port) {
  let portUsed = await tcpPortUsed.check(port, 'localhost')
  if (!portUsed) {
    http.createServer(function (req, res) {
      let name = req.url.slice(1)
      res.writeHead(200, {
        'Content-Type': 'text/json',
        'Access-Control-Allow-Origin':'*',
        "Access-Control-Allow-Headers":"Authorization,Origin, X-Requested-With, Content-Type, Accept",
        "Access-Control-Allow-Methods":"GET,POST"
      })
      res.write(JSON.stringify({ok: true, data: name}))
      res.end()
      if (req.method === 'GET') {
        console.log('do test:', name)
        if (!(tasks[name] && tasks[name].running)) {
          tests[name](name).then(() => {
            console.log('finish test:', name)
          }).catch(error => {
            if (!error.message.startsWith('Stop')) throw error
          })
        } else {
          console.log('stop test:', name)
          tasks[name].setRunning(false)
        }
      }
    }).listen(port)
    console.log('\tcreate new debug http server at', `http://localhost:${port}`)
  } else {
    console.log('\treuse old debug http server:', `http://localhost:${port}`)
  }
}
class SeleniumTest {
  constructor (options) {
    let defaultOptions = {
    }
    this.options = Object.assign(defaultOptions, options)
  }
  apply (compiler) {
    let options = this.options

    compiler.plugin("compilation", compilation => {
      //console.log("Pre build...");
    })

    compiler.plugin("emit", function (compilation, callback) {
      callback()
      setTimeout(function() {
        let url = compilation.modules.filter(_ => _._identifier).map(_ => _._identifier)[0]
        console.log("\tStart selenium to make test")
        openChrome(`http://localhost:${options.appPort}`)
        createHttpServer(options.seleniumPort)
      }, 2000)
    })
  }

}
if (require.main === module) {
  openChrome(`http://localhost:${options.appPort}`)
  createHttpServer(options.seleniumPort)
}
export default SeleniumTest
