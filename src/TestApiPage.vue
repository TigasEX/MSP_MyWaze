<template>
  <div class="test-container">
    <h1>OpenRouteService API Test</h1>
    
    <div class="test-card">
      <h2>Test Snap to Road</h2>
      <div class="input-group">
        <label>Latitude:</label>
        <input v-model="testLat" type="number" step="0.0001" />
      </div>
      <div class="input-group">
        <label>Longitude:</label>
        <input v-model="testLng" type="number" step="0.0001" />
      </div>
      <button @click="testSnapToRoad" class="test-button">Test Snap to Road</button>
      
      <div v-if="snapResult" class="result">
        <h3>Result:</h3>
        <pre>{{ JSON.stringify(snapResult, null, 2) }}</pre>
      </div>
      
      <div v-if="snapError" class="error">
        <h3>Error:</h3>
        <pre>{{ snapError }}</pre>
      </div>
    </div>
    
    <div class="test-card">
      <h2>Test Get Route</h2>
      <div class="input-group">
        <label>Origin Lat:</label>
        <input v-model="originLat" type="number" step="0.0001" />
      </div>
      <div class="input-group">
        <label>Origin Lng:</label>
        <input v-model="originLng" type="number" step="0.0001" />
      </div>
      <div class="input-group">
        <label>Destination Lat:</label>
        <input v-model="destLat" type="number" step="0.0001" />
      </div>
      <div class="input-group">
        <label>Destination Lng:</label>
        <input v-model="destLng" type="number" step="0.0001" />
      </div>
      <button @click="testGetRoute" class="test-button">Test Get Route</button>
      
      <div v-if="routeResult" class="result">
        <h3>Result:</h3>
        <p>Distance: {{ routeResult.distance }} meters</p>
        <p>Duration: {{ routeResult.duration }} seconds</p>
        <p>Points: {{ routeResult.geometry.length }}</p>
      </div>
      
      <div v-if="routeError" class="error">
        <h3>Error:</h3>
        <pre>{{ routeError }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import routingService from './RoutingService.js';

// Snap to Road test
const testLat = ref(38.7223);
const testLng = ref(-9.1393);
const snapResult = ref(null);
const snapError = ref(null);

// Get Route test
const originLat = ref(38.7223);
const originLng = ref(-9.1393);
const destLat = ref(38.7476);
const destLng = ref(-9.1467);
const routeResult = ref(null);
const routeError = ref(null);

async function testSnapToRoad() {
  try {
    snapError.value = null;
    snapResult.value = null;
    console.log('Testing snap to road with:', { lat: testLat.value, lng: testLng.value });
    
    const result = await routingService.snapToRoad({
      lat: testLat.value,
      lng: testLng.value
    });
    
    console.log('Snap to road result:', result);
    snapResult.value = result;
  } catch (error) {
    console.error('Error in snap to road test:', error);
    snapError.value = error.toString();
    if (error.response) {
      snapError.value += '\n\nResponse Data: ' + JSON.stringify(error.response.data, null, 2);
      snapError.value += '\nStatus: ' + error.response.status;
    }
  }
}

async function testGetRoute() {
  try {
    routeError.value = null;
    routeResult.value = null;
    console.log('Testing get route with:', {
      origin: { lat: originLat.value, lng: originLng.value },
      destination: { lat: destLat.value, lng: destLng.value }
    });
    
    const result = await routingService.getRoute(
      { lat: originLat.value, lng: originLng.value },
      { lat: destLat.value, lng: destLng.value }
    );
    
    console.log('Get route result:', result);
    routeResult.value = result;
  } catch (error) {
    console.error('Error in get route test:', error);
    routeError.value = error.toString();
    if (error.response) {
      routeError.value += '\n\nResponse Data: ' + JSON.stringify(error.response.data, null, 2);
      routeError.value += '\nStatus: ' + error.response.status;
    }
  }
}
</script>

<style scoped>
.test-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.test-card {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.input-group {
  display: flex;
  margin-bottom: 10px;
  align-items: center;
}

.input-group label {
  width: 120px;
  font-weight: bold;
}

.input-group input {
  flex-grow: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.test-button {
  background: #4285F4;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin: 10px 0;
}

.test-button:hover {
  background: #3367d6;
}

.result, .error {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
}

.result {
  background: #e6f4ea;
  border: 1px solid #34a853;
}

.error {
  background: #fce8e6;
  border: 1px solid #ea4335;
}

pre {
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  background: rgba(0,0,0,0.05);
  padding: 10px;
  border-radius: 4px;
}
</style>
