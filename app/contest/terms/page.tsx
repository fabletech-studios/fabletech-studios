'use client';

import SiteHeader from '@/components/SiteHeader';
import Link from 'next/link';
import { ChevronLeft, Shield, AlertCircle, FileText, Scale } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ContestTermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-8 pt-28 md:pt-16">
        {/* Back Button */}
        <Link
          href="/contest/submit"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Submission
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold">Contest Terms and Conditions</h1>
          </div>
          <p className="text-gray-400">
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </motion.div>

        {/* Important Notice */}
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-500 mb-2">Important Legal Notice</h3>
              <p className="text-sm text-gray-300">
                By participating in any FableTech Studios contest, you agree to be bound by these Terms and Conditions. 
                Please read them carefully before submitting your entry. If you do not agree with these terms, 
                do not participate in the contest.
              </p>
            </div>
          </div>
        </div>

        {/* Terms Content */}
        <div className="space-y-8 text-gray-300">
          {/* 1. Eligibility */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" />
              1. Eligibility
            </h2>
            <div className="space-y-3 ml-7">
              <p>1.1. Participants must be at least 18 years old or have parental consent to participate.</p>
              <p>1.2. Participants must have a valid FableTech Studios account in good standing.</p>
              <p>1.3. Employees of FableTech Studios and their immediate family members are not eligible to win prizes.</p>
              <p>1.4. One entry per person per contest unless otherwise specified.</p>
              <p>1.5. Multiple accounts or fraudulent entries will result in immediate disqualification.</p>
            </div>
          </section>

          {/* 2. Content Ownership & Rights */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              2. Content Ownership and Rights
            </h2>
            <div className="space-y-3 ml-7">
              <p className="font-semibold text-yellow-400">2.1. Ownership Retention</p>
              <p className="ml-4">You retain all ownership rights to your original story content.</p>
              
              <p className="font-semibold text-yellow-400">2.2. License Grant to FableTech Studios</p>
              <p className="ml-4">By submitting your story, you grant FableTech Studios a worldwide, non-exclusive, royalty-free, perpetual, irrevocable license to:</p>
              <ul className="list-disc list-inside ml-8 space-y-1">
                <li>Display, distribute, and promote your submission on our platform</li>
                <li>Use your submission for marketing and promotional purposes</li>
                <li>Create derivative works (including audio adaptations) if your story wins</li>
                <li>Sublicense these rights to partners for contest-related purposes</li>
              </ul>
              
              <p className="font-semibold text-yellow-400">2.3. Winner Additional Terms</p>
              <p className="ml-4">Contest winners agree to negotiate in good faith for:</p>
              <ul className="list-disc list-inside ml-8 space-y-1">
                <li>Exclusive audio production rights for a period of 12 months</li>
                <li>Revenue sharing agreements as specified in contest prizes</li>
                <li>First right of refusal for future adaptations</li>
              </ul>
            </div>
          </section>

          {/* 3. Content Requirements */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Content Requirements and Restrictions</h2>
            <div className="space-y-3 ml-7">
              <p className="font-semibold">3.1. Original Work</p>
              <p className="ml-4">All submissions must be 100% original work created by the participant. Plagiarism will result in immediate disqualification and potential legal action.</p>
              
              <p className="font-semibold">3.2. Prohibited Content</p>
              <p className="ml-4">Submissions must NOT contain:</p>
              <ul className="list-disc list-inside ml-8 space-y-1">
                <li>Copyrighted material not owned by the participant</li>
                <li>Defamatory, libelous, or invasive content</li>
                <li>Hate speech or discriminatory content</li>
                <li>Explicit sexual content involving minors</li>
                <li>Content that violates any applicable laws</li>
                <li>Personal information of real individuals without consent</li>
              </ul>
              
              <p className="font-semibold">3.3. Content Standards</p>
              <p className="ml-4">Stories must meet specified word count, genre, and theme requirements for each contest.</p>
            </div>
          </section>

          {/* 4. Voting and Fair Play */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Voting and Fair Play</h2>
            <div className="space-y-3 ml-7">
              <p>4.1. Voting must be conducted fairly. Any form of vote manipulation, including but not limited to:</p>
              <ul className="list-disc list-inside ml-8 space-y-1">
                <li>Using bots or automated systems</li>
                <li>Creating fake accounts for voting</li>
                <li>Coordinated voting schemes</li>
                <li>Offering compensation for votes</li>
              </ul>
              <p className="ml-4">will result in disqualification.</p>
              
              <p>4.2. Purchased votes are non-refundable and non-transferable.</p>
              <p>4.3. FableTech Studios reserves the right to audit voting patterns and nullify suspicious votes.</p>
              <p>4.4. Final determination of winners may include editorial review in addition to vote counts.</p>
            </div>
          </section>

          {/* 5. Prizes */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Prizes and Awards</h2>
            <div className="space-y-3 ml-7">
              <p>5.1. Prizes are as stated in the contest description and cannot be exchanged for cash equivalents.</p>
              <p>5.2. Winners are responsible for any taxes on prizes in their jurisdiction.</p>
              <p>5.3. Prize distribution may take up to 30 days after contest conclusion.</p>
              <p>5.4. Production prizes (audio narration) are subject to scheduling and availability.</p>
              <p>5.5. Revenue sharing arrangements begin only after production costs are recouped.</p>
            </div>
          </section>

          {/* 6. Liability and Indemnification */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Liability and Indemnification</h2>
            <div className="space-y-3 ml-7">
              <p className="font-semibold text-yellow-400">6.1. Limitation of Liability</p>
              <p className="ml-4">FableTech Studios shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from contest participation.</p>
              
              <p className="font-semibold text-yellow-400">6.2. Indemnification</p>
              <p className="ml-4">You agree to indemnify and hold harmless FableTech Studios from any claims arising from:</p>
              <ul className="list-disc list-inside ml-8 space-y-1">
                <li>Your breach of these terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Any content you submit</li>
                <li>Your violation of applicable laws</li>
              </ul>
              
              <p className="font-semibold text-yellow-400">6.3. No Warranty</p>
              <p className="ml-4">The contest is provided "as is" without warranties of any kind.</p>
            </div>
          </section>

          {/* 7. Privacy and Data */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Privacy and Data Protection</h2>
            <div className="space-y-3 ml-7">
              <p>7.1. Personal information collected during the contest will be used in accordance with our Privacy Policy.</p>
              <p>7.2. Winners' names and submissions may be used for promotional purposes.</p>
              <p>7.3. We may share participant information with partners necessary for prize fulfillment.</p>
              <p>7.4. You may request deletion of your personal data, which may result in forfeiture of prizes.</p>
            </div>
          </section>

          {/* 8. Disqualification */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Disqualification and Termination</h2>
            <div className="space-y-3 ml-7">
              <p>8.1. FableTech Studios reserves the right to disqualify any participant for:</p>
              <ul className="list-disc list-inside ml-8 space-y-1">
                <li>Violation of these terms</li>
                <li>Inappropriate conduct or harassment</li>
                <li>Fraudulent activity</li>
                <li>Any behavior deemed detrimental to the contest</li>
              </ul>
              <p>8.2. Disqualified participants forfeit all rights to prizes and refunds.</p>
              <p>8.3. FableTech Studios may cancel or modify the contest at any time for any reason.</p>
            </div>
          </section>

          {/* 9. Dispute Resolution */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Dispute Resolution</h2>
            <div className="space-y-3 ml-7">
              <p>9.1. These terms are governed by the laws of [Your Jurisdiction].</p>
              <p>9.2. Any disputes shall first be addressed through good faith negotiations.</p>
              <p>9.3. If negotiations fail, disputes shall be resolved through binding arbitration.</p>
              <p>9.4. Class action lawsuits and jury trials are waived to the fullest extent permitted by law.</p>
            </div>
          </section>

          {/* 10. Modifications */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Modifications to Terms</h2>
            <div className="space-y-3 ml-7">
              <p>10.1. FableTech Studios reserves the right to modify these terms at any time.</p>
              <p>10.2. Continued participation after modifications constitutes acceptance of new terms.</p>
              <p>10.3. Material changes will be communicated via email or platform notification.</p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="border-t border-gray-700 pt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>
            <div className="space-y-2 ml-7">
              <p>For questions about these terms or the contest, please contact:</p>
              <p className="font-semibold">FableTech Studios Legal Department</p>
              <p>Email: legal@fabletechstudios.com</p>
              <p>Address: [Your Business Address]</p>
            </div>
          </section>

          {/* Acceptance */}
          <section className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Acceptance of Terms</h3>
            <p className="text-sm">
              By clicking "I Agree" on the submission form or by participating in any way, 
              you acknowledge that you have read, understood, and agree to be bound by these 
              Terms and Conditions in their entirety.
            </p>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 flex gap-4">
          <Link
            href="/contest/submit"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
          >
            Return to Submission
          </Link>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
          >
            Print Terms
          </button>
        </div>
      </div>
    </div>
  );
}