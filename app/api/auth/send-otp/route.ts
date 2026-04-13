import { NextRequest } from 'next/server';
import { authController } from '@/src/server/controllers/auth.controller';

export async function POST(req: NextRequest) {
  return authController.sendOTP(req);
}
