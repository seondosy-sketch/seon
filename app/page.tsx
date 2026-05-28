'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Week, Project } from '@/lib/types'
import KpiCards from '@/components/KpiCards'
import WeekSelector from '@/components/WeekSelector'
import ProjectsTable from '@/components/ProjectsTable'
import TextSection from '@/components/TextSection'

export default function Dashboard() {
  const [weeks, setWeeks] = useState<Week[]>([])
  const [selectedWeekId, setSelectedWeekId] = useState<string>('')
  const [projects, setProjects] = useState<Project[]>([])
  const [week, setWeek] = useState<Week | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    supabase
      .from('weeks')
      .select('*')
      .order('start_date', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setWeeks(data as Week[])
          setSelectedWeekId(data[0].id)
        }
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedWeekId) return
    const w = weeks.find(w => w.id === selectedWeekId) ?? null
    setWeek(w)
    supabase
      .from('projects')
      .select('*')
      .eq('week_id', selectedWeekId)
      .order('status')
      .order('seq')
      .then(({ data }) => setProjects((data as Project[]) ?? []))
  }, [selectedWeekId, weeks])

  function updateWeekMemo(field: 'memo_education' | 'memo_other', value: string) {
    if (!week) return
    const updated = { ...week, [field]: value }
    setWeek(updated)
    setWeeks(ws => ws.map(w => w.id === updated.id ? updated : w))
  }

  async function downloadHwpx() {
    if (!selectedWeekId || downloading) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/export-hwpx?week_id=${selectedWeekId}`)
      if (!res.ok) throw new Error('export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'weekly_update.hwpx'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--ps-canvas-dark)' }}>
        <span style={{ color: 'var(--ps-body-dark)', fontSize: 14 }}>불러오는 중…</span>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ps-canvas-light)' }}>

      {/* ── Primary Nav (canvas-dark band) ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'var(--ps-canvas-dark)',
        borderBottom: '1px solid var(--ps-hairline-dark)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '0 48px', height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="4" fill="#0070d1"/>
              <path d="M8 22V10l5 1.5v8.5l3-8.5 5 1.5-4 10H8z" fill="white"/>
            </svg>
            <span style={{ color: 'var(--ps-on-dark)', fontSize: 16, fontWeight: 600, letterSpacing: '0.1px' }}>
              미래사업팀 주간업무
            </span>
          </div>

          {/* Right cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <WeekSelector
              weeks={weeks}
              selectedId={selectedWeekId}
              onSelect={setSelectedWeekId}
              onWeekCreated={w => { setWeeks(prev => [w, ...prev]); setSelectedWeekId(w.id) }}
              onWeekDeleted={id => {
                const remaining = weeks.filter(w => w.id !== id)
                setWeeks(remaining)
                if (selectedWeekId === id && remaining.length > 0) setSelectedWeekId(remaining[0].id)
              }}
            />
            <button
              className="ps-btn-commerce"
              onClick={downloadHwpx}
              disabled={downloading}
              style={{ gap: 8 }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {downloading ? '생성 중…' : 'HWPX 다운로드'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content (canvas-light) ── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 48px 96px' }}>

        {/* Sub-heading */}
        {week && (
          <p style={{ color: 'var(--ps-mute-light)', fontSize: 14, fontWeight: 400, marginBottom: 32 }}>
            {week.label}
          </p>
        )}

        {/* KPI Cards */}
        <section style={{ marginBottom: 48 }}>
          <KpiCards week={week} projects={projects} />
        </section>

        {/* Projects Table */}
        <section style={{ marginBottom: 48 }}>
          <ProjectsTable
            weekId={selectedWeekId}
            projects={projects}
            onChange={setProjects}
          />
        </section>

        {/* Text sections */}
        {week && (
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <TextSection
              weekId={week.id}
              title="교육참가자 (OSG팀)"
              field="memo_education"
              value={week.memo_education}
              onChange={v => updateWeekMemo('memo_education', v)}
            />
            <TextSection
              weekId={week.id}
              title="기 타"
              field="memo_other"
              value={week.memo_other}
              onChange={v => updateWeekMemo('memo_other', v)}
            />
          </section>
        )}
      </main>

      {/* ── Footer (PlayStation Blue band) ── */}
      <footer style={{
        background: 'var(--ps-primary)',
        padding: '32px 48px',
        marginTop: 'auto',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 400 }}>
            © 미래사업팀 주간업무 대시보드
          </span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
            Powered by Supabase · Next.js
          </span>
        </div>
      </footer>
    </div>
  )
}
