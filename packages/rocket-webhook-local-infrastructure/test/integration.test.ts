import { sharedMockBoosterRocketDispatcher, restoreMocks } from './setup'

import { expect } from 'chai'
import * as express from 'express'
import * as sinon from 'sinon'
import * as request from 'supertest'
import { Infra } from '../src/infra'
import { BoosterMocks } from './mocks/booster-mocks'
import { WebhookParams, AllowedHttpMethod, WebhookHandlerClassInterface, functionID } from '@boostercloud/rocket-webhook-types'
import { BoosterConfig, rocketFunctionIDEnvVar } from '@boostercloud/framework-types'

describe('Integration Tests', () => {
  let app: express.Application
  let router: express.Router
  let mockConfig: BoosterConfig

  beforeEach(() => {
    app = express()
    router = express.Router()
    app.use(router)
    mockConfig = {} as BoosterConfig
    
    sharedMockBoosterRocketDispatcher.reset()
  })

  afterEach(() => {
    sharedMockBoosterRocketDispatcher.reset()
    sinon.restore()
  })

  after(() => {
    restoreMocks()
  })

  describe('Complete Request-Response Pipeline', () => {
    it('should handle end-to-end webhook processing', async () => {
      const mockHandlerClass = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface
      const params: WebhookParams = [
        {
          route: 'e2e-test',
          handlerClass: mockHandlerClass,
          allowedMethods: [AllowedHttpMethod.POST]
        }
      ]

      const successResponse = BoosterMocks.createSuccessResponse('E2E Success')
      sharedMockBoosterRocketDispatcher.resolves(successResponse)

      Infra.mountStack(params, mockConfig, router)

      const response = await request(app)
        .post('/e2e-test')
        .send('test payload')

      expect(response.status).to.equal(200)
      expect(response.text).to.equal('E2E Success')
      expect(sharedMockBoosterRocketDispatcher.calledOnce).to.be.true
    })

    it('should handle multiple webhook endpoints simultaneously', async () => {
      const mockHandlerClass1 = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface
      const mockHandlerClass2 = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface

      const params: WebhookParams = [
        {
          route: 'webhook-1',
          handlerClass: mockHandlerClass1,
          allowedMethods: [AllowedHttpMethod.POST]
        },
        {
          route: 'webhook-2',
          handlerClass: mockHandlerClass2,
          allowedMethods: [AllowedHttpMethod.GET]
        }
      ]

      const response1 = BoosterMocks.createSuccessResponse('Response 1')
      const response2 = BoosterMocks.createJsonResponse({ message: 'Response 2' })
      
      sharedMockBoosterRocketDispatcher.onFirstCall().resolves(response1)
      sharedMockBoosterRocketDispatcher.onSecondCall().resolves(response2)

      Infra.mountStack(params, mockConfig, router)

      const [result1, result2] = await Promise.all([
        request(app).post('/webhook-1').send('payload 1'),
        request(app).get('/webhook-2')
      ])

      expect(result1.status).to.equal(200)
      expect(result1.text).to.equal('Response 1')
      
      expect(result2.status).to.equal(200)
      expect(result2.body).to.deep.equal({ message: 'Response 2' })
      
      expect(sharedMockBoosterRocketDispatcher.calledTwice).to.be.true
    })

    it('should handle file upload and download pipeline', async () => {
      const mockHandlerClass = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface
      const params: WebhookParams = [
        {
          route: 'file-webhook',
          handlerClass: mockHandlerClass,
          allowedMethods: [AllowedHttpMethod.POST]
        }
      ]

      const fileBuffer = Buffer.from('test file content')
      const fileResponse = BoosterMocks.createFileResponse(fileBuffer, 'download.txt', 'text/plain')
      sharedMockBoosterRocketDispatcher.resolves(fileResponse)

      Infra.mountStack(params, mockConfig, router)

      const response = await request(app)
        .post('/file-webhook')
        .attach('file', Buffer.from('uploaded file'), 'upload.txt')
        .buffer(true)
        .parse((res, callback) => {
          let data = Buffer.alloc(0)
          res.on('data', (chunk) => {
            data = Buffer.concat([data, chunk])
          })
          res.on('end', () => {
            callback(null, data)
          })
        })

      expect(response.status).to.equal(200)
      expect(response.body).to.deep.equal(fileBuffer)
      expect(response.headers['content-type']).to.equal('file')
      expect(response.headers['content-disposition']).to.equal('attachment; filename="download.txt"')
    })
  })

  describe('Framework Integration', () => {
    it('should integrate with Booster framework components', async () => {
      const mockHandlerClass = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface
      const params: WebhookParams = [
        {
          route: 'framework-test',
          handlerClass: mockHandlerClass
        }
      ]

      const successResponse = BoosterMocks.createSuccessResponse('Framework Integration')
      sharedMockBoosterRocketDispatcher.resolves(successResponse)

      Infra.mountStack(params, mockConfig, router)

      const response = await request(app)
        .post('/framework-test')
        .send('framework payload')

      expect(response.status).to.equal(200)
      expect(sharedMockBoosterRocketDispatcher.calledOnce).to.be.true

      const requestArg = sharedMockBoosterRocketDispatcher.getCall(0).args[0] as any
      expect(requestArg).to.have.property(rocketFunctionIDEnvVar)
      expect(requestArg[rocketFunctionIDEnvVar]).to.equal(functionID)
    })

    it('should handle framework peer dependencies correctly', async () => {
      const mockHandlerClass = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface
      const params: WebhookParams = [
        {
          route: 'peer-deps-test',
          handlerClass: mockHandlerClass
        }
      ]

      const successResponse = BoosterMocks.createSuccessResponse('Peer Dependencies OK')
      sharedMockBoosterRocketDispatcher.resolves(successResponse)

      Infra.mountStack(params, mockConfig, router)

      const response = await request(app)
        .post('/peer-deps-test')
        .send('test')

      expect(response.status).to.equal(200)
      expect(response.text).to.equal('Peer Dependencies OK')
    })
  })

  describe('Express.js 4.21.1 Compatibility', () => {
    it('should work with Express.js router functionality', async () => {
      const mockHandlerClass = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface
      const params: WebhookParams = [
        {
          route: 'express-compat',
          handlerClass: mockHandlerClass
        }
      ]

      const successResponse = BoosterMocks.createSuccessResponse('Express Compatible')
      sharedMockBoosterRocketDispatcher.resolves(successResponse)

      Infra.mountStack(params, mockConfig, router)

      expect(router).to.be.a('function')
      expect(router).to.have.property('use')

      const response = await request(app)
        .post('/express-compat')
        .send('express test')

      expect(response.status).to.equal(200)
      expect(response.text).to.equal('Express Compatible')
    })

    it('should handle Express middleware correctly', async () => {
      const mockHandlerClass = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface
      const params: WebhookParams = [
        {
          route: 'middleware-test',
          handlerClass: mockHandlerClass
        }
      ]

      const successResponse = BoosterMocks.createSuccessResponse('Middleware OK')
      sharedMockBoosterRocketDispatcher.resolves(successResponse)

      app.use(express.json())
      Infra.mountStack(params, mockConfig, router)

      const response = await request(app)
        .post('/middleware-test')
        .send({ test: 'data' })

      expect(response.status).to.equal(200)
      expect(response.text).to.equal('Middleware OK')
    })
  })

  describe('Error Scenarios', () => {
    it('should handle dispatcher errors gracefully', async () => {
      const mockHandlerClass = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface
      const params: WebhookParams = [
        {
          route: 'error-test',
          handlerClass: mockHandlerClass
        }
      ]

      const error = new Error('Dispatcher failed')
      sharedMockBoosterRocketDispatcher.rejects(error)

      Infra.mountStack(params, mockConfig, router)

      await request(app)
        .post('/error-test')
        .send('test')

      expect(sharedMockBoosterRocketDispatcher.calledOnce).to.be.true
    })

    it('should handle malformed requests', async () => {
      const mockHandlerClass = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface
      const params: WebhookParams = [
        {
          route: 'malformed-test',
          handlerClass: mockHandlerClass
        }
      ]

      const successResponse = BoosterMocks.createSuccessResponse('Handled malformed')
      sharedMockBoosterRocketDispatcher.resolves(successResponse)

      Infra.mountStack(params, mockConfig, router)

      const response = await request(app)
        .post('/malformed-test')
        .send('invalid json {')

      expect(response.status).to.equal(200)
    })
  })

  describe('Performance and Concurrency', () => {
    it('should handle concurrent requests', async () => {
      const mockHandlerClass = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface
      const params: WebhookParams = [
        {
          route: 'concurrent-test',
          handlerClass: mockHandlerClass
        }
      ]

      const successResponse = BoosterMocks.createSuccessResponse('Concurrent OK')
      sharedMockBoosterRocketDispatcher.resolves(successResponse)

      Infra.mountStack(params, mockConfig, router)

      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/concurrent-test')
          .send(`request ${i}`)
      )

      const responses = await Promise.all(requests)

      responses.forEach(response => {
        expect(response.status).to.equal(200)
        expect(response.text).to.equal('Concurrent OK')
      })

      expect(sharedMockBoosterRocketDispatcher.callCount).to.equal(5)
    })
  })
})
