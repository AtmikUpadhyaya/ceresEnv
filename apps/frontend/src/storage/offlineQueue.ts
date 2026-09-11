import { CreateAssessmentInput } from '@fieldready/shared';
const KEY = 'fieldready-sync-queue-v1';
export const readQueue = (): CreateAssessmentInput[] =>
  JSON.parse(localStorage.getItem(KEY) || '[]');
export const writeQueue = (records: CreateAssessmentInput[]) =>
  localStorage.setItem(KEY, JSON.stringify(records));
export const enqueue = (record: CreateAssessmentInput) =>
  writeQueue([...readQueue(), record]);
