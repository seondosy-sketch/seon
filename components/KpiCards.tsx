'use client'
import { useMemo } from 'react'
import { Project, Week } from '@/lib/types'
import { isWithinInterval, parseISO, addDays } from 'date-fns'

interface Props {
  week: Week | null
  projects: Project[]
}

export default function KpiCards({ week, projects }: Props) {
  const stats = useMemo(() => {
    const inProgress = projects.filter(p => p.status === '진행중')
    const totalFee = inProgress.reduce((s, p) => s + (p.fee_billion ?? 0), 0)

    const today = new Date()
    const in7Days = addDays(today, 7)
    const urgentBidding = inProgress.filter(p => {
      if (!p.confirmed_bidding_at) return false
      const d = parseISO(p.confirmed_bidding_at)
      return isWithinInterval(d, { start: today, end: in7Days })
    })

    const thisWeekDeadline = week
      ? inProgress.filter(p => {
          if (!p.confirmed_bidding_at) return false
          const d = parseISO(p.confirmed_bidding_at)
          return isWithinInterval(d, { start: parseISO(week.start_date), end: parseISO(week.end_date) })
        })
      : []

    return {
      inProgressCount: inProgress.length,
      urgentCount: urgentBidding.length,
      thisWeekCount: thisWeekDeadline.length,
      totalFee: totalFee.toFixed(2),
    }
  }, [projects, week])

  const cards = [
    { label: '진행중', value: `${stats.inProgressCount}건`, sub: '수행 프로젝트' },
    { label: '개찰 임박', value: `${stats.urgentCount}건`, sub: '7일 이내 (확정 기준)' },
    { label: '이번 주 마감', value: `${stats.thisWeekCount}건`, sub: '개찰 확정 기준' },
    { label: '총 용역비', value: `${stats.totalFee}억`, sub: '진행중 합계' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
      {cards.map((c, i) => (
        <div
          key={c.label}
          style={{
            background: 'var(--ps-surface-card)',
            borderRadius: 'var(--rounded-md)',
            padding: '24px 28px',
            borderTop: i === 0 ? '3px solid var(--ps-primary)' : '3px solid transparent',
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ps-mute-light)', marginBottom: 8 }}>
            {c.label}
          </p>
          <p style={{
            fontFamily: "'Roboto', Arial, sans-serif",
            fontSize: 35, fontWeight: 300, lineHeight: 1.1,
            color: 'var(--ps-ink)', marginBottom: 4,
          }}>
            {c.value}
          </p>
          <p style={{ fontSize: 13, color: 'var(--ps-mute-light)' }}>{c.sub}</p>
        </div>
      ))}
    </div>
  )
}
