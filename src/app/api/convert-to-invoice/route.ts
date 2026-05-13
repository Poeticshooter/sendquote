import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'

async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const supabase = createAdminClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (!error && user) return user
  }
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { quoteId } = await request.json()
  if (!quoteId) return NextResponse.json({ error: 'missing quoteId' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: quote } = await supabase.from("quotes").select("user_id, quote_number").eq("id", quoteId).single()
  if (!quote) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (quote.user_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const { data: invoiceId } = await supabase.rpc('create_invoice_from_quote', { p_quote_id: quoteId })
  if (!invoiceId) return NextResponse.json({ error: 'failed to create invoice' }, { status: 500 })

  return NextResponse.json({ invoiceId })
}