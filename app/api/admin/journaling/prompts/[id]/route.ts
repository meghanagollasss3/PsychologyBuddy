import { NextRequest } from 'next/server';
import { journalingAdminController } from '@/src/server/controllers/journaling.admin.controller';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return journalingAdminController.updatePrompt(req, { params: { id } });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return journalingAdminController.updatePrompt(req, { params: { id } });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return journalingAdminController.deletePrompt(req, { params: { id } });
}
