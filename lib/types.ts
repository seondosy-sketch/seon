export interface Week {
  id: string
  label: string
  start_date: string
  end_date: string
  memo_education: string
  memo_other: string
  created_at: string
}

export interface Project {
  id: string
  week_id: string
  status: '개찰' | '진행중'
  seq: number
  name: string
  director: string
  submitted_at: string
  presentation_at: string
  bidding_at: string
  confirmed_bidding_at: string | null
  fee_billion: number | null
  note: string
  created_at: string
  updated_at: string
}
