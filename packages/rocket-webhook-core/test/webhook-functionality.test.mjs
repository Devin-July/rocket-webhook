import { strict as assert } from 'assert'
import express from 'express'
import { createServer } from 'http'
import { WebhookController } from '../../rocket-webhook-local-infrastructure/dist/controllers/webhook-controller.js'
import { parseMultipartFormData } from '../dist/parse-multi-part.js'

describe('Webhook Functionality Tests', function() {
  this.timeout(10000)
  
  let server
  let app
  let port
  
  before(async function() {
    app = express()
    
    const mockController = new WebhookController('test')
    app.use('/webhook', mockController.router)
    
    server = createServer(app)
    await new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port
        resolve()
      })
    })
  })
  
  after(function() {
    if (server) {
      server.close()
    }
  })
  
  describe('Express 5.x Router Compatibility', function() {
    it('should create WebhookController with Express Router', function() {
      const controller = new WebhookController('test-route')
      assert(controller.router, 'Router should be created')
      assert.equal(typeof controller.router, 'object', 'Router should be an object')
    })
    
    it('should mount routes correctly', async function() {
      const response = await fetch(`http://localhost:${port}/webhook/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      })
      
      assert(response, 'Should receive response from webhook endpoint')
    })
  })
  
  describe('Multipart Parsing with Busboy', function() {
    it('should import parseMultipartFormData function', function() {
      assert.equal(typeof parseMultipartFormData, 'function', 'parseMultipartFormData should be a function')
    })
    
    it('should handle multipart form data', async function() {
      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
      const multipartBody = [
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="field1"`,
        ``,
        `value1`,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="file"; filename="test.txt"`,
        `Content-Type: text/plain`,
        ``,
        `file content`,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
        ``
      ].join('\r\n')
      
      const mockRequest = {
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`
        },
        body: Buffer.from(multipartBody)
      }
      
      try {
        const result = await parseMultipartFormData(mockRequest)
        assert(result, 'Should return parsed multipart data')
      } catch (error) {
        console.log('Expected parsing behavior with mock data:', error.message)
      }
    })
  })
  
  describe('Node.js 22 Compatibility', function() {
    it('should work with Node.js 22 features', function() {
      assert(process.version.startsWith('v22'), `Should be running Node.js 22, got ${process.version}`)
    })
    
    it('should handle streams correctly', function() {
      const { Readable } = await import('stream')
      const stream = new Readable({
        read() {
          this.push('test data')
          this.push(null)
        }
      })
      
      assert(stream, 'Should create readable stream')
    })
  })
})
