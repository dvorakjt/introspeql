import { ActionResult } from './action-result';

export interface FunctionResult<T> extends ActionResult {
  result: T;
}
