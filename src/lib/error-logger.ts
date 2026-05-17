import { createAdminClient } from '@/lib/supabase'

export async function logError(
  errorMessage: string,
  stackTrace: string | null,
  page: string | null,
  userId: string | null
): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('error_logs').insert({
      error_message: errorMessage,
      stack_trace: stackTrace,
      page,
      user_id: userId,
    })
  } catch (e) {
    console.error('logError failed:', e)
  }
}
