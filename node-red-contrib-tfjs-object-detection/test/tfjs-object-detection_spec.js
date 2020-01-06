/* global before, after, afterEach, describe, it */

const helper = require('node-red-node-test-helper')
const objDetect = require('../node/tfjs-object-detection.js')

describe('tfjs-object-detection Node', function () {
  before(function (done) {
    helper.startServer(done)
  })

  after(function (done) {
    helper.stopServer(done)
  })

  afterEach(function () {
    helper.unload()
  })

  it('should be loaded', function (done) {
    const flow = [{ id: 'n1', type: 'tfjs-object-detection', name: 'tfjs object detection' }]

    helper.load(objDetect, flow, function () {
      const n1 = helper.getNode('n1')
      n1.should.have.property('name', 'tfjs object detection')
      done()
    })
  })
})
