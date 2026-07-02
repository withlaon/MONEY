'use client'

import { useState } from 'react'
import { Plus, Building2, User, ShoppingBag, Check, X, Pencil, Trash2 } from 'lucide-react'
import { useIncomeSources, useExpenseCategories } from '@/hooks/useTransactions'
import { IncomeSource, ExpenseCategory } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const INP: React.CSSProperties = {
  width: '100%', background: 'var(--day-card2)', border: '1px solid var(--day-border)',
  borderRadius: 10, padding: '10px 14px', fontSize: 14, color: 'var(--day-text1)',
  transition: 'border-color 0.15s',
}

/* ── 카드 헤더 (컴포넌트 밖에서 정의 → 리렌더 시 재생성 안 됨) ── */
function CardHeader({ icon, title, count, onAdd }: { icon: React.ReactNode; title: string; count: number; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '16px 22px', borderBottom: '1px solid var(--day-border)' }}>
      <div className="flex items-center gap-3">
        {icon}
        <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--day-text1)' }}>{title}</p>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'var(--day-card2)', color: 'var(--day-text3)', border: '1px solid var(--day-border)' }}>
          {count}개
        </span>
      </div>
      <button onClick={onAdd} className="flex items-center gap-1.5 font-bold"
        style={{ fontSize: 13, padding: '7px 14px', borderRadius: 10, background: '#eef0fe', border: '1px solid #c7c3fa', color: '#4f46e5' }}>
        <Plus size={13} /> 추가
      </button>
    </div>
  )
}

function GroupLabel({ type }: { type: 'office' | 'personal' }) {
  return (
    <div className="flex items-center gap-2" style={{ padding: '8px 22px', background: 'var(--day-card2)', borderBottom: '1px solid var(--day-border)' }}>
      {type === 'office' ? <Building2 size={12} style={{ color: '#2563eb' }} /> : <User size={12} style={{ color: '#ea580c' }} />}
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: type === 'office' ? '#2563eb' : '#ea580c' }}>
        {type === 'office' ? '사무실 지출' : '개인 지출'}
      </span>
    </div>
  )
}

export default function SettingsPage() {
  const { sources, addSource, updateSource, deleteSource } = useIncomeSources()
  const { categories, addCategory, updateCategory, deleteCategory } = useExpenseCategories()

  /* 입금처 추가 */
  const [addS, setAddS]   = useState(false)
  const [sn, setSn]       = useState('')
  const [sd, setSd]       = useState('')
  const [sLoad, setSLoad] = useState(false)

  /* 입금처 수정 */
  const [editSrcId, setEditSrcId] = useState<string | null>(null)
  const [editSn, setEditSn]       = useState('')
  const [editSd, setEditSd]       = useState('')
  const [editSLoad, setEditSLoad] = useState(false)

  /* 카테고리 추가 */
  const [addC, setAddC]   = useState(false)
  const [cn2, setCn2]     = useState('')
  const [cd, setCd]       = useState('')
  const [ct, setCt]       = useState<'office' | 'personal'>('office')
  const [cLoad, setCLoad] = useState(false)

  /* 카테고리 수정 */
  const [editCatId, setEditCatId] = useState<string | null>(null)
  const [editCn, setEditCn]       = useState('')
  const [editCd, setEditCd]       = useState('')
  const [editCt, setEditCt]       = useState<'office' | 'personal'>('office')
  const [editCLoad, setEditCLoad] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [err, setErr] = useState('')

  const office   = categories.filter(c => c.type === 'office')
  const personal = categories.filter(c => c.type === 'personal')

  /* ── 입금처 ── */
  const doAddS = async () => {
    if (!sn.trim()) return
    setSLoad(true); setErr('')
    try { await addSource(sn.trim(), sd.trim() || undefined); setSn(''); setSd(''); setAddS(false) }
    catch (e) { setErr(e instanceof Error ? e.message : '추가 실패') }
    finally { setSLoad(false) }
  }
  const startEditSrc = (s: IncomeSource) => {
    setEditSrcId(s.id); setEditSn(s.name); setEditSd(s.description || ''); setAddS(false)
  }
  const doEditS = async () => {
    if (!editSrcId || !editSn.trim()) return
    setEditSLoad(true); setErr('')
    try { await updateSource(editSrcId, editSn.trim(), editSd.trim() || undefined); setEditSrcId(null) }
    catch (e) { setErr(e instanceof Error ? e.message : '수정 실패') }
    finally { setEditSLoad(false) }
  }
  const doDelS = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    setDeletingId(id); setErr('')
    try { await deleteSource(id) }
    catch (e) { setErr(e instanceof Error ? e.message : '삭제 실패') }
    finally { setDeletingId(null) }
  }

  /* ── 카테고리 ── */
  const doAddC = async () => {
    if (!cn2.trim()) return
    setCLoad(true); setErr('')
    try { await addCategory(cn2.trim(), ct, cd.trim() || undefined); setCn2(''); setCd(''); setAddC(false) }
    catch (e) { setErr(e instanceof Error ? e.message : '추가 실패') }
    finally { setCLoad(false) }
  }
  const startEditCat = (c: ExpenseCategory) => {
    setEditCatId(c.id); setEditCn(c.name); setEditCd(c.description || ''); setEditCt(c.type); setAddC(false)
  }
  const doEditC = async () => {
    if (!editCatId || !editCn.trim()) return
    setEditCLoad(true); setErr('')
    try { await updateCategory(editCatId, editCn.trim(), editCt, editCd.trim() || undefined); setEditCatId(null) }
    catch (e) { setErr(e instanceof Error ? e.message : '수정 실패') }
    finally { setEditCLoad(false) }
  }
  const doDelC = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    setDeletingId(id); setErr('')
    try { await deleteCategory(id) }
    catch (e) { setErr(e instanceof Error ? e.message : '삭제 실패') }
    finally { setDeletingId(null) }
  }

  /* Enter 키: isComposing 체크 (한글 IME 충돌 방지) */
  const onEnter = (e: React.KeyboardEvent, fn: () => void) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) fn()
  }

  /* 공통 버튼 행 */
  const Btns = ({ onY, onN, load, dis, label = '추가하기' }: { onY: () => void; onN: () => void; load: boolean; dis: boolean; label?: string }) => (
    <div className="flex gap-2 pt-1">
      <button onClick={onY} disabled={load || dis} className={cn('flex items-center gap-2 font-bold', (load || dis) && 'opacity-50')}
        style={{ fontSize: 13, padding: '8px 18px', borderRadius: 10, background: '#4f46e5', color: '#fff' }}>
        <Check size={13} />{load ? '처리 중...' : label}
      </button>
      <button onClick={onN} className="flex items-center gap-2"
        style={{ fontSize: 13, padding: '8px 14px', borderRadius: 10, background: 'var(--day-card)', border: '1px solid var(--day-border)', color: 'var(--day-text2)' }}>
        <X size={13} />취소
      </button>
    </div>
  )

  return (
    <div className="page-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div className="fade-up">
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--day-text1)' }}>설정</h1>
        <p style={{ fontSize: 13, marginTop: 4, color: 'var(--day-text3)' }}>입금처 및 지출 카테고리 관리</p>
      </div>

      {err && (
        <div className="fade-in" style={{ fontSize: 13, padding: '12px 16px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}>
          {err}
        </div>
      )}

      {/* ── 수입 카테고리 ── */}
      <div className="fade-up" style={{ background: 'var(--day-card)', border: '1px solid var(--day-border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--day-shadow)' }}>
        <CardHeader
          icon={<div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ecfdf5' }}><ShoppingBag size={15} style={{ color: '#059669' }} /></div>}
          title="수입 카테고리 관리" count={sources.length}
          onAdd={() => { setAddS(v => !v); setEditSrcId(null) }}
        />

        {/* 추가 폼 */}
        {addS && (
          <div className="space-y-3 fade-in" style={{ padding: '16px 22px', background: '#f8faff', borderBottom: '1px solid var(--day-border)' }}>
            <input autoFocus type="text" value={sn} onChange={e => setSn(e.target.value)}
              placeholder="이름 (예: 판매대금)" style={{ ...INP, borderColor: '#4f46e5' }}
              onKeyDown={e => onEnter(e, doAddS)} />
            <input type="text" value={sd} onChange={e => setSd(e.target.value)} placeholder="설명 (선택)" style={INP} />
            <Btns onY={doAddS} onN={() => { setAddS(false); setSn(''); setSd('') }} load={sLoad} dis={!sn.trim()} />
          </div>
        )}

        {sources.length === 0 && !addS && (
          <div style={{ padding: '20px 22px', textAlign: 'center', color: 'var(--day-text3)', fontSize: 13 }}>카테고리를 추가해보세요</div>
        )}

        {sources.map(s => (
          <div key={s.id}>
            {/* 항목 행 */}
            <div className="flex items-center justify-between gap-3" style={{ padding: '12px 22px', borderBottom: '1px solid var(--day-border)' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--day-text1)' }}>{s.name}</p>
                {s.description && <p style={{ fontSize: 12, marginTop: 2, color: 'var(--day-text3)' }}>{s.description}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: '#ecfdf5', color: '#059669' }}>활성</span>
                <button onClick={() => editSrcId === s.id ? setEditSrcId(null) : startEditSrc(s)}
                  className="flex items-center gap-1 font-bold"
                  style={{ fontSize: 12, padding: '5px 10px', borderRadius: 8, background: '#eef0fe', border: '1px solid #c7c3fa', color: '#4f46e5' }}>
                  <Pencil size={11} />수정
                </button>
                <button onClick={() => doDelS(s.id)} disabled={deletingId === s.id}
                  className={cn('flex items-center gap-1 font-bold', deletingId === s.id && 'opacity-50')}
                  style={{ fontSize: 12, padding: '5px 10px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}>
                  <Trash2 size={11} />{deletingId === s.id ? '...' : '삭제'}
                </button>
              </div>
            </div>

            {/* 수정 폼 — 인라인 JSX (별도 컴포넌트 정의 금지 → IME 버그 방지) */}
            {editSrcId === s.id && (
              <div className="fade-in" style={{ padding: '14px 22px', background: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#d97706' }}>입금처 수정</p>
                <input
                  type="text"
                  value={editSn}
                  onChange={e => setEditSn(e.target.value)}
                  placeholder="이름"
                  style={INP}
                  onKeyDown={e => onEnter(e, doEditS)}
                />
                <input
                  type="text"
                  value={editSd}
                  onChange={e => setEditSd(e.target.value)}
                  placeholder="설명 (선택)"
                  style={INP}
                  onKeyDown={e => onEnter(e, doEditS)}
                />
                <Btns onY={doEditS} onN={() => setEditSrcId(null)} load={editSLoad} dis={!editSn.trim()} label="저장하기" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── 지출 카테고리 ── */}
      <div className="fade-up" style={{ background: 'var(--day-card)', border: '1px solid var(--day-border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--day-shadow)' }}>
        <CardHeader
          icon={<div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eff6ff' }}><Building2 size={15} style={{ color: '#2563eb' }} /></div>}
          title="지출 카테고리 관리" count={categories.length}
          onAdd={() => { setAddC(v => !v); setEditCatId(null) }}
        />

        {/* 추가 폼 */}
        {addC && (
          <div className="space-y-3 fade-in" style={{ padding: '16px 22px', background: '#f8faff', borderBottom: '1px solid var(--day-border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(['office', 'personal'] as const).map(t => (
                <button key={t} type="button" onClick={() => setCt(t)} className="flex items-center justify-center gap-2 font-bold"
                  style={{
                    padding: '10px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                    background: ct === t ? (t === 'office' ? '#eff6ff' : '#fff7ed') : 'var(--day-card)',
                    border: `1px solid ${ct === t ? (t === 'office' ? '#bfdbfe' : '#fed7aa') : 'var(--day-border)'}`,
                    color: ct === t ? (t === 'office' ? '#2563eb' : '#ea580c') : 'var(--day-text3)',
                  }}>
                  {t === 'office' ? <Building2 size={14} /> : <User size={14} />}
                  {t === 'office' ? '사무실' : '개인'}
                </button>
              ))}
            </div>
            <input autoFocus type="text" value={cn2} onChange={e => setCn2(e.target.value)}
              placeholder={`카테고리 이름 (예: ${ct === 'office' ? '보관료' : '헬스장'})`}
              style={{ ...INP, borderColor: '#4f46e5' }} onKeyDown={e => onEnter(e, doAddC)} />
            <input type="text" value={cd} onChange={e => setCd(e.target.value)} placeholder="설명 (선택)" style={INP} />
            <Btns onY={doAddC} onN={() => { setAddC(false); setCn2(''); setCd('') }} load={cLoad} dis={!cn2.trim()} />
          </div>
        )}

        {office.length > 0 && (
          <>
            <GroupLabel type="office" />
            {office.map(c => (
              <div key={c.id}>
                <div className="flex items-center justify-between gap-3" style={{ padding: '12px 22px', borderBottom: '1px solid var(--day-border)' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--day-text1)' }}>{c.name}</p>
                    {c.description && <p style={{ fontSize: 12, marginTop: 2, color: 'var(--day-text3)' }}>{c.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: '#eff6ff', color: '#2563eb' }}>사무실</span>
                    <button onClick={() => editCatId === c.id ? setEditCatId(null) : startEditCat(c)}
                      className="flex items-center gap-1 font-bold"
                      style={{ fontSize: 12, padding: '5px 10px', borderRadius: 8, background: '#eef0fe', border: '1px solid #c7c3fa', color: '#4f46e5' }}>
                      <Pencil size={11} />수정
                    </button>
                    <button onClick={() => doDelC(c.id)} disabled={deletingId === c.id}
                      className={cn('flex items-center gap-1 font-bold', deletingId === c.id && 'opacity-50')}
                      style={{ fontSize: 12, padding: '5px 10px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}>
                      <Trash2 size={11} />{deletingId === c.id ? '...' : '삭제'}
                    </button>
                  </div>
                </div>
                {editCatId === c.id && (
                  <div className="fade-in" style={{ padding: '14px 22px', background: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 800, color: '#d97706' }}>카테고리 수정</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(['office', 'personal'] as const).map(t => (
                        <button key={t} type="button" onClick={() => setEditCt(t)} className="flex items-center justify-center gap-2 font-bold"
                          style={{
                            padding: '9px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                            background: editCt === t ? (t === 'office' ? '#eff6ff' : '#fff7ed') : 'var(--day-card)',
                            border: `1px solid ${editCt === t ? (t === 'office' ? '#bfdbfe' : '#fed7aa') : 'var(--day-border)'}`,
                            color: editCt === t ? (t === 'office' ? '#2563eb' : '#ea580c') : 'var(--day-text3)',
                          }}>
                          {t === 'office' ? <Building2 size={14} /> : <User size={14} />}
                          {t === 'office' ? '사무실' : '개인'}
                        </button>
                      ))}
                    </div>
                    <input type="text" value={editCn} onChange={e => setEditCn(e.target.value)}
                      placeholder="이름" style={INP} onKeyDown={e => onEnter(e, doEditC)} />
                    <input type="text" value={editCd} onChange={e => setEditCd(e.target.value)}
                      placeholder="설명 (선택)" style={INP} onKeyDown={e => onEnter(e, doEditC)} />
                    <Btns onY={doEditC} onN={() => setEditCatId(null)} load={editCLoad} dis={!editCn.trim()} label="저장하기" />
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {personal.length > 0 && (
          <>
            <GroupLabel type="personal" />
            {personal.map(c => (
              <div key={c.id}>
                <div className="flex items-center justify-between gap-3" style={{ padding: '12px 22px', borderBottom: '1px solid var(--day-border)' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--day-text1)' }}>{c.name}</p>
                    {c.description && <p style={{ fontSize: 12, marginTop: 2, color: 'var(--day-text3)' }}>{c.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: '#fff7ed', color: '#ea580c' }}>개인</span>
                    <button onClick={() => editCatId === c.id ? setEditCatId(null) : startEditCat(c)}
                      className="flex items-center gap-1 font-bold"
                      style={{ fontSize: 12, padding: '5px 10px', borderRadius: 8, background: '#eef0fe', border: '1px solid #c7c3fa', color: '#4f46e5' }}>
                      <Pencil size={11} />수정
                    </button>
                    <button onClick={() => doDelC(c.id)} disabled={deletingId === c.id}
                      className={cn('flex items-center gap-1 font-bold', deletingId === c.id && 'opacity-50')}
                      style={{ fontSize: 12, padding: '5px 10px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}>
                      <Trash2 size={11} />{deletingId === c.id ? '...' : '삭제'}
                    </button>
                  </div>
                </div>
                {editCatId === c.id && (
                  <div className="fade-in" style={{ padding: '14px 22px', background: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 800, color: '#d97706' }}>카테고리 수정</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(['office', 'personal'] as const).map(t => (
                        <button key={t} type="button" onClick={() => setEditCt(t)} className="flex items-center justify-center gap-2 font-bold"
                          style={{
                            padding: '9px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                            background: editCt === t ? (t === 'office' ? '#eff6ff' : '#fff7ed') : 'var(--day-card)',
                            border: `1px solid ${editCt === t ? (t === 'office' ? '#bfdbfe' : '#fed7aa') : 'var(--day-border)'}`,
                            color: editCt === t ? (t === 'office' ? '#2563eb' : '#ea580c') : 'var(--day-text3)',
                          }}>
                          {t === 'office' ? <Building2 size={14} /> : <User size={14} />}
                          {t === 'office' ? '사무실' : '개인'}
                        </button>
                      ))}
                    </div>
                    <input type="text" value={editCn} onChange={e => setEditCn(e.target.value)}
                      placeholder="이름" style={INP} onKeyDown={e => onEnter(e, doEditC)} />
                    <input type="text" value={editCd} onChange={e => setEditCd(e.target.value)}
                      placeholder="설명 (선택)" style={INP} onKeyDown={e => onEnter(e, doEditC)} />
                    <Btns onY={doEditC} onN={() => setEditCatId(null)} load={editCLoad} dis={!editCn.trim()} label="저장하기" />
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {categories.length === 0 && !addC && (
          <div style={{ padding: '20px 22px', textAlign: 'center', color: 'var(--day-text3)', fontSize: 13 }}>카테고리를 추가해보세요</div>
        )}
      </div>
    </div>
  )
}
