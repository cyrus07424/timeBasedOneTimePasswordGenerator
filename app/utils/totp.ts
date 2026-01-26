export const extractSecretFromUri = (uri: string): string | null => {
  try {
    // Parse otpauth:// URI
    // Format: otpauth://totp/[label]?secret=[SECRET]&issuer=[ISSUER]
    if (!uri.startsWith('otpauth://')) {
      return null;
    }

    const url = new URL(uri);
    const secret = url.searchParams.get('secret');
    return secret;
  } catch (err) {
    console.error('URI parsing error:', err);
    return null;
  }
};

export const createTotpConfig = (secret: string) => ({
  issuer: 'TOTP Generator',
  label: 'User',
  algorithm: 'SHA1' as const,
  digits: 6,
  period: 30,
  secret: secret,
});
