import crypto from 'crypto';

export const hashSHA256 = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

export const compareHash = (data: string, hash: string): boolean => {
  return hashSHA256(data) === hash;
};
