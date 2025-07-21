import express from 'express'
import { createServer } from 'http'

console.log('🧪 Testing Express 5.x Router Compatibility...')
console.log(`Node.js version: ${process.version}`)
console.log(`Express version: ${express.version || 'unknown'}`)

async function testExpressRouter() {
  console.log('\n1. Testing Express Router creation...')
  
  try {
    const router = express.Router()
    console.log('✅ Express Router created successfully')
    console.log(`✅ Router type: ${typeof router}`)
    
    router.get('/test', (req, res) => {
      res.json({ message: 'GET test successful', timestamp: new Date().toISOString() })
    })
    
    router.post('/test', express.raw(), (req, res) => {
      res.json({ 
        message: 'POST test successful', 
        bodyLength: req.body?.length || 0,
        contentType: req.headers['content-type'],
        timestamp: new Date().toISOString()
      })
    })
    
    console.log('✅ Routes configured successfully')
    return router
  } catch (error) {
    console.error('❌ Router creation failed:', error.message)
    return null
  }
}

async function testExpressApp(router) {
  console.log('\n2. Testing Express App with Router...')
  
  try {
    const app = express()
    app.use('/webhook', router)
    
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy',
        nodeVersion: process.version,
        expressVersion: express.version || 'unknown',
        timestamp: new Date().toISOString()
      })
    })
    
    console.log('✅ Express app created and router mounted')
    return app
  } catch (error) {
    console.error('❌ Express app setup failed:', error.message)
    return null
  }
}

async function testServerStartup(app) {
  console.log('\n3. Testing server startup...')
  
  return new Promise((resolve, reject) => {
    const server = createServer(app)
    
    server.listen(0, () => {
      const port = server.address().port
      console.log(`✅ Server started on port ${port}`)
      
      setTimeout(() => {
        server.close(() => {
          console.log('✅ Server closed successfully')
          resolve({ success: true, port })
        })
      }, 1000)
    })
    
    server.on('error', (error) => {
      console.error('❌ Server startup failed:', error.message)
      reject(error)
    })
  })
}

async function testHttpRequests() {
  console.log('\n4. Testing HTTP requests to Express 5.x server...')
  
  const app = express()
  const router = express.Router()
  
  router.get('/test', (req, res) => {
    res.json({ 
      message: 'GET request successful',
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type']
      },
      timestamp: new Date().toISOString()
    })
  })
  
  router.post('/test', express.raw(), (req, res) => {
    res.json({ 
      message: 'POST request successful',
      bodyLength: req.body?.length || 0,
      contentType: req.headers['content-type'],
      timestamp: new Date().toISOString()
    })
  })
  
  app.use('/webhook', router)
  
  return new Promise((resolve, reject) => {
    const server = createServer(app)
    
    server.listen(0, async () => {
      const port = server.address().port
      console.log(`✅ Test server started on port ${port}`)
      
      try {
        console.log('  Testing GET request...')
        const getResponse = await fetch(`http://localhost:${port}/webhook/test?param=value`, {
          headers: { 'User-Agent': 'express-test-client' }
        })
        const getData = await getResponse.json()
        console.log('  ✅ GET request successful:', getData.message)
        
        console.log('  Testing POST request...')
        const postResponse = await fetch(`http://localhost:${port}/webhook/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'data' })
        })
        const postData = await postResponse.json()
        console.log('  ✅ POST request successful:', postData.message)
        
        server.close(() => {
          console.log('✅ Test server closed')
          resolve(true)
        })
      } catch (error) {
        console.error('  ❌ HTTP request failed:', error.message)
        server.close(() => {
          reject(error)
        })
      }
    })
    
    server.on('error', reject)
  })
}

async function testMiddleware() {
  console.log('\n5. Testing Express 5.x middleware compatibility...')
  
  try {
    const app = express()
    
    app.use(express.json())
    app.use(express.raw())
    app.use(express.urlencoded({ extended: true }))
    
    console.log('✅ Built-in middleware attached successfully')
    
    app.use((req, res, next) => {
      req.customProperty = 'test-value'
      next()
    })
    
    console.log('✅ Custom middleware attached successfully')
    
    return true
  } catch (error) {
    console.error('❌ Middleware test failed:', error.message)
    return false
  }
}

async function runExpressTests() {
  console.log('🚀 Starting Express 5.x compatibility tests...')
  console.log('=' .repeat(60))
  
  const results = {
    router: false,
    app: false,
    server: false,
    requests: false,
    middleware: false
  }
  
  try {
    const router = await testExpressRouter()
    results.router = !!router
    
    if (router) {
      const app = await testExpressApp(router)
      results.app = !!app
      
      if (app) {
        try {
          await testServerStartup(app)
          results.server = true
        } catch (error) {
          console.error('Server test failed:', error.message)
        }
      }
    }
    
    try {
      await testHttpRequests()
      results.requests = true
    } catch (error) {
      console.error('HTTP requests test failed:', error.message)
    }
    
    results.middleware = await testMiddleware()
    
  } catch (error) {
    console.error('❌ Express tests failed:', error.message)
  }
  
  console.log('\n📊 Express 5.x Test Results:')
  console.log('=' .repeat(60))
  
  let passed = 0
  let total = 0
  
  for (const [test, result] of Object.entries(results)) {
    total++
    if (result) passed++
    console.log(`${result ? '✅' : '❌'} ${test.toUpperCase()}: ${result ? 'PASSED' : 'FAILED'}`)
  }
  
  console.log(`\n🎯 Express Tests: ${passed}/${total} passed`)
  
  if (passed === total) {
    console.log('🎉 All Express 5.x tests PASSED!')
    console.log('✅ Express 5.x router and middleware compatibility confirmed')
  } else {
    console.log('⚠️  Some Express tests failed')
  }
  
  return passed === total
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runExpressTests().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('❌ Express test runner failed:', error)
    process.exit(1)
  })
}

export { runExpressTests }
