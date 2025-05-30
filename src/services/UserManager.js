/**
 * User Management Service
 * 
 * Handles all user-related operations including authentication, vehicle management,
 * and route persistence. Communicates with the WebSocket server via REST API endpoints.
 * 
 * Key Features:
 * - User registration and authentication
 * - Session management with duplicate login prevention
 * - Vehicle CRUD operations (Create, Read, Update, Delete)
 * - Route saving and retrieval
 * - User profile management (username updates)
 * - Car database access
 * 
 * API Integration:
 * - RESTful API calls to WebSocket server endpoints
 * - JSON data exchange format
 * - Error handling with user-friendly messages
 * - Session token management
 * 
 * Security:
 * - Password-based authentication
 * - Session validation
 * - Secure logout with server cleanup
 * 
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 */

// Server-side User Manager - connects to WebSocket server APIs
const SERVER_URL = 'http://localhost:8080';

export class UserManager {
  constructor() {
    this.currentUser = null; // Currently authenticated user data
  }

  /**
   * ===== AUTHENTICATION METHODS =====
   */

  /**
   * Register a new user account
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @param {string|null} name - User's display name (optional)
   * @param {string|null} username - User's username (optional)
   * @returns {Promise<Object>} User data object
   */
  async register(email, password, name = null, username = null) {
    try {
      const response = await fetch(`${SERVER_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, username }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      this.currentUser = result.user;
      return result.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @param {boolean} forceLogin - Force login even if already logged in elsewhere
   * @returns {Promise<Object>} User data object
   * @throws {Error} Authentication errors including already logged in
   */
  async login(email, password, forceLogin = false) {
    try {
      const response = await fetch(`${SERVER_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, forceLogin }),
      });

      const result = await response.json();
      
      if (!result.success) {
        if (result.code === 'ALREADY_LOGGED_IN') {
          // Create a specific error for already logged in users
          const error = new Error(result.error);
          error.code = 'ALREADY_LOGGED_IN';
          error.session = result.session;
          throw error;
        }
        throw new Error(result.error);
      }

      this.currentUser = result.user;
      return result.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getUserData(email) {
    try {
      const response = await fetch(`${SERVER_URL}/api/user-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.user;
    } catch (error) {
      console.error('Get user data error:', error);
      throw error;
    }
  }

  async addVehicle(email, vehicle) {
    try {
      const response = await fetch(`${SERVER_URL}/api/add-vehicle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, vehicle }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Update current user data
      if (this.currentUser && this.currentUser.email === email) {
        this.currentUser.vehicles.push(result.vehicle);
      }

      return result.vehicle;
    } catch (error) {
      console.error('Add vehicle error:', error);
      throw error;
    }
  }

  async removeVehicle(email, vehicleId) {
    try {
      const response = await fetch(`${SERVER_URL}/api/remove-vehicle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, vehicleId }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Update current user data
      if (this.currentUser && this.currentUser.email === email) {
        this.currentUser.vehicles = this.currentUser.vehicles.filter(v => v.id !== vehicleId);
      }

      return true;
    } catch (error) {
      console.error('Remove vehicle error:', error);
      throw error;
    }
  }

  async selectVehicle(email, vehicleId) {
    try {
      const response = await fetch(`${SERVER_URL}/api/select-vehicle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, vehicleId }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Update current user data
      if (this.currentUser && this.currentUser.email === email) {
        this.currentUser.vehicles.forEach(v => v.isSelected = false);
        const vehicle = this.currentUser.vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
          vehicle.isSelected = true;
        }
      }

      return result.vehicle;
    } catch (error) {
      console.error('Select vehicle error:', error);
      throw error;
    }
  }

  async saveRoute(email, routeData) {
    try {
      const response = await fetch(`${SERVER_URL}/api/save-route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, routeData }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Update current user data
      if (this.currentUser && this.currentUser.email === email) {
        this.currentUser.savedRoutes.push(result.route);
      }

      return result.route;
    } catch (error) {
      console.error('Save route error:', error);
      throw error;
    }
  }

  async getRoutes(email) {
    try {
      const response = await fetch(`${SERVER_URL}/api/get-routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.routes;
    } catch (error) {
      console.error('Get routes error:', error);
      throw error;
    }
  }

  async deleteRoute(email, routeId) {
    try {
      const response = await fetch(`${SERVER_URL}/api/delete-route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, routeId }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Update current user data
      if (this.currentUser && this.currentUser.email === email) {
        this.currentUser.savedRoutes = this.currentUser.savedRoutes.filter(r => r.id !== routeId);
      }

      return true;
    } catch (error) {
      console.error('Delete route error:', error);
      throw error;
    }
  }

  async getCarDatabase() {
    try {
      const response = await fetch(`${SERVER_URL}/api/car-database`);
      const carDatabase = await response.json();
      return carDatabase;
    } catch (error) {
      console.error('Get car database error:', error);
      throw error;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async logout(email) {
    try {
      const response = await fetch(`${SERVER_URL}/api/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      
      if (result.success) {
        this.currentUser = null;
        console.log('Successfully logged out');
      }
      
      return result;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async updateUsername(email, username) {
    try {
      const response = await fetch(`${SERVER_URL}/api/update-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Update current user if it matches
      if (this.currentUser && this.currentUser.email === email) {
        this.currentUser = result.user;
      }

      return result.user;
    } catch (error) {
      console.error('Update username error:', error);
      throw error;
    }
  }
}

// Create a singleton instance of the UserManager class
const userManager = new UserManager();

// Export individual functions that use the userManager instance
export const userRegister = async (email, password, name = null) => {
  return await userManager.register(email, password, name);
}

export const userLogin = async (email, password) => {
  return await userManager.login(email, password);
}

export const getUserData = async (email) => {
  return await userManager.getUserData(email);
}

export const addUserVehicle = async (email, vehicle) => {
  return await userManager.addVehicle(email, vehicle);
}

export const removeUserVehicle = async (email, vehicleId) => {
  return await userManager.removeVehicle(email, vehicleId);
}

export const selectUserVehicle = async (email, vehicleId) => {
  return await userManager.selectVehicle(email, vehicleId);
}

export const saveUserRoute = async (email, routeData) => {
  return await userManager.saveRoute(email, routeData);
}

export const getUserRoutes = async (email) => {
  return await userManager.getRoutes(email);
}

export const deleteUserRoute = async (email, routeId) => {
  return await userManager.deleteRoute(email, routeId);
}

export const getCarDatabase = async () => {
  return await userManager.getCarDatabase();
}

export const getCurrentUser = () => {
  return userManager.getCurrentUser();
}

export const userLogout = () => {
  userManager.logout();
}

// Export the singleton instance
export default userManager;
