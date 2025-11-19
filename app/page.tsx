'use client'

import React, { useState } from 'react'
import { Mic, Phone, Clock, Shield, Brain, CheckCircle, ArrowRight, Users, Star, Mail } from 'lucide-react'

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
            AI-Powered Phone Reference Checking
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Send your reference a link to schedule their own phone interview. 
            Our AI calls them at their chosen time with custom questions based on your job description.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 flex items-center mx-auto"
          >
            Start Reference Check - $149
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
              <span className="text-gray-600">References schedule instantly</span>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-1" />
              <span className="text-gray-600">500+ calls completed</span>
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
            <Mail className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Reference Self-Scheduling</h3>
            <p className="text-gray-600">
              References receive an email with a link to schedule their own interview time. 
              No back-and-forth - they pick what works for them.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg">
            <Phone className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Automated AI Interviews</h3>
            <p className="text-gray-600">
              Our AI calls at the scheduled time and conducts a professional interview 
              with natural conversation and intelligent follow-up questions.
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
              <h4 className="font-semibold mb-2">1. Submit Reference</h4>
              <p className="text-gray-600 text-sm">Add reference info and paste job description</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">2. Reference Gets Email</h4>
              <p className="text-gray-600 text-sm">Secure link to schedule interview</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">3. They Pick a Time</h4>
              <p className="text-gray-600 text-sm">Choose date and time that works for them</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="font-semibold mb-2">4. AI Conducts Call</h4>
              <p className="text-gray-600 text-sm">Professional interview at scheduled time</p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl p-12 shadow-xl mb-16">
          <h3 className="text-3xl font-bold text-center mb-8">Simple, Transparent Pricing</h3>
          <div className="max-w-md mx-auto text-center">
            <div className="text-4xl font-bold text-blue-600 mb-4">$149</div>
            <div className="text-lg text-gray-600 mb-6">per candidate reference check</div>
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                AI-generated custom questions for any role
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                Self-scheduling for up to 5 references
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                Professional AI phone interviewer
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                Complete transcripts of all interviews
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                Role-specific analysis and insights
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                Detailed report within 24 hours
              </li>
            </ul>
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg text-lg font-medium hover:bg-blue-700"
            >
              Start Reference Check
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to transform your hiring process?</h3>
          <p className="text-xl text-gray-600 mb-8">Join innovative recruiters using AI-powered phone reference checking</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700"
          >
            Get Started Today
          </button>
        </div>
      </div>

      {/* Reference Check Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Start Reference Check</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-3xl"
                >
                  ×
                </button>
              </div>
              <ReferenceCheckForm onClose={() => setShowForm(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Component for the reference check form
function ReferenceCheckForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [candidateData, setCandidateData] = useState({
    name: '',
    position: '',
    jobDescription: '',
    hiringManager: '',
    company: ''
  })
  const [currentReference, setCurrentReference] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: '',
    company: ''
  })

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/create-reference-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: candidateData,
          reference: currentReference
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create reference check')
      }

      const data = await response.json()
      setStep(3) // Success
    } catch (error) {
      console.error('Error:', error)
      alert('Error creating reference check. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 3) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-4">Email Sent!</h3>
        <p className="text-gray-600 mb-6">
          We've sent an email to <strong>{currentReference.email}</strong> with a link to schedule their phone reference check.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
          <h4 className="font-semibold text-blue-900 mb-2">What happens next:</h4>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✅ Reference receives email with scheduling link</li>
            <li>✅ They pick a convenient time for the phone call</li>
            <li>✅ Our AI calls them at that time</li>
            <li>✅ You receive the transcript and analysis within 24 hours</li>
          </ul>
        </div>
        <button
          onClick={onClose}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Done
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {step === 1 && (
        <>
          <h4 className="text-lg font-semibold">Position & Job Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Candidate Name"
              value={candidateData.name}
              onChange={(e) => setCandidateData({...candidateData, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 md:col-span-2"
            />
            <input
              type="text"
              placeholder="Position Title"
              value={candidateData.position}
              onChange={(e) => setCandidateData({...candidateData, position: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Your Name (Hiring Manager)"
              value={candidateData.hiringManager}
              onChange={(e) => setCandidateData({...candidateData, hiringManager: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Your Company"
              value={candidateData.company}
              onChange={(e) => setCandidateData({...candidateData, company: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 md:col-span-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description *
            </label>
            <textarea
              placeholder="Paste the complete job description here. Our AI will generate tailored reference questions based on the specific requirements and responsibilities..."
              value={candidateData.jobDescription}
              onChange={(e) => setCandidateData({...candidateData, jobDescription: e.target.value})}
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              💡 The more detailed the job description, the better our AI can tailor the reference questions
            </p>
          </div>
          
          <button
            onClick={() => setStep(2)}
            disabled={!candidateData.name || !candidateData.position || !candidateData.hiringManager || !candidateData.jobDescription}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            Next: Add Reference Contact
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h4 className="text-lg font-semibold">Reference Contact Information</h4>
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Reference Name *"
                value={currentReference.name}
                onChange={(e) => setCurrentReference({...currentReference, name: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email *"
                value={currentReference.email}
                onChange={(e) => setCurrentReference({...currentReference, email: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                value={currentReference.phone}
                onChange={(e) => setCurrentReference({...currentReference, phone: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={currentReference.relationship}
                onChange={(e) => setCurrentReference({...currentReference, relationship: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Relationship *</option>
                <option value="Direct Manager">Direct Manager</option>
                <option value="Senior Manager">Senior Manager</option>
                <option value="Colleague">Colleague</option>
                <option value="Team Lead">Team Lead</option>
                <option value="HR Contact">HR Contact</option>
                <option value="Client">Client</option>
              </select>
              <input
                type="text"
                placeholder="Company"
                value={currentReference.company}
                onChange={(e) => setCurrentReference({...currentReference, company: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 md:col-span-2"
              />
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">How it works:</p>
                  <p className="text-sm text-blue-800">
                    We'll email {currentReference.name || 'the reference'} a secure link where they can schedule 
                    their own phone reference check. Our AI will then call them at their chosen time with 
                    custom questions based on your job description.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !currentReference.name || !currentReference.email || !currentReference.phone || !currentReference.relationship}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Send Email to Reference
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
