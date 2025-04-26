<template>
    <div class="mt-2 p-4 bg-white rounded shadow">
      <label class="block mb-2">Car Brand:</label>
      <select v-model="selectedBrand" @change="updateModels" class="w-full p-2 mb-2 border rounded">
        <option value="">Select a brand</option>
        <option v-for="brand in carDatabase" :key="brand.brand" :value="brand.brand">{{ brand.brand }}</option>
      </select>
  
      <label class="block mb-2">Car Model:</label>
      <select v-model="selectedModel" class="w-full p-2 mb-2 border rounded">
        <option value="">Select a model</option>
        <option v-for="model in availableModels" :key="model.name" :value="model.name">{{ model.name }}</option>
      </select>
  
      <label class="block mb-2">Vehicle Name:</label>
      <input v-model="vehicleName" type="text" placeholder="Vehicle Name" class="w-full p-2 mb-2 border rounded" />
  
      <button @click="registerVehicle" class="w-full bg-blue-500 text-white p-2 rounded">Submit</button>
    </div>
  </template>
  
  <script setup>
  import { useVehicles1 } from '@/composables/useVehicles1'
  const { carDatabase, selectedBrand, selectedModel, availableModels, vehicleName, updateModels, registerVehicle } = useVehicles1()
  </script>