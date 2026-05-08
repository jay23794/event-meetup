export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

export interface AuthResponse {
  jwt: string
  user: User
}
