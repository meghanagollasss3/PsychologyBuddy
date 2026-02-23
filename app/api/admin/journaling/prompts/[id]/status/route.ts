import { NextRequest } from 'next/server';
import { journalingAdminController } from '@/src/server/controllers/journaling.admin.controller';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return journalingAdminController.updatePromptStatus(req, id);
}
