'use client'

import { Mic } from 'lucide-react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { isSignedIn } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Mic className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">VoiceRef</h1>
          </div>
          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <button onClick={() => signOut()}>Sign Out</button>
            ) : (
              <button onClick={() => router.push('/sign-in')}>Sign In</button>
            )}
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h2 className="text-5xl font-bold mb-6">VoiceRef</h2>
        <p className="text-xl mb-8">AI-Powered Reference Checking</p>
      </div>
    </div>
  )
}
