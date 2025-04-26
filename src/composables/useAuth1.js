import { ref } from 'vue'
import { UserManager } from '@/UserManager'
import { setSessionToken, getSessionToken } from '@/tokenOperations'

const email = ref('')
const password = ref('')
const isAuthenticated = ref(false)

const userManager = new UserManager()

export function useAuth1() {
  const login = () => {
    try {
      userManager.login(email.value, password.value)
      isAuthenticated.value = true
      setSessionToken(email.value)
    } catch (e) {
      alert(e.message)
    }
  }

  const register = () => {
    try {
      userManager.register(email.value, password.value)
      isAuthenticated.value = true
      setSessionToken(email.value)
    } catch (e) {
      alert(e.message)
    }
  }

  const logout = () => {
    document.cookie = 'sessionToken=; path=/; max-age=0'
    isAuthenticated.value = false
  }

  const initAuth = () => {
    const token = getSessionToken()
    if (token) {
      email.value = token
      isAuthenticated.value = true
    }
  }

  return { email, password, isAuthenticated, login, register, logout, initAuth }
}
