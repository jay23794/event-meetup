export interface ApiResponseBody<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
}

export class ApiResponse {
  static success<T>(data: T, message = 'Success'): ApiResponseBody<T> {
    return {
      success: true,
      data,
      message,
    };
  }

  static error(message: string): ApiResponseBody {
    return {
      success: false,
      message,
    };
  }
  
}

export const successResponse = <T>(data: T, message = 'Success'): ApiResponseBody<T> => ({
  success: true,
  message,
  data,
});