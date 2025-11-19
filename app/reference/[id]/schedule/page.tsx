'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Phone, Calendar, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function ReferenceSchedulePage() {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [reference, setReference] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [customQuestions, setCustomQuestions] = useState<string[]>([''])
  const [step, setStep] = useState<'questions' | 'schedule' | 'success'>('questions')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [scheduling, setScheduling] = useState(false)
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
      setQuestions(data.questions || [])
      setPhoneNumber(data.reference.phone || '')
    } catch (err) {
      setError('This reference check link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  const addQuestion = () => {
    setCustomQuestions([...customQuestions, ''])
  }

  const updateQuestion = (index: number, value: string) => {
    const updated = [...customQuestions]
    updated[index] = value
    setCustomQuestions(updated)
  }

  const removeQuestion = (index: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== index))
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
          customQuestions: customQuestions.filter(q => q.trim() !== ''),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to schedule call')
      }

      setStep('success')
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

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Interview Scheduled!</h2>
            <p className="text-gray-600 mb-6">
              Thank you, <strong>{reference.name}</strong>. Your phone interview for{' '}
              <strong>{reference.reference_checks?.candidate_name}</strong> has been scheduled.
            </p>
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-lg mb-3">Interview Details</h3>
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
                Our AI interviewer will call you at the scheduled time. The interview typically takes 10-15 minutes.
                Please answer from a quiet location where you can speak freely.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Phone className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Schedule Your Reference Interview</h2>
            <p className="text-gray-600">
              For <strong>{reference?.reference_checks?.candidate_name}</strong> - {reference?.reference_checks?.position}
            </p>
          </div>

          {step === 'questions' && (
            <>
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Interview Questions</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-3">Standard Questions ({questions.length})</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    {questions.slice(0, 3).map((q: any, i: number) => (
                      <li key={i}>• {q.text}</li>
                    ))}
                    {questions.length > 3 && (
                      <li className="text-blue-600 font-medium">+ {questions.length - 3} more questions</li>
                    )}
                  </ul>
                </div>

                <h4 className="font-semibold mb-3">Add Your Own Questions (Optional)</h4>
                <p className="text-sm text-gray-600 mb-4">
                  If there are specific questions you'd like to be asked, add them below.
                </p>
                
                <div className="space-y-3 mb-4">
                  {customQuestions.map((question, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={question}
                        onChange={(e) => updateQuestion(index, e.target.value)}
                        placeholder={`Optional question ${index + 1}`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      {customQuestions.length > 1 && (
                        <button
                          onClick={() => removeQuestion(index)}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={addQuestion}
                  className="text-blue-600 hover:text-blue-700 font-medium mb-6"
                >
                  + Add Another Question
                </button>
              </div>

              <button
                onClick={() => setStep('schedule')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Continue to Schedule Time
              </button>
            </>
          )}

          {step === 'schedule' && (
            <>
              <button
                onClick={() => setStep('questions')}
                className="text-sm text-gray-600 hover:text-gray-900 mb-6"
              >
                ← Back to Questions
              </button>

              <div className="space-y-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
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
                      Date
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
                      Time (EST)
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

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-purple-900 mb-2">Interview Details:</h3>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• {questions.length} standard questions</li>
                  <li>• {customQuestions.filter(q => q.trim()).length} custom question(s)</li>
                  <li>• Duration: 10-15 minutes</li>
                  <li>• Automated AI interviewer will call you</li>
                </ul>
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
                    Confirm Schedule
                  </>
                )}
              </button>

              <p className="text-sm text-gray-500 text-center mt-4">
                By scheduling, you agree to receive a phone call at the specified time.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
