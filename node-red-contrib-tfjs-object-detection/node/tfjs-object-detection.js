// called when the runtime loads the node on startup
module.exports = function (RED) {
  let tf = null

  // Initialize the TensorFlow.js library and store it in the Global
  // context to make sure we are running only one instance
  const initTfjs = function (node) {
    const globalContext = node.context().global
    if (!tf) {
      tf = globalContext.get('tfjs')
    }
    if (!tf) {
      tf = require('@tensorflow/tfjs-node')
      globalContext.set('tfjs', tf)
      node.log(`Loaded TensorFlow.js v${tf.version.tfjs}`)
    }
  }

  // called whenever a new instance of the node is created
  // the 'config' argument contains node specific properties set in the editor
  const TFJSObjectDetection = function (config) {
    initTfjs(this)
    const fs = require('fs')
    const cocoSsd = require('@tensorflow-models/coco-ssd')

    RED.nodes.createNode(this, config)
    this.modelUrl = config.modelUrl
    const node = this

    node.status({
      fill: 'yellow',
      shape: 'dot',
      text: 'Loading model...'
    })

    // load the TensorFlow.js COCO-SSD model
    cocoSsd.load({modelUrl: node.modelUrl}).then(model => {
      node.model = model
      node.status({
        fill: 'green',
        shape: 'dot',
        text: 'Model is ready'
      })
      node.log('Coco SSD Model Loaded.')
    })

    // run inference against the input image and return the prediction
    const runPrediction = async function (img, msg) {
      const inputTensor = tf.node.decodeImage(img, 3)
      msg.payload = await node.model.detect(inputTensor)
      msg.shape = inputTensor.shape
      inputTensor.dispose()
      msg.classes = {}
      for (let i = 0; i < msg.payload.length; i++) {
        msg.classes[msg.payload[i].class] = (msg.classes[msg.payload[i].class] || 0) + 1
      }
      node.send(msg)
    }

    // register a listener to the 'input' event
    // which gets called whenever a message arrives at the node
    node.on('input', function (msg) {
      try {
        node.status({
          fill: 'yellow',
          shape: 'dot',
          text: 'running inference...'
        })

        const p = (typeof msg.payload === 'string') ? fs.readFileSync(msg.payload) : msg.payload
        runPrediction(p, msg)
        node.status({})
      } catch (error) {
        node.status({
          fill: 'red',
          shape: 'dot',
          text: ''
        })
        node.error(error, msg)
      }
    })

    node.on('close', function () {
    })
  }

  // register the TensorFlow.js Object Detection node
  RED.nodes.registerType('tfjs-object-detection', TFJSObjectDetection)
}
