"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/toast"

const AVAILABLE_VARIABLES = [
  { var: '{{client_name}}', desc: 'Client name' },
  { var: '{{quote_number}}', desc: 'Quote number' },
  { var: '{{total}}', desc: 'Quote total' },
  { var: '{{valid_until}}', desc: 'Expiry date' },
  { var: '{{dashboard_link}}', desc: 'Dashboard URL' },
  { var: '{{message}}', desc: 'Client message (changes requested)' },
]

interface EmailTemplatesClientProps {
  templates: Record<string, { subject: string; body_html: string }>
  availableTemplates: Array<{ key: string; label: string; description: string }>
}

export default function EmailTemplatesClient({ templates, availableTemplates }: EmailTemplatesClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [subject, setSubject] = useState("")
  const [bodyHtml, setBodyHtml] = useState("")
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const selectedTemplate = availableTemplates.find(t => t.key === selectedKey)
  const savedTemplate = selectedKey ? templates[selectedKey] : null

  function handleSelect(key: string) {
    setSelectedKey(key)
    const saved = templates[key]
    setSubject(saved?.subject || "")
    setBodyHtml(saved?.body_html || "")
    setPreviewMode(false)
  }

  function insertVariable(variable: string) {
    setBodyHtml(prev => prev + variable)
  }

  async function handleSave() {
    if (!selectedKey) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast("Not authenticated", "error")
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('email_templates')
      .upsert({
        user_id: user.id,
        template_key: selectedKey,
        subject,
        body_html: bodyHtml,
      }, { onConflict: 'user_id,template_key' })

    if (error) {
      toast("Failed to save template", "error")
    } else {
      toast("Template saved!", "success")
      router.refresh()
    }
    setSaving(false)
  }

  async function handleReset() {
    if (!selectedKey) return
    setSaving(true)

    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('template_key', selectedKey)

    if (error) {
      toast("Failed to reset template", "error")
    } else {
      toast("Template reset to default", "success")
      setSubject("")
      setBodyHtml("")
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/settings" className="text-sm text-indigo-600 hover:text-indigo-700 mb-4 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Settings
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Email Templates</h1>
        <p className="text-slate-500 mt-1">Customize the emails sent to you for quote events.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Templates</h2>
            <div className="space-y-2">
              {availableTemplates.map((tpl) => {
                const hasCustom = !!templates[tpl.key]
                return (
                  <button
                    key={tpl.key}
                    onClick={() => handleSelect(tpl.key)}
                    className={`w-full text-left p-3 rounded-xl transition-colors ${
                      selectedKey === tpl.key
                        ? 'bg-indigo-50 border-indigo-200 border'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900">{tpl.label}</p>
                      {hasCustom && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Custom</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{tpl.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {selectedKey && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mt-4">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Available Variables</h2>
              <div className="space-y-1.5">
                {AVAILABLE_VARIABLES.map((v) => (
                  <button
                    key={v.var}
                    onClick={() => insertVariable(v.var)}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <code className="text-xs text-indigo-600">{v.var}</code>
                    <span className="text-xs text-slate-500 ml-2">{v.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedKey ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">{selectedTemplate?.label}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    {previewMode ? 'Edit' : 'Preview'}
                  </button>
                  {savedTemplate && (
                    <button
                      onClick={handleReset}
                      disabled={saving}
                      className="text-sm text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {previewMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Subject Preview</label>
                    <p className="text-sm text-slate-900 bg-slate-50 rounded-lg p-3">{subject || '(default subject)'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Body Preview</label>
                    <div
                      className="text-sm text-slate-700 bg-slate-50 rounded-lg p-4 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: bodyHtml || '(default body)' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900"
                      placeholder="Email subject line"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Body (HTML)</label>
                    <textarea
                      value={bodyHtml}
                      onChange={e => setBodyHtml(e.target.value)}
                      rows={12}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900 font-mono text-sm resize-y"
                      placeholder="Email body HTML"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving || (!subject && !bodyHtml)}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Save Template'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <p className="text-slate-500 text-sm">Select a template to customize</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
