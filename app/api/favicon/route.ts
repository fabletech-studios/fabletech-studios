import { NextResponse } from 'next/server';

export async function GET() {
  // Generate favicon programmatically
  const size = 32;
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#DC2626;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#B91C1C;stop-opacity:1" />
        </linearGradient>
      </defs>
      <!-- Rounded rectangle background -->
      <rect x="0" y="0" width="${size}" height="${size}" rx="6" ry="6" fill="url(#gradient)" />
      <!-- Play triangle -->
      <path d="M 11 8 L 11 24 L 23 16 Z" fill="white" />
    </svg>
  `;

  // Convert SVG to PNG would require a library like sharp or canvas
  // For now, we'll return the SVG which modern browsers support
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}