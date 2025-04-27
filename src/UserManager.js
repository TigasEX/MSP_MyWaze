export class UserManager {
  constructor() {
    this.users = [{ email: 'user@user', password: 'password' }]
  }

  register(email, password) {
    if (this.users.find((user) => user.email === email)) {
      throw new Error('User already exists')
    }
    this.users.push({ email, password })
    return true
  }

  login(email, password) {
    const user = this.users.find((user) => user.email === email && user.password === password)
    if (!user) {
      throw new Error('Invalid email or password')
    }
    return true
  }
}

// Create a singleton instance of the UserManager class
const userManager = new UserManager()

// Export individual functions that use the userManager instance
export const userRegister = (email, password) => {
  return userManager.register(email, password)
}

export const userLogin = (email, password) => {
  return userManager.login(email, password)
}
