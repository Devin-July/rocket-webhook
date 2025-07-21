import * as sinon from 'sinon'

export const sharedMockBoosterRocketDispatcher = sinon.stub()

const mockFrameworkCore = {
  boosterRocketDispatcher: sharedMockBoosterRocketDispatcher
}

const Module = require('module')
const originalRequire = Module.prototype.require

if (!process.env.MOCK_SETUP_DONE) {
  Module.prototype.require = function(id: string) {
    if (id === '@boostercloud/framework-core') {
      return mockFrameworkCore
    }
    return originalRequire.apply(this, arguments)
  }
  process.env.MOCK_SETUP_DONE = 'true'
}

export function restoreMocks() {
  Module.prototype.require = originalRequire
  delete process.env.MOCK_SETUP_DONE
}
