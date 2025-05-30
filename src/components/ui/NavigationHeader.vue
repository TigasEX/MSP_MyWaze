/**
 * NavigationHeader.vue
 * 
 * Main navigation header component for the MyWaze application providing
 * quick access to core application features and user account management.
 * Features a responsive design with intuitive icons and clear navigation.
 * 
 * Key Features:
 * - Brand identity display with MyWaze logo and distinctive styling
 * - Quick access buttons for vehicle management (Add Vehicle, My Vehicles)
 * - Route management functionality (My Routes) for saved navigation paths
 * - User account settings (Username configuration)
 * - Secure logout functionality with session cleanup
 * - Responsive design adapting to different screen sizes
 * - Event-driven architecture using Vue emit patterns
 * - Clean, modern UI design with consistent iconography
 * 
 * Component Architecture:
 * - Parent-child communication through Vue events ($emit)
 * - Modular button design for easy maintenance and styling
 * - Responsive container layout for optimal display across devices
 * - Semantic HTML structure for accessibility compliance
 * - Scalable CSS architecture with maintainable styles
 * 
 * UI/UX Features:
 * - Intuitive icon-based navigation with descriptive text labels
 * - Consistent visual hierarchy and button styling
 * - Hover effects and interactive feedback for better user experience
 * - Mobile-friendly responsive design with touch-optimized buttons
 * - Clear visual separation between different action categories
 * - Prominent logout button with distinctive styling for security
 * 
 * Navigation Functions:
 * - Vehicle Management: Add new vehicles and view existing vehicle list
 * - Route Management: Access saved routes and navigation history
 * - User Settings: Username configuration and profile management
 * - Authentication: Secure logout with proper session termination
 * 
 * @component NavigationHeader
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 * @since 1.0.0
 */

<template>
  <div class="navigation-header">
    <div class="nav-container">
      <div class="nav-brand">
        <h1 class="brand-text">
          <span class="brand-icon">🗺️</span>
          MyWaze
        </h1>
      </div>
      
      <div class="nav-buttons">
        <button @click="$emit('toggle-vehicle-menu')" class="nav-button">
          <span class="button-icon">🚗</span>
          <span class="button-text">Add Vehicle</span>
        </button>
        <button @click="$emit('toggle-vehicle-list')" class="nav-button">
          <span class="button-icon">📋</span>
          <span class="button-text">My Vehicles</span>
        </button>
        <button @click="$emit('toggle-route-list')" class="nav-button">
          <span class="button-icon">🗺️</span>
          <span class="button-text">My Routes</span>
        </button>
        <button @click="$emit('toggle-username-settings')" class="nav-button">
          <span class="button-icon">👤</span>
          <span class="button-text">Username</span>
        </button>
        <button @click="$emit('logout')" class="nav-button logout-btn">
          <span class="button-icon">🚪</span>
          <span class="button-text">Logout</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['toggle-vehicle-menu', 'toggle-vehicle-list', 'toggle-route-list', 'toggle-username-settings', 'logout'])
</script>

<style scoped>
.navigation-header {
  background: #245DDA;
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.nav-brand {
  display: flex;
  align-items: center;
}

.brand-text {
  font-size: 1.8rem;
  font-weight: bold;
  color: #ffd700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-icon {
  font-size: 2rem;
}

.nav-buttons {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.nav-button:active {
  transform: translateY(0);
}

.logout-btn:hover {
  background: rgba(220, 53, 69, 0.8);
}

.button-icon {
  font-size: 1.2rem;
}

.button-text {
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .nav-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .nav-button {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }
  
  .button-text {
    display: none;
  }
}
</style>
