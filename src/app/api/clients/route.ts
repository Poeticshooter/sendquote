import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { getUser } from '@/lib/auth'
import { validate, clientCreateSchema, clientUpdateSchema } from '@/lib/validation'
import { csrfProtected } from '@/lib/csrf'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clients })
}

export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const csrf = csrfProtected(request)
  if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: csrf.status })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { data, error } = validate(clientCreateSchema, body)
  if (error || !data) {
    return NextResponse.json({ error: error || 'Invalid input' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: client, error: insertError } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      gst_number: data.gstNumber,
      notes: data.notes,
    })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  logger.info('Client created', { userId: user.id, clientId: client.id, name: client.name })
  return NextResponse.json({ client }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const csrf = csrfProtected(request)
  if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: csrf.status })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { data, error } = validate(clientUpdateSchema, { ...(body as Record<string, unknown>), id })
  if (error || !data) {
    return NextResponse.json({ error: error || 'Invalid input' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: client, error: updateError } = await supabase
    .from('clients')
    .update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.gstNumber !== undefined && { gst_number: data.gstNumber }),
      ...(data.notes !== undefined && { notes: data.notes }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (updateError) {
    if (updateError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Client not found or access denied' }, { status: 404 })
    }
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }
  logger.info('Client updated', { userId: user.id, clientId: client.id })
  return NextResponse.json({ client })
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const csrf = csrfProtected(request)
  if (!csrf.ok) return NextResponse.json({ error: csrf.message }, { status: csrf.status })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  logger.info('Client deleted', { userId: user.id, clientId: id })
  return NextResponse.json({ success: true })
}
