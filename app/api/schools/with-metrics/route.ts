import { NextRequest } from 'next/server';
import { UserService } from '@/src/services/user.service';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';

// GET /api/schools/with-metrics - Get all schools with alerts and check-ins metrics (Superadmin only)
export const GET = withPermission({
  module: 'ORGANIZATIONS',
  action: 'VIEW'
})(async (req: NextRequest) => {
  try {
    const schoolsWithMetrics = await UserService.getSchoolsWithMetrics();
    return Response.json(schoolsWithMetrics);
  } catch (error) {
    console.error('Get schools with metrics error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
