import { useState } from 'react';
import { Calendar, Phone, Clock, CheckCircle, AlertCircle, FileText, Sparkles } from 'lucide-react';

interface PhoneSchedulerProps {
  referenceCheckId: string;
  refereeEmail?: string;
  refereeName?: string;
  onScheduled?: (scheduledData: any) => void;
}

export default function PhoneSchedulerWithCustomQuestions({
  referenceCheckId,
  refereeEmail,
  refereeName,
  onScheduled
}: PhoneSchedulerProps) {
  const [step, setStep] = useState<'questions' | 'schedule'>('questions');
  
  // Step 1: Questions
  const [jobDescription, setJobDescription] = useState('');
  const [customQuestions, setCustomQuestions] = useState('');
  
  // Step 2: Scheduling
  const [phoneNumber, setPhoneNumber] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return [match[1], match[2], match[3]].filter(x => x).join('-');
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const validateScheduleInputs = () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    if (!scheduledDate) {
      setError('Please select a date');
      return false;
    }
    if (!scheduledTime) {
      setError('Please select a time');
      return false;
    }
    
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      setError('Please select a future date and time');
      return false;
    }
    
    return true;
  };

  const handleContinueToSchedule = () => {
    setError('');
    setStep('schedule');
  };

  const handleScheduleCall = async () => {
    setError('');
    
    if (!validateScheduleInputs()) return;

    setIsScheduling(true);

    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);

      // Parse custom questions from textarea (one per line)
      const customQuestionsArray = customQuestions
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 0);

      const response = await fetch('/api/schedule-phone-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referenceCheckId,
          phoneNumber: `+1${cleanPhone}`,
          scheduledTime: scheduledDateTime.toISOString(),
          refereeEmail,
          refereeName,
          jobDescription: jobDescription.trim(),
          customQuestions: customQuestionsArray,
          vapiPhoneNumberId: '88a8d0a5-f407-4198-a1ab-8b9c5fd1a7b7'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule call');
      }

      setSuccess(true);
      if (onScheduled) {
        onScheduled(data);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to schedule call. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Step 1: Job Description & Custom Questions
  if (step === 'questions') {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Customize Reference Check Questions
            </h3>
            <p className="text-sm text-gray-600">
              Add job-specific questions in addition to our standard ones
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description (Optional)
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here. The AI will use this context when conducting the interview..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              This helps the AI understand the role and ask relevant follow-up questions
            </p>
          </div>

          {/* Custom Questions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Additional Custom Questions (Optional)
            </label>
            <textarea
              value={customQuestions}
              onChange={(e) => setCustomQuestions(e.target.value)}
              placeholder="Enter additional questions (one per line):
Can you describe their experience with [specific skill]?
How did they handle [specific situation]?
What makes them qualified for this role?"
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              One question per line. These will be asked in addition to our standard questions.
            </p>
          </div>

          {/* Standard Questions Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">
              Standard questions that are always asked:
            </p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• How long did you work with this candidate?</li>
              <li>• What were their primary responsibilities?</li>
              <li>• What were their key strengths?</li>
              <li>• What areas could they improve in?</li>
              <li>• How would you describe their work ethic?</li>
              <li>• Would you hire them again? Why or why not?</li>
            </ul>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinueToSchedule}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Continue to Schedule Call
            <Calendar className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Schedule the Call
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <button
        onClick={() => setStep('questions')}
        className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
      >
        ← Back to Questions
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Phone className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Schedule Phone Call
          </h3>
          <p className="text-sm text-gray-600">
            We'll call at the scheduled time
          </p>
        </div>
      </div>

      {success ? (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-900">Call Scheduled!</p>
            <p className="text-sm text-green-700">
              We'll call {phoneNumber} on {scheduledDate} at {scheduledTime}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {/* Phone Number Input */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="555-123-4567"
                maxLength={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Input */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                id="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={today}
                max={maxDate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Time Input */}
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Time (EST)
              </label>
              <input
                type="time"
                id="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Summary of what will be asked */}
            {(jobDescription || customQuestions) && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs font-medium text-purple-900 mb-1">
                  Interview will include:
                </p>
                <ul className="text-xs text-purple-800 space-y-0.5">
                  <li>• Standard reference check questions</li>
                  {jobDescription && <li>• Context about the role</li>}
                  {customQuestions && (
                    <li>• {customQuestions.split('\n').filter(q => q.trim()).length} custom questions</li>
                  )}
                </ul>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Schedule Button */}
            <button
              onClick={handleScheduleCall}
              disabled={isScheduling}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isScheduling ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5" />
                  Schedule Call
                </>
              )}
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> The AI will call at the scheduled time and conduct the interview
              with your standard questions plus any custom questions you added. Typical call duration: 15-20 minutes.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
