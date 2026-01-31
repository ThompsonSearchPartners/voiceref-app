'use client';

import { useState } from 'react';
import { Calendar, Phone, Clock, User, Mail, CheckCircle } from 'lucide-react';

interface PhoneReferenceSchedulerProps {
  referenceCheckId: string;
  questions: string[];
  candidateName?: string;
  onScheduled?: () => void;
  defaultName?: string;
  defaultPhone?: string;
  defaultEmail?: string;
}

export default function PhoneReferenceScheduler({
  referenceCheckId,
  questions,
  candidateName = 'the candidate',
  onScheduled,
  defaultName = '',
  defaultPhone = '',
  defaultEmail = '',
}: PhoneReferenceSchedulerProps) {
  const [referenceName, setReferenceName] = useState(defaultName);
  const [referencePhone, setReferencePhone] = useState(defaultPhone);
  const [referenceEmail, setReferenceEmail] = useState(defaultEmail);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setReferencePhone(formatted);
  };

  const validateForm = () => {
    if (!referenceName.trim()) {
      setError('Please enter the reference name');
      return false;
    }
    if (!referencePhone.trim() || referencePhone.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    if (!scheduledDate || !scheduledTime) {
      setError('Please select a date and time');
      return false;
    }
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledDateTime < new Date()) {
      setError('Scheduled time must be in the future');
      return false;
    }
    return true;
  };

  const handleSchedule = async () => {
    setError('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      const response = await fetch('/api/phone-reference/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceCheckId,
          referenceName,
          referencePhone: referencePhone.replace(/\D/g, ''),
          referenceEmail: referenceEmail || null,
          scheduledTime: scheduledDateTime,
          questions,
          candidateName,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule call');
      }
      setSuccess(true);
      if (onScheduled) onScheduled();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule call');
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return {
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
    };
  };

  const minDateTime = getMinDateTime();

  // Show confirmation screen after successful scheduling
  if (success) {
    const formattedDate = new Date(`${scheduledDate}T${scheduledTime}`).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = new Date(`${scheduledDate}T${scheduledTime}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return (
      <div className="w-full max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg border border-gray-200 text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Call Scheduled!</h2>
        <p className="text-lg text-gray-600 mb-8">
          Your reference check call has been scheduled successfully.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
          <h3 className="font-semibold text-gray-900 mb-4">Call Details:</h3>
          <div className="space-y-3">
            <p className="flex items-center text-gray-700">
              <Calendar className="w-5 h-5 mr-3 text-blue-600" />
              <span><strong>Date:</strong> {formattedDate}</span>
            </p>
            <p className="flex items-center text-gray-700">
              <Clock className="w-5 h-5 mr-3 text-blue-600" />
              <span><strong>Time:</strong> {formattedTime}</span>
            </p>
            <p className="flex items-center text-gray-700">
              <Phone className="w-5 h-5 mr-3 text-blue-600" />
              <span><strong>Phone:</strong> {referencePhone}</span>
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
          <h3 className="font-semibold text-blue-900 mb-2">What happens next:</h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>✓ You will receive an automated call at the scheduled time</li>
            <li>✓ The call will take approximately 10-15 minutes</li>
            <li>✓ Our AI will ask you {questions.length} questions about {candidateName}</li>
            <li>✓ Just answer honestly and naturally</li>
          </ul>
        </div>

        <p className="mt-8 text-gray-500 text-sm">
          You can close this page now. Thank you for your time!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Schedule Phone Reference Check
        </h3>
        <p className="text-gray-600">
          An AI-powered call will be scheduled to interview you about {candidateName}.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline h-4 w-4 mr-1" />
            Reference Name *
          </label>
          <input
            type="text"
            value={referenceName}
            onChange={(e) => setReferenceName(e.target.value)}
            placeholder="John Smith"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="inline h-4 w-4 mr-1" />
            Phone Number *
          </label>
          <input
            type="tel"
            value={referencePhone}
            onChange={handlePhoneChange}
            placeholder="(555) 123-4567"
            maxLength={14}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="inline h-4 w-4 mr-1" />
            Email (optional)
          </label>
          <input
            type="email"
            value={referenceEmail}
            onChange={(e) => setReferenceEmail(e.target.value)}
            placeholder="john@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Date *
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={minDateTime.date}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              Time *
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium mb-2">
            Questions to be asked ({questions.length}):
          </p>
          <ul className="text-sm text-blue-700 space-y-1">
            {questions.slice(0, 3).map((q, i) => (
              <li key={i}>• {q}</li>
            ))}
            {questions.length > 3 && (
              <li className="text-blue-600">+ {questions.length - 3} more questions</li>
            )}
          </ul>
        </div>

        <button
          onClick={handleSchedule}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              Scheduling...
            </>
          ) : (
            <>
              <Phone className="h-5 w-5" />
              Schedule Phone Call
            </>
          )}
        </button>
      </div>

      <div className="mt-6 text-xs text-gray-500 space-y-1">
        <p>• You will receive an automated call at the scheduled time</p>
        <p>• Call duration: approximately 10-15 minutes</p>
        <p>• Full transcript will be available after the call</p>
      </div>
    </div>
  );
}
