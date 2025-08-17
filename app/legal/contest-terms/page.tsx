'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';

export default function ContestTermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />
      <div className="max-w-4xl mx-auto px-4 py-8 pt-28 md:pt-8">
        <Link
          href="/contest/submit"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Submission
        </Link>

        <h1 className="text-3xl font-bold mb-8">Contest Terms and Conditions</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">1. Eligibility</h2>
            <ul className="list-disc ml-6 space-y-2 text-gray-300">
              <li>Participants must be at least 18 years of age or have parental/guardian consent</li>
              <li>Employees of FableTech Studios and their immediate family members are not eligible</li>
              <li>One submission per person per contest</li>
              <li>Must have a valid account on FableTech Studios platform</li>
            </ul>
          </section>

          <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">2. Submission Requirements</h2>
            <ul className="list-disc ml-6 space-y-2 text-gray-300">
              <li>All submissions must be original work created by the participant</li>
              <li>Submissions must not infringe upon any third-party rights including copyright, trademark, or privacy rights</li>
              <li>Content must not contain defamatory, offensive, or inappropriate material</li>
              <li>Word count limits must be strictly adhered to</li>
              <li>Submissions must be in English unless otherwise specified</li>
              <li>AI-assisted writing must be disclosed if used</li>
            </ul>
          </section>

          <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">3. Rights and Licenses</h2>
            <ul className="list-disc ml-6 space-y-2 text-gray-300">
              <li>Participants retain full copyright ownership of their submissions</li>
              <li>By submitting, participants grant FableTech Studios a non-exclusive, worldwide, royalty-free license to:</li>
              <ul className="list-circle ml-6 mt-2 space-y-1">
                <li>Display the submission on the platform for contest purposes</li>
                <li>Use excerpts for promotional and marketing purposes</li>
                <li>Publish winning entries with author attribution</li>
                <li>Create audio versions of winning stories</li>
              </ul>
              <li>Winners may be required to sign additional agreements for prize distribution</li>
              <li>FableTech Studios reserves the right to edit submissions for length or content standards</li>
            </ul>
          </section>

          <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">4. Judging and Voting</h2>
            <ul className="list-disc ml-6 space-y-2 text-gray-300">
              <li>Voting is conducted by registered users of the platform</li>
              <li>FableTech Studios reserves the right to disqualify suspicious voting activity</li>
              <li>Final winners are determined by a combination of public votes and judge panel review</li>
              <li>All judging decisions are final and binding</li>
              <li>No correspondence will be entered into regarding judging decisions</li>
            </ul>
          </section>

          <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">5. Prizes</h2>
            <ul className="list-disc ml-6 space-y-2 text-gray-300">
              <li>Prizes are as described in the contest announcement</li>
              <li>Prizes are non-transferable and cannot be exchanged for cash</li>
              <li>Winners are responsible for any taxes on prizes</li>
              <li>FableTech Studios reserves the right to substitute prizes of equal value</li>
              <li>Production deals are subject to separate agreements</li>
            </ul>
          </section>

          <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">6. Liability and Indemnification</h2>
            <ul className="list-disc ml-6 space-y-2 text-gray-300">
              <li>FableTech Studios is not responsible for lost, late, or corrupted submissions</li>
              <li>Participants agree to indemnify FableTech Studios against any claims arising from their submission</li>
              <li>FableTech Studios liability is limited to the value of the prize</li>
              <li>Participants are responsible for ensuring their submissions comply with all applicable laws</li>
            </ul>
          </section>

          <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">7. Privacy and Data Protection</h2>
            <ul className="list-disc ml-6 space-y-2 text-gray-300">
              <li>Personal information will be handled in accordance with our Privacy Policy</li>
              <li>Winners names and submissions may be published on the platform</li>
              <li>Email addresses may be used for contest-related communications</li>
              <li>Data will not be sold to third parties</li>
            </ul>
          </section>

          <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">8. Disqualification</h2>
            <ul className="list-disc ml-6 space-y-2 text-gray-300">
              <li>FableTech Studios reserves the right to disqualify any participant who:</li>
              <ul className="list-circle ml-6 mt-2 space-y-1">
                <li>Violates these terms and conditions</li>
                <li>Engages in fraudulent voting or manipulation</li>
                <li>Submits plagiarized or inappropriate content</li>
                <li>Harasses other participants or staff</li>
              </ul>
            </ul>
          </section>

          <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">9. General Terms</h2>
            <ul className="list-disc ml-6 space-y-2 text-gray-300">
              <li>These terms are governed by the laws of [Your Jurisdiction]</li>
              <li>FableTech Studios reserves the right to cancel or modify the contest at any time</li>
              <li>By participating, you agree to these terms and conditions in full</li>
              <li>These terms constitute the entire agreement between participants and FableTech Studios</li>
            </ul>
          </section>

          <section className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6 mt-8">
            <p className="text-sm text-gray-300">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-300 mt-2">
              <strong>Contact:</strong> For questions about these terms, please email legal@fabletech.studio
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}