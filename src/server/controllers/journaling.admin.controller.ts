import { NextRequest, NextResponse } from 'next/server';
import { JournalingAdminService } from '../services/journaling.admin.service';
import { 
  UpdateJournalingConfigSchema, 
  CreateJournalingPromptSchema, 
  UpdateJournalingPromptSchema, 
  DeleteJournalingPromptSchema,
  GetJournalingConfigSchema
} from '../validators/journaling.validators';
import { ApiResponse } from '@/src/utils/api-response';
import { handleError } from '@/src/utils/errors';
import { requirePermission } from '@/src/utils/session-helper';

export class JournalingAdminController {
  // Journaling Config Management

  // GET /api/admin/journaling/config?schoolId=xxx
  async getJournalingConfig(req: NextRequest) {
    try {
      const session = await requirePermission(req, 'selfhelp.journaling.view');

      const { searchParams } = new URL(req.url);
      const schoolId = searchParams.get('schoolId');
      
      if (!schoolId) {
        const errorResponse = ApiResponse.error('School ID is required', 400);
        return NextResponse.json(errorResponse, { status: 400 });
      }

      const query = { schoolId };
      const parsed = GetJournalingConfigSchema.parse(query);

      const result = await JournalingAdminService.getJournalingConfig(session.userId, parsed);

      return NextResponse.json(result);
    } catch (err) {
      const errorResponse = handleError(err);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  }

  // PATCH /api/admin/journaling/config
  async updateJournalingConfig(req: NextRequest) {
    try {
      const session = await requirePermission(req, 'selfhelp.journaling.update');

      const body = await req.json();
      const parsed = UpdateJournalingConfigSchema.parse(body);

      const result = await JournalingAdminService.updateJournalingConfig(session.userId, parsed);

      return NextResponse.json(result);
    } catch (err) {
      const errorResponse = handleError(err);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  }

  // Journaling Prompts Management

  // POST /api/admin/journaling/prompts
  async createPrompt(req: NextRequest) {
    try {
      const session = await requirePermission(req, 'selfhelp.journaling.update');

      const body = await req.json();
      const parsed = CreateJournalingPromptSchema.parse(body);

      const result = await JournalingAdminService.createPrompt(session.userId, parsed);

      return NextResponse.json(result);
    } catch (err) {
      const errorResponse = handleError(err);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  }

  // GET /api/admin/journaling/prompts
  async getAllPrompts(req: NextRequest) {
    try {
      const session = await requirePermission(req, 'selfhelp.journaling.view');

      const { searchParams } = new URL(req.url);
      const schoolId = searchParams.get('schoolId');

      const result = await JournalingAdminService.getAllPrompts(session.userId, schoolId);

      return NextResponse.json(result);
    } catch (err) {
      const errorResponse = handleError(err);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  }

  // PATCH /api/admin/journaling/prompts/:id
  async updatePrompt(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const session = await requirePermission(req, 'selfhelp.journaling.update');

      const body = await req.json();
      const parsed = UpdateJournalingPromptSchema.parse(body);

      const result = await JournalingAdminService.updatePrompt(session.userId, params.id, parsed);

      return NextResponse.json(result);
    } catch (err) {
      const errorResponse = handleError(err);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  }

  // PUT /api/admin/journaling/prompts/:id/status
  async updatePromptStatus(req: NextRequest, id: string) {
    try {
      const session = await requirePermission(req, 'selfhelp.journaling.update');

      const body = await req.json();
      const { isEnabled } = body;

      const result = await JournalingAdminService.updatePromptStatus(session.userId, id, isEnabled);

      return NextResponse.json(result);
    } catch (err) {
      const errorResponse = handleError(err);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  }

  // DELETE /api/admin/journaling/prompts/:id
  async deletePrompt(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const session = await requirePermission(req, 'selfhelp.journaling.update');

      const data = { id: params.id };
      const parsed = DeleteJournalingPromptSchema.parse(data);

      const result = await JournalingAdminService.deletePrompt(session.userId, parsed);

      return NextResponse.json(result);
    } catch (err) {
      const errorResponse = handleError(err);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  }
}

export const journalingAdminController = new JournalingAdminController();
