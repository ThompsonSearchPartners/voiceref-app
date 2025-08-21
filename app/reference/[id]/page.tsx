'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Phone, CheckCircle, Mic, MicOff, ArrowRight } from 'lucide-react'

interface Reference {
  id: string
  name: string
  check_id: string
  reference_checks: {
    candidate_name: string
    position: string
  }
}

interface Question {
  id: string
  text: string
  category: string
  order_num: number
}

export default function ReferenceInterview() {
  const params = useParams()
  const [reference, setReference] = useState<Reference | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<string[]>([])
  const [currentResponse, setCurrentResponse] = useState('')
  const [step, setStep] = useState('intro') // intro, interview, completed
  const [loading, setLoading] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)

  useEffect(() => {
    loadReference()
    checkVoiceSupport()
  }, [params.id])

  const checkVoiceSupport = () => {
    setVoiceSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  }

  const loadReference = async () => {
    try {
      const response = await fetch(`/api/reference/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setReference(data.reference)
        setQuestions(data.questions)
        setResponses(new Array(data.questions.length).fill(''))
      }
    } catch (error) {
      console.error('Error loading reference:', error)
    } finally {
      setLoading(false)
    }
  }

  const startInterview = () => {
    setStep('interview')
  }

  const nextQuestion = () => {
    const newResponses = [...responses]
    newResponses[currentQuestion] = currentResponse
    setResponses(newResponses)
    setCurrentResponse('')

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      completeInterview(newResponses)
    }
  }

  const completeInterview = async (finalResponses: string[]) => {
    try {
      await fetch(`/api/reference/${params.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: finalResponses })
      })
      setStep('completed')
    } catch (error) {
      console.error('Error completing interview:', error)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording logic would go here
      setIsRecording(false)
    } else {
      // Start recording logic would go here
      setIsRecording(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!reference) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reference Not Found</h2>
          <p className="text-gray-600">This reference check may have expired or been completed.</p>
        </div>
      </div>
    )
  }

  if (step === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h2>
            <p className="text-gray-600 mb-6">
              Your reference interview for <strong>{reference.reference_checks.candidate_name}</strong> has been completed successfully.
            </p>
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-lg mb-2">What Happens Next</h3>
              <p className="text-gray-700">
                Your responses will be analyzed by our AI system and included in a comprehensive 
                reference report for the hiring team. Your feedback is valuable and confidential.
              </p>
            </div>
            <p className="text-sm text-gray-500">
              You can close this window. Thank you for taking the time to provide this reference.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'interview') {
    const progress = ((currentQuestion + 1) / questions.length) * 100

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Progress Header */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Reference Interview</h2>
                <span className="text-sm text-gray-500">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Current Question */}
            <div className="mb-8">
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  Question {currentQuestion + 1}
                </h3>
                <p className="text-blue-800 text-lg leading-relaxed">
                  {questions[currentQuestion]?.text}
                </p>
              </div>

              {/* Response Input */}
              <div className="space-y-4">
                <textarea
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  placeholder="Type your response here, or use the voice input button below..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />

                {voiceSupported && (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={toggleRecording}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                        isRecording
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-4 h-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Voice Input
                        </>
                      )}
                    </button>
                    <span className="text-sm text-gray-600">
                      {isRecording ? 'Recording... speak now' : 'Click to use voice input'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  if (currentQuestion > 0) {
                    setCurrentQuestion(currentQuestion - 1)
                    setCurrentResponse(responses[currentQuestion - 1] || '')
                  }
                }}
                disabled={currentQuestion === 0}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <button
                onClick={nextQuestion}
                disabled={!currentResponse.trim()}
                className={`flex items-center px-6 py-3 rounded-lg font-medium ${
                  currentResponse.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {currentQuestion === questions.length - 1 ? 'Complete Interview' : 'Next Question'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
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
          <div className="text-center mb-8">
            <Phone className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Reference Interview</h2>
            <p className="text-gray-600">
              For <strong>{reference.reference_checks.candidate_name}</strong> - {reference.reference_checks.position}
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-3">About This Interview</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• {questions.length} questions tailored to this specific role</li>
                <li>• Takes approximately 10-15 minutes to complete</li>
                <li>• You can type responses or use voice input</li>
                <li>• Your responses are confidential and only shared with the hiring team</li>
                <li>• You can navigate back to previous questions if needed</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-2">Ready to Begin?</h3>
              <p className="text-green-800 text-sm mb-4">
                The questions have been customized based on the specific role requirements. 
                Please provide honest, detailed responses to help with the hiring decision.
              </p>
            </div>

            <button
              onClick={startInterview}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg text-lg font-medium hover:bg-blue-700 flex items-center justify-center"
            >
              Start Interview
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
