'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  availableLanguages: string[];
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

const languages: Record<string, { name: string; flag: string }> = {
  en: { name: 'English', flag: '🇺🇸' },
  it: { name: 'Italiano', flag: '🇮🇹' },
  es: { name: 'Español', flag: '🇪🇸' },
  fr: { name: 'Français', flag: '🇫🇷' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
};

export default function LanguageSelector({
  availableLanguages,
  currentLanguage,
  onLanguageChange
}: LanguageSelectorProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Only show selector if there are translations available
  if (availableLanguages.length <= 1) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
      >
        <Globe className="w-4 h-4" />
        <span>{languages[currentLanguage]?.flag} {languages[currentLanguage]?.name || currentLanguage.toUpperCase()}</span>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden min-w-[150px]">
            {availableLanguages.map(lang => (
              <button
                key={lang}
                onClick={() => {
                  onLanguageChange(lang);
                  setShowMenu(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm ${
                  lang === currentLanguage ? 'bg-red-600 hover:bg-red-700' : ''
                }`}
              >
                <span>{languages[lang]?.flag || '🌐'}</span>
                <span>{languages[lang]?.name || lang.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}