'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import PhoneReferenceScheduler from '@/app/components/PhoneReferenceScheduler'

export default function ReferenceSchedulePage() {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [reference, setReference] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    loadReferenceData()
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
    } catch (err) {
      setError('This reference check link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (error || !reference) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Not Valid</h2>
          <p className="text-gray-600">{error || 'This reference check link is invalid or has expired.'}</p>
        </div>
      </div>
    )
  }

  const questionTexts = questions.map(q => q.text)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <PhoneReferenceScheduler
          referenceCheckId={reference.check_id}
          questions={questionTexts}
          candidateName={reference.reference_checks?.candidate_name || 'the candidate'}
          defaultName={reference.name}
          defaultPhone={reference.phone}
          defaultEmail={reference.email}
        />
      </div>
    </div>
  )
}
