import { useState, useEffect } from 'react';
import { Phone, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface PhoneSchedulerProps {
  referenceCheckId?: string | null;
  refereeName: string;
  refereeEmail: string;
  refereePhone?: string;
  candidateName?: string;
  candidateEmail?: string;
  position?: string;
  jobDescription?: string;
  hiringManager?: string;
  company?: string;
  onScheduled: (data: any) => void;
}

export default function PhoneSchedulerWithCustomQuestions({
  referenceCheckId,
  refereeName,
  refereeEmail,
  refereePhone = '',
  candidateName = '',
  candidateEmail = '',
  position = '',
  jobDescription = '',
  hiringManager = '',
  company = '',
  onScheduled,
}: PhoneSchedulerProps) {
  const [step, setStep] = useState<'questions' | 'schedule'>('questions');
  const [customQuestions, setCustomQuestions] = useState<string[]>(['']);
  const [phoneNumber, setPhoneNumber] = useState(refereePhone);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set minimum date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setScheduledDate(today);
  }, []);

  const addQuestion = () => {
    setCustomQuestions([...customQuestions, '']);
  };

  const updateQuestion = (index: number, value: string) => {
    const updated = [...customQuestions];
    updated[index] = value;
    setCustomQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== index));
  };

  const handleScheduleCall = async () => {
    if (!phoneNumber || !scheduledDate || !scheduledTime) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Combine date and time into ISO format
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

      const payload = {
        referenceCheckId: referenceCheckId || undefined,
        phoneNumber,
        scheduledTime: scheduledDateTime,
        customQuestions: customQuestions.filter(q => q.trim() !== ''),
        // Include all candidate/reference data if creating new check
        candidateData: !referenceCheckId ? {
          name: candidateName,
          email: candidateEmail,
          position,
          jobDescription,
          hiringManager,
          company,
        } : undefined,
        referenceData: !referenceCheckId ? {
          name: refereeName,
          email: refereeEmail,
          phone: phoneNumber,
        } : undefined,
      };

      const response = await fetch('/api/schedule-phone-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule call');
      }

      const data = await response.json();
      onScheduled(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {step === 'questions' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Add Custom Questions (Optional)</h2>
          <p className="text-gray-600 mb-6">
            Add any specific questions you'd like the AI to ask <strong>{refereeName}</strong> during the phone interview.
            Standard reference check questions will be included automatically.
          </p>

          <div className="space-y-4 mb-6">
            {customQuestions.map((question, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => updateQuestion(index, e.target.value)}
                  placeholder={`Custom question ${index + 1}`}
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Interview will include:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Standard reference check questions</li>
              <li>• Context about the role</li>
              <li>• {customQuestions.filter(q => q.trim()).length} custom question(s)</li>
            </ul>
          </div>

          <button
            onClick={() => setStep('schedule')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Continue to Schedule Call
          </button>
        </div>
      )}

      {step === 'schedule' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button
            onClick={() => setStep('questions')}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Questions
          </button>

          <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 rounded-lg">
            <Phone className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Schedule Phone Call</h3>
              <p className="text-sm text-green-700">We'll call at the scheduled time</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="555-123-4567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-purple-900 mb-2">Interview will include:</h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Standard reference check questions</li>
              <li>• Context about the role</li>
              <li>• {customQuestions.filter(q => q.trim()).length} custom question(s)</li>
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
            disabled={loading || !phoneNumber || !scheduledDate || !scheduledTime}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Scheduling...
              </>
            ) : (
              <>
                <Phone className="w-5 h-5" />
                Schedule Call
              </>
            )}
          </button>

          <p className="text-sm text-gray-500 text-center mt-4">
            <strong>Note:</strong> The AI will call at the scheduled time and conduct the interview
            with your standard questions plus any custom questions you added. Typical call duration: 15-20 minutes.
          </p>
        </div>
      )}
    </div>
  );
}
