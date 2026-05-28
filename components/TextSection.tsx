'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  weekId: string
  title: string
  field: 'memo_education' | 'memo_other'
  value: string
  onChange: (v: string) => void
}

export default function TextSection({ weekId, title, field, value, onChange }: Props) {
  const [saving, setSaving] = useState(false)

  async function handleBlur(v: string) {
    if (v === value) return
    setSaving(true)
    onChange(v)
    await supabase.from('weeks').update({ [field]: v }).eq('id', weekId)
    setSaving(false)
  }

  return (
    <div style={{
      background: 'var(--ps-surface-card)',
      borderRadius: 'var(--rounded-md)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--ps-hairline-light)',
        background: 'var(--ps-canvas-light)',
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--ps-mute-light)' }}>
          {title}
        </h2>
        {saving && <span style={{ fontSize: 12, color: 'var(--ps-mute-light)' }}>저장 중…</span>}
      </div>
      <textarea
        style={{
          width: '100%', padding: '16px 24px',
          fontSize: 14, lineHeight: 1.7,
          background: 'var(--ps-surface-card)',
          color: 'var(--ps-body-light)',
          border: 'none', outline: 'none',
          resize: 'none', minHeight: 100,
          fontFamily: "'Inter', Arial, sans-serif",
        }}
        defaultValue={value}
        onBlur={e => handleBlur(e.target.value)}
        rows={5}
      />
    </div>
  )
}
