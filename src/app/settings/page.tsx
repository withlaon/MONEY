'use client'

import { useState } from 'react'
import { Plus, Building2, User, ShoppingBag, Check, X } from 'lucide-react'
import { useIncomeSources, useExpenseCategories } from '@/hooks/useTransactions'
import { cn } from '@/lib/utils'

const field: React.CSSProperties = {
  width:'100%', background:'var(--bg-base)',
  border:'1px solid var(--border)', borderRadius:10,
  padding:'10px 14px', fontSize:13, color:'var(--text-1)',
}

export default function SettingsPage() {
  const { sources, addSource } = useIncomeSources()
  const { categories, addCategory } = useExpenseCategories()

  const [srcName, setSrcName] = useState(''); const [srcDesc, setSrcDesc] = useState('')
  const [addSrc, setAddSrc] = useState(false); const [srcLoad, setSrcLoad] = useState(false)

  const [catName, setCatName] = useState(''); const [catDesc, setCatDesc] = useState('')
  const [catType, setCatType] = useState<'office'|'personal'>('office')
  const [addCat, setAddCat] = useState(false); const [catLoad, setCatLoad] = useState(false)
  const [err, setErr] = useState('')

  const office   = categories.filter(c => c.type==='office')
  const personal = categories.filter(c => c.type==='personal')

  const doAddSrc = async () => {
    if (!srcName.trim()) return
    setSrcLoad(true); setErr('')
    try { await addSource(srcName.trim(), srcDesc.trim()||undefined); setSrcName(''); setSrcDesc(''); setAddSrc(false) }
    catch { setErr('입금처 추가 실패') } finally { setSrcLoad(false) }
  }
  const doAddCat = async () => {
    if (!catName.trim()) return
    setCatLoad(true); setErr('')
    try { await addCategory(catName.trim(), catType, catDesc.trim()||undefined); setCatName(''); setCatDesc(''); setAddCat(false) }
    catch { setErr('카테고리 추가 실패') } finally { setCatLoad(false) }
  }

  const SecHeader = ({ icon, title, count, onAdd }: { icon: React.ReactNode; title: string; count: number; onAdd: () => void }) => (
    <div className="flex items-center justify-between px-4 sm:px-5 py-4" style={{ borderBottom:'1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[13px] sm:text-[14px] font-semibold" style={{ color:'var(--text-1)' }}>{title}</p>
        <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background:'var(--bg-elevated)', color:'var(--text-3)' }}>{count}개</span>
      </div>
      <button onClick={onAdd} className="flex items-center gap-1 text-[12px] font-bold" style={{ color:'var(--primary-light)' }}>
        <Plus size={13}/> 추가
      </button>
    </div>
  )

  const AddBox = ({ children }: { children: React.ReactNode }) => (
    <div className="px-4 sm:px-5 py-4 fade-in space-y-2.5" style={{ background:'var(--bg-elevated)', borderBottom:'1px solid var(--border)' }}>
      {children}
    </div>
  )

  const BtnsRow = ({ onConfirm, onCancel, loading, disabled, label }: { onConfirm:()=>void; onCancel:()=>void; loading:boolean; disabled:boolean; label:string }) => (
    <div className="flex gap-2 pt-1">
      <button onClick={onConfirm} disabled={loading||disabled}
        className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] sm:text-[13px] font-bold', (loading||disabled)&&'opacity-50')}
        style={{ background:'var(--primary-glow)', border:'1px solid rgba(124,111,224,0.28)', color:'var(--primary-light)' }}>
        <Check size={13}/>{loading?'추가 중...':label}
      </button>
      <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] sm:text-[13px] font-medium"
        style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-3)' }}>
        <X size={13}/>취소
      </button>
    </div>
  )

  const GroupLabel = ({ type }: { type: 'office'|'personal' }) => (
    <div className="px-4 sm:px-5 py-2.5" style={{ background:'rgba(255,255,255,0.015)', borderBottom:'1px solid var(--border)' }}>
      <div className="flex items-center gap-1.5">
        {type==='office' ? <Building2 size={11} style={{ color:'var(--office)' }}/> : <User size={11} style={{ color:'var(--personal)' }}/>}
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider" style={{ color:type==='office'?'var(--office)':'var(--personal)' }}>
          {type==='office'?'사무실 지출':'개인 지출'}
        </span>
      </div>
    </div>
  )

  const Row = ({ name, desc, badge, bc, bbg }: { name:string; desc:string|null; badge:string; bc:string; bbg:string }) => (
    <div className="flex items-center justify-between px-4 sm:px-5 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] sm:text-[13px] font-medium" style={{ color:'var(--text-1)' }}>{name}</p>
        {desc && <p className="text-[10px] sm:text-[11px] mt-0.5 truncate" style={{ color:'var(--text-3)' }}>{desc}</p>}
      </div>
      <span className="flex-shrink-0 ml-3 text-[10px] sm:text-[11px] font-bold px-2 py-1 rounded-lg" style={{ background:bbg, color:bc }}>{badge}</span>
    </div>
  )

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-7 max-w-[900px] mx-auto space-y-4 sm:space-y-5">

      <div className="fade-up">
        <h1 className="text-[20px] sm:text-[24px] font-bold tracking-tight" style={{ color:'var(--text-1)' }}>설정</h1>
        <p className="text-[12px] sm:text-[13px] mt-0.5" style={{ color:'var(--text-3)' }}>입금처 및 지출 카테고리 관리</p>
      </div>

      {err && (
        <div className="text-[12px] sm:text-[13px] px-4 py-3 rounded-xl fade-in" style={{ background:'var(--expense-soft)', border:'1px solid var(--expense-border)', color:'var(--expense)' }}>
          {err}
        </div>
      )}

      {/* 입금처 */}
      <div className="rounded-2xl overflow-hidden fade-up" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
        <SecHeader icon={<ShoppingBag size={14} style={{ color:'var(--income)' }}/>} title="입금처 관리" count={sources.length} onAdd={() => setAddSrc(!addSrc)}/>
        {addSrc && (
          <AddBox>
            <input autoFocus type="text" value={srcName} onChange={e => setSrcName(e.target.value)}
              placeholder="입금처 이름 (예: 위메프)" style={{ ...field, borderColor:'var(--primary)' }}
              onKeyDown={e => e.key==='Enter' && doAddSrc()}/>
            <input type="text" value={srcDesc} onChange={e => setSrcDesc(e.target.value)}
              placeholder="설명 (선택)" style={field}/>
            <BtnsRow onConfirm={doAddSrc} onCancel={() => {setAddSrc(false);setSrcName('');setSrcDesc('')}} loading={srcLoad} disabled={!srcName.trim()} label="추가"/>
          </AddBox>
        )}
        <div className="divide-y" style={{ borderColor:'var(--border)' }}>
          {sources.map(s => (
            <Row key={s.id} name={s.name} desc={s.description} badge="활성" bc="var(--income)" bbg="var(--income-soft)"/>
          ))}
        </div>
      </div>

      {/* 카테고리 */}
      <div className="rounded-2xl overflow-hidden fade-up" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
        <SecHeader icon={<Building2 size={14} style={{ color:'var(--office)' }}/>} title="지출 카테고리 관리" count={categories.length} onAdd={() => setAddCat(!addCat)}/>
        {addCat && (
          <AddBox>
            <div className="grid grid-cols-2 gap-2">
              {(['office','personal'] as const).map(t => (
                <button key={t} type="button" onClick={() => setCatType(t)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-bold border transition-all"
                  style={{
                    background: catType===t?(t==='office'?'var(--office-soft)':'var(--personal-soft)'):'var(--bg-base)',
                    border: `1px solid ${catType===t?(t==='office'?'rgba(59,130,246,0.3)':'rgba(249,115,22,0.3)'):'var(--border)'}`,
                    color: catType===t?(t==='office'?'var(--office)':'var(--personal)'):'var(--text-3)',
                  }}>
                  {t==='office'?<Building2 size={13}/>:<User size={13}/>}
                  {t==='office'?'사무실':'개인'}
                </button>
              ))}
            </div>
            <input autoFocus type="text" value={catName} onChange={e => setCatName(e.target.value)}
              placeholder={`카테고리 이름 (예: ${catType==='office'?'보관료':'헬스장'})`}
              style={{ ...field, borderColor:'var(--primary)' }}
              onKeyDown={e => e.key==='Enter' && doAddCat()}/>
            <input type="text" value={catDesc} onChange={e => setCatDesc(e.target.value)}
              placeholder="설명 (선택)" style={field}/>
            <BtnsRow onConfirm={doAddCat} onCancel={() => {setAddCat(false);setCatName('');setCatDesc('')}} loading={catLoad} disabled={!catName.trim()} label="추가"/>
          </AddBox>
        )}
        <GroupLabel type="office"/>
        <div className="divide-y" style={{ borderColor:'var(--border)' }}>
          {office.map(c => <Row key={c.id} name={c.name} desc={c.description} badge="사무실" bc="var(--office)" bbg="var(--office-soft)"/>)}
        </div>
        <GroupLabel type="personal"/>
        <div className="divide-y" style={{ borderColor:'var(--border)' }}>
          {personal.map(c => <Row key={c.id} name={c.name} desc={c.description} badge="개인" bc="var(--personal)" bbg="var(--personal-soft)"/>)}
        </div>
      </div>
    </div>
  )
}
