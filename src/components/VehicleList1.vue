<template>
    <ul class="bg-white rounded shadow p-4">
      <li v-for="(v, index) in vehicles" :key="index" class="border-b py-2 flex items-center">
        <img :src="v.image" alt="Car Image" class="w-16 h-16 mr-4 object-cover rounded" />
        <div>{{ v.name }} ({{ v.brand }} - {{ v.model }})</div>
      </li>
    </ul>
  </template>
  
  <script setup>
  import { useVehicles1 } from '@/composables/useVehicles1'
  const { vehicles } = useVehicles1()
  </script>