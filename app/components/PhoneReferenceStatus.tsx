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
      scheduled: { color: 'bg-
