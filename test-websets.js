// Simple test script to verify the websets API
const axios = require('axios');

const API_KEY = process.env.STAGING_EXA_API_KEY || process.env.EXA_API_KEY;
const BASE_URL = 'https://api.exa.ai';

async function testWebsetsAPI() {
  console.log('Testing Websets API...\n');
  
  try {
    const axiosInstance = axios.create({
      baseURL: BASE_URL,
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': API_KEY
      },
      timeout: 30000
    });

    // Test 1: List existing websets
    console.log('1. Listing websets...');
    const listResponse = await axiosInstance.get('/v0/websets', {
      params: { limit: 5 }
    });
    console.log(`✓ Found ${listResponse.data.data.length} websets`);
    if (listResponse.data.data.length > 0) {
      console.log(`  First webset: ${listResponse.data.data[0].id}`);
    }

    // Test 2: Create a test webset
    console.log('\n2. Creating test webset...');
    const createResponse = await axiosInstance.post('/v0/websets', {
      name: 'MCP Server Test',
      description: 'Test webset created by websets-mcp-server',
      search: {
        query: 'AI research companies',
        count: 5
      }
    });
    console.log(`✓ Created webset: ${createResponse.data.id}`);
    const testWebsetId = createResponse.data.id;

    // Test 3: Get the webset details
    console.log('\n3. Getting webset details...');
    const getResponse = await axiosInstance.get(`/v0/websets/${testWebsetId}`);
    console.log(`✓ Retrieved webset: ${getResponse.data.id}`);
    console.log(`  Status: ${getResponse.data.status}`);
    console.log(`  Items count: ${getResponse.data.itemsCount}`);

    // Test 4: Update the webset
    console.log('\n4. Updating webset...');
    const updateResponse = await axiosInstance.post(`/v0/websets/${testWebsetId}`, {
      description: 'Updated description from MCP test'
    });
    console.log(`✓ Updated webset description`);

    // Test 5: List items (may be empty if search hasn't completed)
    console.log('\n5. Listing webset items...');
    const itemsResponse = await axiosInstance.get(`/v0/websets/${testWebsetId}/items`, {
      params: { limit: 10 }
    });
    console.log(`✓ Found ${itemsResponse.data.data.length} items`);

    // Test 6: Delete the test webset
    console.log('\n6. Deleting test webset...');
    await axiosInstance.delete(`/v0/websets/${testWebsetId}`);
    console.log(`✓ Deleted webset: ${testWebsetId}`);

    console.log('\n✅ All API tests passed!');
    console.log('\nThe websets-mcp-server tools should work correctly with these endpoints.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testWebsetsAPI();
