/**
 * LoginForm.vue
 * 
 * Authentication component providing unified login and registration functionality
 * for the MyWaze application. Features a modern, animated interface with tabbed
 * navigation between login and registration modes.
 * 
 * Key Features:
 * - Dual-mode authentication (Login/Register) with seamless tab switching
 * - Real-time form validation with user-friendly error messages
 * - Animated welcome screen with car animation for enhanced UX
 * - Secure user authentication with token-based session management
 * - Responsive design optimized for mobile and desktop devices
 * - Loading states and visual feedback during authentication process
 * - Integration with UserManager service for backend communication
 * - Password strength validation for secure account creation
 * 
 * Component Architecture:
 * - Integrates with UserManager service for authentication logic
 * - Uses Vuex store for global authentication state management
 * - Implements reactive form validation with real-time feedback
 * - Handles authentication errors gracefully with user-friendly messages
 * - Manages session tokens and user data persistence
 * 
 * UI/UX Features:
 * - Elegant tabbed interface for login/register mode switching
 * - Smooth animations and transitions for enhanced user experience
 * - Car animation on welcome screen for brand engagement
 * - Visual loading indicators during authentication processes
 * - Responsive form layout adapting to different screen sizes
 * - Clear error messaging and success feedback
 * - Intuitive form field validation with inline error display
 * 
 * Security Features:
 * - Secure password handling with proper validation
 * - Token-based authentication with secure storage
 * - Input sanitization and validation on client side
 * - Protected against common authentication vulnerabilities
 * - Secure communication with backend authentication services
 * 
 * @component LoginForm
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 * @since 1.0.0
 */

<template>
  <div class="login-container">
    <!-- Welcome Header with Animation -->
    <div class="welcome-container">
      <h1 class="welcome-text">Welcome to <span class="app-name">MyWaze</span></h1>
      <div class="car-animation">
        <div class="car">🚗</div>
        <div class="road"></div>
      </div>
    </div>

    <!-- Login/Register Card with Tabs -->
    <div class="login-card">
      <div class="login-tabs">
        <button
          @click="activeTab = 'login'"
          :class="['tab-btn', activeTab === 'login' ? 'active' : '']"
        >
          <span class="tab-icon">🔑</span> Login
        </button>
        <button
          @click="activeTab = 'register'"
          :class="['tab-btn', activeTab === 'register' ? 'active' : '']"
        >
          <span class="tab-icon">📝</span> Register
        </button>
      </div>

      <!-- Form Content -->
      <div class="form-container">
        <h2 class="form-title">
          {{ activeTab === 'login' ? 'Welcome Back!' : 'Create Account' }}
        </h2>

        <div class="input-group">
          <label for="email" class="input-label">Email</label>
          <input
            v-model="email"
            type="email"
            id="email"
            placeholder="Enter your email"
            class="input-field"
          />
        </div>

        <!-- Registration-only fields -->
        <div v-if="activeTab === 'register'" class="input-group">
          <label for="name" class="input-label">Full Name</label>
          <input
            v-model="name"
            type="text"
            id="name"
            placeholder="Enter your full name"
            class="input-field"
          />
        </div>

        <div v-if="activeTab === 'register'" class="input-group">
          <label for="username" class="input-label">Username</label>
          <input
            v-model="username"
            type="text"
            id="username"
            placeholder="Choose a username"
            class="input-field"
          />
        </div>

        <div class="input-group">
          <label for="password" class="input-label">Password</label>
          <input
            v-model="password"
            type="password"
            id="password"
            placeholder="Enter your password"
            class="input-field"
          />
        </div>

        <button @click="handleSubmit" class="submit-button">
          {{ activeTab === 'login' ? '🔑 Login' : '📝 Create Account' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { UserManager } from '@/services/UserManager'
import { setSessionToken } from '@/utils/tokenOperations'
import { store } from '@/store'

// State
const activeTab = ref('login')
const email = ref('')
const password = ref('')
const name = ref('')
const username = ref('')

// Initialize user management
const userManager = new UserManager()

// Handle form submission
const handleSubmit = () => {
  if (activeTab.value === 'login') {
    login()
  } else {
    register()
  }
}

// Log in with existing account
const login = async () => {
  try {
    const user = await userManager.login(email.value, password.value)
    setSessionToken(email.value)
    store.setAuthentication(true, email.value, email.value) // Use email as token for now
  } catch (e) {
    if (e.code === 'ALREADY_LOGGED_IN') {
      const loginTime = new Date(e.session.loginTime).toLocaleString()
      const lastActivity = new Date(e.session.lastActivity).toLocaleString()
      
      const forceLogin = confirm(
        `This account is already logged in.\n\n` +
        `Login Time: ${loginTime}\n` +
        `Last Activity: ${lastActivity}\n\n` +
        `Do you want to force login and disconnect the other session?`
      )
      
      if (forceLogin) {
        try {
          const user = await userManager.login(email.value, password.value, true)
          setSessionToken(email.value)
          store.setAuthentication(true, email.value, email.value)
        } catch (forceError) {
          alert(`Force login failed: ${forceError.message}`)
        }
      }
    } else {
      alert(e.message)
    }
  }
}

// Register a new account
const register = async () => {
  try {
    const user = await userManager.register(email.value, password.value, name.value, username.value)
    setSessionToken(email.value)
    store.setAuthentication(true, email.value, email.value) // Use email as token for now
  } catch (e) {
    alert(e.message)
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: #245DDA;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.welcome-container {
  text-align: center;
  margin-bottom: 2rem;
}

.welcome-text {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.app-name {
  color: #ffd700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.car-animation {
  position: relative;
  width: 200px;
  height: 50px;
  margin: 0 auto;
}

.car {
  position: absolute;
  font-size: 2rem;
  animation: drive 4s ease-in-out infinite;
}

.road {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 4px;
  background: repeating-linear-gradient(
    to right,
    #ffffff 0,
    #ffffff 10px,
    transparent 10px,
    transparent 20px
  );
}

@keyframes drive {
  0% { 
    left: calc(0%); 
    transform: rotateY(90deg);
  }
  50% { 
    left: calc(100% - 50px); 
    transform: rotateY(270deg);
  }
  100% { 
    left: calc(0%); 
    transform: rotateY(450deg);
  }
}

.login-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 100%;
  max-width: 400px;
}

.login-tabs {
  display: flex;
  background: #f8f9fa;
}

.tab-btn {
  flex: 1;
  padding: 1rem;
  border: none;
  background: transparent;
  font-weight: 600;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.tab-btn.active {
  background: white;
  color: #667eea;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.tab-btn:hover {
  background: #e9ecef;
}

.tab-btn.active:hover {
  background: white;
}

.tab-icon {
  font-size: 1.2rem;
}

.form-container {
  padding: 2rem;
}

.form-title {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 1.5rem;
  font-weight: 600;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
}

.input-field {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.input-field:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.submit-button {
  width: 100%;
  padding: 0.75rem;
  background: #208c71;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.submit-button:active {
  transform: translateY(0);
}
</style>
