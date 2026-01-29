'use client'

import { useEffect } from 'react'

export default function SignUpPage() {
  useEffect(() => {
    window.location.href = 'https://relaxing-crow-75.clerk.accounts.dev/sign-up?redirect_url=' + encodeURIComponent(window.location.origin + '/dashboard')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <p>Redirecting to sign up...</p>
    </div>
  )
}
