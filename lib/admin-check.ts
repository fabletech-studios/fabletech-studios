// Admin email whitelist - works without Firebase Admin SDK
export const ADMIN_EMAILS = [
  'admin@fabletech.studio',
  'bmwhelp.ga@gmail.com',
  'omvec.performance@gmail.com'
];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// For client-side components
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/session');
    if (!response.ok) return false;
    
    const data = await response.json();
    return isAdminEmail(data.user?.email);
  } catch {
    return false;
  }
}

// For server-side use with session
export function checkAdminSession(session: any): boolean {
  return isAdminEmail(session?.email || session?.user?.email);
}