#!/usr/bin/env node

import { spawn } from 'child_process'
import { readFileSync } from 'fs'

console.log('🧪 Comprehensive Webhook Functionality Test Suite')
console.log('=' .repeat(60))
console.log(`Node.js version: ${process.version}`)
console.log(`Current time: ${new Date().toISOString()}`)
console.log('')

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command} ${args.join(' ')}`)
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Command completed successfully`)
        resolve(code)
      } else {
        console.log(`❌ Command failed with exit code ${code}`)
        reject(new Error(`Command failed: ${command} ${args.join(' ')}`))
      }
    })
    
    child.on('error', (error) => {
      console.error(`❌ Command error:`, error)
      reject(error)
    })
  })
}

async function checkDependencies() {
  console.log('\n📦 Checking dependencies...')
  
  try {
    const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))
    console.log(`✅ Package.json loaded: ${packageJson.name}@${packageJson.version}`)
    console.log(`✅ Type: ${packageJson.type}`)
    
    await runCommand('npm', ['--version'])
    await runCommand('node', ['--version'])
    
    return true
  } catch (error) {
    console.error('❌ Dependency check failed:', error.message)
    return false
  }
}

async function buildProject() {
  console.log('\n🔨 Building project...')
  
  try {
    await runCommand('npm', ['run', 'build', '--workspaces'])
    console.log('✅ Project built successfully')
    return true
  } catch (error) {
    console.error('❌ Build failed:', error.message)
    return false
  }
}

async function runExpressTests() {
  console.log('\n🧪 Running Express 5.x compatibility tests...')
  
  try {
    await runCommand('node', ['test-express-router.mjs'])
    console.log('✅ Express tests completed')
    return true
  } catch (error) {
    console.error('❌ Express tests failed:', error.message)
    return false
  }
}

async function runMultipartTests() {
  console.log('\n🧪 Running multipart parsing tests...')
  
  try {
    await runCommand('node', ['test-multipart-parsing.mjs'])
    console.log('✅ Multipart tests completed')
    return true
  } catch (error) {
    console.error('❌ Multipart tests failed:', error.message)
    return false
  }
}

async function runWebhookTests() {
  console.log('\n🧪 Running isolated webhook tests...')
  
  try {
    await runCommand('node', ['test-isolated-webhook.mjs'])
    console.log('✅ Webhook tests completed')
    return true
  } catch (error) {
    console.error('❌ Webhook tests failed:', error.message)
    return false
  }
}

async function runAllTests() {
  const results = {
    dependencies: false,
    build: false,
    express: false,
    multipart: false,
    webhooks: false
  }
  
  try {
    results.dependencies = await checkDependencies()
    
    if (results.dependencies) {
      results.build = await buildProject()
    }
    
    if (results.build) {
      results.express = await runExpressTests()
      results.multipart = await runMultipartTests()
      results.webhooks = await runWebhookTests()
    }
    
  } catch (error) {
    console.error('❌ Test suite error:', error.message)
  }
  
  console.log('\n📊 Final Test Results:')
  console.log('=' .repeat(60))
  
  let passed = 0
  let total = 0
  
  for (const [test, result] of Object.entries(results)) {
    total++
    if (result) passed++
    console.log(`${result ? '✅' : '❌'} ${test.toUpperCase()}: ${result ? 'PASSED' : 'FAILED'}`)
  }
  
  console.log(`\n🎯 Overall Results: ${passed}/${total} test categories passed`)
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED!')
    console.log('✅ Express 5.x, Busboy, Node.js 22, and TypeScript 5.8 compatibility CONFIRMED')
    console.log('✅ No breaking changes detected in webhook functionality')
  } else {
    console.log('⚠️  Some tests failed - investigation needed')
    console.log('📋 Failed categories need attention before deployment')
  }
  
  return passed === total
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('❌ Test suite failed:', error)
    process.exit(1)
  })
}
