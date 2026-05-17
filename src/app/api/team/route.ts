import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { getUser } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const [membersRes, limitRes] = await Promise.all([
    supabase.from('team_members').select('*').eq('account_user_id', user.id).order('created_at'),
    supabase.rpc('check_team_limit', { p_account_user_id: user.id }),
  ])

  if (membersRes.error) return NextResponse.json({ error: membersRes.error.message }, { status: 500 })
  return NextResponse.json({
    members: membersRes.data || [],
    limit: limitRes.data || { allowed: false, current: 0, limit: 0, plan: 'free' },
  })
}

export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { email, role = 'member' } = await request.json()
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })

  const supabase = createAdminClient()
  const limitRes = await supabase.rpc('check_team_limit', { p_account_user_id: user.id })
  const limit = limitRes.data as { allowed: boolean; limit: number; current: number } | null

  if (!limit?.allowed) {
    return NextResponse.json(
      { error: `Team limit reached (${limit?.current}/${limit?.limit}). Upgrade your plan.` },
      { status: 403 }
    )
  }

  const inviteToken = crypto.randomBytes(16).toString('hex')
  const { data, error } = await supabase
    .from('team_members')
    .insert({ account_user_id: user.id, email, role, invite_token: inviteToken })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ member: data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { role, status } = await request.json()
  const updates: Record<string, string> = {}
  if (role) updates.role = role
  if (status) updates.status = status

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', id)
    .eq('account_user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id)
    .eq('account_user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
