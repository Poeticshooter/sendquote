function getEnv(key: string, required = true): string | undefined {
  const value = process.env[key]
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

let validated = false

function validate() {
  if (validated) return
  validated = true

  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]

  for (const key of required) {
    getEnv(key, true)
  }

  const optional = [
    'RESEND_API_KEY',
    'NEXT_PUBLIC_RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
    'NEXT_PUBLIC_SITE_URL',
    'CRON_SECRET',
    'SUPABASE_ACCESS_TOKEN',
    'EMAIL_FROM_ADDRESS',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD',
    'SMTP_EMAIL',
    'SMTP_APP_PASSWORD',
    'SENTRY_ORG',
    'SENTRY_PROJECT',
    'SENTRY_AUTH_TOKEN',
  ]

  for (const key of optional) {
    getEnv(key, false)
  }
}

export const env = {
  init() {
    validate()
  },
  get supabaseUrl() { return getEnv('NEXT_PUBLIC_SUPABASE_URL')! },
  get supabaseAnonKey() { return getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')! },
  get supabaseServiceKey() { return getEnv('SUPABASE_SERVICE_ROLE_KEY')! },
  get resendApiKey() { return getEnv('RESEND_API_KEY', false) },
  get razorpayKeyId() { return getEnv('NEXT_PUBLIC_RAZORPAY_KEY_ID', false) },
  get razorpaySecret() { return getEnv('RAZORPAY_KEY_SECRET', false) },
  get razorpayWebhookSecret() { return getEnv('RAZORPAY_WEBHOOK_SECRET', false) },
  get siteUrl() { return getEnv('NEXT_PUBLIC_SITE_URL', false) || 'http://localhost:3000' },
  get cronSecret() { return getEnv('CRON_SECRET', false) },
  get emailFrom() { return getEnv('EMAIL_FROM_ADDRESS', false) },
  get smtpEmail() { return getEnv('SMTP_EMAIL', false) },
  get smtpAppPassword() { return getEnv('SMTP_APP_PASSWORD', false) },
  get adminEmail() { return getEnv('ADMIN_EMAIL', false) },
  get adminPassword() { return getEnv('ADMIN_PASSWORD', false) },
  get sentryOrg() { return getEnv('SENTRY_ORG', false) },
  get sentryProject() { return getEnv('SENTRY_PROJECT', false) },
  get sentryAuthToken() { return getEnv('SENTRY_AUTH_TOKEN', false) },
}
