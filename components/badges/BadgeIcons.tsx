import React from 'react';
import { RARITY_STYLES, BadgeRarity } from '@/lib/badges/badge-definitions';

interface BadgeProps {
  size?: number;
  rarity: BadgeRarity;
  earned?: boolean;
}

// First Listen Badge - Headphones with audio waves
export const FirstListenBadge: React.FC<BadgeProps> = ({ size = 80, rarity, earned = true }) => {
  const styles = RARITY_STYLES[rarity];
  const opacity = earned ? 1 : 0.3;
  
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="firstListenGlow">
          <stop offset="0%" stopColor={styles.glowColor} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="headphoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </linearGradient>
      </defs>
      
      {/* Background circle */}
      <circle cx="40" cy="40" r="38" fill="#0F0F0F" stroke={styles.borderColor} strokeWidth="2" opacity={opacity} />
      
      {/* Glow effect */}
      {earned && (
        <circle cx="40" cy="40" r="35" fill="url(#firstListenGlow)" opacity="0.5" />
      )}
      
      {/* Headphones */}
      <path
        d="M20 35C20 24 29 15 40 15C51 15 60 24 60 35V45C60 48 58 50 55 50H52C49 50 47 48 47 45V38C47 35 49 33 52 33H55C55 26 48 20 40 20C32 20 25 26 25 33H28C31 33 33 35 33 38V45C33 48 31 50 28 50H25C22 50 20 48 20 45V35Z"
        fill="url(#headphoneGradient)"
        opacity={opacity}
      />
      
      {/* Audio waves */}
      <path
        d="M15 40Q10 40 10 35Q10 30 15 30M65 40Q70 40 70 35Q70 30 65 30"
        stroke={styles.particleColor}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={earned ? 0.8 : 0.2}
      />
      <path
        d="M12 45Q5 45 5 35Q5 25 12 25M68 45Q75 45 75 35Q75 25 68 25"
        stroke={styles.particleColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={earned ? 0.5 : 0.1}
      />
    </svg>
  );
};

// Binge Master Badge - Play button with energy effects
export const BingeMasterBadge: React.FC<BadgeProps> = ({ size = 80, rarity, earned = true }) => {
  const styles = RARITY_STYLES[rarity];
  const opacity = earned ? 1 : 0.3;
  
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bingeGlow">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="playGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      
      <circle cx="40" cy="40" r="38" fill="#0F0F0F" stroke={styles.borderColor} strokeWidth="2" opacity={opacity} />
      
      {/* Energy burst background */}
      {earned && (
        <>
          <circle cx="40" cy="40" r="30" fill="url(#bingeGlow)" opacity="0.6" />
          {/* Lightning bolts */}
          <path
            d="M40 15 L35 25 L45 25 L40 35 M40 45 L35 55 L45 55 L40 65"
            stroke="#F59E0B"
            strokeWidth="2"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M15 40 L25 35 L25 45 L35 40 M45 40 L55 35 L55 45 L65 40"
            stroke="#F59E0B"
            strokeWidth="2"
            fill="none"
            opacity="0.7"
          />
        </>
      )}
      
      {/* Play button */}
      <path
        d="M32 28 L32 52 L52 40 Z"
        fill="url(#playGradient)"
        opacity={opacity}
      />
    </svg>
  );
};

// Supporter Badge - Geometric gem with glow
export const SupporterBadge: React.FC<BadgeProps> = ({ size = 80, rarity, earned = true }) => {
  const styles = RARITY_STYLES[rarity];
  const opacity = earned ? 1 : 0.3;
  
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="gemGlow">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gemGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      
      <circle cx="40" cy="40" r="38" fill="#0F0F0F" stroke={styles.borderColor} strokeWidth="2" opacity={opacity} />
      
      {earned && (
        <circle cx="40" cy="40" r="28" fill="url(#gemGlow)" opacity="0.5" />
      )}
      
      {/* Gem shape */}
      <path
        d="M40 20 L55 35 L40 60 L25 35 Z"
        fill="url(#gemGradient)"
        opacity={opacity}
      />
      
      {/* Gem facets */}
      <path
        d="M40 20 L25 35 L40 40 Z M40 20 L55 35 L40 40 Z M25 35 L40 60 L40 40 Z M55 35 L40 60 L40 40 Z"
        stroke="#064E3B"
        strokeWidth="1"
        fill="none"
        opacity={opacity * 0.7}
      />
    </svg>
  );
};

// VIP Listener Badge - Crown with audio pattern
export const VIPListenerBadge: React.FC<BadgeProps> = ({ size = 80, rarity, earned = true }) => {
  const styles = RARITY_STYLES[rarity];
  const opacity = earned ? 1 : 0.3;
  
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="vipGlow">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="crownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      
      <circle cx="40" cy="40" r="38" fill="#0F0F0F" stroke={styles.borderColor} strokeWidth="2" opacity={opacity} />
      
      {earned && (
        <circle cx="40" cy="40" r="32" fill="url(#vipGlow)" opacity="0.5" />
      )}
      
      {/* Crown */}
      <path
        d="M20 45 L20 35 L25 25 L30 35 L35 20 L40 35 L45 20 L50 35 L55 25 L60 35 L60 45 L60 55 L20 55 Z"
        fill="url(#crownGradient)"
        opacity={opacity}
      />
      
      {/* Crown jewels */}
      <circle cx="30" cy="45" r="3" fill="#DC2626" opacity={opacity} />
      <circle cx="40" cy="45" r="4" fill="#DC2626" opacity={opacity} />
      <circle cx="50" cy="45" r="3" fill="#DC2626" opacity={opacity} />
      
      {/* Audio wave pattern on crown */}
      <path
        d="M25 50 Q30 48 35 50 T45 50 T55 50"
        stroke="#7C2D12"
        strokeWidth="1.5"
        fill="none"
        opacity={opacity * 0.7}
      />
    </svg>
  );
};

// Completionist Badge - Closed book with golden elements
export const CompletionistBadge: React.FC<BadgeProps> = ({ size = 80, rarity, earned = true }) => {
  const styles = RARITY_STYLES[rarity];
  const opacity = earned ? 1 : 0.3;
  
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bookGlow">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      
      <circle cx="40" cy="40" r="38" fill="#0F0F0F" stroke={styles.borderColor} strokeWidth="2" opacity={opacity} />
      
      {earned && (
        <circle cx="40" cy="40" r="30" fill="url(#bookGlow)" opacity="0.4" />
      )}
      
      {/* Book */}
      <rect x="25" y="20" width="30" height="40" rx="2" fill="url(#bookGradient)" opacity={opacity} />
      
      {/* Book spine */}
      <rect x="25" y="20" width="4" height="40" fill="#4C1D95" opacity={opacity} />
      
      {/* Golden bookmark */}
      <path
        d="M45 15 L50 15 L50 45 L47.5 42 L45 45 Z"
        fill="url(#goldGradient)"
        opacity={opacity}
      />
      
      {/* Completion seal */}
      <circle cx="40" cy="40" r="8" fill="url(#goldGradient)" opacity={opacity} />
      <path
        d="M35 40 L38 43 L45 36"
        stroke="#FFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={opacity}
      />
    </svg>
  );
};

// Early Adopter Badge - Star burst with BETA styling
export const EarlyAdopterBadge: React.FC<BadgeProps> = ({ size = 80, rarity, earned = true }) => {
  const styles = RARITY_STYLES[rarity];
  const opacity = earned ? 1 : 0.3;
  
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="starGlow">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="50%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      
      <circle cx="40" cy="40" r="38" fill="#0F0F0F" stroke={styles.borderColor} strokeWidth="2" opacity={opacity} />
      
      {earned && (
        <>
          <circle cx="40" cy="40" r="35" fill="url(#starGlow)" opacity="0.6" />
          {/* Radiating lines */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1="40"
              y1="40"
              x2={40 + 35 * Math.cos(angle * Math.PI / 180)}
              y2={40 + 35 * Math.sin(angle * Math.PI / 180)}
              stroke="#F87171"
              strokeWidth="1"
              opacity="0.5"
            />
          ))}
        </>
      )}
      
      {/* Star */}
      <path
        d="M40 15 L46 28 L60 30 L50 40 L52 54 L40 47 L28 54 L30 40 L20 30 L34 28 Z"
        fill="url(#starGradient)"
        opacity={opacity}
      />
      
      {/* BETA text */}
      <text
        x="40"
        y="42"
        textAnchor="middle"
        fontFamily="monospace"
        fontSize="10"
        fontWeight="bold"
        fill="#FFF"
        opacity={opacity}
      >
        BETA
      </text>
    </svg>
  );
};

// Badge container with rarity effects
export const BadgeContainer: React.FC<{ 
  children: React.ReactNode; 
  rarity: BadgeRarity; 
  earned?: boolean;
  showAnimation?: boolean;
}> = ({ children, rarity, earned = true, showAnimation = false }) => {
  const styles = RARITY_STYLES[rarity];
  
  return (
    <div className={`relative inline-block ${showAnimation && earned ? 'animate-bounce' : ''}`}>
      {children}
      {earned && (
        <div 
          className="absolute inset-0 rounded-full pointer-events-none animate-pulse"
          style={{
            boxShadow: `0 0 20px ${styles.glowColor}`,
          }}
        />
      )}
    </div>
  );
};