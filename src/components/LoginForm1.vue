<template>
    <div class="max-w-md mx-auto">
      <h1 class="text-2xl font-bold mb-4">Login or Register</h1>
      <input v-model="email" type="email" placeholder="Email" class="w-full p-2 mb-2 border rounded" />
      <input v-model="password" type="password" placeholder="Password" class="w-full p-2 mb-2 border rounded" />
      <button @click="login" class="w-full bg-blue-500 text-white p-2 rounded">Login</button>
      <button @click="register" class="w-full bg-green-500 text-white p-2 rounded">Register</button>
    </div>
  </template>
  
  <script setup>
  import { useAuth1 } from '@/composables/useAuth1'
  const { email, password, login, register } = useAuth1()
  </script>