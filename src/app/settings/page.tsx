'use client'

import { useState } from 'react'
import { Plus, Building2, User, ShoppingBag, Check, X } from 'lucide-react'
import { useIncomeSources, useExpenseCategories } from '@/hooks/useTransactions'
import { cn } from '@/lib/utils'

const F: React.CSSProperties = {
  width:'100%', background:'var(--day-card2)', border:'1px solid var(--day-border)',
  borderRadius:12, padding:'11px 15px', fontSize:15, color:'var(--day-text1)',
  transition:'border-color 0.15s',
}

export default function SettingsPage() {
  const { sources, addSource } = useIncomeSources()
  const { categories, addCategory } = useExpenseCategories()

  const [sn,setSn]=useState(''); const [sd,setSd]=useState('')
  const [addS,setAddS]=useState(false); const [sLoad,setSLoad]=useState(false)
  const [cn2,setCn2]=useState(''); const [cd,setCd]=useState('')
  const [ct,setCt]=useState<'office'|'personal'>('office')
  const [addC,setAddC]=useState(false); const [cLoad,setCLoad]=useState(false)
  const [err,setErr]=useState('')

  const office   = categories.filter(c => c.type==='office')
  const personal = categories.filter(c => c.type==='personal')

  const doS = async () => {
    if (!sn.trim()) return
    setSLoad(true); setErr('')
    try { await addSource(sn.trim(),sd.trim()||undefined); setSn(''); setSd(''); setAddS(false) }
    catch { setErr('입금처 추가 실패') } finally { setSLoad(false) }
  }
  const doC = async () => {
    if (!cn2.trim()) return
    setCLoad(true); setErr('')
    try { await addCategory(cn2.trim(),ct,cd.trim()||undefined); setCn2(''); setCd(''); setAddC(false) }
    catch { setErr('카테고리 추가 실패') } finally { setCLoad(false) }
  }

  const SH = ({icon,title,count,onAdd}:{icon:React.ReactNode;title:string;count:number;onAdd:()=>void}) => (
    <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5" style={{ borderBottom:'1px solid var(--day-border)' }}>
      <div className="flex items-center gap-3">
        {icon}
        <p className="text-[15px] sm:text-[16px] font-extrabold" style={{ color:'var(--day-text1)' }}>{title}</p>
        <span className="text-[12px] font-bold px-2.5 py-1 rounded-xl" style={{ background:'var(--day-card2)', color:'var(--day-text3)', border:'1px solid var(--day-border)' }}>{count}개</span>
      </div>
      <button onClick={onAdd} className="flex items-center gap-1.5 text-[13px] sm:text-[14px] font-bold px-3.5 py-2 rounded-xl"
        style={{ color:'var(--primary-light)', background:'var(--primary-soft)', border:'1px solid var(--primary-border)' }}>
        <Plus size={14}/> 추가
      </button>
    </div>
  )

  const AF = ({children}:{children:React.ReactNode}) => (
    <div className="px-5 sm:px-7 py-4 sm:py-5 space-y-3 fade-in" style={{ background:'#f8faff', borderBottom:'1px solid var(--day-border)' }}>
      {children}
    </div>
  )

  const Btns = ({onY,onN,load,dis}:{onY:()=>void;onN:()=>void;load:boolean;dis:boolean}) => (
    <div className="flex gap-2.5 pt-1">
      <button onClick={onY} disabled={load||dis} className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-bold',(load||dis)&&'opacity-50')}
        style={{ background:'var(--primary)',color:'white',boxShadow:'0 4px 14px rgba(91,77,212,0.25)' }}>
        <Check size={14}/>{load?'추가 중...':'추가하기'}
      </button>
      <button onClick={onN} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold"
        style={{ background:'var(--day-card)', border:'1px solid var(--day-border)', color:'var(--day-text2)' }}>
        <X size={14}/>취소
      </button>
    </div>
  )

  const GL = ({type}:{type:'office'|'personal'}) => (
    <div className="px-5 sm:px-7 py-3" style={{ background:'var(--day-card2)', borderBottom:'1px solid var(--day-border)' }}>
      <div className="flex items-center gap-2">
        {type==='office'?<Building2 size={13} style={{ color:'var(--office)' }}/>:<User size={13} style={{ color:'var(--personal)' }}/>}
        <span className="text-[12px] sm:text-[13px] font-extrabold uppercase tracking-wider" style={{ color:type==='office'?'var(--office)':'var(--personal)' }}>
          {type==='office'?'사무실 지출':'개인 지출'}
        </span>
      </div>
    </div>
  )

  const Row = ({name,desc,badge,bc,bg}:{name:string;desc:string|null;badge:string;bc:string;bg:string}) => (
    <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 sm:py-4">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] sm:text-[15px] font-semibold" style={{ color:'var(--day-text1)' }}>{name}</p>
        {desc&&<p className="text-[12px] sm:text-[13px] mt-0.5 truncate" style={{ color:'var(--day-text3)' }}>{desc}</p>}
      </div>
      <span className="flex-shrink-0 ml-4 text-[11px] sm:text-[12px] font-bold px-2.5 py-1.5 rounded-xl" style={{ background:bg, color:bc }}>{badge}</span>
    </div>
  )

  return (
    <div className="page-wrap space-y-5 sm:space-y-6">

      <div className="fade-up">
        <h1 className="text-[24px] sm:text-[28px] font-extrabold tracking-tight" style={{ color:'var(--day-text1)' }}>설정</h1>
        <p className="text-[14px] mt-1" style={{ color:'var(--day-text3)' }}>입금처 및 지출 카테고리 관리</p>
      </div>

      {err&&<div className="text-[14px] px-5 py-3.5 rounded-2xl fade-in" style={{ background:'var(--expense-soft)', border:'1px solid var(--expense-border)', color:'var(--expense)' }}>{err}</div>}

      {/* 입금처 */}
      <div className="rounded-3xl overflow-hidden fade-up" style={{ background:'var(--day-card)', border:'1px solid var(--day-border)', boxShadow:'var(--day-shadow)' }}>
        <SH icon={<div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--income-soft)' }}><ShoppingBag size={16} style={{ color:'var(--income)' }}/></div>} title="입금처 관리" count={sources.length} onAdd={()=>setAddS(!addS)}/>
        {addS&&<AF>
          <input autoFocus type="text" value={sn} onChange={e=>setSn(e.target.value)} placeholder="입금처 이름 (예: 위메프)" style={{ ...F, borderColor:'var(--primary)' }} onKeyDown={e=>e.key==='Enter'&&doS()}/>
          <input type="text" value={sd} onChange={e=>setSd(e.target.value)} placeholder="설명 (선택사항)" style={F}/>
          <Btns onY={doS} onN={()=>{setAddS(false);setSn('');setSd('')}} load={sLoad} dis={!sn.trim()}/>
        </AF>}
        <div className="divide-y" style={{ borderColor:'var(--day-border)' }}>
          {sources.map(s=><Row key={s.id} name={s.name} desc={s.description} badge="활성" bc="var(--income)" bg="var(--income-soft)"/>)}
        </div>
      </div>

      {/* 카테고리 */}
      <div className="rounded-3xl overflow-hidden fade-up" style={{ background:'var(--day-card)', border:'1px solid var(--day-border)', boxShadow:'var(--day-shadow)' }}>
        <SH icon={<div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--office-soft)' }}><Building2 size={16} style={{ color:'var(--office)' }}/></div>} title="지출 카테고리" count={categories.length} onAdd={()=>setAddC(!addC)}/>
        {addC&&<AF>
          <div className="grid grid-cols-2 gap-2.5">
            {(['office','personal'] as const).map(t=>(
              <button key={t} type="button" onClick={()=>setCt(t)}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-bold border transition-all"
                style={{
                  background: ct===t?(t==='office'?'var(--office-soft)':'var(--personal-soft)'):'var(--day-card)',
                  border:`1px solid ${ct===t?(t==='office'?'var(--office-border)':'var(--personal-border)'):'var(--day-border)'}`,
                  color: ct===t?(t==='office'?'var(--office)':'var(--personal)'):'var(--day-text3)',
                  boxShadow: ct===t?'var(--day-shadow)':'none',
                }}>
                {t==='office'?<Building2 size={15}/>:<User size={15}/>}
                {t==='office'?'사무실':'개인'}
              </button>
            ))}
          </div>
          <input autoFocus type="text" value={cn2} onChange={e=>setCn2(e.target.value)} placeholder={`카테고리 이름 (예: ${ct==='office'?'보관료':'헬스장'})`} style={{ ...F, borderColor:'var(--primary)' }} onKeyDown={e=>e.key==='Enter'&&doC()}/>
          <input type="text" value={cd} onChange={e=>setCd(e.target.value)} placeholder="설명 (선택사항)" style={F}/>
          <Btns onY={doC} onN={()=>{setAddC(false);setCn2('');setCd('')}} load={cLoad} dis={!cn2.trim()}/>
        </AF>}
        <GL type="office"/>
        <div className="divide-y" style={{ borderColor:'var(--day-border)' }}>
          {office.map(c=><Row key={c.id} name={c.name} desc={c.description} badge="사무실" bc="var(--office)" bg="var(--office-soft)"/>)}
        </div>
        <GL type="personal"/>
        <div className="divide-y" style={{ borderColor:'var(--day-border)' }}>
          {personal.map(c=><Row key={c.id} name={c.name} desc={c.description} badge="개인" bc="var(--personal)" bg="var(--personal-soft)"/>)}
        </div>
      </div>
    </div>
  )
}
