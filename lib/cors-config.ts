// CORS configuration for fabletech.studio
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://fabletech.studio' 
    : '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true'
};

export const allowedOrigins = [
  'https://fabletech.studio',
  'https://www.fabletech.studio',
  'https://fabletech-studios.vercel.app' // Keep for transition period
];

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return allowedOrigins.includes(origin);
}
