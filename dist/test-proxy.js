// Simple test to check if the OpenRouteService proxy is working
const testProxyConnectivity = async () => {
  try {
    console.log('Testing proxy connectivity...');
    
    // Test a simple endpoint first
    const response = await fetch('/ors-api/v2/directions/driving-car', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 5b3ce3597851110001cf6248367b86bb45f4468cb4c2fa4ebb0dfc05',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        coordinates: [
          [-9.1393, 38.7223],  // Lisbon Av. da Liberdade
          [-9.1503, 38.7268]   // Marquês de Pombal
        ]
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (data.features && data.features.length > 0) {
      console.log('✅ API working correctly - found route');
      console.log('Route coordinates count:', data.features[0].geometry.coordinates.length);
    } else if (data.routes && data.routes.length > 0) {
      console.log('✅ API working correctly - found route (routes format)');
    } else if (data.error) {
      console.log('❌ API error:', data.error);
    } else {
      console.log('❌ Unknown response format');
    }
    
  } catch (error) {
    console.error('❌ Proxy test failed:', error);
  }
};

// Run the test
testProxyConnectivity();
