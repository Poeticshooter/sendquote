import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)

    if (error) {
      return NextResponse.json(
        { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { status: 'unhealthy', error: message, timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
