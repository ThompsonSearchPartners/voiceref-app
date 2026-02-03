'use client'

import { Mic, Phone, Clock, Brain, CheckCircle, ArrowRight, Users, Star, Mail } from 'lucide-react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleGetStarted = () => {
    if (isSignedIn) {
      router.push('/dashboard')
    } else {
      router.push('/sign-in')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Mic className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">VoiceRef</h1>
          </div>
          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <>
                <span className="text-gray-600">Hi, {user?.firstName || 'there'}</span>
                <button 
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button 
                onClick={() => router.push('/sign-in')}
                className="text-gray-600 hover:text-gray-900"
              >
                Sign In
              </button>
            )}
            <button 
              onClick={handleGetStarted}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Phone Reference Checking
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Send your candidate a link to add their references. 
            Our AI calls each reference at their chosen time with custom questions based on your job description.
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 flex items-center mx-auto"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>

        <div className="text-center mb-16">
          <p className="text-gray-600 mb-4">Trusted by forward-thinking recruiters</p>
          <div className="flex items-center justify-center space-x-8 text-gray-400">
            <div className="flex items-center">
              <Star className="w-5 h-5 text-yellow-400 mr-1" />
              <span className="text-gray-600">4.9/5 completion rate</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-1" />
              <span className="text-gray-600">References schedule instantly</span>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-1" />
              <span className="text-gray-600">500+ calls completed</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <Brain className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Smart Question Generation</h3>
            <p className="text-gray-600">
              Paste any job description and our AI generates tailored reference questions 
              specific to the role requirements and responsibilities.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg">
            <Mail className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Candidate Self-Service</h3>
            <p className="text-gray-600">
              Candidates add their own references with all details. 
              References receive emails to schedule their own interview times.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg">
            <Phone className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Automated AI Interviews</h3>
            <p className="text-gray-600">
              Our AI calls at the scheduled time and conducts a professional interview 
              with natural conversation and intelligent follow-up questions.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-12 shadow-xl mb-16">
          <h3 className="text-3xl font-bold text-center mb-12">How VoiceRef Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">1. HR Submits Request</h4>
              <p className="text-gray-600 text-sm">Add candidate info and job description</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">2. Candidate Gets Email</h4>
              <p className="text-gray-600 text-sm">Link to add their references</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">3. References Schedule</h4>
              <p className="text-gray-600 text-sm">Each reference picks their own time</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="font-semibold mb-2">4. AI Conducts Calls</h4>
              <p className="text-gray-600 text-sm">Professional interviews, full transcripts</p>
            </div>
          </div>
        </div>

        {/* New Pricing Section */}
        <div className="bg-white rounded-2xl p-12 shadow-xl mb-16">
          <h3 className="text-3xl font-bold text-center mb-4">Simple, Transparent Pricing</h3>
          <p className="text-center text-gray-600 mb-12">Start with a free trial, then choose the plan that fits your needs</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Trial */}
            <div className="border-2 border-gray-200 rounded-xl p-8 text-center hover:border-blue-300 transition-colors">
              <h4 className="text-xl font-semibold mb-2">Free Trial</h4>
              <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
              <div className="text-gray-600 mb-6">1 reference check</div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Full AI phone interview
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Complete transcript
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Custom questions
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  No credit card required
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full border-2 border-blue-600 text-blue-600 py-3 px-6 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Start Free Trial
              </button>
            </div>

            {/* Starter */}
            <div className="border-2 border-blue-600 rounded-xl p-8 text-center relative bg-blue-50">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <h4 className="text-xl font-semibold mb-2">Starter</h4>
              <div className="text-4xl font-bold text-gray-900 mb-2">$99<span className="text-lg font-normal text-gray-600">/mo</span></div>
              <div className="text-gray-600 mb-6">5 reference checks per month</div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Everything in Free Trial
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  5 reference checks/month
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Email support
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  $15 per additional check
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Professional */}
            <div className="border-2 border-gray-200 rounded-xl p-8 text-center hover:border-blue-300 transition-colors">
              <h4 className="text-xl font-semibold mb-2">Professional</h4>
              <div className="text-4xl font-bold text-gray-900 mb-2">$199<span className="text-lg font-normal text-gray-600">/mo</span></div>
              <div className="text-gray-600 mb-6">15 reference checks per month</div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Everything in Starter
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  15 reference checks/month
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Priority support
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  $15 per additional check
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full border-2 border-blue-600 text-blue-600 py-3 px-6 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to transform your hiring process?
          </h3>
          <p className="text-xl text-gray-600 mb-8">
            Join innovative recruiters using AI-powered phone reference checking
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700"
          >
            Start Your Free Trial
          </button>
        </div>
      </div>
    </div>
  )
}
