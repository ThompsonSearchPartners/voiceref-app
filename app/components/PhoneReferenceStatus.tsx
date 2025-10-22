'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Phone, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PhoneReferenceCheck {
  id: string;
  reference_name: string;
  reference_phone: string;
  scheduled_time: string;
  call_status: string;
  call_duration_seconds: number | null;
  recording_url: string | null;
  created_at: string;
}

interface CallTranscript {
  transcript_text: string;
  created_at: string;
}

interface PhoneReferenceStatusProps {
  referenceCheckId: string;
}

export default function PhoneReferenceStatus({ referenceCheckId }: PhoneReferenceStatusProps) {
  const [phoneChecks, setPhoneChecks] = useState<PhoneReferenceCheck[]>([]);
  const [selectedCheck, setSelectedCheck] = useState<PhoneReferenceCheck | null>(null);
  const [transcript, setTranscript] = useState<CallTranscript | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhoneChecks();
    
    const channel = supabase
      .channel('phone-reference-checks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'phone_reference_checks',
          filter: `reference_check_id=eq.${referenceCheckId}`,
        },
        (payload) => {
          console.log('Change received!', payload);
          loadPhoneChecks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [referenceCheckId]);

  const loadPhoneChecks = async () => {
    try {
      const { data, error } = await supabase
        .from('phone_reference_checks')
        .select('*')
        .eq('reference_check_id', referenceCheckId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhoneChecks(data || []);
    } catch (error) {
      console.error('Error loading phone checks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTranscript = async (phoneCheckId: string) => {
    try {
      const { data, error } = await supabase
        .from('call_transcripts')
        .select('transcript_text, created_at')
        .eq('phone_reference_check_id', phoneCheckId)
        .single();

      if (error) throw error;
      setTranscript(data);
    } catch (error) {
      console.error('Error loading transcript:', error);
      setTranscript(null);
    }
  };

  const handleViewDetails = (check: PhoneReferenceCheck) => {
    setSelectedCheck(check);
    if (check.call_status === 'completed') {
      loadTranscript(check.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock, text: 'Pending' },
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'Scheduled' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: Loader, text: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Completed' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Failed' },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {badge.text}
      </span>
    );
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (phoneChecks.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
        <Phone className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No phone reference checks scheduled yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900">Scheduled Phone Calls</h3>

      <div className="grid gap-4">
        {phoneChecks.map((check) => (
          <div
            key={check.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-lg">{check.reference_name}</h4>
                  {getStatusBadge(check.call_status)}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <Phone className="inline h-4 w-4 mr-1" />
                    {check.reference_phone}
                  </p>
                  <p>
                    <Clock className="inline h-4 w-4 mr-1" />
                    Scheduled: {new Date(check.scheduled_time).toLocaleString()}
                  </p>
                  {check.call_duration_seconds && (
                    <p>Duration: {formatDuration(check.call_duration_seconds)}</p>
                  )}
                </div>
              </div>

              {check.call_status === 'completed' && (
                <button
                  onClick={() => handleViewDetails(check)}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  View Transcript
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Call Transcript
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {selectedCheck.reference_name} • {new Date(selectedCheck.scheduled_time).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCheck(null);
                    setTranscript(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {transcript ? (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                    {transcript.transcript_text}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              )}
            </div>

            {selectedCheck.recording_url && (
              <div className="p-6 border-t border-gray-200">
                <audio controls className="w-full">
                  <source src={selectedCheck.recording_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
