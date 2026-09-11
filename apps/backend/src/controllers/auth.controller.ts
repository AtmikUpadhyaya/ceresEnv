import { Request, Response } from 'express';
import * as service from '../services/auth.service.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';
export async function register(req: Request, res: Response) {
  try {
    const input = registerSchema.parse(req.body);
    res.status(201).json({
      data: await service.register(
        input.name,
        input.email,
        input.password,
        req.ip || '0.0.0.0',
      ),
    });
  } catch (error) {
    if (error instanceof service.AuthError)
      return res.status(409).json({ message: error.message });
    return res
      .status(400)
      .json({ message: 'Invalid registration data', issues: error });
  }
}
export async function login(req: Request, res: Response) {
  try {
    const input = loginSchema.parse(req.body);
    res.json({ data: await service.login(input.email, input.password) });
  } catch (error) {
    if (error instanceof service.AuthError)
      return res.status(401).json({ message: error.message });
    return res
      .status(400)
      .json({ message: 'Invalid login data', issues: error });
  }
}
