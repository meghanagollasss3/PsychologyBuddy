import { NextRequest } from 'next/server';
import { journalingStudentController } from '@/src/server/controllers/journaling.student.controller';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return journalingStudentController.deleteWritingJournal(req, { params });
}
