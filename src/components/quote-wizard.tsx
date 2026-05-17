"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { formatINR } from "@/lib/utils"
import { sanitizeInput } from "@/lib/sanitize"
import { checkQuota } from "@/lib/plan"
import { useToast } from "@/components/toast"
import { getStatusStyleCompact } from "@/lib/status-styles"
import VoiceInputButton from "./voice-input-button"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type LineItem = {
  id: string
  description: string
  spec: string
  quantity: number
  unit: string
  rate: number
  amount: number
}

const UNITS = ["nos", "sqft", "hours", "days", "kg", "meter", "pcs", "set", "box"]

const STEPS = [
  { id: 1, name: "Client Details", icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" },
  { id: 2, name: "Line Items", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { id: 3, name: "Pricing", icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: 4, name: "Review & Send", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
]

interface SortableItemProps {
  id: string
  children: React.ReactNode
  dragHandleProps?: Record<string, unknown>
}

function SortableItem({ id, children, dragHandleProps }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children}
    </div>
  )
}

interface SortableLineItemProps {
  item: LineItem
  index: number
  filteredItems: { description: string; spec: string; unit: string; rate: number }[]
  itemDropdownIndex: number | null
  updateItem: (index: number, field: keyof LineItem, value: string | number) => void
  removeItem: (index: number) => void
  setItemDropdownIndex: (index: number | null) => void
  canRemove: boolean
}

function SortableLineItem({ item, index, filteredItems, itemDropdownIndex, updateItem, removeItem, setItemDropdownIndex, canRemove }: SortableLineItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1,
      }}
      className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 group"
    >
      <div className="mt-3 text-slate-300 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </div>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-4">
          <div className="relative flex items-center gap-1.5">
            <input
              type="text"
              value={item.description}
              onChange={e => { updateItem(index, "description", e.target.value); setItemDropdownIndex(index) }}
              onFocus={() => setItemDropdownIndex(index)}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Description"
            />
            <VoiceInputButton
              onResult={text => updateItem(index, "description", text)}
              placeholder="Say item name"
              size="sm"
            />
            {itemDropdownIndex === index && filteredItems.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {filteredItems.slice(0, 8).map((pItem, pi) => (
                  <button
                    key={pi}
                    onClick={() => {
                      updateItem(index, "description", pItem.description)
                      updateItem(index, "spec", pItem.spec || "")
                      updateItem(index, "unit", pItem.unit || "nos")
                      updateItem(index, "rate", pItem.rate)
                      setItemDropdownIndex(null)
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-indigo-50 text-sm"
                  >
                    <span className="font-medium text-slate-900">{pItem.description}</span>
                    {pItem.spec && <span className="text-slate-400 ml-1">({pItem.spec})</span>}
                    <span className="text-indigo-500 ml-2">₹{pItem.rate}/{pItem.unit}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="sm:col-span-3">
          <input
            type="text"
            value={item.spec}
            onChange={e => updateItem(index, "spec", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Specifications"
          />
        </div>
        <div className="sm:col-span-2">
          <input
            type="number"
            value={item.quantity || ""}
            onChange={e => updateItem(index, "quantity", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Qty"
            min="0"
          />
        </div>
        <div className="sm:col-span-2">
          <input
            type="number"
            value={item.rate || ""}
            onChange={e => updateItem(index, "rate", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Rate"
            min="0"
          />
        </div>
        <div className="sm:col-span-1">
          <select
            value={item.unit}
            onChange={e => updateItem(index, "unit", e.target.value)}
            className="w-full px-2 py-2 text-sm border border-slate-200 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <div className="text-right min-w-[80px]">
        <p className="text-sm font-medium text-slate-900">₹{item.amount.toFixed(2)}</p>
      </div>
      <button
        onClick={() => removeItem(index)}
        disabled={!canRemove}
        className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-30"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

interface Props {
  initialData?: {
    client_name: string
    client_phone: string
    client_email: string
    client_address: string
    validTill: string
    paymentTerms: string
    items: LineItem[]
    discount: number
    discountType: "percentage" | "fixed"
    gstRate: number
    notes: string
    terms: string
  }
  quoteId?: string
  mode: "create" | "edit"
}

export default function QuoteWizard({ initialData, quoteId, mode }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { toast } = useToast()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [quoteCount, setQuoteCount] = useState<number | null>(null)

  const [clientName, setClientName] = useState(initialData?.client_name || "")
  const [clientPhone, setClientPhone] = useState(initialData?.client_phone || "")
  const [clientEmail, setClientEmail] = useState(initialData?.client_email || "")
  const [clientAddress, setClientAddress] = useState(initialData?.client_address || "")
  const [validTill, setValidTill] = useState(initialData?.validTill || "")
  const [paymentTerms, setPaymentTerms] = useState(initialData?.paymentTerms || "")
  const [items, setItems] = useState<LineItem[]>(initialData?.items || [
    { id: "1", description: "", spec: "", quantity: 1, unit: "nos", rate: 0, amount: 0 },
  ])
  const [discount, setDiscount] = useState(initialData?.discount || 0)
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(initialData?.discountType || "percentage")
  const [gstRate, setGstRate] = useState(initialData?.gstRate || 0)
  const [notes, setNotes] = useState(initialData?.notes || "")
  const [terms, setTerms] = useState(initialData?.terms || "")

  const [showPreview, setShowPreview] = useState(false)
  const [pastClients, setPastClients] = useState<{ client_name: string; client_phone: string; client_email: string; client_address: string }[]>([])
  const [pastItems, setPastItems] = useState<{ description: string; spec: string; unit: string; rate: number }[]>([])
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [itemDropdownIndex, setItemDropdownIndex] = useState<number | null>(null)
  const clientRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { count } = await supabase.from("quotes").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      setQuoteCount(count || 0)

      const templateType = searchParams.get("template")
      const templateId = searchParams.get("templateId")

      if (templateType === "default" && templateId) {
        const { DEFAULT_TEMPLATES } = await import("@/components/template-gallery")
        const tpl = DEFAULT_TEMPLATES.find(t => t.id === templateId)
        if (tpl) {
          setClientName("")
          setClientPhone("")
          setClientEmail("")
          setClientAddress("")
          setDiscount(tpl.discount)
          setDiscountType(tpl.discountType as "percentage" | "fixed")
          setGstRate(tpl.gstRate)
          setNotes(tpl.notes || "")
          setTerms(tpl.terms || "")
          setPaymentTerms(tpl.paymentTerms || "")
          const loadedItems = tpl.items.map((item, i) => ({
            id: `tpl-${i}`,
            description: item.description,
            spec: item.spec,
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            amount: item.quantity * item.rate,
          }))
          setItems(loadedItems)
          toast(`Loaded "${tpl.name}" template`, "success")
        }
      } else if (templateType === "saved" && templateId) {
        const { data: quote } = await supabase.from("quotes").select("*").eq("id", templateId).single()
        if (quote) {
          setClientName("")
          setClientPhone("")
          setClientEmail("")
          setClientAddress("")
          setDiscount(Number(quote.discount))
          setDiscountType(quote.discount_type as "percentage" | "fixed")
          setGstRate(Number(quote.gst_rate))
          setNotes(quote.notes || "")
          setTerms(quote.terms || "")
          setPaymentTerms(quote.payment_terms || "")
          const { data: items } = await supabase.from("quote_items").select("*").eq("quote_id", templateId).order("sort_order")
          if (items && items.length > 0) {
            const loadedItems = items.map((item, i) => ({
              id: `tpl-${i}`,
              description: item.description,
              spec: item.spec || "",
              quantity: item.quantity,
              unit: item.unit,
              rate: item.rate,
              amount: item.amount,
            }))
            setItems(loadedItems)
          }
          toast(`Loaded "${quote.template_name || quote.client_name}" template`, "success")
        }
      }

      const { data: clientData } = await supabase.from("quotes").select("client_name, client_phone, client_email, client_address")
        .eq("user_id", user.id).not("client_name", "is", null).order("created_at", { ascending: false }).limit(20)
      const seenClients = new Set()
      setPastClients((clientData || []).filter(c => {
        if (seenClients.has(c.client_name)) return false
        seenClients.add(c.client_name)
        return true
      }) as typeof pastClients)

      const { data: userQuoteIds } = await supabase
        .from("quotes").select("id").eq("user_id", user.id)
      const ids = (userQuoteIds || []).map(q => q.id)
      if (ids.length > 0) {
        const { data: itemsData } = await supabase
          .from("quote_items").select("description, spec, unit, rate")
          .in("quote_id", ids).order("description").limit(100)
        const uniqueItems = new Map()
        ;(itemsData || []).forEach(item => {
          if (item.description && !uniqueItems.has(item.description)) {
            uniqueItems.set(item.description, item)
          }
        })
        setPastItems(Array.from(uniqueItems.values()))
      }
    })
  }, [supabase]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) setShowClientDropdown(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const filteredItems = itemDropdownIndex !== null && itemDropdownIndex >= 0 && pastItems.length > 0
    ? pastItems.filter(i => i.description.toLowerCase().includes(items[itemDropdownIndex]?.description.toLowerCase() || ""))
    : []

  async function handleSave(asDraft = true) {
    if (!validateStep(currentStep)) {
      toast("Please fix the errors before saving", "error")
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (mode === "create") {
        const quota = await checkQuota(user.id, 'quote')
        if (!quota.allowed) {
          toast("Free plan: 3 quotes/month. Upgrade for ₹299.", "error")
          return
        }
      }

      const { subtotal, discountAmount, afterDiscount, gstAmount, total } = calculateTotals()

      const quoteData = {
        user_id: user.id,
        client_name: sanitizeInput(clientName),
        client_phone: sanitizeInput(clientPhone),
        client_email: sanitizeInput(clientEmail),
        client_address: sanitizeInput(clientAddress),
        valid_until: validTill || null,
        payment_terms: sanitizeInput(paymentTerms),
        subtotal,
        discount,
        discount_type: discountType,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        total,
        notes: sanitizeInput(notes),
        terms: sanitizeInput(terms),
        status: asDraft ? "draft" : "sent",
      }

      let quote
      let quoteNumber = ''
      if (mode === "create") {
        const nanoid = (await import("nanoid")).nanoid
        const token = nanoid(12)
        const { data: numData } = await supabase.rpc('next_quote_number', { p_user_id: user.id })
        quoteNumber = numData as string

        const itemsData = items.map((item, index) => ({
          description: sanitizeInput(item.description),
          spec: sanitizeInput(item.spec || ''),
          quantity: item.quantity,
          unit: sanitizeInput(item.unit),
          rate: item.rate,
          amount: item.amount,
          sort_order: index,
        }))

        const { data, error } = await supabase.rpc('create_quote_with_items', {
          p_user_id: user.id,
          p_quote_number: quoteNumber,
          p_unique_token: token,
          p_client_name: quoteData.client_name,
          p_client_email: quoteData.client_email,
          p_client_phone: quoteData.client_phone,
          p_client_address: quoteData.client_address,
          p_valid_until: quoteData.valid_until,
          p_payment_terms: quoteData.payment_terms,
          p_subtotal: quoteData.subtotal,
          p_discount: quoteData.discount,
          p_discount_type: quoteData.discount_type,
          p_gst_rate: quoteData.gst_rate,
          p_gst_amount: quoteData.gst_amount,
          p_total: quoteData.total,
          p_notes: quoteData.notes,
          p_terms: quoteData.terms,
          p_status: quoteData.status,
          p_items: JSON.stringify(itemsData),
        })

        if (error) throw error
        quote = { id: data }
      } else {
        const { data, error } = await supabase.from("quotes").update({
          ...quoteData,
          updated_at: new Date().toISOString(),
        }).eq("id", quoteId).select("id").single()

        if (error) throw error
        quote = data

        await supabase.from("quote_items").delete().eq("quote_id", quoteId)

        const itemsData = items.map((item, index) => ({
          quote_id: quoteId,
          description: sanitizeInput(item.description),
          spec: sanitizeInput(item.spec || ''),
          quantity: item.quantity,
          unit: sanitizeInput(item.unit),
          rate: item.rate,
          amount: item.amount,
          sort_order: index,
        }))

        const { error: itemsError } = await supabase.from("quote_items").insert(itemsData)
        if (itemsError) throw itemsError
      }

      if (quote) {
        if (mode === "create") {
          const { incrementQuoteCount } = await import("@/lib/plan")
          await incrementQuoteCount(user.id)
          const { logActivity } = await import("@/lib/activity")
          await logActivity(user.id, "quote", quote.id, "quote_created", { quote_number: quoteNumber })
        }

        toast(mode === "create" ? "Quote created!" : "Quote updated!", "success")
        router.push(`/quote/${quote.id}`)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save quote"
      toast(message, "error")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveRef = useRef(handleSave)
  useEffect(() => {
    handleSaveRef.current = handleSave
  })

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSaveRef.current()
      }
      if (e.key === "Escape" && showPreview) {
        setShowPreview(false)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [showPreview])

  useEffect(() => {
    function handleVoiceUpdate(e: Event) {
      const detail = (e as CustomEvent).detail
      if (detail?.clientName && !clientName) {
        setClientName(detail.clientName)
      }
      if (detail?.items?.length > 0 && items.length === 1 && !items[0].description) {
        const voiceItems = detail.items.map((item: { description: string; quantity: number; rate: number }, i: number) => ({
          id: `voice-${i}`,
          description: item.description,
          spec: "",
          quantity: item.quantity,
          unit: "nos",
          rate: item.rate,
          amount: item.quantity * item.rate,
        }))
        setItems(voiceItems)
      } else if (detail?.items?.length > 0) {
        const voiceItems = detail.items.map((item: { description: string; quantity: number; rate: number }, i: number) => ({
          id: `voice-${Date.now()}-${i}`,
          description: item.description,
          spec: "",
          quantity: item.quantity,
          unit: "nos",
          rate: item.rate,
          amount: item.quantity * item.rate,
        }))
        setItems(prev => [...prev, ...voiceItems])
      }
    }

    window.addEventListener('sendquote-voice-update', handleVoiceUpdate)
    return () => window.removeEventListener('sendquote-voice-update', handleVoiceUpdate)
  }, [clientName, items])

  const filteredClients = pastClients.filter(c => c.client_name.toLowerCase().includes(clientName.toLowerCase()))

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    const newItems = [...items]
    const item = { ...newItems[index] } as LineItem
    if (field === "description" || field === "spec" || field === "unit") {
      ;(item as Record<string, unknown>)[field] = value
    } else {
      const numValue = typeof value === "string" ? parseFloat(value) || 0 : value
      ;(item as Record<string, unknown>)[field] = numValue
      item.amount = item.quantity * item.rate
    }
    newItems[index] = item
    setItems(newItems)
    validateStep(currentStep)
  }

  function addItem() {
    setItems([...items, { id: String(Date.now()), description: "", spec: "", quantity: 1, unit: "nos", rate: 0, amount: 0 }])
  }

  function removeItem(index: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over?.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  function calculateTotals() {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    const discountAmount = discountType === "percentage" ? (subtotal * discount) / 100 : discount
    const afterDiscount = subtotal - discountAmount
    const gstAmount = (afterDiscount * gstRate) / 100
    const total = afterDiscount + gstAmount
    return { subtotal, discountAmount, afterDiscount, gstAmount, total }
  }

  function validateStep(step: number): boolean {
    const newErrors: Record<string, string> = {}
    
    if (step === 1) {
      if (!clientName.trim()) {
        newErrors.clientName = "Client name is required"
      }
      if (clientPhone && !/^\d{7,}$/.test(clientPhone.replace(/\D/g, ""))) {
        newErrors.clientPhone = "Please enter a valid phone number"
      }
      if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
        newErrors.clientEmail = "Please enter a valid email address"
      }
    }

    if (step === 2) {
      const emptyItems = items.filter(i => !i.description.trim())
      if (emptyItems.length > 0) {
        newErrors.items = "Please add at least one item with description"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function nextStep() {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, 4))
    }
  }

  function prevStep() {
    setCurrentStep(Math.max(currentStep - 1, 1))
  }

  const { subtotal, discountAmount, afterDiscount, gstAmount, total } = calculateTotals()

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-slate-900 tracking-tight">
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="32" height="32" rx="8" fill="#4F46E5" />
                  <path d="M10 10h12M10 16h8M10 22h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M22 18l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                SendQuote
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-sm text-slate-500">{mode === "create" ? "New Quote" : "Edit Quote"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">Press ESC to exit • Ctrl+S to save</span>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto w-full px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                    disabled={step.id > currentStep}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      step.id === currentStep
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                        : step.id < currentStep
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-400"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      step.id === currentStep ? "bg-white/20" : step.id < currentStep ? "bg-indigo-200" : "bg-slate-200"
                    }`}>
                      {step.id < currentStep ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : step.id}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">{step.name}</span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={`w-8 sm:w-16 h-0.5 mx-1 transition-colors ${step.id < currentStep ? "bg-indigo-600" : "bg-slate-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 animate-fade-in">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Client Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative" ref={clientRef}>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Client Name *</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={clientName}
                          onChange={e => { setClientName(e.target.value); setShowClientDropdown(true) }}
                          onFocus={() => setShowClientDropdown(true)}
                          className={`flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white text-slate-900 ${errors.clientName ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:ring-indigo-200 focus:border-indigo-300"}`}
                          placeholder="Enter client name"
                        />
                        <VoiceInputButton
                          onResult={text => setClientName(text)}
                          placeholder="Say client name"
                          size="md"
                        />
                      </div>
                      {errors.clientName && <p className="text-xs text-red-500 mt-1">{errors.clientName}</p>}
                      {showClientDropdown && filteredClients.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredClients.map((client, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setClientName(client.client_name)
                                setClientPhone(client.client_phone || "")
                                setClientEmail(client.client_email || "")
                                setClientAddress(client.client_address || "")
                                setShowClientDropdown(false)
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm"
                            >
                              <span className="font-medium text-slate-900">{client.client_name}</span>
                              {client.client_phone && <span className="text-slate-400 ml-2">{client.client_phone}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={e => setClientPhone(e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white text-slate-900 ${errors.clientPhone ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:ring-indigo-200 focus:border-indigo-300"}`}
                        placeholder="10-digit phone number"
                      />
                      {errors.clientPhone && <p className="text-xs text-red-500 mt-1">{errors.clientPhone}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={e => setClientEmail(e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white text-slate-900 ${errors.clientEmail ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:ring-indigo-200 focus:border-indigo-300"}`}
                        placeholder="client@example.com"
                      />
                      {errors.clientEmail && <p className="text-xs text-red-500 mt-1">{errors.clientEmail}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Valid Till</label>
                      <input
                        type="date"
                        value={validTill}
                        onChange={e => setValidTill(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-white text-slate-900"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                      <textarea
                        value={clientAddress}
                        onChange={e => setClientAddress(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-none bg-white text-slate-900"
                        placeholder="Client address"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Payment Terms</label>
                      <input
                        type="text"
                        value={paymentTerms}
                        onChange={e => setPaymentTerms(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-white text-slate-900"
                        placeholder="e.g., 50% advance, 50% on delivery"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Line Items</h2>
                  <p className="text-sm text-slate-500">Drag to reorder items</p>
                </div>
                {errors.items && <p className="text-sm text-red-500">{errors.items}</p>}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <SortableLineItem
                          key={item.id}
                          item={item}
                          index={index}
                          filteredItems={filteredItems}
                          itemDropdownIndex={itemDropdownIndex}
                          updateItem={updateItem}
                          removeItem={removeItem}
                          setItemDropdownIndex={setItemDropdownIndex}
                          canRemove={items.length > 1}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <button
                  onClick={addItem}
                  className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-sm font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Item
                </button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Pricing & Terms</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Discount</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={discount || ""}
                          onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900"
                          placeholder="0"
                          min="0"
                        />
                        <select
                          value={discountType}
                          onChange={e => setDiscountType(e.target.value as "percentage" | "fixed")}
                          className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900"
                        >
                          <option value="percentage">%</option>
                          <option value="fixed">₹</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">GST Rate (%)</label>
                      <input
                        type="number"
                        value={gstRate || ""}
                        onChange={e => setGstRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white text-slate-900"
                        placeholder="0"
                        min="0"
                        max="28"
                      />
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="text-slate-900 font-medium">₹{subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Discount ({discountType === "percentage" ? `${discount}%` : "Fixed"})</span>
                        <span className="text-red-600">-₹{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {gstRate > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">GST ({gstRate}%)</span>
                        <span className="text-slate-900">₹{gstAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-200 pt-3 flex justify-between">
                      <span className="font-semibold text-slate-900">Total</span>
                      <span className="text-lg font-bold text-indigo-600">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none bg-white text-slate-900"
                      placeholder="Additional notes for the client"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Terms & Conditions</label>
                    <textarea
                      value={terms}
                      onChange={e => setTerms(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none bg-white text-slate-900"
                      placeholder="Terms and conditions"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Review Quote</h2>
                {mode === "create" && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center gap-3">
                    <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-indigo-900">Quote Number Preview</p>
                      <p className="text-xs text-indigo-700 mt-0.5">This quote will be assigned number <strong>QS-{String((quoteCount || 0) + 1).padStart(4, "0")}</strong> upon saving</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-700">Client Details</h3>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                      <p><span className="text-slate-500">Name:</span> <span className="text-slate-900 font-medium">{clientName}</span></p>
                      {clientPhone && <p><span className="text-slate-500">Phone:</span> <span className="text-slate-900">{clientPhone}</span></p>}
                      {clientEmail && <p><span className="text-slate-500">Email:</span> <span className="text-slate-900">{clientEmail}</span></p>}
                      {clientAddress && <p><span className="text-slate-500">Address:</span> <span className="text-slate-900">{clientAddress}</span></p>}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-700">Summary</h3>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                      <p><span className="text-slate-500">Items:</span> <span className="text-slate-900 font-medium">{items.length}</span></p>
                      <p><span className="text-slate-500">Subtotal:</span> <span className="text-slate-900">₹{subtotal.toFixed(2)}</span></p>
                      {discount > 0 && <p><span className="text-slate-500">Discount:</span> <span className="text-red-600">-₹{discountAmount.toFixed(2)}</span></p>}
                      {gstRate > 0 && <p><span className="text-slate-500">GST ({gstRate}%):</span> <span className="text-slate-900">₹{gstAmount.toFixed(2)}</span></p>}
                      <p className="pt-2 border-t border-slate-200"><span className="text-slate-700 font-medium">Total:</span> <span className="text-indigo-600 font-bold text-lg">₹{total.toFixed(2)}</span></p>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="font-medium text-slate-700 mb-3">Items</h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium text-slate-500">Description</th>
                            <th className="text-right px-4 py-2 font-medium text-slate-500">Qty</th>
                            <th className="text-right px-4 py-2 font-medium text-slate-500">Rate</th>
                            <th className="text-right px-4 py-2 font-medium text-slate-500">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, i) => (
                            <tr key={i} className="border-b border-slate-100">
                              <td className="px-4 py-2 text-slate-900">{item.description}</td>
                              <td className="text-right px-4 py-2 text-slate-700">{item.quantity} {item.unit}</td>
                              <td className="text-right px-4 py-2 text-slate-700">₹{item.rate.toFixed(2)}</td>
                              <td className="text-right px-4 py-2 font-medium text-slate-900">₹{item.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Back
              </button>
              <div className="flex gap-3">
                {currentStep < 4 ? (
                  <button
                    onClick={nextStep}
                    className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
                  >
                    Continue →
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleSave(true)}
                      disabled={saving}
                      className="px-6 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all"
                    >
                      {saving ? "Saving..." : "Save as Draft"}
                    </button>
                    <button
                      onClick={() => handleSave(false)}
                      disabled={saving}
                      className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
                    >
                      {saving ? "Saving..." : "Save & Send"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="w-[400px] bg-white border-l border-slate-200 overflow-y-auto hidden lg:block">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Preview</h3>
          </div>
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">QUOTE</h2>
              <p className="text-sm text-slate-500">QS-0001</p>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-xs text-slate-400 uppercase">Client</p>
                <p className="font-medium text-slate-900">{clientName || "-"}</p>
              </div>
              {clientAddress && (
                <div>
                  <p className="text-xs text-slate-400 uppercase">Address</p>
                  <p className="text-sm text-slate-600">{clientAddress}</p>
                </div>
              )}
            </div>
            <div className="border-t border-b border-slate-200 py-3 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400">
                    <th className="text-left pb-2">Item</th>
                    <th className="text-right pb-2">Qty</th>
                    <th className="text-right pb-2">Rate</th>
                    <th className="text-right pb-2">Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {items.filter(i => i.description).map((item, i) => (
                    <tr key={i}>
                      <td className="py-1 text-slate-900">{item.description}</td>
                      <td className="text-right py-1 text-slate-700">{item.quantity}</td>
                      <td className="text-right py-1 text-slate-700">₹{item.rate}</td>
                      <td className="text-right py-1 font-medium text-slate-900">₹{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {gstRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">GST ({gstRate}%)</span>
                  <span className="text-slate-900">₹{gstAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg text-indigo-600 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}