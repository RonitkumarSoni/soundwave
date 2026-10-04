import type { Request } from 'express';
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    uid: string;
    email: string;
    is_premium: boolean;
    auth_time: number;
  };
}
