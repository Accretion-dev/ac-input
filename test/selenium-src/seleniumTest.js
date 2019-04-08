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
let driver
let executor, sessionID

const modifierKeys = [
  Key.CTRL,
  Key.ALT,
  Key.SHIFT,
]

async function sendKeys({el, keys, interval, delay}) {
  if (!Array.isArray(keys)) {
    keys = Array.from(keys)
  }
  if (delay){
    await driver.sleep(delay)
  }
  for (let each of keys) {
    let actions = driver.actions()
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
    await driver.sleep(interval)
  }
}

async function changeComment ({id, comment}) {
  let template=`
    let comment = document.querySelector("#${id} span.comment")
    comment.textContent = \`${comment}\`
  `
  driver.executeScript(template)
}

async function testAll () {
  console.log('test all')
}
async function testStretch () {
  let data, keys, input
  let id = 'stretch'
  let interval = 10
  let app = await driver.findElement({id: 'app'})
  let root = await driver.findElement({id})
  let inputs = await root.findElements({tagName: 'input'})
  let comment = await root.findElement(By.css("span.comment"))
  changeComment({id, comment: 'test stretch (input and delete)'}); await driver.sleep(500)
  input = inputs[0]
  await input.click()
  await sendKeys({el: input, keys: '!@#$%^&*()_+<>1234567890-=qwertyuiop[]\'\"', interval})
  keys = [...Array(50).keys()].map(_ => Key.BACK_SPACE)
  await sendKeys({el: input, keys, interval})
  input = inputs[1]
  await input.click()
  await sendKeys({el: input, keys: '!@#$%^&*()_+<>1234567890-=qwertyuiop[]\'\"', interval})
  keys = [...Array(30).keys()].map(_ => Key.BACK_SPACE)
  await sendKeys({el: input, keys, interval})
  input = inputs[2]
  await input.click()
  await sendKeys({el: input, keys: '!@#$%^&*()_+<>1234567890-=qwertyuiop[]\'\"', interval})
  keys = [...Array(30).keys()].map(_ => Key.BACK_SPACE)
  await sendKeys({el: input, keys, interval})

  changeComment({id, comment: 'test tab and shift+tab to go next and previous'}); await driver.sleep(500)
  input = inputs[0]
  await input.click()
  await sendKeys({el: input, keys: [Key.TAB, Key.TAB], interval: 300, delay: 200})
  await sendKeys({el: input, keys: [[Key.SHIFT, Key.TAB], [Key.SHIFT, Key.TAB]], interval: 300, delay: 200})

  changeComment({id, comment: 'click input with text will select all'}); await driver.sleep(500)
  input = inputs[1]
  await input.click()
  await sendKeys({el: input, keys: [Key.BACK_SPACE], interval: 300, delay: 200})

  input = inputs[2]
  await input.click()
  await sendKeys({el: input, keys: [Key.BACK_SPACE], interval: 300, delay: 200})

  input = inputs[0]
  await input.click()

  changeComment({id, comment: 'all done'}); await driver.sleep(500)
  changeComment({id, comment: ''})
}

let tests = {
  testStretch,
  testAll,
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
      let data = req.url.slice(1)
      res.writeHead(200, {
        'Content-Type': 'text/json',
        'Access-Control-Allow-Origin':'*',
        "Access-Control-Allow-Headers":"Authorization,Origin, X-Requested-With, Content-Type, Accept",
        "Access-Control-Allow-Methods":"GET,POST"
      })
      res.write(JSON.stringify({ok: true, data}))
      res.end()
      if (req.method === 'GET') {
        let name = `test${data[0].toUpperCase()}${data.slice(1)}`
        if (name in tests) {
          tests[name]()
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
