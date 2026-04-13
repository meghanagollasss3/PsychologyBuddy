// src/auth/auth.controller.ts



import { AuthService } from "../services/auth.service";

import { LoginSchema, AdminLoginSchema } from "../validators/auth.validators";

import { ApiResponse } from "@/src/utils/api-response";

import { handleError } from "@/src/utils/errors";

import { NextRequest, NextResponse } from 'next/server';



export class AuthController {

  // --------------------------------------------------

  // POST /auth/student-login

  // --------------------------------------------------

  async studentLogin(req: NextRequest) {

    try {

      const body = await req.json();

      const parsed = LoginSchema.parse(body);



      const result = await AuthService.studentLogin(parsed.studentId, parsed.password);



      // Set session cookie

      const response = NextResponse.json(result);

      if (result.data?.sessionId) {

        response.cookies.set('sessionId', result.data.sessionId, {

          httpOnly: true,

          secure: process.env.NODE_ENV === 'production',

          sameSite: 'lax',

          maxAge: 7 * 24 * 60 * 60, // 7 days

          path: '/',

        });

      }



      return response;

    } catch (err) {

      const errorResponse = handleError(err);

      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });

    }

  }



  // --------------------------------------------------

  // POST /auth/admin-login

  // --------------------------------------------------

  async adminLogin(req: NextRequest) {

    try {

      const body = await req.json();

      const parsed = AdminLoginSchema.parse(body);



      const result = await AuthService.adminLogin(parsed.email, parsed.password);



      // Set session cookie

      const response = NextResponse.json(result);

      if (result.data?.sessionId) {

        response.cookies.set('sessionId', result.data.sessionId, {

          httpOnly: true,

          secure: process.env.NODE_ENV === 'production',

          sameSite: 'lax',

          maxAge: 7 * 24 * 60 * 60, // 7 days

          path: '/',

        });

      }



      return response;

    } catch (err) {

      const errorResponse = handleError(err);

      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });

    }

  }



  // --------------------------------------------------

  // POST /auth/logout

  // --------------------------------------------------

  async logout(req: NextRequest) {

    try {

      // Get session from cookie or header

      const sessionId = req.cookies.get('sessionId')?.value || 

                      req.headers.get('authorization')?.replace('Bearer ', '');



      if (!sessionId) {

        const errorResponse = ApiResponse.error('No session found', 401);

        return NextResponse.json(errorResponse, { status: 401 });

      }



      const result = await AuthService.logout(sessionId);



      // Clear session cookie

      const response = NextResponse.json(result);

      response.cookies.set('sessionId', '', {

        httpOnly: true,

        secure: process.env.NODE_ENV === 'production',

        sameSite: 'lax',

        maxAge: 0,

        path: '/',

      });



      return response;

    } catch (err) {

      const errorResponse = handleError(err);

      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });

    }

  }



  // --------------------------------------------------

  // GET /auth/me

  // --------------------------------------------------

  async me(req: NextRequest) {

    try {

      // Get session from cookie or header

      const sessionId = req.cookies.get('sessionId')?.value || 

                      req.headers.get('authorization')?.replace('Bearer ', '');



      if (!sessionId) {

        const errorResponse = ApiResponse.error('No session found', 401);

        return NextResponse.json(errorResponse, { status: 401 });

      }



      const result = await AuthService.me(sessionId);



      return NextResponse.json(result);

    } catch (err) {

      const errorResponse = handleError(err);

      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });

    }

  }



  // --------------------------------------------------

  // POST /auth/send-otp

  // --------------------------------------------------

  async sendOTP(req: NextRequest) {

    try {

      const body = await req.json();

      const { phoneNumber } = body;



      if (!phoneNumber) {

        const errorResponse = ApiResponse.error('Phone number is required', 400);

        return NextResponse.json(errorResponse, { status: 400 });

      }



      const result = await AuthService.sendOTPToAdmin(phoneNumber);



      return NextResponse.json(result);

    } catch (err) {

      const errorResponse = handleError(err);

      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });

    }

  }



  // --------------------------------------------------

  // POST /auth/verify-otp

  // --------------------------------------------------

  async verifyOTP(req: NextRequest) {

    try {

      const body = await req.json();

      const { phoneNumber, otp } = body;



      if (!phoneNumber || !otp) {

        const errorResponse = ApiResponse.error('Phone number and OTP are required', 400);

        return NextResponse.json(errorResponse, { status: 400 });

      }



      const result = await AuthService.verifyOTPAndLogin(phoneNumber, otp);



      // Set session cookie for successful OTP login

      const response = NextResponse.json(result);

      if (result.data?.sessionId) {

        response.cookies.set('sessionId', result.data.sessionId, {

          httpOnly: true,

          secure: process.env.NODE_ENV === 'production',

          sameSite: 'lax',

          maxAge: 7 * 24 * 60 * 60, // 7 days

          path: '/',

        });

      }



      return response;

    } catch (err) {

      const errorResponse = handleError(err);

      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });

    }

  }

}



export const authController = new AuthController();

