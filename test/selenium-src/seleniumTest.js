import http from 'http'
import chromedriver from 'chromedriver'
import webdriver from 'selenium-webdriver'
let driver

async function doTest(driver) {

}

async function openChrome(url) {
  driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build()
  driver.get(url)
  await doTest(driver)
}
async function createHttpServer(port) {
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
        console.log("Start selenium to make test")
        openChrome(`http://localhost:${options.appPort}`)
        createHttpServer(options.seleniumPort)
      }, 2000)
    })
  }

}

export default SeleniumTest
