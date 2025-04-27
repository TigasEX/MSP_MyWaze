<template>
    <div class="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div class="text-lg font-semibold">MyWaze</div>
      <div class="flex space-x-4">
        <button @click="toggleVehicleMenu" class="bg-purple-500 px-4 py-2 rounded">Register Vehicle</button>
        <button @click="toggleVehicleList" class="bg-gray-500 px-4 py-2 rounded">Show Registered Vehicles</button>
        <button @click="logout" class="bg-red-500 px-4 py-2 rounded">Logout</button>
      </div>
    </div>
  </template>
  <script setup>
  import { useAuth1 } from '@/composables/useAuth1'
  import { useVehicles1 } from '@/composables/useVehicles1'
  const { logout } = useAuth1()
  const { toggleVehicleMenu, toggleVehicleList } = useVehicles1()
  </script>