import PhoneReferenceScheduler from '@/components/PhoneReferenceScheduler'
import PhoneReferenceStatus from '@/components/PhoneReferenceStatus'

export default function TestPhonePage() {
  const testReferenceCheckId = 'test-123' // Replace with real ID later
  
  const questions = [
    "What was your professional relationship with the candidate?",
    "Can you describe their key strengths?",
    "Would you hire them again?"
  ]

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Phone Reference Check Test</h1>
      
      <PhoneReferenceScheduler
        referenceCheckId={testReferenceCheckId}
        questions={questions}
        candidateName="Test Candidate"
      />
      
      <PhoneReferenceStatus 
        referenceCheckId={testReferenceCheckId}
      />
    </div>
  )
}
