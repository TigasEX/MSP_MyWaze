import { v4 as uuidv4 } from 'uuid'

const generateUniqueKey = () => {
  return uuidv4()
}

const setSessionToken = (email) => {
  const uniqueKey = generateUniqueKey()
  const token = `${email}:${uniqueKey}`
  document.cookie = `sessionToken=${token}; max-age=3600` // Set the session cookie with a 1-hour expiration
}

const isAuthenticated = () => {
  if (!document.cookie) return false
  const sessionCookie = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('sessionToken='))
  if (!sessionCookie) return false

  const token = sessionCookie.split('=')[1]
  const [email, key] = token.split(':')

  return email && key && key.length > 0
}

const getSessionToken = () => {
  const sessionCookie = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('sessionToken='))
  if (!sessionCookie) return null

  const token = sessionCookie.split('=')[1]
  return token.split(':')[0] // Return the email part of the token
}

export { setSessionToken, isAuthenticated, getSessionToken }
