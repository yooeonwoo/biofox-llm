#!/usr/bin/env node

// Test script for Memory Management API endpoints
// Run with: node test_memory_api.js

const fetch = require('node-fetch');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const AUTH_TOKEN = process.env.AUTH_TOKEN; // Set this to user's auth token

async function testMemoryAPI() {
  console.log('🧪 Testing Memory Management API endpoints...');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  
  if (!AUTH_TOKEN) {
    console.log('⚠️  No AUTH_TOKEN provided. Set AUTH_TOKEN environment variable to test authenticated endpoints.');
    console.log('   Example: AUTH_TOKEN=your_token_here node test_memory_api.js');
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  };

  try {
    // Test 1: Get user memories
    console.log('\n📋 Testing GET /user/memories...');
    const memoriesResponse = await fetch(`${BASE_URL}/user/memories`, {
      method: 'GET',
      headers
    });
    
    console.log(`Status: ${memoriesResponse.status}`);
    const memoriesData = await memoriesResponse.text();
    console.log(`Response: ${memoriesData.substring(0, 200)}${memoriesData.length > 200 ? '...' : ''}`);

    // Test 2: Search memories
    console.log('\n🔍 Testing POST /user/memories/search...');
    const searchResponse = await fetch(`${BASE_URL}/user/memories/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: 'test', limit: 5 })
    });
    
    console.log(`Status: ${searchResponse.status}`);
    const searchData = await searchResponse.text();
    console.log(`Response: ${searchData.substring(0, 200)}${searchData.length > 200 ? '...' : ''}`);

    console.log('\n✅ API tests completed');
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

// Test frontend accessibility
async function testFrontend() {
  console.log('\n🌐 Testing frontend accessibility...');
  
  try {
    const response = await fetch(BASE_URL);
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      const html = await response.text();
      const hasIndex = html.includes('index.js');
      const hasCSS = html.includes('index.css');
      
      console.log(`✅ Frontend accessible`);
      console.log(`📄 Has index.js: ${hasIndex ? '✅' : '❌'}`);
      console.log(`🎨 Has index.css: ${hasCSS ? '✅' : '❌'}`);
      
      if (!hasIndex || !hasCSS) {
        console.log('⚠️  Frontend assets may not be properly built');
      }
    } else {
      console.log(`❌ Frontend not accessible (Status: ${response.status})`);
    }
  } catch (error) {
    console.error('❌ Error testing frontend:', error.message);
  }
}

async function main() {
  await testFrontend();
  await testMemoryAPI();
  
  console.log('\n📝 Troubleshooting Tips:');
  console.log('1. Ensure user has enable_mem0 = true in database');
  console.log('2. Check if frontend was properly built and deployed');
  console.log('3. Verify API endpoints are accessible');
  console.log('4. Check browser console for JavaScript errors');
  console.log('5. Try force refresh (Ctrl+F5) to clear cache');
}

main().catch(console.error);