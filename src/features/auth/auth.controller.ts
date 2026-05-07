import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '@/shared/utils/ApiResponse';
import { asyncHandler } from '@/shared/utils/asyncHandler';

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  register = asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement register handler
    res.status(201).json(ApiResponse.success(null, 'User registered'));
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement login handler
    res.status(200).json(ApiResponse.success(null, 'Login successful'));
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement refreshToken handler
    res.status(200).json(ApiResponse.success(null, 'Token refreshed'));
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement logout handler
    res.status(200).json(ApiResponse.success(null, 'Logout successful'));
  });
}
