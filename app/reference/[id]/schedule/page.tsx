'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Phone, Calendar, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function ReferenceSchedulePage() {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [reference, setReference] = useState<any>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadReferenceData()
    const today = new Date().toISOString().split('T')[0]
    setScheduledDate(today)
  }, [params.id])

  const loadReferenceData = async () => {
    try {
      const response = await fetch(`/api/reference/${params.id}`)
      if (!response.ok) {
        throw new Error('Reference not found')
      }
      
      const data = await response.json()
      setReference(data.reference)
      setPhoneNumber(data.reference.phone || '')
    } catch (err) {
      setError('This reference check link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleCall = async () => {
    if (!phoneNumber || !scheduledDate || !scheduledTime) {
      setError('Please fill in all required fields')
      return
    }

    setScheduling(true)
    setError('')

    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()

      const response = await fetch('/api/schedule-phone-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceCheckId: reference.check_id,
          referenceId: params.id,
          phoneNumber,
          scheduledTime: scheduledDateTime,
          customQuestions: [],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to schedule call')
      }

      setSuccess(true)
    } catch (err) {
      setError('Failed to schedule the call. Please try again.')
    } finally {
      setScheduling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (error && !reference) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Not Valid</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Reference Check Scheduled!</h2>
            <p className="text-gray-600 mb-6">
              Thank you, <strong>{reference.name}</strong>. Your phone reference check for{' '}
              <strong>{reference.reference_checks?.candidate_name}</strong> has been scheduled.
            </p>
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-lg mb-3">Call Details</h3>
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Phone: {phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Date: {new Date(scheduledDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Time: {scheduledTime} EST</span>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-2">What to Expect</h3>
              <p className="text-green-800 text-sm">
                Our AI will call you at the scheduled time to conduct a professional reference check. 
                The call typically takes 10-15 minutes. Please answer from a quiet location.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Phone className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Schedule Your Phone Reference Check</h2>
            <p className="text-gray-600">
              For <strong>{reference?.reference_checks?.candidate_name}</strong> - {reference?.reference_checks?.position}
            </p>
          </div>

          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">How It Works:</h3>
            <ol className="text-sm text-blue-800 space-y-2">
              <li>1. Choose a convenient date and time below</li>
              <li>2. Confirm your phone number</li>
              <li>3. Our AI will call you at the scheduled time</li>
              <li>4. Answer questions about {reference?.reference_checks?.candidate_name}</li>
              <li>5. The call takes 10-15 minutes</li>
            </ol>
          </div>

          <div className="space-y-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="555-123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date *
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time (EST) *
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            onClick={handleScheduleCall}
            disabled={scheduling || !phoneNumber || !scheduledDate || !scheduledTime}
            className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {scheduling ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Phone className="w-5 h-5" />
                Schedule Reference Check
              </>
            )}
          </button>

          <p className="text-sm text-gray-500 text-center mt-4">
            By scheduling, you agree to receive a phone call at the specified time.
          </p>
        </div>
      </div>
    </div>
  )
}
