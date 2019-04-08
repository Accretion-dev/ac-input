const SeleniumTest = require('./selenium/seleniumTest.js').default
const testConfig = require('./testConfig.json')
module.exports = {
  devServer: {
    port: testConfig.appPort
  },
  configureWebpack: {
    plugins: [
      new SeleniumTest(testConfig),
    ]
  }
}
