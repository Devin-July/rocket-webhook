# Webhook Testing Framework

This repository includes a comprehensive testing framework to verify webhook functionality with updated dependencies (Express 5.x, Busboy, Node.js 22, TypeScript 5.8).

## Test Files

### Core Test Scripts

- **`test-express-router.mjs`** - Tests Express 5.x router compatibility
  - Router creation and mounting
  - HTTP request handling (GET/POST)
  - Middleware compatibility
  - Server startup/shutdown

- **`test-multipart-parsing.mjs`** - Tests Busboy multipart parsing
  - Import functionality
  - Multipart form data parsing
  - File upload handling
  - Error scenarios

- **`test-isolated-webhook.mjs`** - Tests webhook controller patterns
  - MockWebhookController implementation
  - Multiple webhook endpoints
  - Request/response handling
  - Error handling

- **`run-all-tests.mjs`** - Comprehensive test runner
  - Runs all test categories
  - Dependency checking
  - Build verification
  - Results summary

### Unit Tests

- **`packages/rocket-webhook-core/test/webhook-functionality.test.mjs`** - Mocha-based unit tests
  - Express Router compatibility
  - Multipart parsing with Busboy
  - Node.js 22 features

## Running Tests

### Individual Test Categories

```bash
# Test Express 5.x compatibility
node test-express-router.mjs

# Test Busboy multipart parsing
node test-multipart-parsing.mjs

# Test webhook controller patterns
node test-isolated-webhook.mjs

# Run Mocha unit tests
npx mocha packages/rocket-webhook-core/test/webhook-functionality.test.mjs
```

### Comprehensive Test Suite

```bash
# Run all tests with build verification
node run-all-tests.mjs
```

## Test Coverage

### Express 5.x Compatibility
- ✅ Router creation and configuration
- ✅ Route mounting and middleware
- ✅ HTTP request handling (GET/POST)
- ✅ Server startup and shutdown
- ✅ Built-in and custom middleware

### Busboy Multipart Parsing
- ✅ Function import and availability
- ✅ Multipart form data parsing
- ✅ File upload handling
- ✅ Error handling for malformed data

### Webhook Controller Patterns
- ✅ Controller instantiation
- ✅ Multiple endpoint handling
- ✅ Request/response processing
- ✅ Error scenarios

### Node.js 22 Features
- ✅ Runtime compatibility
- ✅ Stream handling
- ✅ ES module support

## Test Results Interpretation

### Success Indicators
- All test categories show "PASSED" status
- No runtime errors or exceptions
- HTTP requests return expected responses
- Multipart parsing completes successfully

### Failure Scenarios
- Import errors (dependency issues)
- Server startup failures (port conflicts)
- HTTP request failures (routing issues)
- Parsing errors (Busboy compatibility)

## Usage in CI/CD

The test framework can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Run webhook tests
  run: |
    npm run build --workspaces
    node run-all-tests.mjs
```

## Extending Tests

To add new test scenarios:

1. Create new test functions in existing files
2. Add new test categories to `run-all-tests.mjs`
3. Update this documentation

## Dependencies

The testing framework requires:
- Node.js 22+
- Express 5.x
- Busboy (latest)
- Mocha (for unit tests)
- Built project (`npm run build --workspaces`)

## Notes

- Tests are designed to work without full Booster framework setup
- Mock implementations isolate webhook functionality
- Tests verify compatibility but don't replace integration testing
- Real webhook payloads should be tested in actual Booster applications
