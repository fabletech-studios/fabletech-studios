'use client';

import { useEffect } from 'react';

export default function FaviconGenerator() {
  useEffect(() => {
    // Create favicon dynamically
    const canvas = document.createElement('canvas');
    const size = 32;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#DC2626');
    gradient.addColorStop(1, '#B91C1C');
    
    // Rounded square background
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Play triangle
    const triangleSize = size * 0.4;
    const centerX = size / 2;
    const centerY = size / 2;
    const offsetX = triangleSize * 0.1; // Slight offset for visual centering
    
    ctx.beginPath();
    ctx.moveTo(centerX - triangleSize/2 + offsetX, centerY - triangleSize/2);
    ctx.lineTo(centerX - triangleSize/2 + offsetX, centerY + triangleSize/2);
    ctx.lineTo(centerX + triangleSize/2 + offsetX, centerY);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Convert to favicon
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      
      // Remove existing favicons
      const existingLinks = document.querySelectorAll("link[rel*='icon']");
      existingLinks.forEach(link => link.remove());
      
      // Add new favicon
      const link = document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = url;
      document.head.appendChild(link);
      
      // Also add as apple-touch-icon
      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = url;
      document.head.appendChild(appleLink);
    }, 'image/png');
  }, []);

  return null;
}