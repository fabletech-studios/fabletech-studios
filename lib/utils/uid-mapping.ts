// UID Mapping for existing customers who signed in with different auth methods
// This maps Google OAuth UIDs to the original customer UIDs

const UID_MAPPINGS: Record<string, string> = {
  // Google UID -> Original Customer UID
  'IIP8rWwMCeZ62Svix1lcZPyRkRj2': 'BAhEHbxh31MgdhAQJza3SVJ7cIh2', // oryshchynskyy@gmail.com
};

export function getMappedUid(googleUid: string): string {
  // Check if this Google UID has a mapping to an existing customer
  return UID_MAPPINGS[googleUid] || googleUid;
}

export function getReverseMapping(customerUid: string): string | null {
  // Find the Google UID for a given customer UID
  for (const [googleUid, mappedUid] of Object.entries(UID_MAPPINGS)) {
    if (mappedUid === customerUid) {
      return googleUid;
    }
  }
  return null;
}