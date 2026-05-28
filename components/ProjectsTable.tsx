'use client'
import { useState } from 'react'
import { Project } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ProjectModal from './ProjectModal'

interface Props {
  weekId: string
  projects: Project[]
  onChange: (projects: Project[]) => void
}

type FormData = Omit<Project, 'id' | 'week_id' | 'created_at' | 'updated_at'>

function EditableCell({ value, onSave, multiline = false }: { value: string; onSave: (v: string) => void; multiline?: boolean }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function commit() {
    setEditing(false)
    if (draft !== value) onSave(draft)
  }

  if (editing) {
    return multiline
      ? <textarea autoFocus className="cell-input" style={{ resize: 'none', minHeight: 40 }} rows={2} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} />
      : <input autoFocus className="cell-input" value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => e.key === 'Enter' && commit()} />
  }

  return (
    <span
      style={{ display: 'block', minHeight: 20, cursor: 'text', padding: '2px 4px', borderRadius: 3, fontSize: 13, lineHeight: 1.5 }}
      onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.background = 'var(--ps-surface-soft)'}
      onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.background = 'transparent'}
      onClick={() => { setDraft(value); setEditing(true) }}
    >
      {value || <span style={{ color: 'var(--ps-ash-light)' }}>—</span>}
    </span>
  )
}

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onCancel} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 'var(--rounded-md)', padding: '32px 28px', width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ps-ink)', marginBottom: 8 }}>프로젝트 삭제</h3>
        <p style={{ fontSize: 14, color: 'var(--ps-body-light)', marginBottom: 28 }}>이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="ps-btn-secondary-light" style={{ height: 40, fontSize: 14, padding: '0 20px' }}>취소</button>
          <button onClick={onConfirm} style={{ height: 40, padding: '0 20px', fontSize: 14, fontWeight: 700, background: 'var(--ps-warning)', color: '#fff', border: 'none', borderRadius: 'var(--rounded-full)', cursor: 'pointer' }}>삭제</button>
        </div>
      </div>
    </div>
  )
}

function SortableRow({ project, onUpdate, onEdit, onDeleteRequest }: {
  project: Project
  onUpdate: (id: string, field: keyof Project, value: string | number | null) => void
  onEdit: (p: Project) => void
  onDeleteRequest: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id })
  const [hovered, setHovered] = useState(false)

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.45 : 1 }

  const save = (field: keyof Project) => (v: string) => {
    const numFields: (keyof Project)[] = ['fee_billion']
    if (numFields.includes(field)) onUpdate(project.id, field, v === '' ? null : parseFloat(v))
    else onUpdate(project.id, field, v)
  }

  const tdStyle: React.CSSProperties = { padding: '10px 12px', verticalAlign: 'middle', borderBottom: '1px solid var(--ps-hairline-light)', fontSize: 13, color: 'var(--ps-ink)' }
  const rowStyle: React.CSSProperties = { background: hovered ? 'var(--ps-surface-card)' : 'transparent', transition: 'background 0.12s' }

  return (
    <tr ref={setNodeRef} style={{ ...style, ...rowStyle }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <td style={{ ...tdStyle, width: 28, color: 'var(--ps-ash-light)', textAlign: 'center' }}>
        {project.status === '진행중' && (
          <span {...attributes} {...listeners} style={{ cursor: 'grab', userSelect: 'none', fontSize: 16 }}>⠿</span>
        )}
      </td>
      <td style={{ ...tdStyle, width: 70 }}>
        <select
          value={project.status}
          onChange={e => onUpdate(project.id, 'status', e.target.value)}
          className="ps-select-sm"
        >
          <option value="진행중">진행중</option>
          <option value="개찰">개찰</option>
        </select>
      </td>
      <td style={{ ...tdStyle, width: 32, textAlign: 'center', color: 'var(--ps-mute-light)', fontSize: 12 }}>
        {project.status === '진행중' ? project.seq : ''}
      </td>
      <td style={{ ...tdStyle, minWidth: 240 }}><EditableCell value={project.name} onSave={save('name')} /></td>
      <td style={{ ...tdStyle, width: 80 }}><EditableCell value={project.director} onSave={save('director')} /></td>
      <td style={{ ...tdStyle, width: 72 }}><EditableCell value={project.submitted_at} onSave={save('submitted_at')} /></td>
      <td style={{ ...tdStyle, width: 88 }}><EditableCell value={project.presentation_at} onSave={save('presentation_at')} /></td>
      <td style={{ ...tdStyle, width: 72 }}><EditableCell value={project.bidding_at} onSave={save('bidding_at')} /></td>
      <td style={{ ...tdStyle, width: 112 }}><EditableCell value={project.confirmed_bidding_at ?? ''} onSave={save('confirmed_bidding_at')} /></td>
      <td style={{ ...tdStyle, width: 88 }}><EditableCell value={project.fee_billion != null ? String(project.fee_billion) : ''} onSave={save('fee_billion')} /></td>
      <td style={{ ...tdStyle, minWidth: 120 }}><EditableCell value={project.note} onSave={save('note')} multiline /></td>
      <td style={{ ...tdStyle, width: 64 }}>
        <div style={{ display: 'flex', gap: 6, opacity: hovered ? 1 : 0, transition: 'opacity 0.12s' }}>
          <button onClick={() => onEdit(project)} title="수정"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ps-mute-light)', lineHeight: 0, padding: 4, borderRadius: 4 }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--ps-primary)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--ps-mute-light)'}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2.414a2 2 0 01.586-1.414z" />
            </svg>
          </button>
          <button onClick={() => onDeleteRequest(project.id)} title="삭제"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ps-mute-light)', lineHeight: 0, padding: 4, borderRadius: 4 }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--ps-warning)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--ps-mute-light)'}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  )
}

const HEADERS = ['', '구분', '#', '용역명', '단장', '제출일', '발표/면접', '개찰일', '개찰일(확정)', '용역비(억)', '내용', '']

export default function ProjectsTable({ weekId, projects, onChange }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Project | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const bidding = projects.filter(p => p.status === '개찰').sort((a, b) => a.seq - b.seq)
  const inProgress = projects.filter(p => p.status === '진행중').sort((a, b) => a.seq - b.seq)
  const sorted = [...bidding, ...inProgress]

  function openCreate() { setEditTarget(null); setModalOpen(true) }
  function openEdit(p: Project) { setEditTarget(p); setModalOpen(true) }

  async function handleSave(data: FormData) {
    if (editTarget) {
      const updated = { ...editTarget, ...data }
      onChange(projects.map(p => p.id === editTarget.id ? updated : p))
      await supabase.from('projects').update(data).eq('id', editTarget.id)
    } else {
      const newSeq = data.status === '진행중' ? inProgress.length + 1 : 0
      const payload = { ...data, week_id: weekId, seq: data.seq || newSeq }
      const { data: row, error } = await supabase.from('projects').insert(payload).select().single()
      if (!error && row) onChange([...projects, row as Project])
    }
  }

  async function handleUpdate(id: string, field: keyof Project, value: string | number | null) {
    onChange(projects.map(p => p.id === id ? { ...p, [field]: value } : p))
    await supabase.from('projects').update({ [field]: value }).eq('id', id)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    onChange(projects.filter(p => p.id !== deleteTarget))
    await supabase.from('projects').delete().eq('id', deleteTarget)
    setDeleteTarget(null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = inProgress.findIndex(p => p.id === active.id)
    const newIndex = inProgress.findIndex(p => p.id === over.id)
    const reordered = arrayMove(inProgress, oldIndex, newIndex).map((p, i) => ({ ...p, seq: i + 1 }))
    onChange([...bidding, ...reordered])
    await Promise.all(reordered.map(p => supabase.from('projects').update({ seq: p.seq }).eq('id', p.id)))
  }

  return (
    <>
      <div style={{ background: 'var(--ps-canvas-light)', border: '1px solid var(--ps-hairline-light)', borderRadius: 'var(--rounded-md)', overflow: 'hidden' }}>
        {/* Table header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid var(--ps-hairline-light)',
          background: 'var(--ps-canvas-light)',
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--ps-mute-light)' }}>
            수행 Project (공동수행)
          </h2>
          <button onClick={openCreate} className="ps-btn-primary" style={{ height: 36, fontSize: 13, padding: '0 20px' }}>
            + 프로젝트 추가
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--ps-surface-card)', borderBottom: '1px solid var(--ps-hairline-light)' }}>
                  {HEADERS.map((h, i) => (
                    <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--ps-mute-light)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <SortableContext items={inProgress.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  {sorted.map(project => (
                    <SortableRow key={project.id} project={project} onUpdate={handleUpdate} onEdit={openEdit} onDeleteRequest={id => setDeleteTarget(id)} />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
          {sorted.length === 0 && (
            <p style={{ textAlign: 'center', padding: '40px 0', fontSize: 14, color: 'var(--ps-mute-light)' }}>
              프로젝트가 없습니다. 위 버튼으로 추가하세요.
            </p>
          )}
        </div>
      </div>

      <ProjectModal open={modalOpen} initial={editTarget} onClose={() => setModalOpen(false)} onSave={handleSave} />
      {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
    </>
  )
}
