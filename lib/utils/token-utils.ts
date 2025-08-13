// Standardized token parsing utility
export function extractUidFromToken(token: string): { uid: string; userInfo: any } {
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    
    // CRITICAL: Always use the same UID extraction priority
    // For Google Sign-In, the 'sub' field is the stable user identifier
    // Firebase custom tokens use 'user_id'
    // Some tokens might have 'uid'
    const uid = payload.sub || payload.user_id || payload.uid;
    
    if (!uid) {
      throw new Error('No UID found in token');
    }
    
    const userInfo = {
      email: payload.email || `${uid}@google.com`,
      name: payload.name || payload.given_name || 'User',
      picture: payload.picture || '',
      provider: payload.firebase?.sign_in_provider || 'google'
    };
    
    console.log(`Token UID extraction: sub=${payload.sub}, user_id=${payload.user_id}, uid=${payload.uid} -> using: ${uid}`);
    
    return { uid, userInfo };
  } catch (error: any) {
    throw new Error(`Failed to extract UID from token: ${error.message}`);
  }
}