import { setupWorker } from 'msw';
import { handlers } from './handlers';

// 设置 MSW worker
export const worker = setupWorker(...handlers);
