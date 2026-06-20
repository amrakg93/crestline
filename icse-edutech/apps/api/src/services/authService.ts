import jwt from 'jsonwebtoken';
import type { User, OtpRecord, JwtPayload } from '../types';

// In-memory stores
const users = new Map<string, User>();
const otpStore = new Map<string, OtpRecord>();

const JWT_SECRET = process.env.JWT_SECRET || 'icse-edutech-dev-secret-change-in-production';
const JWT_EXPIRY = '7d';
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Generate a deterministic 6-digit OTP (mock)
function generateOtp(phone: string): string {
  if (process.env.OTP_MOCK_ENABLED === 'true' || !process.env.OTP_MOCK_ENABLED) {
    // Mock OTP: always "123456" for any phone in development
    return '123456';
  }
  // Production: generate random 6-digit OTP
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function sendOtp(phone: string): { success: boolean; message: string } {
  // Validate phone (Indian format: 10 digits, optionally starting with +91)
  const cleaned = phone.replace(/[\s+\-]/g, '');
  if (!/^\d{10}$/.test(cleaned)) {
    throw new Error('Invalid phone number. Must be 10 digits.');
  }

  const otp = generateOtp(cleaned);
  const otpRecord: OtpRecord = {
    phone: cleaned,
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    verified: false,
  };

  otpStore.set(cleaned, otpRecord);

  // In production, this would send SMS via Twilio/msg91/etc.
  console.log(`[OTP Mock] OTP for ${cleaned}: ${otp}`);

  return {
    success: true,
    message: `OTP sent to ${cleaned}. (Mock: ${otp})`,
  };
}

export function verifyOtp(phone: string, otp: string): { token: string; user: User } {
  const cleaned = phone.replace(/[\s+\-]/g, '');
  const record = otpStore.get(cleaned);

  if (!record) {
    throw new Error('No OTP was sent to this number. Please request OTP first.');
  }

  if (record.verified) {
    throw new Error('OTP already used. Please request a new one.');
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleaned);
    throw new Error('OTP has expired. Please request a new one.');
  }

  if (record.otp !== otp) {
    throw new Error('Invalid OTP. Please try again.');
  }

  // Mark OTP as verified (single use)
  record.verified = true;

  // Find or create user
  let user = Array.from(users.values()).find((u) => u.phone === cleaned);
  if (!user) {
    user = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      phone: cleaned,
      name: `Student_${cleaned.slice(-4)}`,
      createdAt: Date.now(),
    };
    users.set(user.id, user);
  }

  // Generate JWT
  const payload: JwtPayload = {
    userId: user.id,
    phone: user.phone,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

  return { token, user };
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function getUserById(userId: string): User | undefined {
  return users.get(userId);
}

export function getUserByPhone(phone: string): User | undefined {
  return Array.from(users.values()).find((u) => u.phone === phone);
}

// For development: get JWT secret
export function getJwtSecret(): string {
  return JWT_SECRET;
}
