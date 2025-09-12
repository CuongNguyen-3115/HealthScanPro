#!/usr/bin/env node

/**
 * Script để test server connection và API endpoints
 * Chạy: node test-server-connection.js
 */

const https = require('https');
const http = require('http');

// Configuration
const SERVER_CONFIGS = [
  { name: 'Localhost', url: 'http://localhost:8888' },
  { name: '127.0.0.1', url: 'http://127.0.0.1:8888' },
  { name: 'Local IP', url: 'http://192.168.0.118:8888' },
];

const ENDPOINTS = [
  { name: 'Health Check', path: '/_health', method: 'GET' },
  { name: 'API Health', path: '/api/health', method: 'GET' },
  { name: 'Detailed Analysis', path: '/detailed-analysis', method: 'POST' },
];

// Test data for detailed analysis
const TEST_DATA = {
  profile: {
    basic: {
      age: 30,
      gender: 'male',
      weight: 70,
      height: 175
    },
    conditions: {
      selected: ['tiểu đường']
    },
    goals: {
      selected: ['giảm cân']
    },
    allergies: ['gluten']
  },
  label: {
    ingredients: [
      { name: 'Bột mì', percentage: 56, is_allergen: true },
      { name: 'Đường', percentage: 12 },
      { name: 'Siro glucose' }
    ],
    nutrition_facts: {
      serving_size: '36.3 g',
      calories: '160 kcal',
      nutrients: [
        { name: 'Fat', amount: '6', unit: 'g' },
        { name: 'Sodium', amount: '110', unit: 'mg' },
        { name: 'Carbohydrate', amount: '24', unit: 'g' },
        { name: 'Sugars', amount: '12', unit: 'g' },
        { name: 'Protein', amount: '2', unit: 'g' }
      ]
    },
    warnings: ['có gluten', 'đường cao']
  }
};

// Helper function to make HTTP request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test single endpoint
async function testEndpoint(baseUrl, endpoint) {
  const url = `${baseUrl}${endpoint.path}`;
  const options = {
    method: endpoint.method,
    body: endpoint.method === 'POST' ? TEST_DATA : undefined
  };

  try {
    console.log(`  Testing ${endpoint.name}...`);
    const response = await makeRequest(url, options);
    
    if (response.status === 200) {
      console.log(`    ✅ ${endpoint.name}: OK (${response.status})`);
      try {
        const jsonData = JSON.parse(response.data);
        console.log(`    📊 Response: ${JSON.stringify(jsonData).substring(0, 100)}...`);
      } catch (e) {
        console.log(`    📄 Response: ${response.data.substring(0, 100)}...`);
      }
      return true;
    } else {
      console.log(`    ❌ ${endpoint.name}: Failed (${response.status})`);
      console.log(`    📄 Response: ${response.data.substring(0, 200)}...`);
      return false;
    }
  } catch (error) {
    console.log(`    ❌ ${endpoint.name}: Error - ${error.message}`);
    return false;
  }
}

// Test all endpoints for a server
async function testServer(serverConfig) {
  console.log(`\n🔍 Testing ${serverConfig.name}: ${serverConfig.url}`);
  console.log('=' .repeat(50));
  
  let successCount = 0;
  
  for (const endpoint of ENDPOINTS) {
    const success = await testEndpoint(serverConfig.url, endpoint);
    if (success) successCount++;
  }
  
  console.log(`\n📈 Results for ${serverConfig.name}: ${successCount}/${ENDPOINTS.length} endpoints working`);
  return successCount === ENDPOINTS.length;
}

// Main test function
async function runTests() {
  console.log('🚀 HealthScan Server Connection Test');
  console.log('=====================================');
  
  let workingServers = 0;
  
  for (const serverConfig of SERVER_CONFIGS) {
    const isWorking = await testServer(serverConfig);
    if (isWorking) workingServers++;
  }
  
  console.log('\n🎯 Final Results');
  console.log('================');
  console.log(`Working servers: ${workingServers}/${SERVER_CONFIGS.length}`);
  
  if (workingServers === 0) {
    console.log('\n❌ No servers are working!');
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure the server is running: python server.py');
    console.log('2. Check if port 8888 is available');
    console.log('3. Update IP address in app/config/api.js');
    console.log('4. Check firewall settings');
    console.log('5. Try running: curl http://localhost:8888/_health');
  } else {
    console.log('\n✅ At least one server is working!');
    console.log('\n📱 For mobile development:');
    console.log('- iOS: Use the IP address that worked');
    console.log('- Android: Use 10.0.2.2:8888');
    console.log('- Web: Use localhost:8888');
  }
}

// Run the tests
runTests().catch(console.error);
