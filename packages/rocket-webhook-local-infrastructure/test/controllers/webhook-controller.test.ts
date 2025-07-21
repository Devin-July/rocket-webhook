import { sharedMockBoosterRocketDispatcher, restoreMocks } from '../setup'

import { expect } from 'chai'
import * as express from 'express'
import * as sinon from 'sinon'
import * as request from 'supertest'
import { BoosterMocks } from '../mocks/booster-mocks'
import { WebhookResponseType } from '@boostercloud/rocket-webhook-types'
import { WebhookController } from '../../src/controllers/webhook-controller'
import * as http from '../../src/http'

describe('WebhookController', () => {
  let app: express.Application
  let controller: WebhookController
  let requestFailedStub: sinon.SinonStub

  beforeEach(() => {
    app = express()
    controller = new WebhookController('test-endpoint')
    app.use(controller.router)
    
    sharedMockBoosterRocketDispatcher.reset()
    requestFailedStub = sinon.stub(http, 'requestFailed')
  })

  afterEach(() => {
    sharedMockBoosterRocketDispatcher.reset()
    sinon.restore()
  })

  after(() => {
    restoreMocks()
  })

  describe('Route Registration', () => {
    it('should register POST route for specified endpoint', async () => {
      const successResponse = BoosterMocks.createSuccessResponse()
      sharedMockBoosterRocketDispatcher.resolves(successResponse)

      const response = await request(app)
        .post('/test-endpoint')
        .send('test data')

      expect(response.status).to.equal(200)
      expect(sharedMockBoosterRocketDispatcher.calledOnce).to.be.true
    })

    it('should register GET route for specified endpoint', async () => {
      const successResponse = BoosterMocks.createSuccessResponse()
      sharedMockBoosterRocketDispatcher.resolves(successResponse)

      const response = await request(app)
        .get('/test-endpoint')

      expect(response.status).to.equal(200)
      expect(sharedMockBoosterRocketDispatcher.calledOnce).to.be.true
    })

    it('should use express.raw() middleware', async () => {
      const successResponse = BoosterMocks.createSuccessResponse()
      sharedMockBoosterRocketDispatcher.resolves(successResponse)

      const testData = 'raw test data'
      const response = await request(app)
        .post('/test-endpoint')
        .set('Content-Type', 'application/octet-stream')
        .send(testData)

      expect(response.status).to.equal(200)
      const requestArg = sharedMockBoosterRocketDispatcher.getCall(0).args[0] as any
      expect(requestArg.req.body).to.exist
    })
  })

  describe('Request Processing Pipeline', () => {
    it('should construct request object with rocketFunctionIDEnvVar and functionID', async () => {
      const successResponse = BoosterMocks.createSuccessResponse()
      sharedMockBoosterRocketDispatcher.resolves(successResponse)

      await request(app)
        .post('/test-endpoint')
        .send('test data')

      const requestArg = sharedMockBoosterRocketDispatcher.getCall(0).args[0] as any
      expect(requestArg).to.be.an('object')
      expect(requestArg).to.have.property('req')
      expect(requestArg.req).to.have.property('method', 'POST')
      expect(requestArg.req).to.have.property('url', '/test-endpoint')
    })

    it('should integrate with boosterRocketDispatcher', async () => {
      const successResponse = BoosterMocks.createSuccessResponse('test response')
      sharedMockBoosterRocketDispatcher.resolves(successResponse)

      const response = await request(app)
        .post('/test-endpoint')
        .send('test data')

      expect(sharedMockBoosterRocketDispatcher.calledOnce).to.be.true
      expect(response.status).to.equal(200)
      expect(response.text).to.equal('test response')
    })
  })

  describe('Response Type Handling', () => {
    it('should handle file responses with streams', async () => {
      const fileBuffer = Buffer.from('file content')
      const fileResponse = BoosterMocks.createFileResponse(fileBuffer, 'test.txt')
      sharedMockBoosterRocketDispatcher.resolves(fileResponse)

      const response = await request(app)
        .post('/test-endpoint')
        .send('test data')

      expect(response.status).to.equal(200)
      expect(response.text || response.body.toString()).to.include('file content')
      expect(response.headers['content-type']).to.equal('file')
      expect(response.headers['content-disposition']).to.equal('attachment; filename="test.txt"')
    })

    it('should handle JSON responses', async () => {
      const jsonData = { message: 'test', data: [1, 2, 3] }
      const jsonResponse = BoosterMocks.createJsonResponse(jsonData)
      sharedMockBoosterRocketDispatcher.resolves(jsonResponse)

      const response = await request(app)
        .post('/test-endpoint')
        .send('test data')

      expect(response.status).to.equal(200)
      expect(response.body).to.deep.equal(jsonData)
      expect(response.headers['content-type']).to.include('application/json')
    })

    it('should handle text responses', async () => {
      const textResponse = BoosterMocks.createSuccessResponse('plain text response', WebhookResponseType.text)
      sharedMockBoosterRocketDispatcher.resolves(textResponse)

      const response = await request(app)
        .post('/test-endpoint')
        .send('test data')

      expect(response.status).to.equal(200)
      expect(response.text).to.equal('plain text response')
      expect(response.headers['content-type']).to.include('text/plain')
    })
  })

  describe('Header Management', () => {
    it('should propagate headers from webhook response to Express response', async () => {
      const customHeaders = {
        'X-Custom-Header': 'custom-value',
        'X-Another-Header': 'another-value'
      }
      const successResponse = BoosterMocks.createSuccessResponse('test', WebhookResponseType.text, customHeaders)
      sharedMockBoosterRocketDispatcher.resolves(successResponse)

      const response = await request(app)
        .post('/test-endpoint')
        .send('test data')

      expect(response.status).to.equal(200)
      expect(response.headers['x-custom-header']).to.equal('custom-value')
      expect(response.headers['x-another-header']).to.equal('another-value')
    })

    it('should set Content-Type header correctly', async () => {
      const jsonData = { message: 'test' }
      const jsonResponse = BoosterMocks.createJsonResponse(jsonData)
      sharedMockBoosterRocketDispatcher.resolves(jsonResponse)

      const response = await request(app)
        .post('/test-endpoint')
        .send('test data')

      expect(response.headers['content-type']).to.include('application/json')
      expect(response.body).to.deep.equal(jsonData)
    })
  })

  describe('Error Handling', () => {
    it('should catch exceptions and call requestFailed', async () => {
      const error = new Error('Test error')
      sharedMockBoosterRocketDispatcher.rejects(error)
      requestFailedStub.resolves()

      await request(app)
        .post('/test-endpoint')
        .send('test data')

      expect(requestFailedStub.calledOnce).to.be.true
      expect(requestFailedStub.calledWith(error)).to.be.true
    })

    it('should call Express error middleware on exception', (done) => {
      const error = new Error('Test error')
      sharedMockBoosterRocketDispatcher.rejects(error)
      requestFailedStub.resolves()

      app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        expect(err).to.equal(error)
        done()
      })

      request(app)
        .post('/test-endpoint')
        .send('test data')
        .end(() => {})
    })

    it('should handle error responses from boosterRocketDispatcher', async () => {
      const error = new Error('Webhook processing failed')
      const errorResponse = BoosterMocks.createErrorResponse(error)
      sharedMockBoosterRocketDispatcher.resolves(errorResponse)

      const response = await request(app)
        .post('/test-endpoint')
        .send('test data')

      expect(response.status).to.equal(errorResponse.status)
      expect(response.body).to.deep.equal(errorResponse.body)
    })
  })

  describe('Success Response Detection', () => {
    it('should correctly identify success responses', async () => {
      const successResponse = BoosterMocks.createSuccessResponse('success')
      sharedMockBoosterRocketDispatcher.resolves(successResponse)

      const response = await request(app)
        .post('/test-endpoint')
        .send('test data')

      expect(response.status).to.equal(200)
      expect(response.text).to.equal('success')
    })

    it('should correctly handle non-success responses', async () => {
      const errorResponse = BoosterMocks.createErrorResponse(new Error('Not found'))
      sharedMockBoosterRocketDispatcher.resolves(errorResponse)

      const response = await request(app)
        .post('/test-endpoint')
        .send('test data')

      expect(response.status).to.equal(errorResponse.status)
      expect(response.body).to.deep.equal(errorResponse.body)
    })
  })

  describe('Express Router Integration', () => {
    it('should create Express router instance', () => {
      expect(controller.router).to.be.a('function')
      expect(controller.router).to.have.property('use')
      expect(controller.router).to.have.property('get')
      expect(controller.router).to.have.property('post')
    })

    it('should bind handleWebhook method correctly', async () => {
      const successResponse = BoosterMocks.createSuccessResponse()
      sharedMockBoosterRocketDispatcher.resolves(successResponse)

      await request(app)
        .post('/test-endpoint')
        .send('test data')

      expect(sharedMockBoosterRocketDispatcher.calledOnce).to.be.true
    })
  })
})
