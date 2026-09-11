import { Request, Response } from 'express';
import { getSummary } from '../services/report.service.js';
export async function getCountySummary(_req: Request, res: Response) {
  res.json({ data: await getSummary() });
}
