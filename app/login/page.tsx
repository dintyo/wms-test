'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const router = useRouter()

  const validateInputs = () => {
    let isValid = true

    // Validate username
    if (!username.trim()) {
      setUsernameError('Username is required.')
      isValid = false
    } else if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters long.')
      isValid = false
    } else {
      setUsernameError('')
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError('Password is required.')
      isValid = false
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.')
      isValid = false
    } else {
      setPasswordError('')
    }

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateInputs()) return

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Login
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              required
              className={`appearance-none rounded relative block w-full px-3 py-2 border ${
                usernameError ? 'border-red-500' : 'border-gray-300'
              } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {usernameError && (
              <p className="mt-1 text-sm text-red-500">{usernameError}</p>
            )}
          </div>
          <div>
            <input
              type="password"
              required
              className={`appearance-none rounded relative block w-full px-3 py-2 border ${
                passwordError ? 'border-red-500' : 'border-gray-300'
              } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {passwordError && (
              <p className="mt-1 text-sm text-red-500">{passwordError}</p>
            )}
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
