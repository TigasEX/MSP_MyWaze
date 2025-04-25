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
