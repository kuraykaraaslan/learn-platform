// COPIED FROM: kui-react/libs/utils/cn.ts (v1.0.1, copied 2026-08-26)
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
