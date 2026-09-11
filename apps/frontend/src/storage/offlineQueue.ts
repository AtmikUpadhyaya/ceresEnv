import { CreateAssessmentInput } from '@fieldready/shared';
const keyFor = (userId: string) => `fieldready-sync-queue-v1:${userId}`;
export const readQueue = (userId: string): CreateAssessmentInput[] =>
  JSON.parse(localStorage.getItem(keyFor(userId)) || '[]');
export const writeQueue = (userId: string, records: CreateAssessmentInput[]) =>
  localStorage.setItem(keyFor(userId), JSON.stringify(records));
export const enqueue = (userId: string, record: CreateAssessmentInput) =>
  writeQueue(userId, [...readQueue(userId), record]);
