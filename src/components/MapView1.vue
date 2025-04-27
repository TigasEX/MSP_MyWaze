<template>
    <div>
      <GoogleMap :api-key="apiKey" style="width: 100%; height: 500px" :center="center" :zoom="15" @click="addMarker">
        <Marker v-for="(marker, index) in markers" :key="index" :options="{ position: marker }" />
        <Marker :options="{ position: center, icon: carMarkerIcon }" />
        <Polyline :path="routePath" :options="routeOptions" />
      </GoogleMap>
      <button @click="centerMap" class="bg-blue-500 text-white p-2 rounded mt-4">Center Map</button>
      <div v-if="routeInfo.duration" class="bg-white p-4 mt-4 rounded shadow">
        <p><strong>Estimated Time:</strong> {{ routeInfo.duration }}</p>
        <p><strong>Distance:</strong> {{ routeInfo.distance }}</p>
      </div>
  
      <div class="flex justify-center space-x-4 mt-4">
        <button v-for="dir in directions" :key="dir" @mousedown="startMoving(dir)" @mouseup="stopMoving" class="bg-blue-500 text-white p-2 rounded">{{ dir }}</button>
      </div>
  
      <div class="speed-limit-display bg-gray-800 text-white p-2 rounded fixed bottom-4 right-4">
        <p>Speed Limit: {{ speedLimit ? speedLimit + ' km/h' : 'Loading...' }}</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { GoogleMap, Marker, Polyline } from 'vue3-google-map'
  import { useMap1 } from '@/composables/useMap1'
  const { apiKey, center, markers, carMarkerIcon, routePath, routeOptions, addMarker, centerMap, routeInfo, directions, startMoving, stopMoving, speedLimit } = useMap1()
  </script>