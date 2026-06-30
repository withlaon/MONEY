'use client'

import { useState } from 'react'
import { Plus, Building2, User, ShoppingBag, Check, X } from 'lucide-react'
import { useIncomeSources, useExpenseCategories } from '@/hooks/useTransactions'
import { cn } from '@/lib/utils'

const inputStyle = {
  width: '100%',
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '13px',
  color: 'var(--text-primary)',
} as React.CSSProperties

export default function SettingsPage() {
  const { sources, addSource } = useIncomeSources()
  const { categories, addCategory } = useExpenseCategories()

  const [newSourceName, setNewSourceName] = useState('')
  const [newSourceDesc, setNewSourceDesc] = useState('')
  const [addingSource, setAddingSource] = useState(false)
  const [sourceLoading, setSourceLoading] = useState(false)

  const [newCatName, setNewCatName] = useState('')
  const [newCatType, setNewCatType] = useState<'office' | 'personal'>('office')
  const [newCatDesc, setNewCatDesc] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [catLoading, setCatLoading] = useState(false)
  const [error, setError] = useState('')

  const officeCategories = categories.filter(c => c.type === 'office')
  const personalCategories = categories.filter(c => c.type === 'personal')

  const handleAddSource = async () => {
    if (!newSourceName.trim()) return
    setSourceLoading(true); setError('')
    try {
      await addSource(newSourceName.trim(), newSourceDesc.trim() || undefined)
      setNewSourceName(''); setNewSourceDesc(''); setAddingSource(false)
    } catch { setError('입금처 추가에 실패했습니다.') }
    finally { setSourceLoading(false) }
  }

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    setCatLoading(true); setError('')
    try {
      await addCategory(newCatName.trim(), newCatType, newCatDesc.trim() || undefined)
      setNewCatName(''); setNewCatDesc(''); setAddingCat(false)
    } catch { setError('카테고리 추가에 실패했습니다.') }
    finally { setCatLoading(false) }
  }

  const SectionHeader = ({ icon, title, count, onAdd }: { icon: React.ReactNode; title: string; count: number; onAdd: () => void }) => (
    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
          {count}개
        </span>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-1 text-[12px] font-semibold transition-colors"
        style={{ color: 'var(--primary-light)' }}
      >
        <Plus size={13} /> 추가
      </button>
    </div>
  )

  const AddForm = ({ children }: { children: React.ReactNode }) => (
    <div className="px-5 py-4 fade-in" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
      {children}
    </div>
  )

  const CategoryGroupHeader = ({ type }: { type: 'office' | 'personal' }) => (
    <div className="px-5 py-2.5" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-1.5">
        {type === 'office'
          ? <Building2 size={12} style={{ color: '#3b82f6' }} />
          : <User size={12} style={{ color: '#f97316' }} />
        }
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: type==='office' ? '#3b82f6' : '#f97316' }}>
          {type === 'office' ? '사무실 지출' : '개인 지출'}
        </span>
      </div>
    </div>
  )

  return (
    <div className="min-h-full p-5 sm:p-7 max-w-[900px] mx-auto space-y-5">

      <div className="fade-up">
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>설정</h1>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>입금처 및 지출 카테고리 관리</p>
      </div>

      {error && (
        <div className="text-[13px] px-4 py-3 rounded-xl fade-in" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e' }}>
          {error}
        </div>
      )}

      {/* 입금처 */}
      <div className="rounded-2xl overflow-hidden fade-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <SectionHeader
          icon={<ShoppingBag size={15} style={{ color: '#10b981' }} />}
          title="입금처 관리"
          count={sources.length}
          onAdd={() => setAddingSource(!addingSource)}
        />
        {addingSource && (
          <AddForm>
            <div className="space-y-2">
              <input autoFocus type="text" value={newSourceName} onChange={e => setNewSourceName(e.target.value)}
                placeholder="입금처 이름 (예: 위메프)" style={{ ...inputStyle, borderColor: 'var(--primary)' }}
                onKeyDown={e => e.key === 'Enter' && handleAddSource()} />
              <input type="text" value={newSourceDesc} onChange={e => setNewSourceDesc(e.target.value)}
                placeholder="설명 (선택사항)" style={inputStyle} />
              <div className="flex gap-2 pt-1">
                <button onClick={handleAddSource} disabled={sourceLoading || !newSourceName.trim()}
                  className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all', (sourceLoading || !newSourceName.trim()) && 'opacity-50 cursor-not-allowed')}
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>
                  <Check size={13} />{sourceLoading ? '추가 중...' : '추가'}
                </button>
                <button onClick={() => { setAddingSource(false); setNewSourceName(''); setNewSourceDesc('') }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <X size={13} />취소
                </button>
              </div>
            </div>
          </AddForm>
        )}
        <div>
          {sources.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: i < sources.length-1 ? '1px solid var(--border)' : 'none' }}
            >
              <div>
                <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                {s.description && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.description}</p>}
              </div>
              <span className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>활성</span>
            </div>
          ))}
        </div>
      </div>

      {/* 지출 카테고리 */}
      <div className="rounded-2xl overflow-hidden fade-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <SectionHeader
          icon={<Building2 size={15} style={{ color: '#3b82f6' }} />}
          title="지출 카테고리 관리"
          count={categories.length}
          onAdd={() => setAddingCat(!addingCat)}
        />
        {addingCat && (
          <AddForm>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {(['office','personal'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setNewCatType(t)}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold border transition-all"
                    style={{
                      background: newCatType===t ? (t==='office' ? 'rgba(59,130,246,0.12)' : 'rgba(249,115,22,0.12)') : 'var(--bg-base)',
                      border: `1px solid ${newCatType===t ? (t==='office' ? 'rgba(59,130,246,0.3)' : 'rgba(249,115,22,0.3)') : 'var(--border)'}`,
                      color: newCatType===t ? (t==='office' ? '#3b82f6' : '#f97316') : 'var(--text-muted)',
                    }}>
                    {t==='office' ? <Building2 size={13}/> : <User size={13}/>}
                    {t==='office' ? '사무실' : '개인'}
                  </button>
                ))}
              </div>
              <input autoFocus type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                placeholder={`카테고리 이름 (예: ${newCatType==='office' ? '보관료' : '헬스장'})`}
                style={{ ...inputStyle, borderColor: 'var(--primary)' }}
                onKeyDown={e => e.key==='Enter' && handleAddCategory()} />
              <input type="text" value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)}
                placeholder="설명 (선택사항)" style={inputStyle} />
              <div className="flex gap-2 pt-1">
                <button onClick={handleAddCategory} disabled={catLoading || !newCatName.trim()}
                  className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all', (catLoading || !newCatName.trim()) && 'opacity-50 cursor-not-allowed')}
                  style={{ background: 'rgba(123,111,224,0.12)', border: '1px solid rgba(123,111,224,0.25)', color: 'var(--primary-light)' }}>
                  <Check size={13}/>{catLoading ? '추가 중...' : '추가'}
                </button>
                <button onClick={() => { setAddingCat(false); setNewCatName(''); setNewCatDesc('') }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <X size={13}/>취소
                </button>
              </div>
            </div>
          </AddForm>
        )}

        <CategoryGroupHeader type="office" />
        <div>
          {officeCategories.map((c, i) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                {c.description && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.description}</p>}
              </div>
              <span className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>사무실</span>
            </div>
          ))}
        </div>

        <CategoryGroupHeader type="personal" />
        <div>
          {personalCategories.map((c, i) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: i < personalCategories.length-1 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                {c.description && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.description}</p>}
              </div>
              <span className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>개인</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
