'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2, Mail, Phone as PhoneIcon, User, Building, CheckCircle } from 'lucide-react'

interface Reference {
  name: string
  email: string
  phone: string
  relationship: string
  company: string
}

export default function AddReferencesPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [referenceCheck, setReferenceCheck] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [references, setReferences] = useState<Reference[]>([
    { name: '', email: '', phone: '', relationship: '', company: '' },
    { name: '', email: '', phone: '', relationship: '', company: '' },
  ])

  useEffect(() => {
    // ✅ FIX: Only load if params.id exists
    if (params.id) {
      loadReferenceCheck()
    } else {
      setError('This link is invalid or has expired.')
      setLoading(false)
    }
  }, [params.id])

  const loadReferenceCheck = async () => {
    // ✅ FIX: Double-check params.id exists before API call
    if (!params.id) {
      setError('This link is invalid or has expired.')
      setLoading(false)
      return
    }

    try {
      console.log('Fetching reference check:', params.id) // Debug log
      const response = await fetch(`/api/reference-check/${params.id}`)
      
      console.log('Response status:', response.status) // Debug log
      
      if (!response.ok) {
        throw new Error('Reference check not found')
      }
      
      const data = await response.json()
      console.log('Reference check data:', data) // Debug log
      setReferenceCheck(data)
    } catch (err) {
      console.error('Error loading reference check:', err) // Debug log
      setError('This link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  const addReference = () => {
    if (references.length < 5) {
      setReferences([...references, { name: '', email: '', phone: '', relationship: '', company: '' }])
    }
  }

  const removeReference = (index: number) => {
    if (references.length > 2) {
      setReferences(references.filter((_, i) => i !== index))
    }
  }

  const updateReference = (index: number, field: keyof Reference, value: string) => {
    const updated = [...references]
    updated[index][field] = value
    setReferences(updated)
  }

  const validateForm = () => {
    // Check if at least 2 references are filled
    const filledReferences = references.filter(ref => 
      ref.name.trim() && ref.email.trim() && ref.phone.trim() && ref.relationship.trim()
    )
    
    if (filledReferences.length < 2) {
      setError('Please add at least 2 complete references')
      return false
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    for (const ref of filledReferences) {
      if (!emailRegex.test(ref.email)) {
        setError(`Invalid email address for ${ref.name}`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    setError('')
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const filledReferences = references.filter(ref => 
        ref.name.trim() && ref.email.trim() && ref.phone.trim() && ref.relationship.trim()
      )

      const response = await fetch('/api/submit-references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceCheckId: params.id,
          references: filledReferences,
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit references')
      }

      setSuccess(true)
    } catch (err) {
      setError('Failed to submit references. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (error && !referenceCheck) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">References Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for submitting your references. Each reference will receive an email 
              with a link to schedule their phone interview at a time that works for them.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-2">What happens next:</h3>
              <ul className="text-sm text-green-800 space-y-2 text-left">
                <li>✅ Each reference receives an email</li>
                <li>✅ They choose a convenient time for the call</li>
                <li>✅ Our AI conducts professional phone interviews</li>
                <li>✅ {referenceCheck.company} receives the complete report</li>
              </ul>
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
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Add Your References</h2>
            <p className="text-gray-600">
              For <strong>{referenceCheck?.candidate_name}</strong> - {referenceCheck?.position} at {referenceCheck?.company}
            </p>
          </div>

          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
            <ol className="text-sm text-blue-800 space-y-2">
              <li>1. Add 2-5 professional references below</li>
              <li>2. Each reference will receive an email to schedule their phone interview</li>
              <li>3. They pick a time that works for them</li>
              <li>4. Our AI conducts a professional 10-15 minute phone interview</li>
              <li>5. {referenceCheck?.company} receives the complete reference report</li>
            </ol>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-6 mb-6">
            {references.map((ref, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 relative">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Reference {index + 1}</h3>
                  {references.length > 2 && (
                    <button
                      onClick={() => removeReference(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="inline w-4 h-4 mr-1" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={ref.name}
                      onChange={(e) => updateReference(index, 'name', e.target.value)}
                      placeholder="John Smith"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="inline w-4 h-4 mr-1" />
                      Email *
                    </label>
                    <input
                      type="email"
                      value={ref.email}
                      onChange={(e) => updateReference(index, 'email', e.target.value)}
                      placeholder="john@company.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <PhoneIcon className="inline w-4 h-4 mr-1" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={ref.phone}
                      onChange={(e) => updateReference(index, 'phone', e.target.value)}
                      placeholder="555-123-4567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship *
                    </label>
                    <select
                      value={ref.relationship}
                      onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select relationship</option>
                      <option value="Direct Manager">Direct Manager</option>
                      <option value="Senior Manager">Senior Manager</option>
                      <option value="Colleague">Colleague</option>
                      <option value="Team Lead">Team Lead</option>
                      <option value="HR Contact">HR Contact</option>
                      <option value="Client">Client</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="inline w-4 h-4 mr-1" />
                      Company (Optional)
                    </label>
                    <input
                      type="text"
                      value={ref.company}
                      onChange={(e) => updateReference(index, 'company', e.target.value)}
                      placeholder="Company Name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {references.length < 5 && (
            <button
              onClick={addReference}
              className="w-full mb-6 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Another Reference (Optional)
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Submit References
              </>
            )}
          </button>

          <p className="text-sm text-gray-500 text-center mt-4">
            By submitting, you confirm these references have agreed to be contacted.
          </p>
        </div>
      </div>
    </div>
  )
}
