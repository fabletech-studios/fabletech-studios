'use client';

import { Shield, AlertTriangle, Scale } from 'lucide-react';
import { motion } from 'framer-motion';

interface CopyrightNoticeProps {
  variant?: 'full' | 'compact' | 'banner';
  onAccept?: () => void;
}

export default function CopyrightNotice({ variant = 'compact', onAccept }: CopyrightNoticeProps) {
  if (variant === 'banner') {
    return (
      <div className="bg-red-900/20 border border-red-800 p-3 rounded-lg mb-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-gray-300">
            This content is protected by copyright. Unauthorized recording, downloading, or distribution is strictly prohibited and may result in legal action.
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Shield className="w-3 h-3" />
        <span>© FableTech Studios. All rights reserved. Protected content.</span>
      </div>
    );
  }

  // Full variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-6 bg-gray-900 rounded-lg border border-gray-800"
    >
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-8 h-8 text-red-600" />
        <h2 className="text-2xl font-bold text-white">Copyright Protection Notice</h2>
      </div>

      <div className="space-y-4 text-gray-300">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white mb-1">Content Protection</h3>
            <p className="text-sm">
              All audiovisual content on FableTech Studios is protected by copyright law and international treaties. 
              This content is licensed for personal, non-commercial use only.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Scale className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white mb-1">Legal Penalties</h3>
            <p className="text-sm">
              Unauthorized recording, reproduction, distribution, or public display of our content may result in:
            </p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>Civil penalties up to $150,000 per work infringed</li>
              <li>Criminal prosecution with fines up to $250,000</li>
              <li>Imprisonment up to 5 years</li>
              <li>Permanent account termination</li>
            </ul>
          </div>
        </div>

        <div className="bg-red-900/20 border border-red-800 p-4 rounded">
          <p className="text-sm font-semibold text-red-400">
            By accessing this content, you agree to:
          </p>
          <ul className="list-disc list-inside text-sm mt-2 space-y-1 text-gray-300">
            <li>Not record, download, or capture any content</li>
            <li>Not share your account credentials</li>
            <li>Report any piracy you encounter</li>
            <li>Respect the intellectual property rights of content creators</li>
          </ul>
        </div>

        <div className="pt-4">
          <p className="text-xs text-gray-500">
            FableTech Studios actively monitors for copyright violations using advanced detection technology. 
            All violations are logged and may be reported to law enforcement.
          </p>
        </div>

        {onAccept && (
          <div className="pt-4">
            <button
              onClick={onAccept}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
            >
              I Understand and Accept
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}