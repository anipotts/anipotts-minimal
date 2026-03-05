export type ApiResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };
