import type { FunctionData } from './function-data';

export function shouldIncludeFunction(fd: FunctionData) {
  return !!fd.overloads.length;
}
