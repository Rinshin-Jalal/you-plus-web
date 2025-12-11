import { z } from 'zod';

export const stringId = z.string().min(1, 'id required');
export const email = z.string().email('invalid email');
export const url = z.string().url('invalid url');
export const planId = z.string().min(1, 'planId required');
