'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function TermsOfServicePage() {
  const router = useRouter();
  const lastUpdated = 'December 2, 2024';

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-mono">
      {/* Header */}
      <div className="border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold uppercase tracking-wider">Terms of Service</h1>
          <Button variant="outline" onClick={() => router.back()} className="border-white/20 text-white hover:bg-white/10">
            Back
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-sm text-white/50 mb-8 font-mono">
          Last updated: {lastUpdated}
        </p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              1. Agreement to Terms
            </h2>
            <p className="text-white/70 mb-4 leading-relaxed">
              By accessing or using You+ (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
            </p>
            <p className="text-white/70 leading-relaxed">
              You+ is operated by Rinshin Jalal, based in India. These Terms constitute a legally binding agreement between you and the operator.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              2. Eligibility
            </h2>
            <p className="text-white/70 mb-4 leading-relaxed">
              You must be at least <strong className="text-white">18 years old</strong> to use You+. By using the Service, you represent and warrant that you are 18 or older and have the legal capacity to enter into these Terms.
            </p>
            <p className="text-white/70 leading-relaxed">
              If we discover you are under 18, your account will be terminated immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              3. Description of Service
            </h2>
            <p className="text-white/70 mb-4 leading-relaxed">
              You+ is an AI-powered accountability coaching application that helps you stay committed to your goals through:
            </p>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li>Personalized onboarding to understand your goals and motivations</li>
              <li>Daily voice calls to check on your commitment progress</li>
              <li>AI-generated personalized coaching based on your history</li>
              <li>Streak tracking and accountability scoring</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              4. Account Registration
            </h2>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li>You must create an account using Google or Apple sign-in</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must provide accurate information during onboarding</li>
              <li>You may not share your account with others or create multiple accounts</li>
              <li>You are responsible for all activity under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              5. Voice Recording Consent
            </h2>
            <p className="text-white/70 mb-4 leading-relaxed">By using You+, you expressly consent to:</p>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li><strong className="text-white">Onboarding voice recordings:</strong> We record your voice during onboarding to understand your motivation and to create a personalized AI voice clone</li>
              <li><strong className="text-white">Call recordings:</strong> All accountability calls are recorded for transcription and progress tracking</li>
              <li><strong className="text-white">AI voice cloning:</strong> Your voice recordings are used to create a personalized AI voice for your accountability calls</li>
            </ul>
            <div className="mt-4 p-4 bg-white/5 border-l-4 border-[#F97316]">
              Your voice recordings are NOT used to train AI models and are NOT shared with third parties except as necessary to provide the Service (transcription, voice synthesis).
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              6. Subscription & Payment
            </h2>
            
            <h3 className="text-lg font-bold mt-6 mb-3 text-white">6.1 Subscription Plans</h3>
            <p className="text-white/70 leading-relaxed">
              You+ requires a paid subscription to access the full service. Available plans and pricing are displayed at checkout and may change from time to time.
            </p>

            <h3 className="text-lg font-bold mt-6 mb-3 text-white">6.2 Automatic Renewal</h3>
            <p className="text-white/70 leading-relaxed">
              Subscriptions automatically renew at the end of each billing period (monthly or yearly) unless you cancel before the renewal date. You authorize us to charge your payment method on file for each renewal.
            </p>

            <h3 className="text-lg font-bold mt-6 mb-3 text-white">6.3 Cancellation</h3>
            <p className="text-white/70 leading-relaxed">You may cancel your subscription at any time through your account settings. Upon cancellation:</p>
            <ul className="list-disc pl-6 text-white/70 space-y-2 mt-2">
              <li>You retain access until the end of your current billing period</li>
              <li>No further charges will be made</li>
              <li>Your data remains accessible until you delete your account</li>
            </ul>

            <h3 className="text-lg font-bold mt-6 mb-3 text-white">6.4 Refund Policy</h3>
            <p className="text-white/70 mb-4 leading-relaxed">
              <strong className="text-white">All subscription payments are non-refundable.</strong> We do not provide refunds or credits for:
            </p>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li>Partial subscription periods</li>
              <li>Unused time after cancellation</li>
              <li>Periods where you did not use the Service</li>
            </ul>
            <p className="text-white/70 mt-4 leading-relaxed">
              <strong className="text-white">Refund Appeals:</strong> In exceptional circumstances, you may request a refund review by contacting <a href="mailto:support@youplus.app" className="underline text-[#F97316]">support@youplus.app</a>. All appeal decisions are final and made at our sole discretion.
            </p>

            <h3 className="text-lg font-bold mt-6 mb-3 text-white">6.5 Payment Processing</h3>
            <p className="text-white/70 leading-relaxed">
              Payments are processed by DodoPayments (web) and RevenueCat/App Store/Google Play (mobile). By subscribing, you also agree to their respective terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              7. Important Disclaimers
            </h2>
            
            <div className="p-4 bg-[#F97316]/10 border border-[#F97316]/50 mb-4">
              <h3 className="text-lg font-bold mb-2 uppercase text-[#F97316]">Not Medical or Therapeutic Advice</h3>
              <p className="text-white/70">
                You+ is a <strong className="text-white">productivity and accountability tool</strong>. It is NOT a substitute for professional medical advice, diagnosis, treatment, therapy, or counseling. If you are experiencing mental health issues, please consult a qualified healthcare professional.
              </p>
            </div>

            <p className="text-white/70 leading-relaxed">
              The Service is provided for general productivity and self-improvement purposes only. We make no claims about specific results or outcomes. Individual results vary based on your commitment, circumstances, and many other factors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              8. Acceptable Use
            </h2>
            <p className="text-white/70 mb-4 leading-relaxed">You agree NOT to:</p>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Upload malicious content or code</li>
              <li>Impersonate another person or entity</li>
              <li>Use the Service to harass, abuse, or harm others</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use automated systems (bots) to access the Service</li>
              <li>Record calls for purposes other than personal use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              9. Intellectual Property
            </h2>
            
            <h3 className="text-lg font-bold mt-6 mb-3 text-white">9.1 Our Content</h3>
            <p className="text-white/70 leading-relaxed">
              The Service, including its design, features, code, and content (excluding user content), is owned by us and protected by intellectual property laws. You may not copy, modify, or distribute our content without permission.
            </p>

            <h3 className="text-lg font-bold mt-6 mb-3 text-white">9.2 Your Content</h3>
            <p className="text-white/70 leading-relaxed">
              You retain ownership of your voice recordings and personal data. By using the Service, you grant us a limited license to use this content solely to provide and improve the Service. This license ends when you delete your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              10. Service Availability
            </h2>
            <p className="text-white/70 mb-4 leading-relaxed">
              We strive to provide reliable service but cannot guarantee uninterrupted availability. The Service may be temporarily unavailable due to:
            </p>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li>Scheduled maintenance</li>
              <li>Technical issues or outages</li>
              <li>Third-party service disruptions</li>
              <li>Events beyond our reasonable control</li>
            </ul>
            <p className="text-white/70 mt-4 leading-relaxed">
              We are not liable for any losses resulting from service unavailability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              11. Account Termination
            </h2>
            
            <h3 className="text-lg font-bold mt-6 mb-3 text-white">11.1 By You</h3>
            <p className="text-white/70 leading-relaxed">
              You may delete your account at any time through Settings → Delete Account. Upon deletion, your data will be permanently removed within 14 days.
            </p>

            <h3 className="text-lg font-bold mt-6 mb-3 text-white">11.2 By Us</h3>
            <p className="text-white/70 leading-relaxed">
              We may suspend or terminate your account if you violate these Terms, engage in fraudulent activity, or for any other reason at our discretion. We will attempt to notify you but are not required to do so.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              12. Limitation of Liability
            </h2>
            <p className="text-white/70 mb-4 leading-relaxed uppercase font-bold">
              To the maximum extent permitted by law:
            </p>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li>The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind</li>
              <li>We disclaim all warranties, express or implied, including merchantability and fitness for a particular purpose</li>
              <li>We are not liable for any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim</li>
              <li>We are not liable for actions or content of third-party services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              13. Indemnification
            </h2>
            <p className="text-white/70 leading-relaxed">
              You agree to indemnify and hold harmless the operator, Rinshin Jalal, from any claims, damages, losses, or expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              14. Dispute Resolution
            </h2>
            <p className="text-white/70 mb-4 leading-relaxed">
              Any disputes arising from these Terms or your use of the Service shall be:
            </p>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li>First attempted to be resolved through informal negotiation by contacting <a href="mailto:support@youplus.app" className="underline text-[#F97316]">support@youplus.app</a></li>
              <li>If unresolved after 30 days, either party may pursue formal resolution</li>
              <li>Governed by the laws of India</li>
              <li>Subject to the exclusive jurisdiction of courts in India</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              15. Changes to Terms
            </h2>
            <p className="text-white/70 leading-relaxed">
              We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms and changing the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              16. General Provisions
            </h2>
            <ul className="list-disc pl-6 text-white/70 space-y-2">
              <li><strong className="text-white">Entire Agreement:</strong> These Terms constitute the entire agreement between you and us regarding the Service</li>
              <li><strong className="text-white">Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect</li>
              <li><strong className="text-white">Waiver:</strong> Failure to enforce any right does not waive that right</li>
              <li><strong className="text-white">Assignment:</strong> You may not assign these Terms; we may assign them freely</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              17. Contact Us
            </h2>
            <p className="text-white/70 mb-4 leading-relaxed">
              For questions about these Terms, contact us at:
            </p>
            <div className="p-4 border border-white/20 bg-white/5">
              <p className="font-bold text-white">You+</p>
              <p className="text-white/70">Operated by Rinshin Jalal</p>
              <p className="text-white/70">
                Email: <a href="mailto:support@youplus.app" className="underline text-[#F97316]">support@youplus.app</a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
