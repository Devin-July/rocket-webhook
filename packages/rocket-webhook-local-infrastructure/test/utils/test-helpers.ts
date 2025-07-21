import * as express from 'express'
import { WebhookParams } from '@boostercloud/rocket-webhook-types'
import { BoosterConfig } from '@boostercloud/framework-types'
import { Infra } from '../../src/infra'

export class TestHelpers {
  static createTestApp(params: WebhookParams, config: BoosterConfig = {} as BoosterConfig): express.Application {
    const app = express()
    const router = express.Router()
    
    Infra.mountStack(params, config, router)
    app.use(router)
    
    return app
  }

  static createMockHandlerClass() {
    return {
      handle: async () => ({ body: 'mock response', responseType: 'text/plain' })
    }
  }

  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
