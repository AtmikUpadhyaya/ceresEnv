import { Request } from 'express';
import { User } from '@fieldready/shared';

export type AuthUser = User;

export type AuthenticatedRequest = Request & {
  user?: AuthUser;
};
