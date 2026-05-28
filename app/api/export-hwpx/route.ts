import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function buildMarkdown(week: any, projects: any[]): string {
  const bidding = projects.filter((p: any) => p.status === '개찰').sort((a: any, b: any) => a.seq - b.seq)
  const inProgress = projects.filter((p: any) => p.status === '진행중').sort((a: any, b: any) => a.seq - b.seq)

  const cell = (v: any) => String(v ?? '').replace(/\|/g, '｜').replace(/\n/g, ' ')

  const biddingRows = bidding.length > 0
    ? bidding.map((p: any) =>
        `| 개찰 | ${cell(p.seq)} | ${cell(p.name)} | ${cell(p.director)} | ${cell(p.submitted_at)} | ${cell(p.presentation_at)} | ${cell(p.bidding_at)} | ${cell(p.fee_billion)} | ${cell(p.note)} |`
      ).join('\n')
    : '| 개찰 | | | | | | | | |'

  const inProgressRows = inProgress.map((p: any, i: number) =>
    `| ${i === 0 ? '진행중' : ''} | ${cell(p.seq)} | ${cell(p.name)} | ${cell(p.director)} | ${cell(p.submitted_at)} | ${cell(p.presentation_at)} | ${cell(p.bidding_at)} | ${cell(p.fee_billion) || '-'} | ${cell(p.note)} |`
  ).join('\n')

  return `# 미래사업팀 주간업무

(${week.label})

## 1) 수행 Project (공동수행)

| 구분 | # | 용역명 | 단장 | 제출일 | 발표/면접 | 개찰일 | 용역비(억원) | 내 용 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${biddingRows}
${inProgressRows}

## 2) 발주예상 Project (공동예정)

| 연번 | Project | 발주청 | 단장 | 사업비(억) | 발주(월) | 용역비(억) | 내 용 |
| --- | --- | --- | --- | --- | --- | --- | --- |

## 3) 교육참가자(OSG팀)

${week.memo_education || ''}

## 4) 기 타

${week.memo_other || ''}
`
}

export async function GET(req: NextRequest) {
  const weekId = req.nextUrl.searchParams.get('week_id')
  if (!weekId) return NextResponse.json({ error: 'week_id required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [{ data: week }, { data: projects }] = await Promise.all([
    supabase.from('weeks').select('*').eq('id', weekId).single(),
    supabase.from('projects').select('*').eq('week_id', weekId).order('status').order('seq'),
  ])

  if (!week) return NextResponse.json({ error: 'week not found' }, { status: 404 })

  const md = buildMarkdown(week, projects ?? [])

  const { markdownToHwpx } = await import('kordoc')
  const hwpxBuffer: ArrayBuffer = await markdownToHwpx(md)

  return new NextResponse(Buffer.from(hwpxBuffer), {
    headers: {
      'Content-Type': 'application/vnd.hancom.hwpx',
      'Content-Disposition': 'attachment; filename="weekly_update.hwpx"',
    },
  })
}
