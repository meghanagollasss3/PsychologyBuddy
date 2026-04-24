// src/middlewares/permission.middleware.ts



import { NextRequest, NextResponse } from "next/server";

import { AuthRepository } from "@/src/server/repository/auth.repository";

import { ROLE_PERMISSIONS, MODULES, ACTIONS } from "@/src/config/permission";

import prisma from "@/src/prisma";



interface PermissionOptions {

  module: keyof typeof MODULES;

  action?: keyof typeof ACTIONS; // optional — defaults to "view"

}



/**

 * Middleware-style wrapper for API routes

 * 

 * Usage:

 *   export const POST = withPermission({ module: 'PSYCHO_EDUCATION', action: 'CREATE' })(handler)

 */

export function withPermission(options: PermissionOptions) {

  const { module, action = "VIEW" } = options;

  const requiredPermissionKey = `${MODULES[module]}.${ACTIONS[action]}`;



  return function <T extends (...args: any[]) => any>(handler: T) {

    return async function (req: NextRequest, ctx: any) {

      // Step 1: Get session from cookie

      const sessionId = req.cookies.get('sessionId')?.value || 

                      req.headers.get('authorization')?.replace('Bearer ', '');



      if (!sessionId) {

        return NextResponse.json(

          { success: false, message: "Not authenticated" },

          { status: 401 }

        );

      }



      // Step 2: Find session and user with permissions

      const session = await AuthRepository.findSessionBySessionId(sessionId);

      

      if (!session) {

        return NextResponse.json(

          { success: false, message: "Invalid session" },

          { status: 401 }

        );

      }



      // Step 3: Check if session is expired

      if (session.expiresAt < new Date()) {

        await AuthRepository.deleteSession(sessionId);

        return NextResponse.json(

          { success: false, message: "Session expired" },

          { status: 401 }

        );

      }



      const user = session.user;



      // Step 3.5: Check user status

      // Check student status

      if (user.role?.name === 'STUDENT') {

        const studentStatus = user.studentProfile?.status || 'ACTIVE';

        if (studentStatus === 'INACTIVE') {

          await AuthRepository.deleteSession(sessionId);

          return NextResponse.json(

            { success: false, message: "Your account is inactive. Please contact your school administrator." },

            { status: 403 }

          );

        }

        

        if (studentStatus === 'SUSPENDED') {

          await AuthRepository.deleteSession(sessionId);

          return NextResponse.json(

            { success: false, message: "Your account is suspended. Please contact your school administrator." },

            { status: 403 }

          );

        }

      }



      // Check admin status

      if (user.role?.name && ['ADMIN', 'SCHOOL_SUPERADMIN', 'SUPERADMIN'].includes(user.role.name)) {

        const adminStatus = user.status || 'ACTIVE';

        if (adminStatus === 'INACTIVE') {

          await AuthRepository.deleteSession(sessionId);

          return NextResponse.json(

            { success: false, message: "Your account is inactive. Please contact your school administrator." },

            { status: 403 }

          );

        }

        

        if (adminStatus === 'SUSPENDED') {

          await AuthRepository.deleteSession(sessionId);

          return NextResponse.json(

            { success: false, message: "Your account is suspended. Please contact your school administrator." },

            { status: 403 }

          );

        }

      }



      // Extract schoolId from user's school relation

      const userSchoolId = user.school?.id || user.schoolId;



      // For non-SUPERADMIN users, schoolId is required

      if (user.role.name !== "SUPERADMIN" && !userSchoolId) {

        return NextResponse.json(

          { success: false, message: "User is not assigned to any school" },

          { status: 403 }

        );

      }



      // Step 4: SuperAdmin always bypasses permission checks

      if (user.role.name === "SUPERADMIN") {

        return handler(req, { ...ctx, user, userSchoolId });

      }



      // Step 5: Get user permissions from role

      const userPermissions = ROLE_PERMISSIONS[user.role.name as keyof typeof ROLE_PERMISSIONS] || [];

      console.log('Permission check:', {
        userRole: user.role.name,
        requiredPermission: requiredPermissionKey,
        userPermissions,
        hasPermission: userPermissions.includes(requiredPermissionKey as any)
      });



      // Step 6: Check if user has required permission

      const hasPermission = userPermissions.includes(requiredPermissionKey as any);



      if (!hasPermission) {

        return NextResponse.json(

          {

            success: false,

            message: `Forbidden: Missing permission '${requiredPermissionKey}'`,

            requiredPermission: requiredPermissionKey,

            userRole: user.role.name,

          },

          { status: 403 }

        );

      }



      // Step 7: School/organization scoping for admins

      if ((user.role.name === "ADMIN" || user.role.name === "SCHOOL_SUPERADMIN") && userSchoolId) {

        // Admin can only access resources from their school

        // This will be implemented in specific API routes

        ctx.userSchoolId = userSchoolId;

        // Check if user is a primary admin for location-specific permissions

        const primaryAdminSchool = await prisma.school.findFirst({

          where: { primaryAdminId: user.id },

          select: { id: true }

        });

        if (primaryAdminSchool) {

          ctx.isPrimaryAdmin = true;

          ctx.primarySchoolId = primaryAdminSchool.id;

        }

        // For ADMIN users, get their assigned locations
        if (user.role.name === "ADMIN") {
          const assignedLocations = await prisma.locationAdminAssignment.findMany({
            where: { adminId: user.id },
            select: { locationId: true }
          });
          
          ctx.userLocationIds = assignedLocations.map(loc => loc.locationId);
        }

        // Note: This will be implemented in specific API routes that need location access

      }

      // Step 8: Pass user into API handler context

      return handler(req, { ...ctx, user, userSchoolId });

    };

  };

}

