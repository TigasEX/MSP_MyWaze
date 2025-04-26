<template>
    <div class="min-h-screen bg-gray-100 p-6">
      <LoginForm1 v-if="!isAuthenticated" />
      <div v-else>
        <TopBar1 />
        <VehicleForm1 v-if="showVehicleMenu" />
        <VehicleList1 v-if="showVehicleList" />
        <MapView1 />
      </div>
    </div>
  </template>
  
  <script setup>
  import { useAuth1 } from '@/composables/useAuth1'
  import { useVehicles1 } from '@/composables/useVehicles1'
  import { useMap1 } from '@/composables/useMap1'
  
  import LoginForm1 from '@/components/LoginForm1.vue'
  import TopBar1 from '@/components/TopBar1.vue'
  import VehicleForm1 from '@/components/VehicleForm1.vue'
  import VehicleList1 from '@/components/VehicleList1.vue'
  import MapView1 from '@/components/MapView1.vue'
  
  const { isAuthenticated } = useAuth1()
  const { showVehicleMenu, showVehicleList } = useVehicles1()
  </script>
  