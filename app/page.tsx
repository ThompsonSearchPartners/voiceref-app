'use client'

import React, { useState } from 'react'
import { Mic, Phone, Clock, Shield, Brain, CheckCircle, ArrowRight, Users, Star } from 'lucide-react'

export default function Home() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Mic className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">VoiceRef</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-600 hover:text-gray-900">Sign In</button>
            <button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Web Reference Checking
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Paste any job description and get custom AI-generated reference questions. 
            References complete voice or text interviews online at their convenience, 
            and you get detailed analysis tailored to your specific role requirements.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 flex items-center mx-auto"
          >
            Start Custom Reference Check - $149
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>

        {/* Social Proof */}
        <div className="text-center mb-16">
          <p className="text-gray-600 mb-4">Trusted by forward-thinking recruiters</p>
          <div className="flex items-center justify-center space-x-8 text-gray-400">
            <div className="flex items-center">
              <Star className="w-5 h-5 text-yellow-400 mr-1" />
              <span className="text-gray-600">4.9/5 completion rate</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-1" />
              <span className="text-gray-600">10x faster than email</span>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-1" />
              <span className="text-gray-600">500+ interviews completed</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <Brain className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Smart Question Generation</h3>
            <p className="text-gray-600">
              Paste any job description and our AI generates tailored reference questions 
              specific to the role's requirements and responsibilities.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg">
            <Phone className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Web-Based Interviews</h3>
            <p className="text-gray-600">
              References receive a secure link to complete the interview online. 
              Voice or text responses, at their convenience, on any device.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg">
            <Shield className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Role-Specific Analysis</h3>
            <p className="text-gray-600">
              Advanced AI analysis and insights focused on the exact skills 
              and qualities needed for your specific position.
            </p>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-2xl p-12 shadow-xl mb-16">
          <h3 className="text-3xl font-bold text-center mb-12">How VoiceRef Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">1. Paste Job Description</h4>
              <p className="text-gray-600 text-sm">AI generates custom questions for the role</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">2. Send Web Links</h4>
              <p className="text-gray-600 text-sm">References get secure interview links via email</p>
            </div>
            <div className="tex
