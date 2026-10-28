export const extractSecretFromUri = (uri: string): string | null => {
  try {
    const trimmedUri = uri.trim();
    if (!/^otpauth:\/\//i.test(trimmedUri)) {
      return null;
    }

    const url = new URL(trimmedUri);
    const secret = url.searchParams.get('secret');
    return secret?.trim() || null;
  } catch (err) {
    console.error('URI parsing error:', err);
    return null;
  }
};

export const normalizeSecretInput = (input: string): string => {
  const trimmedInput = input.trim();
  return extractSecretFromUri(trimmedInput) ?? trimmedInput;
};

export const createTotpConfig = (secret: string) => ({
  issuer: 'TOTP Generator',
  label: 'User',
  algorithm: 'SHA1' as const,
  digits: 6,
  period: 30,
  secret: secret,
});
