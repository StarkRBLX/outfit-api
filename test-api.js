const https = require('https');

// Configuration
const API_ENDPOINT = 'https://rblxdb.starkrblx.com';
const API_KEY = '@Luabearygood98765';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_ENDPOINT + path);
        
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Helper function to make GET requests without API key
function makeGetRequest(path) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_ENDPOINT + path);
        
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'GET'
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

// Test functions
async function testHealthCheck() {
    console.log('1. Testing Health Check...');
    try {
        const response = await makeGetRequest('/health');
        console.log(`Status: ${response.status}`);
        console.log(`Response:`, response.data);
        return response.status === 200 && response.data.status === 'OK';
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
}

async function testUploadOutfit() {
    console.log('\n2. Testing Upload Outfit...');
    const outfitData = {
        Name: 'Test Summer Outfit JS',
        AccessoryData: JSON.stringify({
            hat: 123456,
            shirt: 789012,
            pants: 345678,
            face: 901234
        }),
        Price: 150,
        SerializedDescription: {
            description: 'A cool test outfit for summer',
            tags: ['summer', 'test', 'trendy']
        },
        OtherMetadata: {
            creator: 'TestUserJS',
            season: 'summer'
        }
    };

    try {
        const response = await makeRequest('POST', '/api/UploadOutfit', outfitData);
        console.log(`Status: ${response.status}`);
        console.log(`Response:`, response.data);
        
        if (response.status === 200 && (typeof response.data === 'number' || !isNaN(parseInt(response.data)))) {
            const outfitId = typeof response.data === 'number' ? response.data : parseInt(response.data);
            console.log(`✓ Outfit uploaded successfully! ID: ${outfitId}`);
            return outfitId;
        } else {
            console.log('✗ Upload failed');
            console.log('Response status:', response.status);
            console.log('Response data:', response.data);
            return null;
        }
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}

async function testUploadSecondOutfit() {
    console.log('\n3. Testing Upload Second Outfit...');
    const outfitData = {
        Name: 'Winter Style Outfit JS',
        AccessoryData: JSON.stringify({
            hat: 111111,
            shirt: 222222,
            pants: 333333
        }),
        Price: 200,
        SerializedDescription: {
            description: 'A warm winter outfit',
            tags: ['winter', 'warm', 'stylish']
        },
        OtherMetadata: {
            creator: 'TestUser2JS',
            season: 'winter'
        }
    };

    try {
        const response = await makeRequest('POST', '/api/UploadOutfit', outfitData);
        console.log(`Status: ${response.status}`);
        console.log(`Response:`, response.data);
        
        if (response.status === 200 && (typeof response.data === 'number' || !isNaN(parseInt(response.data)))) {
            const outfitId = typeof response.data === 'number' ? response.data : parseInt(response.data);
            console.log(`✓ Second outfit uploaded successfully! ID: ${outfitId}`);
            return outfitId;
        } else {
            console.log('✗ Upload failed');
            console.log('Response status:', response.status);
            console.log('Response data:', response.data);
            return null;
        }
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}

async function testGetOutfitDetails(outfitId1, outfitId2) {
    console.log('\n4. Testing Get Outfit Details...');
    const requestData = {
        OutfitUniqueIds: {
            '1': outfitId1,
            '2': outfitId2,
            '3': 999999999 // Non-existent ID
        }
    };

    try {
        const response = await makeRequest('POST', '/api/GetOutfitDetails', requestData);
        console.log(`Status: ${response.status}`);
        console.log(`Response:`, JSON.stringify(response.data, null, 2));
        
        if (response.status === 200) {
            console.log('✓ Get outfit details successful');
            return true;
        } else {
            console.log('✗ Get outfit details failed');
            return false;
        }
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
}

async function testSearchOutfits() {
    console.log('\n5. Testing Search Outfits (Newest)...');
    const searchData = {
        SortType: 'Newest',
        Amount: 10,
        SearchKeyword: ''
    };

    try {
        const response = await makeRequest('POST', '/api/SearchOutfitsAsync', searchData);
        console.log(`Status: ${response.status}`);
        console.log(`Found ${response.data.length} outfits`);
        console.log(`Response:`, JSON.stringify(response.data, null, 2));
        
        if (response.status === 200 && Array.isArray(response.data)) {
            console.log('✓ Search outfits successful');
            return true;
        } else {
            console.log('✗ Search outfits failed');
            return false;
        }
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
}

async function testSearchWithKeyword() {
    console.log('\n6. Testing Search Outfits with Keyword (Summer)...');
    const searchData = {
        SortType: 'Newest',
        Amount: 5,
        SearchKeyword: 'Summer'
    };

    try {
        const response = await makeRequest('POST', '/api/SearchOutfitsAsync', searchData);
        console.log(`Status: ${response.status}`);
        console.log(`Found ${response.data.length} outfits with "Summer"`);
        console.log(`Response:`, JSON.stringify(response.data, null, 2));
        
        if (response.status === 200) {
            console.log('✓ Search with keyword successful');
            return true;
        } else {
            console.log('✗ Search with keyword failed');
            return false;
        }
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
}

async function testIncrementViews(outfitId1, outfitId2) {
    console.log('\n7. Testing Increment Views...');
    const outfitIds = [outfitId1, outfitId2];

    try {
        const response = await makeRequest('POST', '/api/IncrementViews', outfitIds);
        console.log(`Status: ${response.status}`);
        console.log(`Response:`, response.data);
        
        if (response.status === 200 && response.data.success) {
            console.log(`✓ Incremented views for ${response.data.updated} outfits`);
            return true;
        } else {
            console.log('✗ Increment views failed');
            return false;
        }
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
}

async function testIncrementFavourites(outfitId1) {
    console.log('\n8. Testing Increment Favourites...');
    const outfitIds = [outfitId1];

    try {
        const response = await makeRequest('POST', '/api/IncrementFavourites', outfitIds);
        console.log(`Status: ${response.status}`);
        console.log(`Response:`, response.data);
        
        if (response.status === 200 && response.data.success) {
            console.log(`✓ Incremented favourites for ${response.data.updated} outfits`);
            return true;
        } else {
            console.log('✗ Increment favourites failed');
            return false;
        }
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
}

async function testInvalidApiKey() {
    console.log('\n9. Testing Invalid API Key...');
    
    // Override API key for this test
    const originalRequest = makeRequest;
    const makeRequestWithBadKey = (method, path, data = null) => {
        return new Promise((resolve, reject) => {
            const url = new URL(API_ENDPOINT + path);
            
            const options = {
                hostname: url.hostname,
                port: 443,
                path: url.pathname,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'invalid_key'
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(body);
                        resolve({ status: res.statusCode, data: response });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: body });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    };

    const searchData = {
        SortType: 'Newest',
        Amount: 5
    };

    try {
        const response = await makeRequestWithBadKey('POST', '/api/SearchOutfitsAsync', searchData);
        console.log(`Status: ${response.status}`);
        console.log(`Response:`, response.data);
        
        if (response.status === 401) {
            console.log('✓ Invalid API key correctly rejected');
            return true;
        } else {
            console.log('✗ Invalid API key test failed');
            return false;
        }
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
}

async function testPopularSort() {
    console.log('\n10. Testing Search Outfits (Popular Sort)...');
    const searchData = {
        SortType: 'Popular',
        Amount: 5,
        SearchKeyword: ''
    };

    try {
        const response = await makeRequest('POST', '/api/SearchOutfitsAsync', searchData);
        console.log(`Status: ${response.status}`);
        console.log(`Found ${response.data.length} outfits (Popular sort)`);
        console.log(`Response:`, JSON.stringify(response.data, null, 2));
        
        if (response.status === 200) {
            console.log('✓ Popular sort successful');
            return true;
        } else {
            console.log('✗ Popular sort failed');
            return false;
        }
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log('=== Testing Outfit Database API ===');
    console.log(`Domain: ${API_ENDPOINT}`);
    console.log(`API Key: ${API_KEY}\n`);

    let passedTests = 0;
    let totalTests = 0;

    // Test 1: Health Check
    totalTests++;
    if (await testHealthCheck()) passedTests++;

    // Test 2: Upload Outfit
    totalTests++;
    const outfitId1 = await testUploadOutfit();
    if (outfitId1) passedTests++;

    // Test 3: Upload Second Outfit
    totalTests++;
    const outfitId2 = await testUploadSecondOutfit();
    if (outfitId2) passedTests++;

    if (outfitId1 && outfitId2) {
        // Test 4: Get Outfit Details
        totalTests++;
        if (await testGetOutfitDetails(outfitId1, outfitId2)) passedTests++;

        // Test 5: Search Outfits
        totalTests++;
        if (await testSearchOutfits()) passedTests++;

        // Test 6: Search with Keyword
        totalTests++;
        if (await testSearchWithKeyword()) passedTests++;

        // Test 7: Increment Views
        totalTests++;
        if (await testIncrementViews(outfitId1, outfitId2)) passedTests++;

        // Test 8: Increment Favourites
        totalTests++;
        if (await testIncrementFavourites(outfitId1)) passedTests++;

        // Test 9: Invalid API Key
        totalTests++;
        if (await testInvalidApiKey()) passedTests++;

        // Test 10: Popular Sort
        totalTests++;
        if (await testPopularSort()) passedTests++;
    }

    console.log('\n=== Test Results ===');
    console.log(`Passed: ${passedTests}/${totalTests} tests`);
    console.log(`Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Your API is working perfectly!');
    } else {
        console.log('⚠️  Some tests failed. Check the output above for details.');
    }
}

// Run tests
runAllTests().catch(console.error); 