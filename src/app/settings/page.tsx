'use client'

import { useState } from 'react'
import { Plus, Building2, User, ShoppingBag, Check, X } from 'lucide-react'
import { useIncomeSources, useExpenseCategories } from '@/hooks/useTransactions'
import { cn } from '@/lib/utils'

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
    setSourceLoading(true)
    setError('')
    try {
      await addSource(newSourceName.trim(), newSourceDesc.trim() || undefined)
      setNewSourceName('')
      setNewSourceDesc('')
      setAddingSource(false)
    } catch {
      setError('입금처 추가에 실패했습니다.')
    } finally {
      setSourceLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    setCatLoading(true)
    setError('')
    try {
      await addCategory(newCatName.trim(), newCatType, newCatDesc.trim() || undefined)
      setNewCatName('')
      setNewCatDesc('')
      setAddingCat(false)
    } catch {
      setError('카테고리 추가에 실패했습니다.')
    } finally {
      setCatLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">설정</h1>
        <p className="text-sm text-[#6b7280] mt-0.5">입금처 및 지출 카테고리 관리</p>
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* 입금처 관리 */}
      <div className="bg-[#13151f] border border-[#1e2130] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2130]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">입금처 관리</h2>
            <span className="text-xs text-[#6b7280]">({sources.length}개)</span>
          </div>
          <button
            onClick={() => setAddingSource(!addingSource)}
            className="flex items-center gap-1.5 text-xs text-[#6c63ff] hover:text-[#8b84ff] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            추가
          </button>
        </div>

        {addingSource && (
          <div className="px-5 py-4 bg-[#1a1d27] border-b border-[#1e2130] fade-in">
            <div className="space-y-3">
              <input
                type="text"
                value={newSourceName}
                onChange={e => setNewSourceName(e.target.value)}
                placeholder="입금처 이름 (예: 위메프)"
                className="w-full bg-[#0f1117] border border-[#252836] rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#6c63ff] transition-colors"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleAddSource()}
              />
              <input
                type="text"
                value={newSourceDesc}
                onChange={e => setNewSourceDesc(e.target.value)}
                placeholder="설명 (선택사항)"
                className="w-full bg-[#0f1117] border border-[#252836] rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#6c63ff] transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddSource}
                  disabled={sourceLoading || !newSourceName.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {sourceLoading ? '추가 중...' : '추가'}
                </button>
                <button
                  onClick={() => { setAddingSource(false); setNewSourceName(''); setNewSourceDesc('') }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1a1d27] border border-[#252836] text-[#6b7280] text-sm hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="divide-y divide-[#1e2130]">
          {sources.map(source => (
            <div key={source.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm text-white">{source.name}</p>
                {source.description && (
                  <p className="text-xs text-[#6b7280] mt-0.5">{source.description}</p>
                )}
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">활성</span>
            </div>
          ))}
        </div>
      </div>

      {/* 지출 카테고리 관리 */}
      <div className="bg-[#13151f] border border-[#1e2130] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2130]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">지출 카테고리 관리</h2>
            <span className="text-xs text-[#6b7280]">({categories.length}개)</span>
          </div>
          <button
            onClick={() => setAddingCat(!addingCat)}
            className="flex items-center gap-1.5 text-xs text-[#6c63ff] hover:text-[#8b84ff] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            추가
          </button>
        </div>

        {addingCat && (
          <div className="px-5 py-4 bg-[#1a1d27] border-b border-[#1e2130] fade-in">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewCatType('office')}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all',
                    newCatType === 'office'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-[#0f1117] text-[#6b7280] border-[#252836] hover:text-white'
                  )}
                >
                  <Building2 className="w-4 h-4" />
                  사무실
                </button>
                <button
                  type="button"
                  onClick={() => setNewCatType('personal')}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all',
                    newCatType === 'personal'
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      : 'bg-[#0f1117] text-[#6b7280] border-[#252836] hover:text-white'
                  )}
                >
                  <User className="w-4 h-4" />
                  개인
                </button>
              </div>
              <input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder={`카테고리 이름 (예: ${newCatType === 'office' ? '보관료' : '헬스장'})`}
                className="w-full bg-[#0f1117] border border-[#252836] rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#6c63ff] transition-colors"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              />
              <input
                type="text"
                value={newCatDesc}
                onChange={e => setNewCatDesc(e.target.value)}
                placeholder="설명 (선택사항)"
                className="w-full bg-[#0f1117] border border-[#252836] rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#6c63ff] transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddCategory}
                  disabled={catLoading || !newCatName.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6c63ff20] border border-[#6c63ff30] text-[#8b84ff] text-sm hover:bg-[#6c63ff30] transition-all disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {catLoading ? '추가 중...' : '추가'}
                </button>
                <button
                  onClick={() => { setAddingCat(false); setNewCatName(''); setNewCatDesc('') }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1a1d27] border border-[#252836] text-[#6b7280] text-sm hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 사무실 카테고리 */}
        <div className="px-5 py-3 border-b border-[#1e2130] bg-[#1a1d2780]">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400">사무실 지출</span>
          </div>
        </div>
        <div className="divide-y divide-[#1e2130]">
          {officeCategories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm text-white">{cat.name}</p>
                {cat.description && (
                  <p className="text-xs text-[#6b7280] mt-0.5">{cat.description}</p>
                )}
              </div>
              <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">사무실</span>
            </div>
          ))}
        </div>

        {/* 개인 카테고리 */}
        <div className="px-5 py-3 border-y border-[#1e2130] bg-[#1a1d2780]">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-semibold text-orange-400">개인 지출</span>
          </div>
        </div>
        <div className="divide-y divide-[#1e2130]">
          {personalCategories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm text-white">{cat.name}</p>
                {cat.description && (
                  <p className="text-xs text-[#6b7280] mt-0.5">{cat.description}</p>
                )}
              </div>
              <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">개인</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
