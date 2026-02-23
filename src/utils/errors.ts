export class AppError extends Error {

  statusCode: number;



  constructor(message: string, statusCode = 400) {

    super(message);

    this.statusCode = statusCode;

  }

}



export const throwError = (msg: string, code = 400) => {

  throw new AppError(msg, code);

};



// Authentication specific errors

export class AuthError extends AppError {

  constructor(message: string, statusCode = 401) {

    super(message, statusCode);

    this.name = 'AuthError';

  }



  static invalidCredentials(message: string = 'Invalid credentials') {

    return new AuthError(message, 401);

  }



  static unauthorized(message: string = 'Unauthorized') {

    return new AuthError(message, 401);

  }



  static forbidden(message: string = 'Forbidden') {

    return new AuthError(message, 403);

  }



  static notFound(message: string = 'Resource not found') {

    return new AuthError(message, 404);

  }



  static conflict(message: string = 'Resource already exists') {

    return new AuthError(message, 409);

  }

}



// Error handler for API routes

export const handleError = (error: unknown) => {

  console.error('API Error:', {

    error: error instanceof Error ? error.message : error,

    stack: error instanceof Error ? error.stack : undefined,

  });



  // Return appropriate error response

  if (error instanceof Error) {

    return {

      success: false,

      message: error.message,

      error: {

        code: 500,

        type: 'Error',

        details: error

      }

    };

  }



  // Handle Prisma errors

  if (error && typeof error === 'object' && 'code' in error && 'meta' in error) {

    const prismaError = error as any;

    return {

      success: false,

      message: `Database operation failed: ${prismaError.message}`,

      error: {

        code: prismaError.code || 500,

        type: 'DatabaseError',

        details: prismaError.meta

      }

    };

  }



  // Handle other error types

  return {

    success: false,

    message: error instanceof Error ? error.message : 'Unknown error occurred',

    error: {

      code: 500,

      type: 'Error',

      details: error

    }

  };

};

