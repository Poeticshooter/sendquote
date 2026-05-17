import { createAdminClient } from '@/lib/supabase'

export async function logActivity(
  userId: string,
  entityType: 'quote' | 'invoice' | 'client' | 'payment',
  entityId: string,
  action: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const supabase = createAdminClient()

  await supabase.from('activity_logs').insert({
    user_id: userId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    metadata,
  })
}
