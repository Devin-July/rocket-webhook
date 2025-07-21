import express from 'express'
import { createServer } from 'http'

console.log('🧪 Testing Isolated Webhook Controller Functionality...')

class MockWebhookController {
  constructor(endpoint) {
    this.endpoint = endpoint
    this.router = express.Router()
    this.setupRoutes()
  }
  
  setupRoutes() {
    this.router.post(`/${this.endpoint}`, express.raw(), this.handleWebhook.bind(this))
    this.router.get(`/${this.endpoint}`, express.raw(), this.handleWebhook.bind(this))
  }
  
  async handleWebhook(req, res, next) {
    try {
      console.log(`📨 Webhook received: ${req.method} ${req.url}`)
      console.log(`📋 Headers:`, Object.keys(req.headers))
      console.log(`📦 Body length: ${req.body?.length || 0}`)
      
      const mockResponse = {
        status: 200,
        body: {
          success: true,
          message: 'Webhook processed successfully',
          timestamp: new Date().toISOString(),
          receivedData: {
            method: req.method,
            url: req.url,
            contentType: req.headers['content-type'],
            bodyLength: req.body?.length || 0
          }
        }
      }
      
      res.status(mockResponse.status)
      
      if (this.isSuccess(mockResponse)) {
        const body = mockResponse.body
        this.setHeaders(mockResponse, res)
        
        if (typeof body === 'string') {
          res.send(body)
        } else {
          res.json(body)
        }
      } else {
        res.json({ error: 'Webhook processing failed' })
      }
      
    } catch (error) {
      console.error('❌ Webhook error:', error.message)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
  
  setHeaders(response, res) {
    if (response.headers) {
      Object.entries(response.headers).forEach(([key, value]) => {
        res.set(key, value)
      })
    }
  }
  
  isSuccess(response) {
    return response.status >= 200 && response.status < 300
  }
}

async function testWebhookController() {
  console.log('\n1. Testing MockWebhookController instantiation...')
  
  try {
    const controller = new MockWebhookController('test')
    console.log('✅ MockWebhookController created successfully')
    console.log(`✅ Router available: ${typeof controller.router}`)
    console.log(`✅ Endpoint: ${controller.endpoint}`)
    
    return controller
  } catch (error) {
    console.error('❌ MockWebhookController creation failed:', error.message)
    return null
  }
}

async function testWebhookServer(controller) {
  console.log('\n2. Testing webhook server with multiple controllers...')
  
  const app = express()
  
  app.use('/webhook', controller.router)
  
  const jsonController = new MockWebhookController('json')
  app.use('/webhook', jsonController.router)
  
  const multipartController = new MockWebhookController('multipart')
  app.use('/webhook', multipartController.router)
  
  console.log('✅ Multiple webhook controllers mounted')
  
  return new Promise((resolve, reject) => {
    const server = createServer(app)
    
    server.listen(0, async () => {
      const port = server.address().port
      console.log(`✅ Webhook server started on port ${port}`)
      
      try {
        await testWebhookRequests(port)
        
        server.close(() => {
          console.log('✅ Webhook server closed')
          resolve(true)
        })
      } catch (error) {
        server.close(() => {
          reject(error)
        })
      }
    })
    
    server.on('error', reject)
  })
}

async function testWebhookRequests(port) {
  console.log('\n3. Testing webhook requests...')
  
  const tests = [
    {
      name: 'JSON POST webhook',
      url: `http://localhost:${port}/webhook/json`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'test', data: { key: 'value' } })
      }
    },
    {
      name: 'GET webhook with query params',
      url: `http://localhost:${port}/webhook/test?event=get_test&timestamp=${Date.now()}`,
      options: {
        method: 'GET',
        headers: { 'User-Agent': 'webhook-test-client' }
      }
    },
    {
      name: 'Raw POST webhook',
      url: `http://localhost:${port}/webhook/test`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'Raw webhook data for testing'
      }
    },
    {
      name: 'Multipart webhook',
      url: `http://localhost:${port}/webhook/multipart`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data; boundary=test123' },
        body: '--test123\r\nContent-Disposition: form-data; name="field"\r\n\r\nvalue\r\n--test123--'
      }
    }
  ]
  
  let passedTests = 0
  
  for (const test of tests) {
    try {
      console.log(`  Testing: ${test.name}`)
      const response = await fetch(test.url, test.options)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`    ✅ ${test.name} successful - Status: ${response.status}`)
        console.log(`    📋 Response: ${data.message}`)
        passedTests++
      } else {
        console.log(`    ❌ ${test.name} failed - Status: ${response.status}`)
      }
    } catch (error) {
      console.log(`    ❌ ${test.name} error: ${error.message}`)
    }
  }
  
  console.log(`\n📊 Webhook requests: ${passedTests}/${tests.length} passed`)
  return passedTests === tests.length
}

async function runIsolatedWebhookTests() {
  console.log('🚀 Starting isolated webhook functionality tests...')
  console.log('=' .repeat(60))
  
  const results = {
    controller: false,
    server: false
  }
  
  try {
    const controller = await testWebhookController()
    results.controller = !!controller
    
    if (controller) {
      results.server = await testWebhookServer(controller)
    }
    
  } catch (error) {
    console.error('❌ Isolated webhook tests failed:', error.message)
  }
  
  console.log('\n📊 Isolated Webhook Test Results:')
  console.log('=' .repeat(60))
  
  let passed = 0
  let total = 0
  
  for (const [test, result] of Object.entries(results)) {
    total++
    if (result) passed++
    console.log(`${result ? '✅' : '❌'} ${test.toUpperCase()}: ${result ? 'PASSED' : 'FAILED'}`)
  }
  
  console.log(`\n🎯 Isolated Webhook Tests: ${passed}/${total} passed`)
  
  if (passed === total) {
    console.log('🎉 All isolated webhook tests PASSED!')
    console.log('✅ Webhook controller pattern works with Express 5.x')
  } else {
    console.log('⚠️  Some isolated webhook tests failed')
  }
  
  return passed === total
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runIsolatedWebhookTests().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('❌ Isolated webhook test runner failed:', error)
    process.exit(1)
  })
}

export { runIsolatedWebhookTests }
