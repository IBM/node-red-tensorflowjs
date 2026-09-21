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
    this.timeout(20000)
    const flow = [{ id: 'n1', type: 'tfjs-object-detection', name: 'tfjs object detection' }]

    helper.load(objDetect, flow, function () {
      const n1 = helper.getNode('n1')
      n1.should.have.property('name', 'tfjs object detection')
      done()
    })
  })

  it('should process input and run object detection inference', function (done) {
    this.timeout(30000)
    const tf = require('@tensorflow/tfjs-node')
    const flow = [
      { id: 'n1', type: 'tfjs-object-detection', name: 'tfjs object detection', wires: [['n2']] },
      { id: 'n2', type: 'helper' }
    ]

    helper.load(objDetect, flow, function () {
      const n1 = helper.getNode('n1')
      const n2 = helper.getNode('n2')

      n2.on('input', function (msg) {
        try {
          msg.should.have.property('payload')
          msg.should.have.property('classes')
          Array.isArray(msg.payload).should.be.true()
          done()
        } catch (err) {
          done(err)
        }
      })

      // Wait for model to load, then send 3-channel image buffer encoded as PNG/raw
      const checkReadyAndSend = function () {
        if (n1.model) {
          const tensor = tf.zeros([64, 64, 3], 'int32')
          tf.node.encodePng(tensor).then(buf => {
            tensor.dispose()
            n1.receive({ payload: buf })
          }).catch(done)
        } else {
          setTimeout(checkReadyAndSend, 200)
        }
      }
      checkReadyAndSend()
    })
  })
})
