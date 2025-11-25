'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Mic, Mail, Loader2, Plus, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState([])
  const [candidateData, setCandidateData] = useState({
    name: '',
    email: '',
    position: '',
    jobDescription: '',
    company: ''
  })

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/create-candidate-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: candidateData,
          hrEmail: user?.emailAddresses?.[0]?.emailAddress || ''
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create reference check')
      }

      alert('✅ Email sent to candidate! They will add their references.')
      setShowForm(false)
      setCandidateData({
        name: '',
        email: '',
        position: '',
        jobDescription: '',
        company: ''
      })
      // Refresh requests list
      // loadRequests()
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error creating reference check. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Mic className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">VoiceRef Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Hi, {user.firstName || 'there'}!</span>
            <button 
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName}!
          </h2>
          <p className="text-gray-600 mb-6">
            Create a new reference check or view your existing requests below.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Reference Check
          </button>
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Requests</h3>
          
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No reference checks yet</p>
              <p className="text-sm text-gray-400">
                Create your first reference check to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request: any) => (
                <div 
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{request.candidateName}</h4>
                      <p className="text-sm text-gray-600">{request.position}</p>
                      <p className="text-sm text-gray-500 mt-1">{request.candidateEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {request.status === 'pending' && (
                        <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm">
                          <Clock className="w-4 h-4" />
                          Pending
                        </span>
                      )}
                      {request.status === 'completed' && (
                        <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Reference Check Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">New Reference Check</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-3xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <h4 className="text-lg font-semibold">Candidate & Job Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Candidate Name *"
                    value={candidateData.name}
                    onChange={(e) => setCandidateData({...candidateData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="email"
                    placeholder="Candidate Email *"
                    value={candidateData.email}
                    onChange={(e) => setCandidateData({...candidateData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Position Title *"
                    value={candidateData.position}
                    onChange={(e) => setCandidateData({...candidateData, position: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Your Company *"
                    value={candidateData.company}
                    onChange={(e) => setCandidateData({...candidateData, company: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    placeholder="Paste the complete job description here..."
                    value={candidateData.jobDescription}
                    onChange={(e) => setCandidateData({...candidateData, jobDescription: e.target.value})}
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>What happens next:</strong> The candidate will receive an email with a link to add their own references (names, phone numbers, emails, etc.). Each reference will then be emailed to schedule their phone interview.
                  </p>
                </div>
                
                <button
                  onClick={handleSubmit}
                  disabled={loading || !candidateData.name || !candidateData.email || !candidateData.position || !candidateData.jobDescription || !candidateData.company}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Send Email to Candidate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
