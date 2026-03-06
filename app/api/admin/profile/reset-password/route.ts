import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/src/server/profiles/admin/admin.service";
import { withPermission } from "@/src/middleware/permission.middleware";
import { handleError } from "@/src/utils/errors";
import { ResetAdminPasswordSchema } from "@/src/server/profiles/admin/admin.validators";

// POST /api/admin/profile/reset-password - Change own password
export const POST = withPermission({ 
  module: 'SETTINGS', 
  action: 'UPDATE' 
})(async (req: NextRequest, { user }: any) => {
  try {
    const body = await req.json();
    const validatedData = ResetAdminPasswordSchema.parse(body);
    
    const result = await AdminService.changeOwnPassword(user.id, validatedData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Change admin password error:', error);
    const errorResponse = handleError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
