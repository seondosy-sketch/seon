'use client'
import { useState } from 'react'
import { Week } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface Props {
  weeks: Week[]
  selectedId: string
  onSelect: (id: string) => void
  onWeekCreated: (week: Week) => void
  onWeekDeleted: (id: string) => void
}

export default function WeekSelector({ weeks, selectedId, onSelect, onWeekCreated, onWeekDeleted }: Props) {
  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const selected = weeks.find(w => w.id === selectedId)

  async function createWeek() {
    if (!startDate || !endDate) return
    setSaving(true)
    const s = new Date(startDate)
    const e = new Date(endDate)
    const label = `${format(s, 'yyyy.M.d.')} ~ ${format(e, 'yyyy.M.d.')}`
    const { data, error } = await supabase
      .from('weeks')
      .insert({ label, start_date: startDate, end_date: endDate, memo_education: '', memo_other: '' })
      .select().single()
    setSaving(false)
    if (!error && data) {
      onWeekCreated(data as Week)
      setShowForm(false); setStartDate(''); setEndDate(''); setOpen(false)
    }
  }

  async function deleteWeek(id: string) {
    await supabase.from('weeks').delete().eq('id', id)
    onWeekDeleted(id)
    setConfirmDelete(null); setOpen(false)
  }

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute', right: 0, top: 52, zIndex: 40,
    width: 300,
    background: 'var(--ps-surface-dark-elev)',
    border: '1px solid var(--ps-hairline-dark)',
    borderRadius: 'var(--rounded-md)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    padding: 8,
  }

  return (
    <>
      <div style={{ position: 'relative' }}>
        <button
          className="ps-btn-secondary-dark"
          style={{ height: 40, padding: '0 20px', fontSize: 14, fontWeight: 600 }}
          onClick={() => setOpen(!open)}
        >
          {selected?.label ?? '주차 선택'}
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 39 }} onClick={() => { setOpen(false); setShowForm(false) }} />
            <div style={dropdownStyle}>
              {weeks.map(w => (
                <div
                  key={w.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
                    background: w.id === selectedId ? 'rgba(0,112,209,0.2)' : 'transparent',
                    transition: 'background 0.12s',
                  }}
                  onClick={() => { onSelect(w.id); setOpen(false) }}
                  onMouseEnter={e => { if (w.id !== selectedId) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)' }}
                  onMouseLeave={e => { if (w.id !== selectedId) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                >
                  <span style={{ color: w.id === selectedId ? '#fff' : 'var(--ps-body-dark)', fontSize: 14, fontWeight: w.id === selectedId ? 600 : 400 }}>
                    {w.label}
                  </span>
                  {weeks.length > 1 && (
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDelete(w.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ps-on-dark-mute)', padding: 4, borderRadius: 4, opacity: 0.5, lineHeight: 0 }}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#ff6b6b'}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--ps-on-dark-mute)'}
                    >
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--ps-hairline-dark)', marginTop: 4, paddingTop: 4 }}>
                {!showForm ? (
                  <button
                    onClick={() => setShowForm(true)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 12px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--ps-primary)', fontSize: 14, fontWeight: 600,
                      borderRadius: 6,
                    }}
                  >
                    + 새 주차 만들기
                  </button>
                ) : (
                  <div style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--ps-mute-dark)', marginBottom: 4, fontWeight: 600 }}>시작일</label>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                        style={{ width: '100%', background: '#1a1a1a', color: '#fff', border: '1px solid var(--ps-hairline-dark)', borderRadius: 4, padding: '6px 10px', fontSize: 13, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--ps-mute-dark)', marginBottom: 4, fontWeight: 600 }}>종료일</label>
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                        style={{ width: '100%', background: '#1a1a1a', color: '#fff', border: '1px solid var(--ps-hairline-dark)', borderRadius: 4, padding: '6px 10px', fontSize: 13, outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={createWeek} disabled={saving || !startDate || !endDate}
                        className="ps-btn-primary"
                        style={{ flex: 1, height: 36, fontSize: 13, padding: '0 16px' }}>
                        {saving ? '저장 중…' : '만들기'}
                      </button>
                      <button onClick={() => setShowForm(false)}
                        className="ps-btn-secondary-dark"
                        style={{ flex: 1, height: 36, fontSize: 13, padding: '0 16px' }}>
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 주차 삭제 확인 다이얼로그 */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setConfirmDelete(null)} />
          <div style={{ position: 'relative', background: 'var(--ps-canvas-light)', borderRadius: 'var(--rounded-md)', padding: '32px 28px', width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ps-ink)', marginBottom: 8 }}>주차 삭제</h3>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ps-ink)', marginBottom: 4 }}>
              {weeks.find(w => w.id === confirmDelete)?.label}
            </p>
            <p style={{ fontSize: 14, color: 'var(--ps-body-light)', marginBottom: 28 }}>
              이 주차와 소속된 모든 프로젝트가 삭제됩니다. 되돌릴 수 없습니다.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)}
                className="ps-btn-secondary-light"
                style={{ height: 40, fontSize: 14, padding: '0 20px' }}>취소</button>
              <button onClick={() => deleteWeek(confirmDelete)}
                style={{
                  height: 40, padding: '0 20px', fontSize: 14, fontWeight: 700,
                  background: 'var(--ps-warning)', color: '#fff',
                  border: 'none', borderRadius: 'var(--rounded-full)', cursor: 'pointer',
                }}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
