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
let driver
let executor, sessionID

async function doTest(driver) {
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
  await doTest(driver)
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

export default SeleniumTest
