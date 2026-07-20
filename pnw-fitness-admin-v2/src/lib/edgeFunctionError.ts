// Supabase Edge Function errors carry the function's JSON error body on
// `context` (a Response), which isn't part of the base FunctionsError type.
interface EdgeFunctionErrorLike {
  message: string;
  context?: { json?: () => Promise<{ error?: string } | null> };
}

export async function edgeFunctionErrorMessage(err: EdgeFunctionErrorLike): Promise<string> {
  try {
    const body = await err.context?.json?.();
    if (body?.error) return body.error;
  } catch {
    // fall through to the raw error message
  }
  return err.message;
}
