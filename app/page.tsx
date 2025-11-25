'use client'

import React, { useState } from 'react'
import { Mic, Phone, Clock, Brain, CheckCircle, ArrowRight, Users, Star, Mail, LogOut } from 'lucide-react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [showForm, setShowForm] = useState(false)
  const { isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleGetStarted = () => {
    if (isSignedIn) {
      setShowForm(true)
    } else {
      router.push('/sign-in')
    }
  }

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
              <>
                <span className="text-gray-600">
                  Hi, {user?.firstName || user?.emailAddresses?.[0]?.emailAddress}
                </span>
                <button 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <button 
                onClick={() => router.push('/sign-in')}
                className="text-gray-600 hover:text-gray-900"
              >
                Sign In
              </button>
            )}
            <button 
              onClick={handleGetStarted}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <div className=
