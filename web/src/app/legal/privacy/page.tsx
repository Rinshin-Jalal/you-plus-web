'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const lastUpdated = 'December 2, 2024';

  return (
    <div className="min-h-screen bg-white text-black font-mono">
      {/* Header */}
      <div className="border-b-4 border-black">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold uppercase tracking-wider">Privacy Policy</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-sm text-gray-500 mb-8 font-mono">
          Last updated: {lastUpdated}
        </p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b-2 border-black pb-2">
              1. Introduction
            </h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              You+ ("we," "our," or "us") is operated by Rinshin Jalal, based in India. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our accountability coaching application and related services (the "Service").
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using You+, you agree to the collection and use of information in accordance with this policy. If you do not agree with this policy, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b-2 border-black pb-2">
              2. Information We Collect
            </h2>
            
            <h3 className="text-lg font-bold mt-6 mb-3">2.1 Account Information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Name and email address (via Google or Apple sign-in)</li>
              <li>Profile information from your OAuth provider</li>
              <li>Timezone and preferred call times</li>
            </ul>

            <h3 className="text-lg font-bold mt-6 mb-3">2.2 Onboarding & Goal Information</h3>
            <p className="text-gray-700 mb-2">
              During onboarding, we collect information to personalize your accountability experience:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Your goals, commitments, and deadlines</li>
              <li>Motivation levels and self-assessments</li>
              <li>Past experiences with goal achievement</li>
              <li>Preferred accountability style and strike limits</li>
              <li>Age, gender/pronouns (optional), and general location</li>
            </ul>

            <h3 className="text-lg font-bold mt-6 mb-3">2.3 Voice Recordings</h3>
            <p className="text-gray-700 mb-2">We collect voice recordings in two contexts:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Onboarding recordings:</strong> Used to understand your motivation and to create a personalized AI voice for your accountability calls</li>
              <li><strong>Call recordings:</strong> Daily accountability calls are recorded to track your progress and commitments</li>
            </ul>
            <div className="mt-4 p-4 bg-gray-100 border-l-4 border-black">
              <strong>Important:</strong> Your voice recordings are NEVER used to train AI models. They are used solely for transcription and creating your personalized accountability experience.
            </div>

            <h3 className="text-lg font-bold mt-6 mb-3">2.4 Usage & Call Data</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Call history, duration, and transcripts</li>
              <li>Promise tracking (commitments kept or broken)</li>
              <li>Streak data and accountability scores</li>
              <li>App usage patterns</li>
            </ul>

            <h3 className="text-lg font-bold mt-6 mb-3">2.5 Payment Information</h3>
            <p className="text-gray-700">
              Payment processing is handled by DodoPayments (web) and RevenueCat (mobile apps). We do not store your credit card numbers or bank details. We only receive confirmation of your subscription status, plan type, and billing dates.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b-2 border-black pb-2">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide and personalize the accountability coaching service</li>
              <li>Schedule and conduct daily accountability calls</li>
              <li>Create your personalized AI voice clone for calls</li>
              <li>Track your commitments, streaks, and progress</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send service-related notifications (call reminders, account updates)</li>
              <li>Improve and develop new features</li>
              <li>Respond to your requests and support inquiries</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b-2 border-black pb-2">
              4. Third-Party Services
            </h2>
            <p className="text-gray-700 mb-4">We use the following third-party services to operate You+:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-700 border-2 border-black">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="py-2 px-4 text-left font-bold uppercase">Service</th>
                    <th className="py-2 px-4 text-left font-bold uppercase">Purpose</th>
                    <th className="py-2 px-4 text-left font-bold uppercase">Data Shared</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  <tr><td className="py-3 px-4">Supabase</td><td className="py-3 px-4">Authentication & database</td><td className="py-3 px-4">Account data, app data</td></tr>
                  <tr><td className="py-3 px-4">Google (OAuth)</td><td className="py-3 px-4">Sign-in</td><td className="py-3 px-4">Email, name, profile picture</td></tr>
                  <tr><td className="py-3 px-4">Apple (OAuth)</td><td className="py-3 px-4">Sign-in</td><td className="py-3 px-4">Email, name</td></tr>
                  <tr><td className="py-3 px-4">DodoPayments</td><td className="py-3 px-4">Payment processing (web)</td><td className="py-3 px-4">Email, payment details</td></tr>
                  <tr><td className="py-3 px-4">Google Gemini</td><td className="py-3 px-4">AI personalization</td><td className="py-3 px-4">Onboarding context, goals</td></tr>
                  <tr><td className="py-3 px-4">Cartesia</td><td className="py-3 px-4">Voice synthesis & cloning</td><td className="py-3 px-4">Voice recordings</td></tr>
                  <tr><td className="py-3 px-4">LiveKit</td><td className="py-3 px-4">Real-time voice calls</td><td className="py-3 px-4">Call audio</td></tr>
                  <tr><td className="py-3 px-4">Cloudflare</td><td className="py-3 px-4">Hosting & file storage</td><td className="py-3 px-4">All app data, recordings</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 mt-4">
              These services have their own privacy policies. We encourage you to review them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b-2 border-black pb-2">
              5. Data Retention
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Active accounts:</strong> We retain your data for as long as your account is active</li>
              <li><strong>Call recordings & transcripts:</strong> Retained until you delete your account</li>
              <li><strong>After account deletion:</strong> All data is permanently deleted within 14 days</li>
              <li><strong>Payment records:</strong> May be retained longer as required by law for tax/accounting purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b-2 border-black pb-2">
              6. Your Rights
            </h2>
            <p className="text-gray-700 mb-4">You have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate data</li>
              <li><strong>Deletion:</strong> Delete your account and all associated data (Settings → Delete Account)</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your data</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, contact us at <a href="mailto:privacy@youplus.app" className="underline font-bold">privacy@youplus.app</a>
            </p>

            <h3 className="text-lg font-bold mt-6 mb-3">For EU/EEA Residents (GDPR)</h3>
            <p className="text-gray-700">
              If you are in the European Union or European Economic Area, you have additional rights under GDPR including the right to lodge a complaint with your local data protection authority.
            </p>

            <h3 className="text-lg font-bold mt-6 mb-3">For California Residents (CCPA)</h3>
            <p className="text-gray-700">
              California residents have the right to know what personal information is collected, request deletion, and opt-out of the sale of personal information. We do not sell your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b-2 border-black pb-2">
              7. Data Security
            </h2>
            <p className="text-gray-700 mb-4">We implement appropriate security measures to protect your data:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Secure authentication via OAuth providers</li>
              <li>Row-level security on database tables</li>
              <li>Secure cloud infrastructure (Cloudflare, Supabase)</li>
            </ul>
            <p className="text-gray-700 mt-4">
              However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b-2 border-black pb-2">
              8. Age Restriction
            </h2>
            <p className="text-gray-700">
              You+ is intended for users who are 18 years of age or older. We do not knowingly collect personal information from anyone under 18. If you are under 18, please do not use this Service. If we learn we have collected data from someone under 18, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b-2 border-black pb-2">
              9. International Data Transfers
            </h2>
            <p className="text-gray-700">
              Your data may be transferred to and processed in countries other than your own, including the United States and India where our service providers operate. These countries may have different data protection laws. By using You+, you consent to this transfer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b-2 border-black pb-2">
              10. Changes to This Policy
            </h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b-2 border-black pb-2">
              11. Contact Us
            </h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this Privacy Policy or our data practices, contact us at:
            </p>
            <div className="p-4 border-2 border-black">
              <p className="font-bold">You+</p>
              <p className="text-gray-700">Operated by Rinshin Jalal</p>
              <p className="text-gray-700">
                Email: <a href="mailto:privacy@youplus.app" className="underline font-bold">privacy@youplus.app</a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
