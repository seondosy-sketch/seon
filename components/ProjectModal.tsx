'use client'
import { useEffect, useState } from 'react'
import { Project } from '@/lib/types'

type FormData = Omit<Project, 'id' | 'week_id' | 'created_at' | 'updated_at'>

interface Props {
  open: boolean
  initial?: Project | null
  onClose: () => void
  onSave: (data: FormData) => Promise<void>
}

const EMPTY: FormData = {
  status: '진행중', seq: 0, name: '', director: '',
  submitted_at: '', presentation_at: '', bidding_at: '',
  confirmed_bidding_at: null, fee_billion: null, note: '',
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', color: 'var(--ps-mute-light)' }}>
        {label}{required && <span style={{ color: 'var(--ps-warning)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export default function ProjectModal({ open, initial, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { status: initial.status, seq: initial.seq, name: initial.name, director: initial.director, submitted_at: initial.submitted_at, presentation_at: initial.presentation_at, bidding_at: initial.bidding_at, confirmed_bidding_at: initial.confirmed_bidding_at, fee_billion: initial.fee_billion, note: initial.note }
        : EMPTY)
    }
  }, [open, initial])

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try { await onSave(form); onClose() }
    finally { setSaving(false) }
  }

  if (!open) return null
  const isEdit = !!initial

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--ps-canvas-light)', color: 'var(--ps-ink)',
    border: '1px solid var(--ps-ash-light)', borderRadius: 'var(--rounded-sm)',
    padding: '10px 14px', fontSize: 15, fontWeight: 400, outline: 'none',
    fontFamily: "'Inter', Arial, sans-serif",
    transition: 'border-color 0.15s',
  }

  return (
    <>
      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} onClick={onClose} />

      {/* Slide-over panel */}
      <div style={{
        position: 'fixed', right: 0, top: 0, height: '100%', width: 500,
        background: 'var(--ps-canvas-light)',
        zIndex: 50,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px',
          borderBottom: '1px solid var(--ps-hairline-light)',
          background: 'var(--ps-canvas-dark)',
        }}>
          <span style={{ fontFamily: "'Roboto', Arial, sans-serif", fontSize: 22, fontWeight: 300, color: 'var(--ps-on-dark)', letterSpacing: '0.1px' }}>
            {isEdit ? '프로젝트 수정' : '프로젝트 추가'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ps-on-dark-mute)', lineHeight: 0, padding: 4 }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="구분">
              <select value={form.status} onChange={e => set('status', e.target.value as Project['status'])} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="진행중">진행중</option>
                <option value="개찰">개찰</option>
              </select>
            </Field>
            <Field label="연번">
              <input type="number" value={form.seq || ''} onChange={e => set('seq', parseInt(e.target.value) || 0)} style={inputStyle} placeholder="자동" />
            </Field>
          </div>

          <Field label="용역명" required>
            <input value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} placeholder="용역명을 입력하세요" required />
          </Field>

          <Field label="단장">
            <input value={form.director} onChange={e => set('director', e.target.value)} style={inputStyle} placeholder="예: 신경철" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="제출일">
              <input value={form.submitted_at} onChange={e => set('submitted_at', e.target.value)} style={inputStyle} placeholder="예: 4/2" />
            </Field>
            <Field label="발표/면접">
              <input value={form.presentation_at} onChange={e => set('presentation_at', e.target.value)} style={inputStyle} placeholder="예: 서면평가, 추후" />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="개찰일 (표시)">
              <input value={form.bidding_at} onChange={e => set('bidding_at', e.target.value)} style={inputStyle} placeholder="예: 6/17, 추후" />
            </Field>
            <Field label="개찰일 (확정)">
              <input type="date" value={form.confirmed_bidding_at ?? ''} onChange={e => set('confirmed_bidding_at', e.target.value || null)} style={inputStyle} />
            </Field>
          </div>

          <Field label="용역비 (억원)">
            <input type="number" step="0.01" value={form.fee_billion ?? ''} onChange={e => set('fee_billion', e.target.value === '' ? null : parseFloat(e.target.value))} style={inputStyle} placeholder="예: 24.68" />
          </Field>

          <Field label="내용">
            <textarea value={form.note} onChange={e => set('note', e.target.value)} style={{ ...inputStyle, resize: 'none', height: 'auto', lineHeight: 1.6 } as React.CSSProperties} rows={3} placeholder="예: -건축 류호관" />
          </Field>
        </form>

        {/* Footer */}
        <div style={{
          padding: '20px 28px',
          borderTop: '1px solid var(--ps-hairline-light)',
          display: 'flex', gap: 12, justifyContent: 'flex-end',
          background: 'var(--ps-surface-card)',
        }}>
          <button type="button" onClick={onClose} className="ps-btn-secondary-light" style={{ height: 44, fontSize: 15, padding: '0 24px' }}>취소</button>
          <button onClick={handleSubmit as unknown as React.MouseEventHandler} disabled={saving} className="ps-btn-primary" style={{ height: 44, fontSize: 15, padding: '0 24px' }}>
            {saving ? '저장 중…' : isEdit ? '수정 완료' : '추가'}
          </button>
        </div>
      </div>
    </>
  )
}
