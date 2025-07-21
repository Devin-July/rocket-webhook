import { expect } from 'chai'
import * as express from 'express'
import * as sinon from 'sinon'
import { Infra } from '../src/infra'
import { WebhookParams, AllowedHttpMethod, WebhookHandlerClassInterface } from '@boostercloud/rocket-webhook-types'
import { BoosterConfig } from '@boostercloud/framework-types'

describe('Infra', () => {
  let router: express.Router
  let mockConfig: BoosterConfig
  let routerUseSpy: sinon.SinonSpy

  beforeEach(() => {
    router = express.Router()
    routerUseSpy = sinon.spy(router, 'use')
    mockConfig = {} as BoosterConfig
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('mountStack', () => {
    it('should mount single webhook route', () => {
      const mockHandlerClass = {
        handle: sinon.stub()
      } as unknown as WebhookHandlerClassInterface

      const params: WebhookParams = [
        {
          route: 'test-webhook',
          handlerClass: mockHandlerClass,
          allowedMethods: [AllowedHttpMethod.POST]
        }
      ]

      Infra.mountStack(params, mockConfig, router)

      expect(routerUseSpy.calledOnce).to.be.true
      expect(routerUseSpy.calledWith('/')).to.be.true
    })

    it('should mount multiple webhook routes', () => {
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
          allowedMethods: [AllowedHttpMethod.GET, AllowedHttpMethod.POST]
        }
      ]

      Infra.mountStack(params, mockConfig, router)

      expect(routerUseSpy.calledTwice).to.be.true
      expect(routerUseSpy.alwaysCalledWith('/')).to.be.true
    })

    it('should handle route parameter processing via getRoute', () => {
      const mockHandlerClass = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface

      const params: WebhookParams = [
        {
          route: 'custom-route',
          handlerClass: mockHandlerClass
        }
      ]

      Infra.mountStack(params, mockConfig, router)

      expect(routerUseSpy.calledOnce).to.be.true
    })

    it('should handle deprecated origin parameter', () => {
      const mockHandlerClass = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface

      const params: WebhookParams = [
        {
          origin: 'legacy-webhook',
          handlerClass: mockHandlerClass
        }
      ]

      Infra.mountStack(params, mockConfig, router)

      expect(routerUseSpy.calledOnce).to.be.true
    })

    it('should prioritize route over origin parameter', () => {
      const mockHandlerClass = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface

      const params: WebhookParams = [
        {
          route: 'new-route',
          origin: 'old-route',
          handlerClass: mockHandlerClass
        }
      ]

      Infra.mountStack(params, mockConfig, router)

      expect(routerUseSpy.calledOnce).to.be.true
    })

    it('should handle empty params array', () => {
      const params: WebhookParams = []

      Infra.mountStack(params, mockConfig, router)

      expect(routerUseSpy.notCalled).to.be.true
    })

    it('should handle complex webhook configurations', () => {
      const mockHandlerClass = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface

      const params: WebhookParams = [
        {
          route: 'complex-webhook',
          handlerClass: mockHandlerClass,
          allowedMethods: [AllowedHttpMethod.GET, AllowedHttpMethod.POST],
          authorize: 'all',
          multiPartConfig: {
            limits: {
              fileSize: 1024 * 1024,
              files: 5
            }
          }
        }
      ]

      Infra.mountStack(params, mockConfig, router)

      expect(routerUseSpy.calledOnce).to.be.true
    })
  })

  describe('Express Router Integration', () => {
    it('should integrate with Express Router correctly', () => {
      const mockHandlerClass = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface
      const params: WebhookParams = [
        {
          route: 'integration-test',
          handlerClass: mockHandlerClass
        }
      ]

      expect(() => {
        Infra.mountStack(params, mockConfig, router)
      }).to.not.throw()

      expect(routerUseSpy.calledOnce).to.be.true
    })

    it('should pass router instance to WebhookController', () => {
      const mockHandlerClass = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface
      const params: WebhookParams = [
        {
          route: 'router-test',
          handlerClass: mockHandlerClass
        }
      ]

      Infra.mountStack(params, mockConfig, router)

      const callArgs = routerUseSpy.getCall(0).args
      expect(callArgs[0]).to.equal('/')
      expect(callArgs[1]).to.be.a('function')
      expect(callArgs[1]).to.have.property('use')
    })
  })

  describe('Configuration Handling', () => {
    it('should accept BoosterConfig parameter', () => {
      const mockHandlerClass = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface
      const params: WebhookParams = [
        {
          route: 'config-test',
          handlerClass: mockHandlerClass
        }
      ]

      expect(() => {
        Infra.mountStack(params, mockConfig, router)
      }).to.not.throw()
    })

    it('should handle different WebhookParamsEvent configurations', () => {
      const mockHandlerClass1 = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface
      const mockHandlerClass2 = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface
      const mockHandlerClass3 = { handle: sinon.stub() } as unknown as WebhookHandlerClassInterface

      const params: WebhookParams = [
        {
          route: 'minimal-config',
          handlerClass: mockHandlerClass1
        },
        {
          route: 'full-config',
          handlerClass: mockHandlerClass2,
          allowedMethods: [AllowedHttpMethod.POST],
          authorize: 'all',
          multiPartConfig: { limits: { fileSize: 1024 } }
        },
        {
          origin: 'legacy-config',
          handlerClass: mockHandlerClass3,
          allowedMethods: [AllowedHttpMethod.GET]
        }
      ]

      Infra.mountStack(params, mockConfig, router)

      expect(routerUseSpy.calledThrice).to.be.true
    })
  })
})
