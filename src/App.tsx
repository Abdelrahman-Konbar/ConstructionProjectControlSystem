import { useEffect, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { localizeRole, localizeStatus, localizeUiText, setActiveLanguage, translate, type Lang } from '@/i18n/translations'
import { APP_ROUTE_PATTERNS, keyToPath, pathToKey, replaceProjectContextPath } from '@/app/router/paths'
import { useAuth } from '@/features/auth/AuthProvider'
import { AppLayout } from '@/layouts/AppLayout/AppLayout'
import { ProjectProvider } from '@/app/providers/ProjectContext'
import { useProjectContext } from '@/app/providers/ProjectContext'
import { approveApproval, awardRfq, closePurchaseOrder, createBoqItem, createDocument, createExpense, createInvitation, createMaterialRequest, createProgress, createQuote, createReceipt, createRfq, createSubcontractor, createSupplier, createProject, createPurchaseOrder, createSubcontract, downloadDocument, getComparison, getExpense, getMaterialRequest, getPurchaseOrder, getSupplier, getCompanySettings, inviteRfqSupplier, issuePurchaseOrder, issueRfq, markAllNotificationsRead, markNotificationRead, postExpense, rejectApproval, removeRfqSupplier, setTeamMemberActive, submitExpense, submitMaterialRequest, submitPurchaseOrder, updateExpense, updateMaterialRequest, updateSupplier, updateCompanySettings, updateTeamMember, uploadDocument, uploadDocumentVersion, useApprovals, useAuditEvents, useBudget, useBoq, useCostCodes, useDashboardSummary, useDocuments, useExpenses, useMaterialRequests, useNotifications, useProgress, useProject, useProjects, usePurchaseOrders, useReceipts, useReportSummary, useRfqs, useSubcontractors, useSubcontracts, useSuppliers, useTeam, toProjectRows } from '@/services/api'
import { ErrorState, EmptyState, LoadingState } from '@/components/shared/AsyncState'
import { ApiError } from '@/services/api/errors'

const T = translate
let currentLanguage: Lang = 'ar'

/* ---------- primitives ---------- */
const tone: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200', amber: 'bg-orange-50 text-orange-700 ring-orange-200',
  red: 'bg-red-50 text-red-700 ring-red-200', blue: 'bg-sky-50 text-sky-700 ring-sky-200', gray: 'bg-stone-100 text-stone-600 ring-stone-200',
}
const Chip = ({ t = 'gray', children }: { t?: string; children: ReactNode }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-medium ring-1 ${tone[t]}`}>
    <span className="size-1.5 rounded-full bg-current opacity-70" />{typeof children === 'string' ? localizeStatus(currentLanguage, children) : children}</span>)
const Btn = ({ primary, children, onClick, disabled, type = 'button' }: { primary?: boolean; children: ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' | 'reset' }) => (
  <button type={type} onClick={onClick ?? (typeof children === 'string' && children.toLowerCase().includes('new project') ? () => window.dispatchEvent(new Event('construction:create-project')) : undefined)} disabled={disabled} className={`h-9 rounded-lg px-4 text-[13px] font-medium transition ${primary ? 'bg-amber text-white hover:bg-[#c4621a] shadow-sm' : 'border border-line bg-paper hover:bg-white'} disabled:cursor-not-allowed disabled:opacity-50`}>{typeof children === 'string' ? localizeUiText(currentLanguage, children) : children}</button>)
const Bar = ({ v, c = 'bg-amber' }: { v: number; c?: string }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200"><div className={`h-full ${c}`} style={{ width: `${Math.min(v, 100)}%` }} /></div>)
const Card = ({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={`card ${className}`}>
    {title && <header className="flex items-center justify-between border-b border-line px-5 py-3.5"><h3 className="text-[14px] font-semibold">{localizeUiText(currentLanguage, title)}</h3>{action}</header>}
    {children}</section>)
const Kpi = ({ label, value, sub, trend, accent }: { label: string; value: string; sub: string; trend?: string; accent?: boolean }) => (
  <div className={`card p-5 ${accent ? 'corner' : ''}`}>
    <div className="text-[12px] text-steel">{localizeUiText(currentLanguage, label)}</div>
    <div className="num mt-2 text-[26px] font-medium tracking-tight">{value}</div>
    <div className="mt-1 flex items-center gap-2 text-[12px] text-steel">{trend && <span className={trend.startsWith('-') ? 'text-red-600' : 'text-emerald-700'}>{trend}</span>}{localizeUiText(currentLanguage, sub)}</div>
  </div>)
const Head = ({ code, title, sub, actions }: { code: string; title: string; sub: string; actions?: ReactNode }) => (
  <div className="mb-6 flex items-end justify-between">
    <div><div className="num mb-1 text-[11px] tracking-widest text-amber">{code}</div>
      <h1 className="text-[24px] font-semibold">{localizeUiText(currentLanguage, title)}</h1><p className="mt-1 text-[13px] text-steel">{localizeUiText(currentLanguage, sub)}</p></div>
    <div className="flex gap-2">{actions}</div></div>)
const Table = ({ cols, rows, onRow }: { cols: string[]; rows: ReactNode[][]; onRow?: (i: number) => void }) => (
  <div className="overflow-x-auto"><table className="dt"><thead><tr>{cols.map((c) => <th key={c}>{localizeUiText(currentLanguage, c)}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i} onClick={() => onRow?.(i)} className={onRow ? 'cursor-pointer' : ''}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>)
const Steps = ({ steps, at }: { steps: string[]; at: number }) => (
  <ol className="flex items-center">{steps.map((s, i) => (
    <li key={s} className="flex flex-1 items-center gap-2 last:flex-none">
      <span className={`num grid size-7 shrink-0 place-items-center rounded-full text-[12px] ${i < at ? 'bg-navy text-white' : i === at ? 'bg-amber text-white ring-4 ring-orange-100' : 'border border-line bg-paper text-steel'}`}>{i < at ? '✓' : i + 1}</span>
      <span className={`text-[12.5px] whitespace-nowrap ${i === at ? 'font-semibold' : 'text-steel'}`}>{localizeUiText(currentLanguage, s)}</span>
      {i < steps.length - 1 && <span className={`mx-3 h-px flex-1 ${i < at ? 'bg-navy' : 'bg-line'}`} />}</li>))}</ol>)
const sar = (n: number) => n.toLocaleString('en-US')
const downloadCsv = (name: string, rows: string[][]) => { const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `${name}.csv`; link.click(); URL.revokeObjectURL(url) }

/* ---------- icons (thin technical line set) ---------- */
const P: Record<string, string> = {
  dash: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z', proj: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6', boq: 'M4 4h16v16H4zM4 9h16M4 14h16M9 4v16',
  cost: 'M12 3v18M17 7H9.5a3 3 0 000 6h5a3 3 0 010 6H7', mr: 'M8 4h8l4 4v12H4V4h4M9 12h6M9 16h6', rfq: 'M4 6h16M4 12h10M4 18h7M18 15l3 3-3 3',
  cmp: 'M6 20V10M12 20V4M18 20v-7', po: 'M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6', grn: 'M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10',
  sup: 'M3 21V9l6-4v4l6-4v4l6-4v16zM7 17h2M12 17h2M17 17h1', prog: 'M3 17l6-6 4 4 8-8M15 7h6v6', sub: 'M12 2l9 5v10l-9 5-9-5V7z',
  exp: 'M3 6h18v12H3zM3 10h18M7 15h3', appr: 'M9 12l2 2 4-4M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z', doc: 'M14 3H6v18h12V7zM14 3v4h4',
  team: 'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21v-1a7 7 0 0114 0v1M17 11a3 3 0 000-6M22 21v-1a5 5 0 00-4-5', rep: 'M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6',
  set: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-2.7-1.1l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00-1.1-2.7H3a2 2 0 110-4h.1a1.6 1.6 0 001.1-2.7l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 002.7-1.1V3a2 2 0 114 0v.1a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 001.1 2.7H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1.3z',
  bell: 'M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4', audit: 'M5 3h14v18H5zM8 8h8M8 12h8M8 16h5', search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5',
}
const I = ({ n, c = 'size-[18px]' }: { n: string; c?: string }) => (
  <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d={P[n]} /></svg>)

/* ---------- navigation ---------- */
type Key = keyof typeof P
const NAV: { g: [string, string]; items: [Key, string, string][] }[] = [
  { g: ['نظرة عامة', 'Overview'], items: [['dash', 'لوحة القيادة', 'Executive'], ['proj', 'المشاريع', 'Projects'], ['prog', 'تتبع الإنجاز', 'Progress']] },
  { g: ['التكاليف', 'Cost Control'], items: [['boq', 'جدول الكميات', 'BOQ'], ['cost', 'الميزانية والتكلفة', 'Budget & Cost'], ['exp', 'المصروفات', 'Expenses']] },
  { g: ['المشتريات', 'Procurement'], items: [['mr', 'طلبات المواد', 'Material Requests'], ['rfq', 'طلبات التسعير', 'RFQs'], ['cmp', 'مقارنة العروض', 'Quote Comparison'], ['po', 'أوامر الشراء', 'Purchase Orders'], ['grn', 'استلام المواد', 'Goods Receiving'], ['sup', 'الموردون', 'Suppliers'], ['sub', 'مقاولو الباطن', 'Subcontractors']] },
  { g: ['التحكم', 'Control'], items: [['appr', 'الموافقات', 'Approvals'], ['doc', 'المستندات', 'Documents'], ['team', 'الفريق', 'Team'], ['rep', 'التقارير', 'Reports'], ['audit', 'سجل التدقيق', 'Audit Log'], ['set', 'الإعدادات', 'Settings']] },
]

/* ---------- screens ---------- */
function Executive({ l, go, openProject }: { l: Lang; go: (k: string) => void; openProject: (id: string) => void }) {
  const { data } = useProjects()
  const { data: approvalRows } = useApprovals()
  const { data: summary } = useDashboardSummary()
  const projects = data ? toProjectRows(data.items) : []
  const portfolioValue = data?.items.reduce((sum, project) => sum + Number(project.contractValue ?? 0), 0) ?? 0
  const pendingApprovals = approvalRows?.filter((approval) => approval.status === 'PENDING').length ?? 0
  const history = summary?.history ?? []
  return <>
    <Head code="EXEC · Q3 2025" title={T(l, 'لوحة القيادة التنفيذية', 'Executive Dashboard')} sub={T(l, 'محفظة ٥ مشاريع نشطة · من بيانات النظام الفعلية', 'Live portfolio data')} actions={<><Btn onClick={() => downloadCsv('projects', [['Code', 'Name', 'Status', 'Progress'], ...projects.map((p) => [p[0], p[2], p[8], String(p[6])])])}>{T(l, 'تصدير', 'Export')}</Btn><Btn primary onClick={() => go('proj')}>{T(l, '+ مشروع جديد', '+ New project')}</Btn></>} />
    <div className="grid grid-cols-4 gap-4">
      <Kpi accent label={T(l, 'قيمة المحفظة (ر.س)', 'Portfolio value (SAR)')} value={`${(portfolioValue / 1_000_000).toFixed(1)}M`} sub={`${projects.length} ${T(l, 'مشاريع', 'projects')}`} />
      <Kpi label={T(l, 'التكلفة الفعلية', 'Actual cost')} value={summary ? `${(summary.actual / 1_000_000).toFixed(2)}M` : '—'} sub={T(l, 'من الاستلامات والمصروفات المرحلة', 'From posted receipts and expenses')} />
      <Kpi label={T(l, 'التكلفة الملتزم بها', 'Committed cost')} value={summary ? `${(summary.committed / 1_000_000).toFixed(2)}M` : '—'} sub={`${summary?.poCount ?? 0} ${T(l, 'أوامر شراء', 'purchase orders')}`} />
      <Kpi label={T(l, 'موافقات معلّقة', 'Pending approvals')} value={String(summary?.pendingApprovals ?? pendingApprovals)} sub={T(l, 'من بيانات الاعتماد الفعلية', 'From live approval data')} />
    </div>
    <div className="mt-4 grid grid-cols-3 gap-4">
      <Card className="col-span-2" title={T(l, 'التدفق النقدي: المخطط مقابل الفعلي', 'Cash flow: planned vs actual')} action={<span className="num text-[11px] text-steel">SAR M · 2025</span>}>
        <div className="grid-paper flex h-56 items-center justify-center px-6 pt-6 pb-4">
          {history.length ? history.map((point) => { const max = Math.max(...history.flatMap((item) => [item.planned, item.actual]), 1); return <div key={point.period} className="flex flex-1 flex-col items-center gap-1.5"><div className="flex h-44 w-full items-end gap-1">
            <div className="flex-1 rounded-t-sm bg-stone-300" style={{ height: `${(point.planned / max) * 100}%` }} /><div className="flex-1 rounded-t-sm bg-navy" style={{ height: `${(point.actual / max) * 100}%` }} /></div>
            <span className="num text-[10px] text-steel">{point.period.slice(5)}</span></div> }) : <div className="text-center text-[13px] text-steel">{T(l, 'لا توجد بيانات تاريخية كافية لعرض الاتجاهات.', 'Historical trend data is not available yet.')}</div>}
        </div></Card>
      <Card title={T(l, 'تنبيهات حرجة', 'Critical alerts')}>
        <ul className="divide-y divide-line text-[13px]">{[
          ['red', T(l, 'تجاوز ميزانية الخرسانة ١٢٪ — مستشفى النخيل', 'Concrete budget +12% — Nakheel Hospital')],
          ['amber', T(l, 'أمر شراء PO-1182 متأخر ٥ أيام عن التوريد', 'PO-1182 delivery 5 days late')],
          ['amber', T(l, 'انتهاء ضمان أداء مقاول الباطن خلال ١٠ أيام', 'Subcontractor bond expires in 10 days')],
          ['blue', T(l, '٣ عروض أسعار جديدة بانتظار المقارنة', '3 new quotes awaiting comparison')]].map(([t, s], i) =>
          <li key={i} className="flex items-start gap-3 px-5 py-3.5"><span className={`mt-1.5 size-2 rounded-full ${t === 'red' ? 'bg-red-500' : t === 'amber' ? 'bg-amber' : 'bg-sky-500'}`} />{s}</li>)}</ul></Card>
    </div>
    <Card className="mt-4" title={T(l, 'صحة المشاريع', 'Project health')} action={<button onClick={() => go('proj')} className="text-[12px] text-amber">{T(l, 'عرض الكل ←', 'View all →')}</button>}>
      <Table onRow={() => data?.items[0] && openProject(data.items[0].id)} cols={[T(l, 'الرمز', 'Code'), T(l, 'المشروع', 'Project'), T(l, 'القيمة', 'Value'), T(l, 'الإنجاز', 'Progress'), T(l, 'الصرف', 'Spent'), T(l, 'الحالة', 'Status')]}
        rows={projects.map((p) => [<span className="num text-steel">{p[0]}</span>, <b className="font-medium">{l === 'ar' ? p[1] : p[2]}</b>, <span className="num">{p[5]}M</span>,
          <div className="flex w-40 items-center gap-2"><Bar v={p[6]} c="bg-navy" /><span className="num text-[11px]">{p[6]}%</span></div>,
          <div className="flex w-40 items-center gap-2"><Bar v={p[7]} /><span className="num text-[11px]">{p[7]}%</span></div>,
          <Chip t={p[8]}>{{ green: T(l, 'ضمن الخطة', 'On track'), amber: T(l, 'تحت المراقبة', 'At risk'), red: T(l, 'متأخر', 'Delayed'), blue: T(l, 'تعبئة', 'Mobilizing') }[p[8]]}</Chip>])} /></Card>
  </>
}

function Projects({ l, go, openProject }: { l: Lang; go: (k: string) => void; openProject: (id: string) => void }) {
  const { data, isLoading, isError } = useProjects()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  useEffect(() => { const handler = () => setOpen(true); window.addEventListener('construction:create-project', handler); return () => window.removeEventListener('construction:create-project', handler) }, [])
  const projects = data ? toProjectRows(data.items) : []
  if (isLoading) return <><Head code="PRJ · PORTFOLIO" title={T(l, 'المشاريع', 'Projects')} sub={T(l, 'جميع المشاريع النشطة والمخطط لها', 'All active and planned projects')} /><LoadingState>{T(l, 'جارٍ تحميل المشاريع…', 'Loading projects…')}</LoadingState></>
  if (isError) return <><Head code="PRJ · PORTFOLIO" title={T(l, 'المشاريع', 'Projects')} sub={T(l, 'جميع المشاريع النشطة والمخطط لها', 'All active and planned projects')} /><ErrorState>{T(l, 'تعذر تحميل المشاريع.', 'Unable to load projects.')}</ErrorState></>
  if (!projects.length) return <><Head code="PRJ · PORTFOLIO" title={T(l, 'المشاريع', 'Projects')} sub={T(l, 'جميع المشاريع النشطة والمخطط لها', 'All active and planned projects')} /><EmptyState>{T(l, 'لا توجد مشاريع.', 'No projects found.')}</EmptyState></>
  return <>
    {open && <Card className="mb-4" title={T(l, 'إنشاء مشروع', 'Create project')}><form className="grid grid-cols-3 gap-2 p-4" onSubmit={async (event) => { event.preventDefault(); if (saving) return; setSaving(true); try { const form = new FormData(event.currentTarget); const project = await createProject({ code: form.get('code'), name: form.get('name'), clientName: form.get('clientName'), location: form.get('location'), contractValue: Number(form.get('contractValue') || 0), budgetValue: Number(form.get('budgetValue') || 0), startDate: form.get('startDate') || undefined, plannedEndDate: form.get('plannedEndDate') || undefined, status: form.get('status') || 'PLANNING' }); setOpen(false); void queryClient.invalidateQueries({ queryKey: ['projects'] }); openProject(project.id) } finally { setSaving(false) } }}><CoreField l={l} name="code" placeholder="Code" /><CoreField l={l} name="name" placeholder="Project name" /><CoreField l={l} name="clientName" placeholder="Client name" /><CoreField l={l} name="location" placeholder="Location" /><CoreField l={l} name="contractValue" placeholder="Contract value" type="number" /><CoreField l={l} name="budgetValue" placeholder="Budget value" type="number" /><CoreField l={l} name="startDate" placeholder="Start date" type="date" /><CoreField l={l} name="plannedEndDate" placeholder="Planned end date" type="date" /><select name="status" defaultValue="PLANNING" className="h-9 rounded-lg border border-line px-3 text-[13px]"><option value="PLANNING">Planning</option><option value="ACTIVE">Active</option><option value="ON_HOLD">On hold</option></select><div className="col-span-3 flex justify-end"><Btn primary type="submit" disabled={saving}>{saving ? 'Saving…' : T(l, 'حفظ المشروع', 'Save project')}</Btn></div></form></Card>}
    <Head code="PRJ · PORTFOLIO" title={T(l, 'المشاريع', 'Projects')} sub={T(l, 'جميع المشاريع النشطة والمخطط لها', 'All active and planned projects')} actions={<Btn primary onClick={() => setOpen(true)}>{T(l, '+ مشروع جديد', '+ New project')}</Btn>} />
    <div className="grid grid-cols-3 gap-4">{projects.map((p) => (
      <button key={p[0]} onClick={() => openProject(p[9])} className="card corner overflow-hidden text-start transition hover:-translate-y-0.5 hover:shadow-lg">
        <div className="blueprint relative h-24 bg-navy p-4 text-white"><span className="num text-[11px] text-amber2">{p[0]}</span>
          <svg className="absolute bottom-0 end-4 h-20 opacity-40" viewBox="0 0 80 80" fill="none" stroke="#f3a54a"><path d="M10 80V30h20v50M30 80V10h25v70M55 80V40h15v40" /><path d="M35 20h15M35 30h15M35 40h15M35 50h15" strokeDasharray="2 3" /></svg></div>
        <div className="p-5"><h3 className="font-semibold">{l === 'ar' ? p[1] : p[2]}</h3><p className="text-[12px] text-steel">{l === 'ar' ? p[3] : p[4]} · <span className="num">SAR {p[5]}M</span></p>
          <div className="mt-4 space-y-2 text-[12px]"><div className="flex justify-between"><span className="text-steel">{T(l, 'الإنجاز', 'Progress')}</span><span className="num">{p[6]}%</span></div><Bar v={p[6]} c="bg-navy" />
            <div className="flex justify-between pt-1"><span className="text-steel">{T(l, 'الصرف', 'Spent')}</span><span className="num">{p[7]}%</span></div><Bar v={p[7]} /></div></div>
      </button>))}</div>
  </>
}

function ProjectDash({ l }: { l: Lang }) {
  const { selectedProjectId } = useProjectContext()
  const navigate = useNavigate()
  const { data: project } = useProject(selectedProjectId)
  const { data: budget } = useBudget(selectedProjectId)
  const { data: progressUpdates, isLoading: isProgressLoading } = useProgress(selectedProjectId)
  const contractValue = project?.contractValue ? `${(Number(project.contractValue) / 1_000_000).toFixed(1)}M` : '—'
  const progress = project?.progressPercent ?? '—'
  const recentProgress = Array.isArray(progressUpdates) ? progressUpdates.slice(0, 4) : []
  return <>
    <Head code={project?.code ?? 'PRJ'} title={project?.name ?? T(l, 'المشروع', 'Project')} sub={`${project?.location ?? '—'} · ${project?.projectManager?.jobTitle ?? T(l, 'مدير المشروع', 'Project Manager')}: ${project?.projectManager?.name ?? '—'} · ${localizeStatus(l, project?.status ?? '—')} · ${project?.plannedEndDate ? new Date(project.plannedEndDate).toLocaleDateString() : '—'}`} actions={<><Btn onClick={() => navigate('/documents')}>{T(l, 'المستندات', 'Documents')}</Btn><Btn primary onClick={() => navigate('/reports')}>{T(l, 'تقرير أسبوعي', 'Weekly report')}</Btn></>} />
    <div className="grid grid-cols-5 gap-4">
      <Kpi accent label={T(l, 'قيمة العقد', 'Contract')} value={contractValue} sub="SAR" /><Kpi label={T(l, 'الإنجاز الحالي', 'Current progress')} value={`${progress}%`} sub={T(l, 'من بيانات المشروع', 'From project data')} />
      <Kpi label={T(l, 'التكلفة الفعلية AC', 'Actual cost')} value={budget ? `${(budget.summary.actual / 1_000_000).toFixed(2)}M` : '—'} sub={T(l, 'من الاستلامات والمصروفات المرحلة', 'From posted receipts and expenses')} /><Kpi label={T(l, 'التكلفة الملتزم بها', 'Committed cost')} value={budget ? `${(budget.summary.committed / 1_000_000).toFixed(2)}M` : '—'} sub={T(l, 'من أوامر الشراء', 'From purchase orders')} /><Kpi label={T(l, 'التكلفة المتوقعة', 'Forecast cost')} value={budget ? `${(budget.summary.forecast / 1_000_000).toFixed(2)}M` : '—'} sub={T(l, 'حساب خدمة الميزانية', 'Budget service calculation')} />
    </div>
    <div className="mt-4 grid grid-cols-3 gap-4">
      <Card className="col-span-2" title={T(l, 'أحدث قياسات الإنجاز', 'Recent progress measurements')}>
        <div className="space-y-4 p-5">{isProgressLoading ? <LoadingState>{T(l, 'جارٍ تحميل قياسات الإنجاز…', 'Loading progress measurements…')}</LoadingState> : recentProgress.length ? recentProgress.map((item) => <div key={item.id}><div className="mb-1.5 flex justify-between text-[13px]"><span>{item.notes || T(l, 'تحديث إنجاز', 'Progress update')}</span><span className="num text-steel">{item.progressPercent}%</span></div><Bar v={Number(item.progressPercent)} c="bg-navy" /><div className="mt-1 text-[11px] text-steel">{new Date(item.measuredDate).toLocaleDateString()}</div></div>) : <EmptyState>{T(l, 'لا توجد قياسات إنجاز مسجلة لعرضها.', 'No persisted progress measurements are available yet.')}</EmptyState>}</div></Card>
      <Card title={T(l, 'ملخص الإنجاز', 'Progress summary')}><div className="p-5 text-[13px] text-steel">{recentProgress.length ? T(l, 'تُعرض القياسات المحفوظة أعلاه. تتطلب المعالم الزمنية بيانات أنشطة مجدولة.', 'Persisted measurements are shown alongside. Scheduled milestone tracking requires scheduled activity data.') : T(l, 'لم تُسجل قياسات إنجاز بعد.', 'No progress measurements have been recorded yet.')}</div></Card>
    </div>
  </>
}

function LiveSupplierDetail({ l }: { l: Lang }) {
  const { supplierId } = useParams<{ supplierId: string }>()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const { data: supplier, isLoading, isError } = useQuery({ queryKey: ['supplier', supplierId], queryFn: () => getSupplier(supplierId!), enabled: Boolean(supplierId) })
  if (isLoading) return <LoadingState>{T(l, 'جارٍ تحميل المورد…', 'Loading supplier…')}</LoadingState>
  if (isError || !supplier) return <ErrorState>{T(l, 'تعذر تحميل المورد.', 'Unable to load supplier.')}</ErrorState>
  return <><Head code={supplier.code} title={supplier.name} sub={`${supplier.category ?? T(l, 'مورد', 'Supplier')} · ${localizeStatus(l, supplier.status)}`} actions={<Btn onClick={() => setEditing(!editing)}>{T(l, 'تعديل', 'Edit')}</Btn>} />{editing && <Card className="mb-4" title={T(l, 'تعديل المورد', 'Edit supplier')}><form className="grid grid-cols-4 gap-2 p-4" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await updateSupplier(supplier.id, { code: form.get('code'), name: form.get('name'), category: form.get('category'), city: form.get('city'), status: form.get('status') }); setEditing(false); void queryClient.invalidateQueries({ queryKey: ['supplier', supplierId] }); void queryClient.invalidateQueries({ queryKey: ['suppliers'] }) }}><CoreField l={l} name="code" placeholder="Code" /><CoreField l={l} name="name" placeholder="Supplier name" /><CoreField l={l} name="category" placeholder="Category" /><CoreField l={l} name="city" placeholder="City" /><select name="status" defaultValue={supplier.status} className="h-9 rounded-lg border border-line px-3 text-[13px]"><option value="ACTIVE">{T(l, 'نشط', 'Active')}</option><option value="INACTIVE">{T(l, 'غير نشط', 'Inactive')}</option></select><div className="col-span-4 flex justify-end"><Btn primary>{T(l, 'حفظ المورد', 'Save supplier')}</Btn></div></form></Card>}<div className="grid grid-cols-3 gap-4"><Kpi accent label={T(l, 'المورد', 'Supplier')} value={supplier.name} sub={supplier.code} /><Kpi label={T(l, 'الفئة', 'Category')} value={supplier.category ?? '—'} sub={supplier.city ?? '—'} /><Kpi label={T(l, 'الحالة', 'Status')} value={localizeStatus(l, supplier.status)} sub={T(l, 'بيانات مورد فعلية', 'Live supplier record')} /></div></>
}

/* function LiveMRDetailComplete({ l }: { l: Lang }) {
  const { requestId } = useParams<{ requestId: string }>()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const { data: request, isLoading, isError } = useQuery({ queryKey: ['material-request', requestId], queryFn: () => getMaterialRequest(requestId!), enabled: Boolean(requestId) })
  const { data: approvals } = useApprovals()
  const approval = approvals?.find((item) => item.entityId === requestId && item.status === 'PENDING')
  if (isLoading) return <LoadingState>{T(l, 'جارٍ تحميل طلب المواد…', 'Loading material request…')}</LoadingState>
  if (isError || !request) return <ErrorState>{T(l, 'تعذر تحميل طلب المواد.', 'Unable to load material request.')}</ErrorState>
  const refresh = () => { void queryClient.invalidateQueries({ queryKey: ['material-request', requestId] }); void queryClient.invalidateQueries({ queryKey: ['approvals'] }) }
  return <><Head code={request.requestNumber} title={request.purpose ?? T(l, 'طلب مواد', 'Material request')} sub={`${request.projectId} · ${localizeStatus(l, request.status)}`} actions={<div className="flex gap-2">{request.status === 'DRAFT' && <><Btn onClick={() => setEditing(!editing)}>{T(l, 'تعديل', 'Edit')}</Btn><Btn primary onClick={async () => { await submitMaterialRequest(request.id); refresh() }}>{T(l, 'إرسال', 'Submit')}</Btn></>}{approval && <><Btn onClick={async () => { await rejectApproval(approval.id); refresh() }}>{T(l, 'رفض', 'Reject')}</Btn><Btn primary onClick={async () => { await approveApproval(approval.id); refresh() }}>{T(l, 'اعتماد', 'Approve')}</Btn>}</div>} />{editing && <Card className="mb-4" title={T(l, 'تعديل الطلب المسودة', 'Edit draft request')}><form className="grid grid-cols-4 gap-2 p-4" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await updateMaterialRequest(request.id, { purpose: form.get('purpose'), items: request.items.map((item) => ({ description: item.description, unit: item.unit, requestedQuantity: Number(item.requestedQuantity) })) }); setEditing(false); refresh() }}><CoreField l={l} name="purpose" placeholder="Purpose" /><div className="col-span-4 flex justify-end"><Btn primary>{T(l, 'حفظ المسودة', 'Save draft')}</Btn></div></form></Card>}<Card className="mb-4 px-6 py-5"><Steps at={request.status === 'APPROVED' ? 3 : request.status === 'PENDING_APPROVAL' ? 2 : 1} steps={[T(l, 'إنشاء', 'Created'), T(l, 'إرسال', 'Submitted'), T(l, 'اعتماد مدير المشروع', 'PM approval'), T(l, 'المشتريات', 'Procurement'), 'PO']} /></Card><Card title={T(l, 'البنود', 'Line items')}><Table cols={[T(l, 'الوصف', 'Description'), T(l, 'الوحدة', 'Unit'), T(l, 'الكمية', 'Quantity')]} rows={request.items.map((item) => [item.description, item.unit, item.requestedQuantity])} /></Card></>
 }
*/

function LiveMRDetailComplete({ l }: { l: Lang }) {
  const { requestId } = useParams<{ requestId: string }>()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const { data: request, isLoading, isError } = useQuery({ queryKey: ['material-request', requestId], queryFn: () => getMaterialRequest(requestId!), enabled: Boolean(requestId) })
  const { data: approvals } = useApprovals()
  const approval = approvals?.find((item) => item.entityId === requestId && item.status === 'PENDING')
  if (isLoading) return <LoadingState>{T(l, 'جارٍ تحميل طلب المواد…', 'Loading material request…')}</LoadingState>
  if (isError || !request) return <ErrorState>{T(l, 'تعذر تحميل طلب المواد.', 'Unable to load material request.')}</ErrorState>
  const refresh = () => { void queryClient.invalidateQueries({ queryKey: ['material-request', requestId] }); void queryClient.invalidateQueries({ queryKey: ['approvals'] }) }
  return <><Head code={request.requestNumber} title={request.purpose ?? T(l, 'طلب مواد', 'Material request')} sub={`${request.projectId} · ${localizeStatus(l, request.status)}`} actions={<div className="flex gap-2">{request.status === 'DRAFT' && <><Btn onClick={() => setEditing(!editing)}>{T(l, 'تعديل', 'Edit')}</Btn><Btn primary onClick={async () => { await submitMaterialRequest(request.id); refresh() }}>{T(l, 'إرسال', 'Submit')}</Btn></>}{approval && <><Btn onClick={async () => { await rejectApproval(approval.id); refresh() }}>{T(l, 'رفض', 'Reject')}</Btn><Btn primary onClick={async () => { await approveApproval(approval.id); refresh() }}>{T(l, 'اعتماد', 'Approve')}</Btn></>}</div>} />{editing && <Card className="mb-4" title={T(l, 'تعديل الطلب المسودة', 'Edit draft request')}><form className="grid grid-cols-4 gap-2 p-4" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await updateMaterialRequest(request.id, { purpose: form.get('purpose'), items: request.items.map((item) => ({ description: item.description, unit: item.unit, requestedQuantity: Number(item.requestedQuantity) })) }); setEditing(false); refresh() }}><CoreField l={l} name="purpose" placeholder="Purpose" /><div className="col-span-4 flex justify-end"><Btn primary>{T(l, 'حفظ المسودة', 'Save draft')}</Btn></div></form></Card>}<Card className="mb-4 px-6 py-5"><Steps at={request.status === 'APPROVED' ? 3 : request.status === 'PENDING_APPROVAL' ? 2 : 1} steps={[T(l, 'إنشاء', 'Created'), T(l, 'إرسال', 'Submitted'), T(l, 'اعتماد مدير المشروع', 'PM approval'), T(l, 'المشتريات', 'Procurement'), T(l, 'أمر شراء', 'PO')]} /></Card><Card title={T(l, 'البنود', 'Line items')}><Table cols={[T(l, 'الوصف', 'Description'), T(l, 'الوحدة', 'Unit'), T(l, 'الكمية', 'Quantity')]} rows={request.items.map((item) => [item.description, item.unit, item.requestedQuantity])} /></Card></>
}

function LiveMRDetail({ l }: { l: Lang }) {
  const { requestId } = useParams<{ requestId: string }>()
  const queryClient = useQueryClient()
  const { data: request, isLoading, isError } = useQuery({ queryKey: ['material-request', requestId], queryFn: () => getMaterialRequest(requestId!), enabled: Boolean(requestId) })
  const { data: approvals } = useApprovals()
  const approval = approvals?.find((item) => item.entityId === requestId && item.status === 'PENDING')
  if (isLoading) return <LoadingState>Loading material request…</LoadingState>
  if (isError || !request) return <ErrorState>Unable to load material request.</ErrorState>
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['material-request', requestId] })
  return <><Head code={request.requestNumber} title={request.purpose ?? T(l, 'طلب مواد', 'Material request')} sub={`${request.projectId} · ${request.status}`} actions={<div className="flex gap-2">{request.status === 'DRAFT' && <Btn primary onClick={async () => { await submitMaterialRequest(request.id); refresh() }}>Submit</Btn>}{approval && <><Btn onClick={async () => { await rejectApproval(approval.id, undefined); refresh() }}>Reject</Btn><Btn primary onClick={async () => { await approveApproval(approval.id, undefined); refresh() }}>Approve</Btn></>}</div>} /><Card className="mb-4 px-6 py-5"><Steps at={request.status === 'APPROVED' ? 3 : request.status === 'PENDING_APPROVAL' ? 2 : 1} steps={['Created', 'Submitted', 'PM approval', 'Procurement', 'PO']} /></Card><Card title="Line items"><Table cols={['Description', 'Unit', 'Quantity']} rows={request.items.map((item) => [item.description, item.unit, item.requestedQuantity])} /></Card></>
}

function RfqInvitations({ l = currentLanguage, rfqId, invitations, status, queryClient }: { l?: Lang; rfqId: string; invitations: any[]; status: string; queryClient: ReturnType<typeof useQueryClient> }) {
  const { data } = useSuppliers()
  const invited = new Set(invitations.map((item) => item.supplierId))
  return <Card className="mb-4" title={T(l, 'دعوات الموردين', 'Supplier invitations')}><div className="grid grid-cols-2 gap-2 p-4">{(data?.items ?? []).map((supplier) => <label key={supplier.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[12px]"><span>{supplier.name}</span>{invited.has(supplier.id) ? <span className="flex items-center gap-2"><Chip t="green">{T(l, 'تمت الدعوة', 'Invited')}</Chip>{status === 'DRAFT' && <button type="button" className="text-red-600" onClick={async () => { await removeRfqSupplier(rfqId, supplier.id); void queryClient.invalidateQueries({ queryKey: ['comparison', rfqId] }) }}>{T(l, 'إزالة', 'Remove')}</button>}</span> : status === 'DRAFT' ? <button type="button" className="text-amber" onClick={async () => { await inviteRfqSupplier(rfqId, supplier.id); void queryClient.invalidateQueries({ queryKey: ['comparison', rfqId] }) }}>{T(l, 'إضافة', 'Add')}</button> : <span className="text-steel">{T(l, 'غير مدعو', 'Not invited')}</span>}</label>)}</div></Card>
}

function MRDetail({ l }: { l: Lang }) {
  return <>
    <Head code="MR-2407-0318" title={T(l, 'طلب مواد: حديد تسليح للطابق ٢٥', 'Material request: Rebar for Level 25')} sub={T(l, 'برج الريم · مقدم من م. سامر حداد · ١٤ أغسطس ٢٠٢٥', 'Al Reem · by Eng. Samer Haddad · 14 Aug 2025')} actions={<><Btn>{T(l, 'رفض', 'Reject')}</Btn><Btn primary>{T(l, 'اعتماد وتحويل لطلب تسعير', 'Approve → RFQ')}</Btn></>} />
    <Card className="mb-4 px-6 py-5"><Steps at={2} steps={[T(l, 'إنشاء', 'Created'), T(l, 'مراجعة الموقع', 'Site review'), T(l, 'اعتماد مدير المشروع', 'PM approval'), T(l, 'طلب تسعير', 'RFQ'), T(l, 'أمر شراء', 'PO')]} /></Card>
    <div className="grid grid-cols-3 gap-4">
      <Card className="col-span-2" title={T(l, 'البنود', 'Line items')}>
        <Table cols={[T(l, 'بند BOQ', 'BOQ ref'), T(l, 'الوصف', 'Description'), T(l, 'الكمية', 'Qty'), T(l, 'الوحدة', 'Unit'), T(l, 'المتبقي بالميزانية', 'Budget left')]} rows={[
          ['03.21.04', T(l, 'حديد تسليح Ø16 درجة 60', 'Rebar Ø16 Grade 60'), '42.0', T(l, 'طن', 'ton'), <Chip t="green">78%</Chip>],
          ['03.21.05', T(l, 'حديد تسليح Ø12 درجة 60', 'Rebar Ø12 Grade 60'), '18.5', T(l, 'طن', 'ton'), <Chip t="amber">22%</Chip>],
          ['03.22.01', T(l, 'أسلاك ربط مجلفنة', 'Galvanized tie wire'), '600', T(l, 'كغ', 'kg'), <Chip t="green">64%</Chip>]].map((r) => r.map((c, i) => i === 0 || i === 2 ? <span className="num">{c}</span> : c))} /></Card>
      <Card title={T(l, 'سجل الاعتماد', 'Approval trail')}><ul className="space-y-4 p-5 text-[13px]">{[
        [T(l, 'سامر حداد', 'Samer Haddad'), T(l, 'أنشأ الطلب', 'Created request'), '09:12'], [T(l, 'فهد القحطاني', 'Fahad Al-Qahtani'), T(l, 'اعتمد — مهندس الموقع', 'Approved — Site Eng.'), '11:40'], [T(l, 'خالد العتيبي', 'Khalid Al-Otaibi'), T(l, 'بانتظار الاعتماد', 'Awaiting approval'), '—']].map(([n, a, t], i) =>
        <li key={n} className="flex gap-3"><span className={`grid size-8 place-items-center rounded-full text-[12px] text-white ${i < 2 ? 'bg-navy' : 'bg-amber'}`}>{n[0]}</span><div className="flex-1"><b className="font-medium">{n}</b><div className="text-[12px] text-steel">{a}</div></div><span className="num text-[11px] text-steel">{t}</span></li>)}</ul></Card>
    </div>
  </>
}

function LegacyLiveCompare({ l }: { l: Lang }) {
  const { rfqId } = useParams<{ rfqId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [quoteOpen, setQuoteOpen] = useState(false)
  const { data, isLoading, isError } = useQuery({ queryKey: ['comparison', rfqId], queryFn: () => getComparison(rfqId!), enabled: Boolean(rfqId) })
  const { data: suppliers } = useSuppliers()
  const supplierName = (id: string) => suppliers?.items.find((supplier) => supplier.id === id)?.name ?? id
  if (isLoading) return <LoadingState>{T(l, 'جارٍ تحميل مقارنة العروض…', 'Loading quote comparison…')}</LoadingState>
  if (isError || !data) return <ErrorState>{T(l, 'تعذر تحميل مقارنة العروض.', 'Unable to load quote comparison.')}</ErrorState>
  return <><Head code="RFQ · COMPARISON" title={T(l, 'مقارنة عروض الأسعار', 'Quote comparison')} sub={`${data.quotes.length} ${T(l, 'عروض موردين', 'supplier quotes')}`} actions={<div className="flex gap-2">{data.rfq.status === 'DRAFT' && <Btn onClick={async () => { await issueRfq(rfqId!); void queryClient.invalidateQueries({ queryKey: ['comparison', rfqId] }) }}>{T(l, 'إصدار الطلب', 'Issue RFQ')}</Btn>}<Btn onClick={() => setQuoteOpen(!quoteOpen)}>{T(l, '+ إضافة عرض', '+ Add quote')}</Btn></div>} /><RfqInvitations rfqId={rfqId!} invitations={data.rfq.invitations} status={data.rfq.status} queryClient={queryClient} />{quoteOpen && <Card className="mb-4"><form className="space-y-3 p-5" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const items = data.items.map((item) => ({ rfqItemId: item.id, quantity: Number(item.quantity), unitRate: Number(form.get(`rate-${item.id}`)) })); await createQuote(rfqId!, { supplierId: String(form.get('supplierId')), quoteNumber: form.get('quoteNumber'), quoteDate: form.get('quoteDate'), validUntil: form.get('validUntil'), deliveryDays: Number(form.get('deliveryDays')), paymentTerms: form.get('paymentTerms'), taxRate: Number(form.get('taxRate') ?? 0), items }); setQuoteOpen(false); void queryClient.invalidateQueries({ queryKey: ['comparison', rfqId] }) }}><div className="grid grid-cols-3 gap-2"><select name="supplierId" required className="h-9 rounded-lg border border-line px-3 text-[13px]">{data.rfq.invitations.map((inv: any) => <option key={inv.supplierId} value={inv.supplierId}>{inv.supplierId}</option>)}</select><CoreField l={l} name="quoteNumber" placeholder="Quote number" /><CoreField l={l} name="quoteDate" placeholder="Quote date" type="date" /><CoreField l={l} name="validUntil" placeholder="Valid until" type="date" /><CoreField l={l} name="deliveryDays" placeholder="Delivery days" type="number" /><CoreField l={l} name="taxRate" placeholder="Tax %" type="number" /></div><input name="paymentTerms" placeholder={T(l, 'شروط الدفع', 'Payment terms')} className="h-9 w-full rounded-lg border border-line px-3 text-[13px]" />{data.items.map((item: any) => <div key={item.id} className="grid grid-cols-3 gap-2 text-[13px]"><span>{item.description} · {item.quantity} {item.unit}</span><CoreField l={l} name={`rate-${item.id}`} placeholder="Unit rate" type="number" /></div>)}<Btn primary>{T(l, 'حفظ العرض', 'Save quote')}</Btn></form></Card>}<div className="grid grid-cols-3 gap-4">{data.quotes.map((quote) => <Card key={quote.id} className={quote.status === 'AWARDED' ? 'corner ring-2 ring-amber' : ''}><div className="flex items-center justify-between"><h3 className="font-semibold">{quote.supplierId}</h3><Chip t={quote.status === 'AWARDED' ? 'green' : 'blue'}>{localizeStatus(l, quote.status)}</Chip></div><div className="num mt-4 text-[28px]">{sar(Number(quote.totalAmount))}</div><div className="text-[12px] text-steel">SAR · {quote.deliveryDays ?? '—'} {T(l, 'يوماً', 'days')}</div>{quote.status !== 'AWARDED' && <Btn primary onClick={async () => { await awardRfq(rfqId!, quote.id); void queryClient.invalidateQueries({ queryKey: ['comparison', rfqId] }) }}>{T(l, 'ترسية', 'Award')}</Btn>}</Card>)}</div>{data.quotes.some((quote) => quote.status === 'AWARDED') && <div className="mt-4"><Btn primary onClick={async () => { const po = await createPurchaseOrder(rfqId!); navigate(`/purchase-orders/${po.id}`) }}>{T(l, 'إنشاء أمر شراء', 'Create purchase order')}</Btn></div>}</>
}

function LiveCompare({ l }: { l: Lang }) {
  const { rfqId } = useParams<{ rfqId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const comparison = useQuery({ queryKey: ['comparison', rfqId], queryFn: () => getComparison(rfqId!), enabled: Boolean(rfqId) })
  const suppliers = useSuppliers()
  if (comparison.isLoading) return <LoadingState>{T(l, 'جارٍ تحميل مقارنة العروض…', 'Loading quote comparison…')}</LoadingState>
  if (comparison.isError || !comparison.data) return <ErrorState>{T(l, 'تعذر تحميل مقارنة العروض.', 'Unable to load quote comparison.')}</ErrorState>
  const data = comparison.data
  const supplierName = (id: string) => suppliers.data?.items.find((supplier) => supplier.id === id)?.name ?? id
  const refresh = () => { void queryClient.invalidateQueries({ queryKey: ['comparison', rfqId] }); void queryClient.invalidateQueries({ queryKey: ['rfqs', data.rfq.projectId] }); void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }) }
  return <><Head code={data.rfq.rfqNumber} title={T(l, 'مقارنة عروض الأسعار', 'Quote comparison')} sub={`${data.quotes.length} ${T(l, 'عروض موردين', 'supplier quotes')}`} actions={<div className="flex gap-2">{data.rfq.status === 'DRAFT' && <Btn onClick={async () => { await issueRfq(rfqId!); refresh() }}>{T(l, 'إصدار الطلب', 'Issue RFQ')}</Btn>}{['OPEN', 'QUOTES_RECEIVED', 'EVALUATION'].includes(data.rfq.status) && <Btn primary onClick={() => setQuoteOpen((value) => !value)}>{T(l, '+ إضافة عرض', '+ Add quote')}</Btn>}</div>} />
    <RfqInvitations rfqId={rfqId!} invitations={data.rfq.invitations} status={data.rfq.status} queryClient={queryClient} />
    {quoteOpen && <Card className="mb-4" title={T(l, 'إدخال عرض مورد', 'Enter supplier quote')}><form className="space-y-3 p-5" onSubmit={async (event) => { event.preventDefault(); if (saving) return; const form = new FormData(event.currentTarget); setSaving(true); try { await createQuote(rfqId!, { supplierId: String(form.get('supplierId')), quoteNumber: form.get('quoteNumber'), quoteDate: form.get('quoteDate'), validUntil: form.get('validUntil'), deliveryDays: Number(form.get('deliveryDays') || 0), paymentTerms: form.get('paymentTerms'), taxRate: Number(form.get('taxRate') || 0), items: data.items.map((item: any) => ({ rfqItemId: item.id, quantity: Number(item.quantity), unitRate: Number(form.get(`rate-${item.id}`) || 0) })) }); setQuoteOpen(false); refresh() } finally { setSaving(false) } }}><div className="grid grid-cols-3 gap-2"><select name="supplierId" required className="h-9 rounded-lg border border-line bg-white px-3 text-[13px]"><option value="">{T(l, 'اختر المورد', 'Select supplier')}</option>{data.rfq.invitations.map((inv: any) => <option key={inv.supplierId} value={inv.supplierId}>{supplierName(inv.supplierId)}</option>)}</select><CoreField l={l} name="quoteNumber" placeholder="Quote number" /><CoreField l={l} name="quoteDate" placeholder="Quote date" type="date" /><CoreField l={l} name="validUntil" placeholder="Valid until" type="date" /><CoreField l={l} name="deliveryDays" placeholder="Delivery days" type="number" /><CoreField l={l} name="taxRate" placeholder="Tax %" type="number" /></div><input name="paymentTerms" placeholder={T(l, 'شروط الدفع', 'Payment terms')} className="h-9 w-full rounded-lg border border-line bg-white px-3 text-[13px]" />{data.items.map((item: any) => <div key={item.id} className="grid grid-cols-2 gap-2 text-[13px]"><span>{item.description} · {item.quantity} {item.unit}</span><CoreField l={l} name={`rate-${item.id}`} placeholder="Unit rate" type="number" /></div>)}<Btn primary type="submit" disabled={saving}>{saving ? T(l, 'جارٍ الحفظ…', 'Saving…') : T(l, 'حفظ العرض', 'Save quote')}</Btn></form></Card>}
    <div className="grid grid-cols-3 gap-4">{data.quotes.map((quote) => <Card key={quote.id} className={quote.status === 'AWARDED' ? 'corner ring-2 ring-amber' : ''}><div className="flex items-center justify-between"><h3 className="font-semibold">{supplierName(quote.supplierId)}</h3><Chip t={quote.status === 'AWARDED' ? 'green' : 'blue'}>{quote.status}</Chip></div><div className="num mt-4 text-[28px]">{sar(Number(quote.totalAmount))}</div><div className="text-[12px] text-steel">SAR · {quote.deliveryDays ?? '—'} {T(l, 'يوماً', 'days')}</div>{quote.status !== 'AWARDED' && data.rfq.status !== 'AWARDED' && <Btn primary onClick={async () => { await awardRfq(rfqId!, quote.id); refresh() }}>{T(l, 'ترسية', 'Award')}</Btn>}</Card>)}</div>
    {data.quotes.some((quote) => quote.status === 'AWARDED') && <div className="mt-4"><Btn primary onClick={async () => { const po = await createPurchaseOrder(rfqId!); navigate(`/purchase-orders/${po.id}`) }}>{T(l, 'إنشاء أمر شراء', 'Create purchase order')}</Btn></div>}
  </>
}

function Compare({ l }: { l: Lang }) {
  const s = [[T(l, 'حديد الراجحي', 'Al Rajhi Steel'), 2840, 2795, 14, '4.7', true], [T(l, 'الاتفاق للصلب', 'Al Ittefaq Steel'), 2790, 2810, 21, '4.4', false], [T(l, 'سابك للمعادن', 'SABIC Metals'), 2905, 2860, 10, '4.8', false]] as const
  return <>
    <Head code="RFQ-0912 · COMPARISON" title={T(l, 'مقارنة عروض الأسعار', 'Quote comparison')} sub={T(l, 'حديد تسليح · ٣ موردين · الإغلاق ١٨ أغسطس', 'Rebar · 3 suppliers · closes 18 Aug')} actions={<Btn primary>{T(l, 'ترسية وإنشاء أمر شراء', 'Award & create PO')}</Btn>} />
    <div className="grid grid-cols-3 gap-4">{s.map(([n, a, b, d, r, best]) => {
      const tot = a * 42 + b * 18.5
      return <div key={n} className={`card p-5 ${best ? 'corner ring-2 ring-amber' : ''}`}>
        <div className="flex items-center justify-between"><h3 className="font-semibold">{n}</h3>{best && <Chip t="amber">{T(l, 'موصى به', 'Recommended')}</Chip>}</div>
        <div className="num mt-4 text-[28px]">{sar(Math.round(tot))}</div><div className="text-[12px] text-steel">SAR {T(l, 'شامل الضريبة', 'incl. VAT')}</div>
        <dl className="mt-4 grid grid-cols-2 gap-y-2 border-t border-line pt-4 text-[12.5px]">
          <dt className="text-steel">Ø16 / {T(l, 'طن', 'ton')}</dt><dd className="num text-end">{sar(a)}</dd><dt className="text-steel">Ø12 / {T(l, 'طن', 'ton')}</dt><dd className="num text-end">{sar(b)}</dd>
          <dt className="text-steel">{T(l, 'مدة التوريد', 'Lead time')}</dt><dd className="num text-end">{d} {T(l, 'يوم', 'd')}</dd><dt className="text-steel">{T(l, 'تقييم المورد', 'Rating')}</dt><dd className="num text-end">{r} / 5</dd></dl></div>
    })}</div>
  </>
}

function LegacyExpenseDetail({ l }: { l: Lang }) {
  const { expenseId } = useParams<{ expenseId: string }>()
  const queryClient = useQueryClient()
  const { data: expense, isLoading, isError } = useQuery({ queryKey: ['expense', expenseId], queryFn: () => getExpense(expenseId!), enabled: Boolean(expenseId) })
  const { data: approvals } = useApprovals()
  const approval = approvals?.find((item) => item.entityId === expenseId && item.status === 'PENDING')
  if (isLoading) return <LoadingState>{T(l, 'جارٍ تحميل المصروف…', 'Loading expense…')}</LoadingState>
  if (isError || !expense) return <ErrorState>{T(l, 'تعذر تحميل المصروف.', 'Unable to load expense.')}</ErrorState>
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['expense', expenseId] })
  return <><Head code={expense.expenseNumber} title={expense.description} sub={`${expense.projectId} · ${expense.status}`} actions={<div className="flex gap-2">{expense.status === 'DRAFT' && <Btn primary onClick={async () => { await submitExpense(expense.id); refresh() }}>Submit</Btn>}{approval && <><Btn onClick={async () => { await rejectApproval(approval.id); refresh() }}>Reject</Btn><Btn primary onClick={async () => { await approveApproval(approval.id); refresh() }}>Approve</Btn></>}{expense.status === 'APPROVED' && <Btn primary onClick={async () => { await postExpense(expense.id); refresh() }}>Post</Btn>}</div>} /><div className="grid grid-cols-4 gap-4"><Kpi accent label="Amount" value={sar(Number(expense.amount))} sub="SAR" /><Kpi label="Category" value={expense.category} sub="" /><Kpi label="Date" value={new Date(expense.expenseDate).toLocaleDateString()} sub="" /><Kpi label="Status" value={expense.status} sub="" /></div></>
}

function LiveExpenseDetail({ l }: { l: Lang }) {
  const { expenseId } = useParams<{ expenseId: string }>()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const { data: expense, isLoading, isError } = useQuery({ queryKey: ['expense', expenseId], queryFn: () => getExpense(expenseId!), enabled: Boolean(expenseId) })
  const { data: approvals } = useApprovals()
  const approval = approvals?.find((item) => item.entityId === expenseId && item.status === 'PENDING')
  if (isLoading) return <LoadingState>{T(l, 'جارٍ تحميل المصروف…', 'Loading expense…')}</LoadingState>
  if (isError || !expense) return <ErrorState>{T(l, 'تعذر تحميل المصروف.', 'Unable to load expense.')}</ErrorState>
  const refresh = () => { void queryClient.invalidateQueries({ queryKey: ['expense', expenseId] }); void queryClient.invalidateQueries({ queryKey: ['approvals'] }) }
  return <><Head code={expense.expenseNumber} title={expense.description} sub={`${expense.projectId} · ${expense.status}`} actions={<div className="flex gap-2">{expense.status === 'DRAFT' && <><Btn onClick={() => setEditOpen(!editOpen)}>Edit</Btn><Btn primary onClick={async () => { await submitExpense(expense.id); refresh() }}>Submit</Btn></>}{approval && <><Btn onClick={async () => { await rejectApproval(approval.id); refresh() }}>Reject</Btn><Btn primary onClick={async () => { await approveApproval(approval.id); refresh() }}>Approve</Btn></>}{expense.status === 'APPROVED' && <Btn primary onClick={async () => { await postExpense(expense.id); refresh() }}>Post</Btn>}</div>} />{editOpen && <Card className="mb-4" title="Edit draft expense"><form className="grid grid-cols-3 gap-2 p-5" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await updateExpense(expense.id, { category: form.get('category'), description: form.get('description'), amount: Number(form.get('amount')), taxAmount: Number(form.get('taxAmount')), expenseDate: form.get('expenseDate'), payee: form.get('payee') }); setEditOpen(false); refresh() }}><CoreField name="category" placeholder="Category" /><CoreField name="description" placeholder="Description" /><CoreField name="amount" placeholder="Amount" type="number" /><CoreField name="taxAmount" placeholder="Tax" type="number" /><CoreField name="expenseDate" placeholder="Date" type="date" /><CoreField name="payee" placeholder="Vendor / payee" /><div className="col-span-3 flex justify-end"><Btn primary>Save draft</Btn></div></form></Card>}<div className="grid grid-cols-4 gap-4"><Kpi accent label="Amount" value={sar(Number(expense.amount))} sub="SAR" /><Kpi label="Category" value={expense.category} sub="" /><Kpi label="Date" value={new Date(expense.expenseDate).toLocaleDateString()} sub="" /><Kpi label="Status" value={expense.status} sub="" /></div></>
}

function LegacyLivePODetail({ l }: { l: Lang }) {
  const { purchaseOrderId } = useParams<{ purchaseOrderId: string }>()
  const queryClient = useQueryClient()
  const [receiptOpen, setReceiptOpen] = useState(false)
  const { data: po, isLoading, isError } = useQuery({ queryKey: ['purchase-order', purchaseOrderId], queryFn: () => getPurchaseOrder(purchaseOrderId!), enabled: Boolean(purchaseOrderId) })
  const { data: project } = useProject(po?.projectId)
  const { data: approvals } = useApprovals()
  const approval = approvals?.find((item) => item.entityId === purchaseOrderId && item.status === 'PENDING')
  if (isLoading) return <LoadingState>{T(l, 'جارٍ تحميل أمر الشراء…', 'Loading purchase order…')}</LoadingState>
  if (isError || !po) return <ErrorState>{T(l, 'تعذر تحميل أمر الشراء.', 'Unable to load purchase order.')}</ErrorState>
  const refresh = () => { void queryClient.invalidateQueries({ queryKey: ['purchase-order', purchaseOrderId] }); void queryClient.invalidateQueries({ queryKey: ['approvals'] }) }
  return <><Head code={po.poNumber} title={T(l, 'أمر الشراء', 'Purchase order')} sub={`${po.projectId} · ${po.status}`} actions={<div className="flex gap-2">{po.status === 'DRAFT' && <Btn primary onClick={async () => { await submitPurchaseOrder(po.id); refresh() }}>Submit</Btn>}{approval && <><Btn onClick={async () => { await rejectApproval(approval.id); refresh() }}>Reject</Btn><Btn primary onClick={async () => { await approveApproval(approval.id); refresh() }}>Approve</Btn></>}{po.status === 'APPROVED' && <Btn primary onClick={async () => { await issuePurchaseOrder(po.id); refresh() }}>Issue</Btn>}{['ISSUED', 'PARTIALLY_RECEIVED'].includes(po.status) && <Btn primary onClick={() => setReceiptOpen(true)}>Record receipt</Btn>}{po.status === 'RECEIVED' && <Btn onClick={async () => { await closePurchaseOrder(po.id); refresh() }}>Close</Btn>}</div>} />{receiptOpen && <Card className="mb-4" title="Record goods receipt"><form className="space-y-3 p-5" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const items = po.items.map((item: any) => { const received = Number(form.get(`received-${item.id}`) ?? 0); const accepted = Number(form.get(`accepted-${item.id}`) ?? 0); const rejected = Number(form.get(`rejected-${item.id}`) ?? 0); return received > 0 ? { purchaseOrderItemId: item.id, receivedQuantity: received, acceptedQuantity: accepted, rejectedQuantity: rejected } : null }).filter(Boolean); await createReceipt(po.id, { deliveryNoteNumber: form.get('deliveryNoteNumber'), siteId: form.get('siteId') || undefined, notes: form.get('notes'), items }); setReceiptOpen(false); refresh() }}><div className="grid grid-cols-3 gap-2"><CoreField name="deliveryNoteNumber" placeholder="Delivery note number" /><CoreField name="siteId" placeholder="Site ID (optional)" /><CoreField name="notes" placeholder="Notes" /></div>{po.items.map((item: any) => <div key={item.id} className="grid grid-cols-5 items-center gap-2 border-b border-line py-2 text-[12px]"><span>{item.description}</span><span>Remaining: {Number(item.orderedQuantity) - Number(item.receivedQuantity)}</span><CoreField name={`received-${item.id}`} placeholder="Received" type="number" /><CoreField name={`accepted-${item.id}`} placeholder="Accepted" type="number" /><CoreField name={`rejected-${item.id}`} placeholder="Rejected" type="number" /></div>)}<div className="flex justify-end gap-2"><Btn onClick={() => setReceiptOpen(false)}>Cancel</Btn><Btn primary>Post receipt</Btn></div></form></Card>}<Card className="mb-4"><Steps at={po.status === 'RECEIVED' ? 4 : po.status === 'PARTIALLY_RECEIVED' ? 3 : po.status === 'ISSUED' ? 2 : po.status === 'APPROVED' ? 1 : 0} steps={['Draft', 'Approved', 'Issued', 'Receiving', 'Received']} /></Card><Card title="Purchase order items"><Table cols={['Description', 'Unit', 'Ordered', 'Received', 'Rate', 'Amount']} rows={po.items.map((item: any) => [item.description, item.unit, item.orderedQuantity, item.receivedQuantity, item.unitRate, item.lineTotal])} /></Card><div className="mt-4 grid grid-cols-3 gap-4"><Kpi accent label="PO total" value={sar(Number(po.totalAmount))} sub={po.currency} /><Kpi label="Subtotal" value={sar(Number(po.subtotal))} sub={po.currency} /><Kpi label="Tax" value={sar(Number(po.taxAmount))} sub={po.currency} /></div></>
}

function LivePODetail({ l }: { l: Lang }) {
  const { purchaseOrderId } = useParams<{ purchaseOrderId: string }>()
  const queryClient = useQueryClient()
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [posting, setPosting] = useState(false)
  const poQuery = useQuery({ queryKey: ['purchase-order', purchaseOrderId], queryFn: () => getPurchaseOrder(purchaseOrderId!), enabled: Boolean(purchaseOrderId) })
  const po = poQuery.data
  const project = useProject(po?.projectId)
  const approvals = useApprovals()
  if (poQuery.isLoading) return <LoadingState>{T(l, 'جارٍ تحميل أمر الشراء…', 'Loading purchase order…')}</LoadingState>
  if (poQuery.isError || !po) return <ErrorState>{T(l, 'تعذر تحميل أمر الشراء.', 'Unable to load purchase order.')}</ErrorState>
  const pendingApproval = approvals.data?.find((item) => item.entityId === po.id && item.status === 'PENDING')
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['purchase-order', po.id] })
    void queryClient.invalidateQueries({ queryKey: ['purchase-orders', po.projectId] })
    void queryClient.invalidateQueries({ queryKey: ['goods-receipts', po.projectId] })
    void queryClient.invalidateQueries({ queryKey: ['approvals'] })
    void queryClient.invalidateQueries({ queryKey: ['budget', po.projectId] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    void queryClient.invalidateQueries({ queryKey: ['reports-summary'] })
  }
  const actions = <div className="flex gap-2">
    {po.status === 'DRAFT' && <Btn primary onClick={async () => { await submitPurchaseOrder(po.id); refresh() }}>{T(l, 'إرسال للاعتماد', 'Submit for approval')}</Btn>}
    {pendingApproval && <><Btn onClick={async () => { await rejectApproval(pendingApproval.id); refresh() }}>{T(l, 'رفض', 'Reject')}</Btn><Btn primary onClick={async () => { await approveApproval(pendingApproval.id); refresh() }}>{T(l, 'اعتماد', 'Approve')}</Btn></>}
    {po.status === 'APPROVED' && <Btn primary onClick={async () => { await issuePurchaseOrder(po.id); refresh() }}>{T(l, 'إصدار', 'Issue')}</Btn>}
    {['ISSUED', 'PARTIALLY_RECEIVED'].includes(po.status) && <Btn primary onClick={() => setReceiptOpen(true)}>{T(l, 'تسجيل استلام', 'Record receipt')}</Btn>}
    {po.status === 'RECEIVED' && <Btn onClick={async () => { await closePurchaseOrder(po.id); refresh() }}>{T(l, 'إغلاق', 'Close')}</Btn>}
  </div>
  return <><Head code={po.poNumber} title={T(l, 'أمر الشراء', 'Purchase order')} sub={`${po.projectId} · ${localizeStatus(l, po.status)}`} actions={actions} />
    {receiptOpen && <Card className="mb-4" title={T(l, 'تسجيل استلام مواد', 'Record goods receipt')}><form className="space-y-3 p-5" onSubmit={async (event) => { event.preventDefault(); if (posting) return; const form = new FormData(event.currentTarget); const items = po.items.map((item: any) => { const receivedQuantity = Number(form.get(`received-${item.id}`) || 0); const acceptedQuantity = Number(form.get(`accepted-${item.id}`) || 0); const rejectedQuantity = Number(form.get(`rejected-${item.id}`) || 0); return receivedQuantity > 0 ? { purchaseOrderItemId: item.id, receivedQuantity, acceptedQuantity, rejectedQuantity } : null }).filter(Boolean); if (!items.length) return; setPosting(true); try { await createReceipt(po.id, { siteId: form.get('siteId') || undefined, deliveryNoteNumber: form.get('deliveryNoteNumber') || undefined, notes: form.get('notes') || undefined, items }); setReceiptOpen(false); refresh() } finally { setPosting(false) } }}>
      <div className="grid grid-cols-3 gap-2"><select name="siteId" className="h-9 rounded-lg border border-line bg-white px-3 text-[13px]"><option value="">{T(l, 'اختر الموقع', 'Select site')}</option>{(project.data?.sites ?? []).map((site) => <option key={site.id} value={site.id}>{site.code} · {site.name}</option>)}</select><CoreField l={l} name="deliveryNoteNumber" placeholder="Delivery note number" /><CoreField l={l} name="notes" placeholder="Notes" /></div>
      {po.items.map((item: any) => <div key={item.id} className="grid grid-cols-5 items-center gap-2 border-b border-line py-2 text-[12px]"><span>{item.description}</span><span>{T(l, 'المتبقي', 'Remaining')}: {Number(item.orderedQuantity) - Number(item.receivedQuantity)}</span><CoreField l={l} name={`received-${item.id}`} placeholder="Received" type="number" /><CoreField l={l} name={`accepted-${item.id}`} placeholder="Accepted" type="number" /><CoreField l={l} name={`rejected-${item.id}`} placeholder="Rejected" type="number" /></div>)}
      <div className="flex justify-end gap-2"><Btn onClick={() => setReceiptOpen(false)}>{T(l, 'إلغاء', 'Cancel')}</Btn><Btn primary type="submit" disabled={posting}>{posting ? T(l, 'جارٍ الترحيل…', 'Posting…') : T(l, 'ترحيل الاستلام', 'Post receipt')}</Btn></div>
    </form></Card>}
    <Card title={T(l, 'بنود أمر الشراء', 'Purchase order items')}><Table cols={['Description', 'Unit', 'Ordered', 'Received', 'Rate', 'Amount']} rows={po.items.map((item: any) => [item.description, item.unit, item.orderedQuantity, item.receivedQuantity, item.unitRate, item.lineTotal])} /></Card>
  </>
}

function ExpenseDetailScreen({ l }: { l: Lang }) {
  const { expenseId } = useParams<{ expenseId: string }>()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const expenseQuery = useQuery({ queryKey: ['expense', expenseId], queryFn: () => getExpense(expenseId!), enabled: Boolean(expenseId) })
  const expense = expenseQuery.data
  const codes = useCostCodes(expense?.projectId)
  const project = useProject(expense?.projectId)
  const approvals = useApprovals()
  if (expenseQuery.isLoading) return <LoadingState>{T(l, 'جارٍ تحميل المصروف…', 'Loading expense…')}</LoadingState>
  if (expenseQuery.isError || !expense) return <ErrorState>{T(l, 'تعذر تحميل المصروف.', 'Unable to load expense.')}</ErrorState>
  const pendingApproval = approvals.data?.find((approval) => approval.entityId === expense.id && approval.status === 'PENDING')
  const refresh = () => { void queryClient.invalidateQueries({ queryKey: ['expense', expense.id] }); void queryClient.invalidateQueries({ queryKey: ['expenses', expense.projectId] }); void queryClient.invalidateQueries({ queryKey: ['approvals'] }); void queryClient.invalidateQueries({ queryKey: ['budget', expense.projectId] }); void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }); void queryClient.invalidateQueries({ queryKey: ['reports-summary'] }) }
  return <><Head code={expense.expenseNumber} title={expense.description} sub={`${expense.projectId} · ${localizeStatus(l, expense.status)}`} actions={<div className="flex gap-2">{expense.status === 'DRAFT' && <><Btn onClick={() => setEditing((value) => !value)}>{T(l, 'تعديل', 'Edit')}</Btn><Btn primary onClick={async () => { await submitExpense(expense.id); refresh() }}>{T(l, 'إرسال', 'Submit')}</Btn></>}{pendingApproval && <><Btn onClick={async () => { await rejectApproval(pendingApproval.id); refresh() }}>{T(l, 'رفض', 'Reject')}</Btn><Btn primary onClick={async () => { await approveApproval(pendingApproval.id); refresh() }}>{T(l, 'اعتماد', 'Approve')}</Btn></>}{expense.status === 'APPROVED' && <Btn primary onClick={async () => { await postExpense(expense.id); refresh() }}>{T(l, 'ترحيل', 'Post')}</Btn>}</div>} />{editing && <Card className="mb-4" title={T(l, 'تعديل مسودة المصروف', 'Edit draft expense')}><form className="grid grid-cols-3 gap-2 p-5" onSubmit={async (event) => { event.preventDefault(); if (saving) return; setSaving(true); try { const form = new FormData(event.currentTarget); await updateExpense(expense.id, { category: form.get('category'), description: form.get('description'), amount: Number(form.get('amount')), taxAmount: Number(form.get('taxAmount') || 0), expenseDate: form.get('expenseDate'), payee: form.get('payee'), siteId: form.get('siteId') || undefined, costCodeId: form.get('costCodeId') }); setEditing(false); refresh() } finally { setSaving(false) } }}><CoreField l={l} name="category" placeholder="Category" /><CoreField l={l} name="description" placeholder="Description" /><select name="costCodeId" defaultValue={(expense as any).costCodeId ?? ''} required className="h-9 rounded-lg border border-line px-3 text-[13px]"><option value="">{T(l, 'اختر رمز التكلفة', 'Select cost code')}</option>{(codes.data ?? []).map((code) => <option key={code.id} value={code.id}>{code.code} · {code.name}</option>)}</select><select name="siteId" defaultValue={(expense as any).siteId ?? ''} className="h-9 rounded-lg border border-line px-3 text-[13px]"><option value="">{T(l, 'بدون موقع', 'No site')}</option>{(project.data?.sites ?? []).map((site) => <option key={site.id} value={site.id}>{site.code} · {site.name}</option>)}</select><CoreField l={l} name="amount" placeholder="Amount" type="number" /><CoreField l={l} name="taxAmount" placeholder="Tax" type="number" /><CoreField l={l} name="expenseDate" placeholder="Date" type="date" /><CoreField l={l} name="payee" placeholder="Vendor / payee" /><div className="col-span-3 flex justify-end"><Btn primary type="submit" disabled={saving}>{saving ? T(l, 'جارٍ الحفظ…', 'Saving…') : T(l, 'حفظ المسودة', 'Save draft')}</Btn></div></form></Card>}<div className="grid grid-cols-4 gap-4"><Kpi accent label={T(l, 'المبلغ', 'Amount')} value={sar(Number(expense.amount))} sub="SAR" /><Kpi label={T(l, 'الفئة', 'Category')} value={expense.category} sub="" /><Kpi label={T(l, 'التاريخ', 'Date')} value={new Date(expense.expenseDate).toLocaleDateString()} sub="" /><Kpi label={T(l, 'الحالة', 'Status')} value={localizeStatus(l, expense.status)} sub="" /></div></>
}

function LiveReceiptDetail({ l }: { l: Lang }) {
  const { receiptId } = useParams<{ receiptId: string }>()
  const receipt = useQuery({ queryKey: ['goods-receipt', receiptId], queryFn: () => getReceipt(receiptId!), enabled: Boolean(receiptId) })
  if (receipt.isLoading) return <LoadingState>{T(l, 'جارٍ تحميل سند الاستلام…', 'Loading goods receipt…')}</LoadingState>
  if (receipt.isError || !receipt.data) return <ErrorState>{T(l, 'تعذر تحميل سند الاستلام.', 'Unable to load goods receipt.')}</ErrorState>
  const data = receipt.data
  return <><Head code={data.receiptNumber} title={T(l, 'سند استلام المواد', 'Goods receipt')} sub={`${data.purchaseOrderId} · ${data.receivedDate ? new Date(data.receivedDate).toLocaleDateString() : '—'}`} /><Card title={T(l, 'بنود الاستلام', 'Receipt items')}><Table cols={['PO item', 'Received', 'Accepted', 'Rejected']} rows={(data.items ?? []).map((item: any) => [item.purchaseOrderItemId, item.receivedQuantity, item.acceptedQuantity, item.rejectedQuantity])} /></Card></>
}

function LegacyPODetail({ l }: { l: Lang }) {
  const { purchaseOrderId } = useParams<{ purchaseOrderId: string }>()
  const queryClient = useQueryClient()
  const { data: po, isLoading, isError } = useQuery({ queryKey: ['purchase-order', purchaseOrderId], queryFn: () => getPurchaseOrder(purchaseOrderId!), enabled: Boolean(purchaseOrderId) })
  const { data: approvals } = useApprovals()
  const approval = approvals?.find((item) => item.entityId === purchaseOrderId && item.status === 'PENDING')
  if (isLoading) return <LoadingState>{T(l, 'جارٍ تحميل أمر الشراء…', 'Loading purchase order…')}</LoadingState>
  if (isError || !po) return <ErrorState>{T(l, 'تعذر تحميل أمر الشراء.', 'Unable to load purchase order.')}</ErrorState>
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['purchase-order', purchaseOrderId] })
  return <><Head code={po.poNumber} title={T(l, 'أمر الشراء', 'Purchase order')} sub={`${po.projectId} · ${po.status}`} actions={<div className="flex gap-2">{po.status === 'DRAFT' && <Btn primary onClick={async () => { await submitPurchaseOrder(po.id); refresh() }}>Submit</Btn>}{approval && <><Btn onClick={async () => { await rejectApproval(approval.id); refresh() }}>Reject</Btn><Btn primary onClick={async () => { await approveApproval(approval.id); refresh() }}>Approve</Btn></>}{po.status === 'APPROVED' && <Btn primary onClick={async () => { await issuePurchaseOrder(po.id); refresh() }}>Issue</Btn>}{['ISSUED', 'PARTIALLY_RECEIVED'].includes(po.status) && <Btn primary onClick={async () => { const line = po.items[0] as any; const quantity = 0; if (quantity > 0) { await createReceipt(po.id, { items: [{ purchaseOrderItemId: line.id, receivedQuantity: quantity, acceptedQuantity: quantity, rejectedQuantity: 0 }] }); refresh() } }}>Record receipt</Btn>}{po.status === 'RECEIVED' && <Btn onClick={async () => { await closePurchaseOrder(po.id); refresh() }}>Close</Btn>}</div>} /><Card className="mb-4"><Steps at={po.status === 'RECEIVED' ? 4 : po.status === 'PARTIALLY_RECEIVED' ? 3 : po.status === 'ISSUED' ? 2 : po.status === 'APPROVED' ? 1 : 0} steps={['Draft', 'Approved', 'Issued', 'Receiving', 'Received']} /></Card><Card title="Purchase order items"><Table cols={['Description', 'Unit', 'Ordered', 'Received', 'Rate', 'Amount']} rows={po.items.map((item: any) => [item.description, item.unit, item.orderedQuantity, item.receivedQuantity, item.unitRate, item.lineTotal])} /></Card><div className="mt-4 grid grid-cols-3 gap-4"><Kpi accent label="PO total" value={sar(Number(po.totalAmount))} sub={po.currency} /><Kpi label="Subtotal" value={sar(Number(po.subtotal))} sub={po.currency} /><Kpi label="Tax" value={sar(Number(po.taxAmount))} sub={po.currency} /></div></>
}

function PODetail({ l }: { l: Lang }) {
  return <>
    <Head code="PO-2407-1182" title={T(l, 'أمر شراء — حديد الراجحي', 'Purchase order — Al Rajhi Steel')} sub={T(l, 'برج الريم · صادر ١٩ أغسطس ٢٠٢٥ · شروط الدفع ٦٠ يوماً', 'Al Reem · issued 19 Aug 2025 · Net 60')} actions={<><Btn>{T(l, 'طباعة PDF', 'Print PDF')}</Btn><Btn primary>{T(l, 'تسجيل استلام', 'Record receipt')}</Btn></>} />
    <Card className="mb-4 px-6 py-5"><Steps at={3} steps={[T(l, 'مسودة', 'Draft'), T(l, 'معتمد', 'Approved'), T(l, 'مرسل للمورد', 'Sent'), T(l, 'استلام جزئي', 'Partially received'), T(l, 'مغلق', 'Closed')]} /></Card>
    <div className="grid grid-cols-4 gap-4"><Kpi accent label={T(l, 'إجمالي الأمر', 'PO total')} value="171,950" sub="SAR" /><Kpi label={T(l, 'المستلم', 'Received')} value="65%" sub="39.3 / 60.5 t" /><Kpi label={T(l, 'المفوتر', 'Invoiced')} value="98,400" sub="SAR" /><Kpi label={T(l, 'التوريد القادم', 'Next delivery')} value="24 Aug" sub={T(l, 'شحنة ٢ من ٣', 'Batch 2 of 3')} /></div>
  </>
}

function Approvals({ l }: { l: Lang }) {
  return <>
    <Head code="APR · INBOX" title={T(l, 'الموافقات والإشعارات', 'Approvals & notifications')} sub={T(l, '٢٣ عنصراً بانتظار إجرائك', '23 items awaiting your action')} />
    <Card><Table cols={[T(l, 'النوع', 'Type'), T(l, 'المرجع', 'Ref'), T(l, 'الوصف', 'Description'), T(l, 'المبلغ', 'Amount'), T(l, 'الانتظار', 'Waiting'), '']} rows={[
      [<Chip t="blue">{T(l, 'أمر شراء', 'PO')}</Chip>, 'PO-1190', T(l, 'كابلات كهربائية — مستشفى النخيل', 'Electrical cables — Nakheel'), '212,400', <Chip t="red">3d</Chip>],
      [<Chip t="amber">{T(l, 'مصروف', 'Expense')}</Chip>, 'EXP-0771', T(l, 'إيجار رافعة برجية — أغسطس', 'Tower crane rent — Aug'), '48,000', <Chip t="gray">6h</Chip>],
      [<Chip t="green">{T(l, 'مستخلص', 'Sub. invoice')}</Chip>, 'SC-IPC-07', T(l, 'مستخلص ٧ — شركة البناء المتحد', 'IPC 7 — United Builders'), '386,900', <Chip t="amber">1d</Chip>],
      [<Chip t="gray">{T(l, 'طلب مواد', 'MR')}</Chip>, 'MR-0318', T(l, 'حديد تسليح للطابق ٢٥', 'Rebar Level 25'), '—', <Chip t="gray">2h</Chip>]].map((r) => [r[0], <span className="num text-steel">{r[1]}</span>, r[2], <span className="num">{r[3]}</span>, r[4],
        <div className="flex justify-end gap-2"><button className="rounded-md border border-line px-3 py-1 text-[12px]">{T(l, 'رفض', 'Reject')}</button><button className="rounded-md bg-navy px-3 py-1 text-[12px] text-white">{T(l, 'اعتماد', 'Approve')}</button></div>])} /></Card>
  </>
}

/* generic register screens for the remaining modules */
const REG: Record<string, { code: string; t: [string, string]; cols: [string, string][]; rows: (string | [string, string])[][] }> = {
  boq: { code: 'BOQ · PRJ-2407', t: ['جدول الكميات', 'Bill of Quantities'], cols: [['البند', 'Item'], ['الوصف', 'Description'], ['الوحدة', 'Unit'], ['الكمية', 'Qty'], ['سعر الوحدة', 'Rate'], ['الإجمالي', 'Amount'], ['الحالة', 'Status']],
    rows: [['02.10.01', 'حفر وردم — Excavation & backfill', 'm³', '18,400', '32', '588,800', 'green'], ['03.11.02', 'خرسانة C40 — Concrete C40', 'm³', '9,250', '410', '3,792,500', 'amber'], ['03.21.04', 'حديد تسليح — Rebar Ø16', 't', '1,120', '2,840', '3,180,800', 'green'], ['08.40.01', 'واجهة زجاجية — Curtain wall', 'm²', '6,800', '1,150', '7,820,000', 'gray']] },
  cost: { code: 'COST · CONTROL', t: ['الميزانية والتكلفة', 'Budget & Cost Control'], cols: [['الرمز', 'Code'], ['حساب التكلفة', 'Cost account'], ['الوحدة', 'Unit'], ['الميزانية', 'Budget'], ['الملتزم', 'Committed'], ['الفعلي', 'Actual'], ['الحالة', 'Status']],
    rows: [['CC-01', 'مواد — Materials', 'SAR', '78.2M', '61.0M', '48.3M', 'green'], ['CC-02', 'عمالة — Labour', 'SAR', '41.0M', '—', '27.9M', 'amber'], ['CC-03', 'مقاولو باطن — Subcontracts', 'SAR', '46.5M', '39.8M', '22.1M', 'green'], ['CC-04', 'معدات — Equipment', 'SAR', '12.4M', '9.0M', '8.7M', 'red']] },
  mr: { code: 'MR · REGISTER', t: ['طلبات المواد', 'Material Requests'], cols: [['الرقم', 'No.'], ['الوصف', 'Description'], ['المشروع', 'Project'], ['البنود', 'Items'], ['المطلوب', 'Needed'], ['المقدم', 'By'], ['الحالة', 'Status']],
    rows: [['MR-0318', 'حديد تسليح — Rebar L25', 'PRJ-2407', '3', '22 Aug', 'S. Haddad', 'amber'], ['MR-0317', 'بلوك عازل — Insulated block', 'PRJ-2411', '2', '25 Aug', 'M. Nasser', 'green'], ['MR-0315', 'كابلات — Cables', 'PRJ-2415', '7', '20 Aug', 'A. Saleh', 'red'], ['MR-0312', 'دهانات — Paints', 'PRJ-2420', '4', '30 Aug', 'R. Omar', 'blue']] },
  rfq: { code: 'RFQ · REGISTER', t: ['طلبات التسعير', 'Requests for Quotation'], cols: [['الرقم', 'No.'], ['الوصف', 'Description'], ['المشروع', 'Project'], ['الموردون', 'Suppliers'], ['العروض', 'Quotes'], ['الإغلاق', 'Closes'], ['الحالة', 'Status']],
    rows: [['RFQ-0912', 'حديد تسليح — Rebar', 'PRJ-2407', '3', '3', '18 Aug', 'green'], ['RFQ-0910', 'مضخات — Pumps', 'PRJ-2415', '4', '2', '21 Aug', 'amber'], ['RFQ-0907', 'ألمنيوم — Aluminium', 'PRJ-2411', '5', '0', '27 Aug', 'blue']] },
  po: { code: 'PO · REGISTER', t: ['أوامر الشراء', 'Purchase Orders'], cols: [['الرقم', 'No.'], ['المورد', 'Supplier'], ['المشروع', 'Project'], ['القيمة', 'Value'], ['المستلم', 'Received'], ['التوريد', 'Delivery'], ['الحالة', 'Status']],
    rows: [['PO-1182', 'حديد الراجحي — Al Rajhi Steel', 'PRJ-2407', '171,950', '65%', '24 Aug', 'amber'], ['PO-1179', 'إسمنت اليمامة — Yamama Cement', 'PRJ-2411', '88,200', '100%', '10 Aug', 'green'], ['PO-1175', 'الزامل للتكييف — Zamil AC', 'PRJ-2415', '1,240,000', '0%', '02 Sep', 'blue']] },
  grn: { code: 'GRN · RECEIVING', t: ['استلام المواد', 'Goods Receiving'], cols: [['الرقم', 'GRN'], ['أمر الشراء', 'PO'], ['المادة', 'Material'], ['المطلوب', 'Ordered'], ['المستلم', 'Received'], ['الفحص', 'Inspection'], ['الحالة', 'Status']],
    rows: [['GRN-0644', 'PO-1182', 'حديد Ø16 — Rebar Ø16', '42 t', '28 t', 'QC-OK', 'green'], ['GRN-0643', 'PO-1179', 'إسمنت — Cement', '1,800 bags', '1,760', '40 damaged', 'amber'], ['GRN-0640', 'PO-1170', 'أنابيب — Pipes', '320 m', '0', 'Rejected', 'red']] },
  sup: { code: 'SUP · DIRECTORY', t: ['الموردون', 'Suppliers'], cols: [['الرمز', 'Code'], ['المورد', 'Supplier'], ['الفئة', 'Category'], ['المدينة', 'City'], ['أوامر', 'POs'], ['التقييم', 'Rating'], ['الحالة', 'Status']],
    rows: [['SUP-014', 'حديد الراجحي — Al Rajhi Steel', 'Steel', 'Riyadh', '38', '4.7', 'green'], ['SUP-022', 'إسمنت اليمامة — Yamama Cement', 'Cement', 'Riyadh', '52', '4.5', 'green'], ['SUP-031', 'الخليج للأنابيب — Gulf Pipes', 'MEP', 'Dammam', '9', '3.6', 'amber']] },
  prog: { code: 'PROG · TRACKING', t: ['تتبع الإنجاز', 'Progress Tracking'], cols: [['النشاط', 'Activity'], ['الوصف', 'Description'], ['المشروع', 'Project'], ['المخطط', 'Planned'], ['الفعلي', 'Actual'], ['الانحراف', 'Var.'], ['الحالة', 'Status']],
    rows: [['A-2401', 'صب أسقف — Slab L24', 'PRJ-2407', '100%', '100%', '0d', 'green'], ['A-2510', 'واجهات شمالية — North facade', 'PRJ-2407', '60%', '48%', '-6d', 'amber'], ['H-0302', 'هيكل الجناح ب — Wing B frame', 'PRJ-2415', '45%', '30%', '-14d', 'red']] },
  sub: { code: 'SUB · CONTRACTS', t: ['مقاولو الباطن', 'Subcontractors'], cols: [['العقد', 'Contract'], ['المقاول', 'Subcontractor'], ['النطاق', 'Scope'], ['القيمة', 'Value'], ['المستخلص', 'Certified'], ['الاستقطاع', 'Retention'], ['الحالة', 'Status']],
    rows: [['SC-07', 'البناء المتحد — United Builders', 'Structure', '22.4M', '14.1M', '10%', 'green'], ['SC-11', 'الواجهات الحديثة — Modern Facades', 'Facade', '9.8M', '3.2M', '10%', 'amber'], ['SC-14', 'كهرباء الشرق — East Electric', 'MEP', '15.6M', '4.0M', '5%', 'blue']] },
  exp: { code: 'EXP · LEDGER', t: ['المصروفات', 'Expenses'], cols: [['الرقم', 'No.'], ['البيان', 'Description'], ['المشروع', 'Project'], ['التصنيف', 'Category'], ['المبلغ', 'Amount'], ['التاريخ', 'Date'], ['الحالة', 'Status']],
    rows: [['EXP-0771', 'إيجار رافعة — Crane rent', 'PRJ-2407', 'Equipment', '48,000', '15 Aug', 'amber'], ['EXP-0768', 'سكن عمال — Labour camp', 'PRJ-2415', 'Site', '126,500', '12 Aug', 'green'], ['EXP-0765', 'وقود — Diesel', 'PRJ-2411', 'Fuel', '9,840', '10 Aug', 'green']] },
}
const STAT: Record<string, [string, string]> = { green: ['معتمد', 'Approved'], amber: ['قيد المراجعة', 'In review'], red: ['متأخر', 'Overdue'], blue: ['جديد', 'New'], gray: ['لم يبدأ', 'Not started'] }

const fieldTranslations: Record<string, [string, string]> = {
  code: ['الرمز', 'Code'], name: ['الاسم', 'Name'], category: ['الفئة', 'Category'], city: ['المدينة', 'City'], description: ['الوصف', 'Description'], purpose: ['الغرض', 'Purpose'], unit: ['الوحدة', 'Unit'], quantity: ['الكمية', 'Quantity'], rate: ['السعر', 'Rate'], amount: ['المبلغ', 'Amount'], taxAmount: ['الضريبة', 'Tax'], expenseDate: ['التاريخ', 'Date'], payee: ['المورد / المستفيد', 'Vendor / payee'], progressPercent: ['نسبة الإنجاز', 'Progress %'], measuredQuantity: ['الكمية المنفذة', 'Measured quantity'], measuredDate: ['تاريخ القياس', 'Date'], notes: ['ملاحظات', 'Notes'], storageKey: ['مفتاح التخزين', 'Storage key'], originalName: ['اسم الملف الأصلي', 'Original filename'], mimeType: ['نوع الملف', 'MIME type'], size: ['الحجم بالبايت', 'Size (bytes)'], deliveryNoteNumber: ['رقم إشعار التسليم', 'Delivery note number'], siteId: ['معرّف الموقع', 'Site ID (optional)'], title: ['العنوان', 'Title'], requestId: ['طلب المواد', 'Material request'], quoteNumber: ['رقم العرض', 'Quote number'], quoteDate: ['تاريخ العرض', 'Quote date'], validUntil: ['صالح حتى', 'Valid until'], deliveryDays: ['مدة التسليم بالأيام', 'Delivery days'], taxRate: ['نسبة الضريبة', 'Tax %'], paymentTerms: ['شروط الدفع', 'Payment terms'], received: ['المستلم الآن', 'Received now'], accepted: ['المقبول', 'Accepted'], rejected: ['المرفوض', 'Rejected'],
}
const CoreField = ({ l, name, placeholder, type = 'text' }: { l?: Lang; name: string; placeholder: string; type?: string }) => <input name={name} type={type} required placeholder={fieldTranslations[name] ? T(l ?? currentLanguage, ...fieldTranslations[name]) : localizeUiText(l ?? currentLanguage, placeholder)} className="h-9 rounded-lg border border-line bg-white px-3 text-[13px] outline-none focus:border-amber focus:ring-4 focus:ring-orange-100" />

function LiveReceipts({ l, projectId }: { l: Lang; projectId?: string }) {
  const navigate = useNavigate()
  const receipts = useReceipts(projectId)
  const rows = (receipts.data ?? []).map((receipt: any) => [<span className="num text-steel">{receipt.receiptNumber}</span>, receipt.purchaseOrderId, receipt.supplierId, receipt.receivedDate ? new Date(receipt.receivedDate).toLocaleDateString() : '—', <Chip t="green">{receipt.status}</Chip>])
  return <><Head code="GRN · LIVE" title={T(l, 'استلام المواد', 'Goods Receiving')} sub={`${rows.length} receipts from the API`} /><Card>{receipts.isLoading ? <LoadingState>{T(l, 'جارٍ تحميل الاستلامات…', 'Loading receipts…')}</LoadingState> : receipts.isError ? <ErrorState>{T(l, 'تعذر تحميل الاستلامات.', 'Unable to load receipts.')}</ErrorState> : <Table onRow={(index) => receipts.data?.[index] && navigate(`/goods-receipts/${(receipts.data[index] as any).id}`)} cols={['GRN', 'PO', 'Supplier', 'Date', 'Status']} rows={rows} />}</Card></>
}

function LiveDocuments({ l }: { l: Lang }) {
  const { selectedProjectId } = useProjectContext()
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const documents = useDocuments(selectedProjectId)
  return <><Head code="DOC · LIVE" title={T(l, 'المستندات', 'Documents')} sub={T(l, 'مستندات حية وإصدارات محفوظة', 'Live documents and retained versions')} actions={<label className={`inline-flex h-9 cursor-pointer items-center rounded-lg bg-amber px-4 text-[13px] font-medium text-white ${uploading ? 'opacity-50' : ''}`}><input type="file" className="hidden" disabled={uploading} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setUploading(true); try { await uploadDocument(file, { projectId: selectedProjectId, name: file.name }); void queryClient.invalidateQueries({ queryKey: ['documents'] }) } finally { setUploading(false); event.target.value = '' } }} />{uploading ? T(l, 'جارٍ الرفع…', 'Uploading…') : T(l, 'رفع مستند', 'Upload document')}</label>} /><Card>{documents.isLoading ? <LoadingState>{T(l, 'جارٍ تحميل المستندات…', 'Loading documents…')}</LoadingState> : documents.isError ? <ErrorState>{T(l, 'تعذر تحميل المستندات.', 'Unable to load documents.')}</ErrorState> : <Table cols={['Name', 'Type', 'Version', 'Created', 'Actions']} rows={(documents.data ?? []).map((document) => [document.name, document.mimeType, String(document.version), new Date(document.createdAt).toLocaleDateString(), <div className="flex gap-2"><Btn onClick={() => void downloadDocument(document.id, document.originalName ?? document.name)}>{T(l, 'تنزيل', 'Download')}</Btn><label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-line bg-paper px-4 text-[13px]"><input type="file" className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; await uploadDocumentVersion(document.id, file); void queryClient.invalidateQueries({ queryKey: ['documents'] }); event.target.value = '' }} />{T(l, 'إصدار جديد', 'New version')}</label></div>])} />}</Card></>
}

function LiveNotifications({ l }: { l: Lang }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const notifications = useNotifications()
  const open = (item: any) => {
    if (item.entityType === 'MaterialRequest' && item.entityId) navigate(`/material-requests/${item.entityId}`)
    else if (item.entityType === 'PurchaseOrder' && item.entityId) navigate(`/purchase-orders/${item.entityId}`)
    else if (item.entityType === 'Expense' && item.entityId) navigate(`/expenses/${item.entityId}`)
    else if (item.entityType === 'GoodsReceipt' && item.entityId) navigate(`/goods-receipts/${item.entityId}`)
  }
  return <><Head code="NOT · LIVE" title={T(l, 'الإشعارات', 'Notifications')} sub={T(l, 'تنبيهات سير العمل الخاصة بك', 'Your workflow alerts')} actions={<Btn onClick={async () => { await markAllNotificationsRead(); void queryClient.invalidateQueries({ queryKey: ['notifications'] }) }}>{T(l, 'تعليم الكل كمقروء', 'Mark all read')}</Btn>} />
    <Card>{notifications.isLoading ? <LoadingState>{T(l, 'جارٍ تحميل الإشعارات…', 'Loading notifications…')}</LoadingState> : notifications.isError ? <ErrorState>{T(l, 'تعذر تحميل الإشعارات.', 'Unable to load notifications.')}</ErrorState> : !notifications.data?.length ? <EmptyState>{T(l, 'لا توجد إشعارات.', 'No notifications.')}</EmptyState> : <div className="divide-y divide-line">{notifications.data.map((item) => <button type="button" key={item.id} onClick={async () => { await markNotificationRead(item.id); void queryClient.invalidateQueries({ queryKey: ['notifications'] }); open(item) }} className={`flex w-full items-start justify-between gap-4 px-5 py-4 text-start hover:bg-stone-50 ${item.readAt ? '' : 'bg-orange-50/40'}`}><div><div className="text-[13px] font-semibold">{item.title}</div><div className="mt-1 text-[12px] text-steel">{item.message}</div></div><time className="shrink-0 text-[11px] text-steel">{new Date(item.createdAt).toLocaleDateString()}</time></button>)}</div>}</Card></>
}

function LiveAuditLog({ l }: { l: Lang }) {
  const [entityType, setEntityType] = useState('')
  const events = useAuditEvents(entityType || undefined)
  return <><Head code="AUD · LIVE" title={T(l, 'سجل التدقيق', 'Audit Log')} sub={T(l, 'سجل غير قابل للتعديل للعمليات المهمة', 'Immutable record of important operations')} />
    <Card><div className="border-b border-line p-4"><select value={entityType} onChange={(event) => setEntityType(event.target.value)} className="h-9 rounded-lg border border-line bg-paper px-3 text-[13px]"><option value="">{T(l, 'كل الكيانات', 'All entities')}</option><option value="MaterialRequest">{T(l, 'طلبات المواد', 'Material requests')}</option><option value="PurchaseOrder">{T(l, 'أوامر الشراء', 'Purchase orders')}</option><option value="Expense">{T(l, 'المصروفات', 'Expenses')}</option><option value="Document">{T(l, 'المستندات', 'Documents')}</option></select></div>{events.isLoading ? <LoadingState>{T(l, 'جارٍ تحميل السجل…', 'Loading audit log…')}</LoadingState> : events.isError ? <ErrorState>{T(l, 'تعذر تحميل سجل التدقيق.', 'Unable to load audit log.')}</ErrorState> : !events.data?.length ? <EmptyState>{T(l, 'لا توجد أحداث مطابقة.', 'No matching events.')}</EmptyState> : <Table cols={['Action', 'Entity', 'Reference', 'Actor', 'Date']} rows={events.data.map((event) => [event.action, event.entityType, event.entityId?.slice(0, 8) ?? '—', event.actor?.name ?? '—', new Date(event.createdAt).toLocaleString()])} />}</Card></>
}

function SettingsScreen({ l }: { l: Lang }) {
  const queryClient = useQueryClient()
  const settings = useQuery({ queryKey: ['company-settings'], queryFn: getCompanySettings })
  const [saving, setSaving] = useState(false)
  if (settings.isLoading) return <LoadingState>{T(l, 'جارٍ تحميل الإعدادات…', 'Loading settings…')}</LoadingState>
  if (settings.isError || !settings.data) return <ErrorState>{T(l, 'تعذر تحميل الإعدادات.', 'Unable to load settings.')}</ErrorState>
  const policy = settings.data.settings?.purchaseOrderApproval ?? { projectManagerLimit: 20000, financeLimit: 100000 }
  return <><Head code="SET · LIVE" title={T(l, 'الإعدادات', 'Settings')} sub={T(l, 'تكوين الشركة وسياسة الاعتماد', 'Company configuration and approval policy')} />
    <Card title={T(l, 'إعدادات الشركة وسياسة أمر الشراء', 'Company and purchase order policy')}><form className="grid grid-cols-2 gap-3 p-5" onSubmit={async (event) => { event.preventDefault(); if (saving) return; const form = new FormData(event.currentTarget); setSaving(true); try { await updateCompanySettings({ name: form.get('name'), legalName: form.get('legalName'), defaultCurrency: form.get('defaultCurrency'), timezone: form.get('timezone'), vatNumber: form.get('vatNumber'), settings: { ...settings.data.settings, purchaseOrderApproval: { projectManagerLimit: Number(form.get('projectManagerLimit')), financeLimit: Number(form.get('financeLimit')) } } }); void queryClient.invalidateQueries({ queryKey: ['company-settings'] }) } finally { setSaving(false) } }}><input name="name" defaultValue={settings.data.name ?? ''} placeholder={T(l, 'اسم الشركة', 'Company name')} className="h-9 rounded-lg border border-line bg-white px-3 text-[13px]" /><input name="legalName" defaultValue={settings.data.legalName ?? ''} placeholder={T(l, 'الاسم القانوني', 'Legal name')} className="h-9 rounded-lg border border-line bg-white px-3 text-[13px]" /><input name="defaultCurrency" defaultValue={settings.data.defaultCurrency ?? 'SAR'} placeholder={T(l, 'العملة', 'Currency')} className="h-9 rounded-lg border border-line bg-white px-3 text-[13px]" /><input name="timezone" defaultValue={settings.data.timezone ?? ''} placeholder={T(l, 'المنطقة الزمنية', 'Timezone')} className="h-9 rounded-lg border border-line bg-white px-3 text-[13px]" /><input name="vatNumber" defaultValue={settings.data.vatNumber ?? ''} placeholder={T(l, 'الرقم الضريبي', 'VAT number')} className="h-9 rounded-lg border border-line bg-white px-3 text-[13px]" /><div className="col-span-2 mt-2 grid grid-cols-2 gap-3 border-t border-line pt-4"><label className="text-[12px] text-steel">{T(l, 'حد اعتماد مدير المشروع (SAR)', 'Project manager threshold (SAR)')}<input name="projectManagerLimit" type="number" min="0" defaultValue={policy.projectManagerLimit} className="mt-1 h-9 w-full rounded-lg border border-line bg-white px-3 text-[13px]" /></label><label className="text-[12px] text-steel">{T(l, 'حد اعتماد المالية (SAR)', 'Finance threshold (SAR)')}<input name="financeLimit" type="number" min="0" defaultValue={policy.financeLimit} className="mt-1 h-9 w-full rounded-lg border border-line bg-white px-3 text-[13px]" /></label></div><div className="col-span-2 flex justify-end"><Btn primary type="submit" disabled={saving}>{saving ? T(l, 'جارٍ الحفظ…', 'Saving…') : T(l, 'حفظ الإعدادات', 'Save settings')}</Btn></div></form></Card>
  </>
}

function TeamScreen({ l }: { l: Lang }) {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const team = useTeam()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteResult, setInviteResult] = useState<string>()
  const isAdmin = session?.user.roles.some((role) => role === 'ADMIN' || role === 'OWNER_EXECUTIVE') ?? false
  if (team.isLoading) return <LoadingState>{T(l, 'جارٍ تحميل الفريق…', 'Loading team…')}</LoadingState>
  if (team.isError) return <ErrorState>{T(l, 'تعذر تحميل الفريق.', 'Unable to load team.')}</ErrorState>
  return <><Head code="TEAM · LIVE" title={T(l, 'الفريق', 'Team')} sub={T(l, 'إدارة عضوية الشركة والصلاحيات', 'Company membership and roles')} actions={isAdmin ? <Btn primary onClick={() => setInviteOpen((value) => !value)}>{T(l, 'دعوة عضو', 'Invite member')}</Btn> : undefined} />
    {inviteOpen && <Card className="mb-4" title={T(l, 'إنشاء دعوة', 'Create invitation')}><form className="grid grid-cols-3 gap-2 p-5" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const invitation = await createInvitation({ email: form.get('email'), role: form.get('role'), expiresInDays: Number(form.get('expiresInDays') || 7) }); setInviteResult(`${window.location.origin}/invite?token=${invitation.token}`); void queryClient.invalidateQueries({ queryKey: ['invitations'] }) }}><input name="email" type="email" required placeholder={T(l, 'البريد الإلكتروني', 'Email')} className="h-9 rounded-lg border border-line bg-white px-3 text-[13px]" /><select name="role" defaultValue="SITE_ENGINEER" className="h-9 rounded-lg border border-line bg-white px-3 text-[13px]"><option value="SITE_ENGINEER">{T(l, 'مهندس موقع', 'Site Engineer')}</option><option value="PROJECT_MANAGER">{T(l, 'مدير مشروع', 'Project Manager')}</option><option value="PROCUREMENT">{T(l, 'المشتريات', 'Procurement')}</option><option value="FINANCE">{T(l, 'المالية', 'Finance')}</option><option value="QUANTITY_SURVEYOR">{T(l, 'مساح كميات', 'Quantity Surveyor')}</option></select><input name="expiresInDays" type="number" min="1" max="30" defaultValue="7" aria-label={T(l, 'أيام الصلاحية', 'Expiry days')} className="h-9 rounded-lg border border-line bg-white px-3 text-[13px]" /><div className="col-span-3 flex justify-end"><Btn primary type="submit">{T(l, 'إنشاء رابط الدعوة', 'Create invitation link')}</Btn></div></form>{inviteResult && <div className="mx-5 mb-5 rounded-lg bg-orange-50 p-3 text-[12px] text-ink"><div>{T(l, 'التسليم عبر البريد قابل للتكوين؛ استخدم الرابط التالي في التطوير:', 'Email delivery is configurable; use this development link:')}</div><code className="mt-2 block break-all" dir="ltr">{inviteResult}</code></div>}</Card>}
    <Card><Table cols={['Name', 'Email', 'Job title', 'Role', 'Status', 'Actions']} rows={(team.data ?? []).map((member: any) => [member.user.name, member.user.email, member.user.jobTitle ?? '—', isAdmin ? <select defaultValue={member.role} onChange={async (event) => { await updateTeamMember(member.id, { role: event.target.value }); void queryClient.invalidateQueries({ queryKey: ['team'] }) }} className="rounded border border-line bg-white px-2 py-1 text-[12px]"><option value="OWNER_EXECUTIVE">{T(l, 'مالك / تنفيذي', 'Owner / Executive')}</option><option value="ADMIN">{T(l, 'مدير النظام', 'Admin')}</option><option value="PROJECT_MANAGER">{T(l, 'مدير مشروع', 'Project Manager')}</option><option value="SITE_ENGINEER">{T(l, 'مهندس موقع', 'Site Engineer')}</option><option value="PROCUREMENT">{T(l, 'المشتريات', 'Procurement')}</option><option value="FINANCE">{T(l, 'المالية', 'Finance')}</option><option value="QUANTITY_SURVEYOR">{T(l, 'مساح كميات', 'Quantity Surveyor')}</option><option value="STOREKEEPER">{T(l, 'أمين مستودع', 'Storekeeper')}</option></select> : localizeRole(l, member.role), <Chip t={member.status === 'ACTIVE' ? 'green' : 'amber'}>{member.status}</Chip>, isAdmin ? <Btn onClick={async () => { await setTeamMemberActive(member.id, member.status !== 'ACTIVE'); void queryClient.invalidateQueries({ queryKey: ['team'] }) }}>{member.status === 'ACTIVE' ? T(l, 'تعطيل', 'Deactivate') : T(l, 'تفعيل', 'Activate')}</Btn> : '—'])} /></Card>
  </>
}

function LiveExpenses({ l, projectId }: { l: Lang; projectId?: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const expenses = useExpenses(projectId)
  const costCodes = useCostCodes(projectId)
  const { data: project } = useProject(projectId)
  const rows = (expenses.data ?? []).map((expense) => [<span className="num text-steel">{expense.expenseNumber}</span>, expense.description, expense.category, expense.amount, new Date(expense.expenseDate).toLocaleDateString(), <Chip t={expense.status === 'POSTED' ? 'green' : 'amber'}>{expense.status}</Chip>])
  return <><Head code="EXP · LIVE" title={T(l, 'المصروفات', 'Expenses')} sub={`${rows.length} ${T(l, 'مصروفات من واجهة البرمجة', 'expenses from the API')}`} actions={<Btn primary onClick={() => setOpen((value) => !value)}>{T(l, '+ إضافة مصروف', '+ Add expense')}</Btn>} />{open && <Card className="mb-4" title={T(l, 'إضافة مصروف', 'Add expense')}><form className="grid grid-cols-3 gap-2 p-5" onSubmit={async (event) => { event.preventDefault(); if (!projectId || saving) return; setSaving(true); try { const form = new FormData(event.currentTarget); await createExpense(projectId, { category: form.get('category'), description: form.get('description'), amount: Number(form.get('amount')), taxAmount: Number(form.get('taxAmount') || 0), expenseDate: form.get('expenseDate'), payee: form.get('payee'), siteId: form.get('siteId') || undefined, costCodeId: form.get('costCodeId') }); setOpen(false); void queryClient.invalidateQueries({ queryKey: ['expenses', projectId] }); void queryClient.invalidateQueries({ queryKey: ['budget', projectId] }); void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }); void queryClient.invalidateQueries({ queryKey: ['reports-summary'] }) } finally { setSaving(false) } }}><CoreField l={l} name="category" placeholder="Category" /><CoreField l={l} name="description" placeholder="Description" /><select name="costCodeId" required className="h-9 rounded-lg border border-line px-3 text-[13px]"><option value="">{T(l, 'اختر رمز التكلفة', 'Select cost code')}</option>{(costCodes.data ?? []).map((code) => <option key={code.id} value={code.id}>{code.code} · {code.name}</option>)}</select><select name="siteId" className="h-9 rounded-lg border border-line px-3 text-[13px]"><option value="">{T(l, 'بدون موقع', 'No site')}</option>{(project?.sites ?? []).map((site) => <option key={site.id} value={site.id}>{site.code} · {site.name}</option>)}</select><CoreField l={l} name="amount" placeholder="Amount" type="number" /><CoreField l={l} name="taxAmount" placeholder="Tax" type="number" /><CoreField l={l} name="expenseDate" placeholder="Date" type="date" /><CoreField l={l} name="payee" placeholder="Vendor / payee" /><div className="col-span-3 flex justify-end"><Btn primary type="submit" disabled={saving}>{saving ? T(l, 'جارٍ الحفظ…', 'Saving…') : T(l, 'حفظ المسودة', 'Save draft')}</Btn></div></form></Card>}<Card>{expenses.isLoading ? <LoadingState>{T(l, 'جارٍ تحميل المصروفات…', 'Loading expenses…')}</LoadingState> : expenses.isError ? <ErrorState>{T(l, 'تعذر تحميل المصروفات.', 'Unable to load expenses.')}</ErrorState> : <Table onRow={(index) => expenses.data?.[index] && navigate(`/expenses/${expenses.data[index].id}`)} cols={['No.', 'Description', 'Category', 'Amount', 'Date', 'Status']} rows={rows} />}</Card></>
}

function ProcurementScreen({ l, k }: { l: Lang; k: string }) {
  const { selectedProjectId } = useProjectContext()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [rfqOpen, setRfqOpen] = useState(false)
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([])
  const [expenseOpen, setExpenseOpen] = useState(false)
  const rfqs = useRfqs(selectedProjectId, search)
  const approvedRequests = useMaterialRequests(selectedProjectId, 'APPROVED')
  const suppliers = useSuppliers()
  const pos = usePurchaseOrders(selectedProjectId)
  const receipts = useReceipts(selectedProjectId)
  const expenses = useExpenses(selectedProjectId)
  if (k === 'rfq') {
    const comparisonEntry = new URLSearchParams(location.search).get('comparison') === '1'
    const rows = (rfqs.data ?? []).map((x) => [<span className="num text-steel">{x.rfqNumber}</span>, x.title, x.projectId, '—', '—', x.closingDate ? new Date(x.closingDate).toLocaleDateString() : '—', <Chip t={x.status === 'AWARDED' ? 'green' : 'amber'}>{x.status}</Chip>])
    return <><Head code={comparisonEntry ? 'RFQ · COMPARISON' : 'RFQ · LIVE'} title={comparisonEntry ? T(l, 'اختر طلب التسعير للمقارنة', 'Select an RFQ for comparison') : T(l, 'طلبات التسعير', 'Requests for Quotation')} sub={comparisonEntry ? T(l, 'اختر طلب تسعير لفتح مقارنة عروض الموردين الفعلية.', 'Select an RFQ to open its live supplier quote comparison.') : `${rows.length} RFQs from the API`} actions={<Btn primary onClick={() => setRfqOpen(!rfqOpen)}>{T(l, '+ طلب تسعير جديد', '+ New RFQ')}</Btn>} />{rfqOpen && <Card className="mb-4"><form className="grid grid-cols-3 gap-2 p-5" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const request = approvedRequests.data?.find((item) => item.id === String(form.get('requestId'))); if (request && selectedProjectId) { await createRfq(selectedProjectId, { title: form.get('title'), sourceMaterialRequestId: request.id, supplierIds: selectedSupplierIds, items: request.items.map((item) => ({ description: item.description, unit: item.unit, quantity: Number(item.requestedQuantity) })) }); setRfqOpen(false); void queryClient.invalidateQueries({ queryKey: ['rfqs', selectedProjectId] }) } }}><CoreField l={l} name="title" placeholder="RFQ title" /><select name="requestId" required className="h-9 rounded-lg border border-line px-3 text-[13px]">{(approvedRequests.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.requestNumber} · {item.purpose}</option>)}</select><div className="col-span-3 rounded-lg border border-line p-3"><div className="mb-2 text-[12px] font-medium">{T(l, 'دعوة الموردين', 'Invite suppliers')}</div><div className="grid grid-cols-3 gap-2">{(suppliers.data?.items ?? []).map((supplier) => <label key={supplier.id} className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={selectedSupplierIds.includes(supplier.id)} onChange={(event) => setSelectedSupplierIds((current) => event.target.checked ? [...current, supplier.id] : current.filter((id) => id !== supplier.id))} />{supplier.name}</label>)}</div></div><Btn primary disabled={!selectedSupplierIds.length}>{T(l, 'إنشاء طلب تسعير', 'Create RFQ')}</Btn></form></Card>}<Card><div className="border-b border-line p-4"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={T(l, 'البحث في طلبات التسعير', 'Search RFQs')} className="h-9 w-64 rounded-lg border border-line px-3 text-[13px]" /></div>{rfqs.isLoading ? <LoadingState>{T(l, 'جارٍ تحميل طلبات التسعير…', 'Loading RFQs…')}</LoadingState> : rfqs.isError ? <ErrorState>{T(l, 'تعذر تحميل طلبات التسعير.', 'Unable to load RFQs.')}</ErrorState> : <Table onRow={(i) => rfqs.data?.[i] && navigate(`/rfqs/${rfqs.data[i].id}/compare`)} cols={['No.', 'Description', 'Project', 'Suppliers', 'Quotes', 'Closes', 'Status']} rows={rows} />}</Card></>
  }
  if (k === 'po') {
    const rows = (pos.data ?? []).map((x) => [<span className="num text-steel">{x.poNumber}</span>, x.supplierId, x.projectId, x.totalAmount, '—', '—', <Chip t={x.status === 'RECEIVED' ? 'green' : 'amber'}>{x.status}</Chip>])
    return <><Head code="PO · LIVE" title={T(l, 'أوامر الشراء', 'Purchase Orders')} sub={`${rows.length} purchase orders from the API`} /><Card>{pos.isLoading ? <LoadingState>Loading purchase orders…</LoadingState> : pos.isError ? <ErrorState>Unable to load purchase orders.</ErrorState> : <Table onRow={(i) => pos.data?.[i] && navigate(`/purchase-orders/${pos.data[i].id}`)} cols={['No.', 'Supplier', 'Project', 'Value', 'Received', 'Delivery', 'Status']} rows={rows} />}</Card></>
  }
  if (k === 'grn') return <LiveReceipts l={l} projectId={selectedProjectId} />
  if (k === 'exp') return <LiveExpenses l={l} projectId={selectedProjectId} />
  if (k === 'grn') {
    const rows = (receipts.data ?? []).map((x: any) => [<span className="num text-steel">{x.receiptNumber}</span>, x.purchaseOrderId, '—', '—', x.receivedDate ? new Date(x.receivedDate).toLocaleDateString() : '—', <Chip t="green">{x.status}</Chip>])
    return <><Head code="GRN · LIVE" title={T(l, 'استلام المواد', 'Goods Receiving')} sub={`${rows.length} receipts from the API`} /><Card>{receipts.isLoading ? <LoadingState>Loading receipts…</LoadingState> : receipts.isError ? <ErrorState>Unable to load receipts.</ErrorState> : <Table cols={['GRN', 'PO', 'Material', 'Received', 'Date', 'Status']} rows={rows} />}</Card></>
  }
  const rows = (expenses.data ?? []).map((x) => [<span className="num text-steel">{x.expenseNumber}</span>, x.description, x.projectId ?? selectedProjectId, x.category, x.amount, new Date(x.expenseDate).toLocaleDateString(), <Chip t={x.status === 'POSTED' ? 'green' : 'amber'}>{x.status}</Chip>])
  return <><Head code="EXP · LIVE" title={T(l, 'المصروفات', 'Expenses')} sub={`${rows.length} expenses from the API`} actions={<Btn primary onClick={() => setExpenseOpen(!expenseOpen)}>+ Add expense</Btn>} />{expenseOpen && <Card className="mb-4" title="New expense"><form className="grid grid-cols-3 gap-2 p-5" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); if (selectedProjectId) { await createExpense(selectedProjectId, { category: form.get('category'), description: form.get('description'), amount: Number(form.get('amount')), taxAmount: Number(form.get('taxAmount')), expenseDate: form.get('expenseDate'), payee: form.get('payee') }); setExpenseOpen(false); void queryClient.invalidateQueries({ queryKey: ['expenses', selectedProjectId] }) } }}><CoreField name="category" placeholder="Category" /><CoreField name="description" placeholder="Description" /><CoreField name="amount" placeholder="Amount" type="number" /><CoreField name="taxAmount" placeholder="Tax" type="number" /><CoreField name="expenseDate" placeholder="Date" type="date" /><CoreField name="payee" placeholder="Vendor / payee" /><div className="col-span-3 flex justify-end"><Btn primary>Save draft</Btn></div></form></Card>}<Card>{expenses.isLoading ? <LoadingState>Loading expenses…</LoadingState> : expenses.isError ? <ErrorState>Unable to load expenses.</ErrorState> : <Table onRow={(i) => expenses.data?.[i] && navigate(`/expenses/${expenses.data[i].id}`)} cols={['No.', 'Description', 'Project', 'Category', 'Amount', 'Date', 'Status']} rows={rows} />}</Card></>
}

function CoreScreen({ l, k }: { l: Lang; k: string }) {
  const { selectedProjectId } = useProjectContext()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const boq = useBoq(selectedProjectId, search)
  const budget = useBudget(selectedProjectId)
  const codes = useCostCodes(selectedProjectId, search)
  const suppliers = useSuppliers(search)
  const materialRequests = useMaterialRequests(selectedProjectId, search || undefined)
  if (k === 'boq') {
    const { data, isLoading, isError } = boq
    const rows = (data?.items ?? []).map((x) => [<span className="num text-steel">{x.code}</span>, x.description, x.unit, x.contractQuantity, x.contractRate, x.contractValue, <Chip t="green">Approved</Chip>])
    return <><Head code="BOQ · LIVE" title={T(l, 'جدول الكميات', 'Bill of Quantities')} sub="Project BOQ from the API" actions={<Btn primary onClick={() => setOpen(!open)}>{T(l, '+ إضافة بند', '+ Add item')}</Btn>} />{open && <Card className="mb-4"><form className="grid grid-cols-5 gap-2 p-4" onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget); await createBoqItem(selectedProjectId!, { code: f.get('code'), description: f.get('description'), unit: f.get('unit'), contractQuantity: Number(f.get('quantity')), contractRate: Number(f.get('rate')) }); setOpen(false); void queryClient.invalidateQueries({ queryKey: ['boq', selectedProjectId] }) }}><CoreField l={l} name="code" placeholder="Code" /><CoreField l={l} name="description" placeholder="Description" /><CoreField l={l} name="unit" placeholder="Unit" /><CoreField l={l} name="quantity" placeholder="Quantity" type="number" /><CoreField l={l} name="rate" placeholder="Rate" type="number" /><div className="col-span-5 flex justify-end"><Btn primary>{T(l, 'حفظ', 'Save')}</Btn></div></form></Card>}<Card><div className="border-b border-line p-4"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={T(l, 'البحث في جدول الكميات', 'Search BOQ')} className="h-9 w-64 rounded-lg border border-line px-3 text-[13px]" /></div>{isLoading ? <LoadingState>{T(l, 'جارٍ تحميل جدول الكميات…', 'Loading BOQ…')}</LoadingState> : isError ? <ErrorState>{T(l, 'تعذر تحميل جدول الكميات.', 'Unable to load BOQ.')}</ErrorState> : <Table cols={['Item', 'Description', 'Unit', 'Qty', 'Rate', 'Amount', 'Status']} rows={rows} />}</Card></>
  }
  if (k === 'cost') {
    const rows = (codes.data ?? []).map((code) => { const line = budget.data?.lines.find((x) => x.costCodeId === code.id); return [<span className="num text-steel">{code.code}</span>, code.name, 'SAR', line?.revised ?? '0', line?.committed ?? '0', line?.actual ?? '0', <Chip t="green">Active</Chip>] })
    return <><Head code="COST · LIVE" title={T(l, 'الميزانية والتكلفة', 'Budget & Cost Control')} sub="Real budget and cost-code foundation" /><Card title="Cost codes and budget lines"><div className="border-b border-line p-4"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={T(l, 'البحث في أكواد التكلفة', 'Search cost codes')} className="h-9 w-64 rounded-lg border border-line px-3 text-[13px]" /></div>{budget.isLoading || codes.isLoading ? <LoadingState>{T(l, 'جارٍ تحميل مراقبة التكلفة…', 'Loading cost control…')}</LoadingState> : budget.isError || codes.isError ? <ErrorState>{T(l, 'تعذر تحميل مراقبة التكلفة.', 'Unable to load cost control.')}</ErrorState> : <Table cols={['Code', 'Cost account', 'Unit', 'Budget', 'Committed', 'Actual', 'Status']} rows={rows} />}</Card></>
  }
  if (k === 'sup') {
    const { data, isLoading, isError } = suppliers
    const rows = (data?.items ?? []).map((x) => [<span className="num text-steel">{x.code}</span>, <span className="font-medium">{x.name}</span>, x.category ?? '—', x.city ?? '—', '—', x.rating ?? '—', <Chip t="green">Active</Chip>])
    return <><Head code="SUP · LIVE" title={T(l, 'الموردون', 'Suppliers')} sub={`${data?.total ?? 0} suppliers from the API`} actions={<Btn primary onClick={() => setOpen(!open)}>{T(l, '+ إضافة مورد', '+ Add supplier')}</Btn>} />{open && <Card className="mb-4"><form className="grid grid-cols-4 gap-2 p-4" onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget); await createSupplier({ code: f.get('code'), name: f.get('name'), category: f.get('category'), city: f.get('city') }); setOpen(false); void queryClient.invalidateQueries({ queryKey: ['suppliers'] }) }}><CoreField l={l} name="code" placeholder="Code" /><CoreField l={l} name="name" placeholder="Supplier name" /><CoreField l={l} name="category" placeholder="Category" /><CoreField l={l} name="city" placeholder="City" /><div className="col-span-4 flex justify-end"><Btn primary>{T(l, 'حفظ المورد', 'Save supplier')}</Btn></div></form></Card>}<Card><div className="border-b border-line p-4"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={T(l, 'البحث في الموردين', 'Search suppliers')} className="h-9 w-64 rounded-lg border border-line px-3 text-[13px]" /></div>{isLoading ? <LoadingState>{T(l, 'جارٍ تحميل الموردين…', 'Loading suppliers…')}</LoadingState> : isError ? <ErrorState>{T(l, 'تعذر تحميل الموردين.', 'Unable to load suppliers.')}</ErrorState> : <Table onRow={(i) => data?.items[i] && navigate(`/suppliers/${data.items[i].id}`)} cols={['Code', 'Supplier', 'Category', 'City', 'POs', 'Rating', 'Status']} rows={rows} />}</Card></>
  }
  const { data, isLoading, isError } = materialRequests
  const requests = data ?? []
  if (k === 'mr') return <><Head code="MR · LIVE" title={T(l, 'طلبات المواد', 'Material Requests')} sub={`${requests.length} ${T(l, 'طلبات من النظام', 'requests from the API')}`} actions={<Btn primary onClick={() => setOpen((value) => !value)}>{T(l, '+ طلب جديد', '+ New request')}</Btn>} />{open && <Card className="mb-4" title={T(l, 'إنشاء طلب مواد', 'Create material request')}><form className="grid grid-cols-3 gap-2 p-4" onSubmit={async (e) => { e.preventDefault(); if (!selectedProjectId) return; const f = new FormData(e.currentTarget); await createMaterialRequest(selectedProjectId, { purpose: f.get('purpose'), items: [{ description: f.get('description'), unit: f.get('unit'), requestedQuantity: Number(f.get('quantity')) }] }); setOpen(false); void queryClient.invalidateQueries({ queryKey: ['material-requests', selectedProjectId] }) }}><CoreField l={l} name="purpose" placeholder="Purpose" /><CoreField l={l} name="description" placeholder="Material description" /><CoreField l={l} name="unit" placeholder="Unit" /><CoreField l={l} name="quantity" placeholder="Quantity" type="number" /><div className="col-span-3 flex justify-end"><Btn primary type="submit">{T(l, 'حفظ المسودة', 'Save draft')}</Btn></div></form></Card>}<Card><div className="border-b border-line p-4"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={T(l, 'البحث في الطلبات', 'Search requests')} className="h-9 w-64 rounded-lg border border-line px-3 text-[13px]" /></div>{isLoading ? <LoadingState>{T(l, 'جارٍ تحميل طلبات المواد…', 'Loading material requests…')}</LoadingState> : isError ? <ErrorState>{T(l, 'تعذر تحميل طلبات المواد.', 'Unable to load material requests.')}</ErrorState> : <Table onRow={(i) => requests[i] && navigate(`/material-requests/${requests[i].id}`)} cols={['No.', 'Purpose', 'Project', 'Items', 'Status']} rows={requests.map((x) => [<span className="num text-steel">{x.requestNumber}</span>, x.purpose ?? '—', x.projectId, String(x.items?.length ?? 0), <Chip t={x.status === 'APPROVED' ? 'green' : 'amber'}>{x.status}</Chip>])} />}</Card></>
  /*
  return <><Head code="MR · LIVE" title={T(l, 'طلبات المواد', 'Material Requests')} sub={`${requests.length} requests from the API`} actions={<Btn primary onClick={() => setOpen(!open)}>+ New request</Btn>} />{open && <Card className="mb-4"><form className="grid grid-cols-3 gap-2 p-4" onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget); await createMaterialRequest(selectedProjectId!, { purpose: f.get('purpose'), items: [{ description: f.get('description'), unit: f.get('unit'), requestedQuantity: Number(f.get('quantity')) }] }); setOpen(false); void queryClient.invalidateQueries({ queryKey: ['material-requests', selectedProjectId] }) }}><CoreField name="purpose" placeholder="Purpose" /><CoreField name="description" placeholder="Material description" /><CoreField name="unit" placeholder="Unit" /><CoreField name="quantity" placeholder="Quantity" type="number" /><div className="col-span-3 flex justify-end"><Btn primary>Save draft</Btn></div></form></Card>}<Card><div className="border-b border-line p-4"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests" className="h-9 w-64 rounded-lg border border-line px-3 text-[13px]" /></div>{isLoading ? <LoadingState>Loading material requests…</LoadingState> : isError ? <ErrorState>Unable to load material requests.</ErrorState> : <Table cols={['No.', 'Purpose', 'Project', 'Items', 'Needed', 'By', 'Status']} rows={requests.map((x) => [<span className="num text-steel">{x.requestNumber}</span>, x.purpose ?? '—', x.projectId, String(x.items?.length ?? 0), x.requestedForDate ? new Date(x.requestedForDate).toLocaleDateString() : '—', '—', <Chip t={x.status === 'APPROVED' ? 'green' : x.status === 'REJECTED' ? 'red' : 'amber'}>{x.status}</Chip>])} /></Card>}</>
  */
  return <><Head code="MR · LIVE" title={T(l, 'طلبات المواد', 'Material Requests')} sub={`${requests.length} requests from the API`} actions={<Btn primary onClick={() => setOpen(!open)}>+ New request</Btn>} /><Card><div className="border-b border-line p-4"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests" className="h-9 w-64 rounded-lg border border-line px-3 text-[13px]" /></div>{isLoading ? <LoadingState>Loading material requests…</LoadingState> : isError ? <ErrorState>Unable to load material requests.</ErrorState> : <Table cols={['No.', 'Purpose', 'Project', 'Items', 'Status']} rows={requests.map((x) => [<span className="num text-steel">{x.requestNumber}</span>, x.purpose ?? '—', x.projectId, String(x.items?.length ?? 0), <Chip t={x.status === 'APPROVED' ? 'green' : 'amber'}>{x.status}</Chip>])} />}</Card></>
}

function LiveApprovals({ l }: { l: Lang }) {
  const { data, isLoading, isError } = useApprovals()
  const queryClient = useQueryClient()
  const items = data ?? []
  const rows = items.map((x) => [x.entityType, <span className="num">{x.entityId.slice(0, 8)}</span>, x.projectId ?? '—', <Chip t={x.status === 'APPROVED' ? 'green' : x.status === 'REJECTED' ? 'red' : 'amber'}>{x.status}</Chip>, x.status === 'PENDING' ? <div className="flex gap-2"><button onClick={async () => { await rejectApproval(x.id, undefined); void queryClient.invalidateQueries({ queryKey: ['approvals'] }) }} className="rounded-md border border-line px-3 py-1 text-[12px]">{T(l, 'رفض', 'Reject')}</button><button onClick={async () => { await approveApproval(x.id, undefined); void queryClient.invalidateQueries({ queryKey: ['approvals'] }) }} className="rounded-md bg-navy px-3 py-1 text-[12px] text-white">{T(l, 'اعتماد', 'Approve')}</button></div> : '—'])
  return <><Head code="APPR · LIVE" title={T(l, 'الموافقات', 'Approvals')} sub={`${items.length} approval records from the API`} /><Card><div className="border-b border-line px-5 py-3 text-[12px] text-steel">{items.filter((x) => x.status === 'PENDING').length} pending approvals</div>{isLoading ? <LoadingState>Loading approvals…</LoadingState> : isError ? <ErrorState>Unable to load approvals.</ErrorState> : !items.length ? <EmptyState>No approvals found.</EmptyState> : <Table cols={['Entity', 'Record', 'Project', 'Status', 'Actions']} rows={rows} />}</Card></>
}

function OperationsScreen({ l, k }: { l: Lang; k: string }) {
  const { selectedProjectId } = useProjectContext()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const subcontractors = useSubcontractors()
  const progress = useProgress(selectedProjectId)
  const documents = useDocuments(selectedProjectId)
  const team = useTeam()
  const report = useReportSummary()
  const settings = useQuery({ queryKey: ['company-settings'], queryFn: getCompanySettings, enabled: k === 'set' })
  if (k === 'sub') return <><Head code="SUB · LIVE" title={T(l, 'مقاولو الباطن', 'Subcontractors')} sub={`${subcontractors.data?.length ?? 0} subcontractors from the API`} actions={<Btn primary onClick={() => setOpen(!open)}>+ Add subcontractor</Btn>} />{open && <Card className="mb-4" title="New subcontractor"><form className="grid grid-cols-3 gap-2 p-4" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await createSubcontractor({ code: form.get('code'), name: form.get('name'), specialties: form.get('specialties') }); setOpen(false); void queryClient.invalidateQueries({ queryKey: ['subcontractors'] }) }}><CoreField name="code" placeholder="Code" /><CoreField name="name" placeholder="Name" /><CoreField name="specialties" placeholder="Specialties" /><div className="col-span-3 flex justify-end"><Btn primary>Save subcontractor</Btn></div></form></Card>}<Card>{subcontractors.isLoading ? <LoadingState>Loading subcontractors…</LoadingState> : subcontractors.isError ? <ErrorState>Unable to load subcontractors.</ErrorState> : <Table cols={['Code', 'Name', 'Contact', 'Specialties', 'Status']} rows={(subcontractors.data ?? []).map((x) => [x.code, x.name, x.contactPerson ?? '—', x.specialties ?? '—', <Chip t="green">{x.status}</Chip>])} />}</Card></>
  if (k === 'prog') return <><Head code="PROG · LIVE" title={T(l, 'تتبع الإنجاز', 'Progress Tracking')} sub={`${progress.data?.length ?? 0} progress measurements from the API`} actions={<Btn primary onClick={() => setOpen(!open)}>+ Add update</Btn>} />{open && <Card className="mb-4" title="New progress update"><form className="grid grid-cols-3 gap-2 p-4" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await createProgress(selectedProjectId!, { progressPercent: Number(form.get('progressPercent')), measuredQuantity: Number(form.get('measuredQuantity')), measuredDate: form.get('measuredDate'), notes: form.get('notes') }); setOpen(false); void queryClient.invalidateQueries({ queryKey: ['progress', selectedProjectId] }) }}><CoreField name="progressPercent" placeholder="Progress %" type="number" /><CoreField name="measuredQuantity" placeholder="Measured quantity" type="number" /><CoreField name="measuredDate" placeholder="Date" type="date" /><CoreField name="notes" placeholder="Notes" /><div className="col-span-3 flex justify-end"><Btn primary>Save update</Btn></div></form></Card>}<Card>{progress.isLoading ? <LoadingState>Loading progress…</LoadingState> : progress.isError ? <ErrorState>Unable to load progress.</ErrorState> : <Table cols={['Date', 'Progress', 'Measured quantity', 'Notes']} rows={(progress.data ?? []).map((x) => [new Date(x.measuredDate).toLocaleDateString(), `${x.progressPercent}%`, x.measuredQuantity ?? '—', x.notes ?? '—'])} />}</Card></>
  if (k === 'doc') return <><Head code="DOC · LIVE" title={T(l, 'المستندات', 'Documents')} sub={`${documents.data?.length ?? 0} document records from the API`} actions={<Btn primary onClick={() => setOpen(!open)}>+ Add document</Btn>} />{open && <Card className="mb-4" title="Document metadata"><form className="grid grid-cols-3 gap-2 p-4" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await createDocument({ projectId: selectedProjectId, name: form.get('name'), originalName: form.get('originalName'), mimeType: form.get('mimeType'), size: Number(form.get('size')), storageKey: form.get('storageKey') }); setOpen(false); void queryClient.invalidateQueries({ queryKey: ['documents', selectedProjectId] }) }}><CoreField name="name" placeholder="Document name" /><CoreField name="originalName" placeholder="Original filename" /><CoreField name="mimeType" placeholder="MIME type" /><CoreField name="size" placeholder="Size (bytes)" type="number" /><CoreField name="storageKey" placeholder="Storage key" /><div className="col-span-3 flex justify-end"><Btn primary>Save document</Btn></div></form></Card>}<Card>{documents.isLoading ? <LoadingState>Loading documents…</LoadingState> : documents.isError ? <ErrorState>Unable to load documents.</ErrorState> : <Table cols={['Name', 'Type', 'Version', 'Linked record', 'Created']} rows={(documents.data ?? []).map((x) => [x.name, x.mimeType, x.version, x.entityType ? `${x.entityType} · ${x.entityId ?? ''}` : '—', new Date(x.createdAt).toLocaleDateString()])} />}</Card></>
  if (k === 'team') return <><Head code="TEAM · LIVE" title={T(l, 'الفريق', 'Team')} sub="Company membership and role visibility" /><Card>{team.isLoading ? <LoadingState>Loading team…</LoadingState> : team.isError ? <ErrorState>Unable to load team.</ErrorState> : <Table cols={['Name', 'Email', 'Job title', 'Role', 'Status']} rows={(team.data ?? []).map((x: any) => [x.user.name, x.user.email, x.user.jobTitle ?? '—', localizeRole(l, x.role), <Chip t={x.status === 'ACTIVE' ? 'green' : 'amber'}>{x.status}</Chip>])} />}</Card></>
  if (k === 'rep') return <><Head code="REPORT · LIVE" title={T(l, 'التقارير', 'Reports')} sub="Tenant-scoped aggregations from the reporting API" /><div className="grid grid-cols-4 gap-4"><Kpi accent label="Revised budget" value={report.data ? sar(report.data.budget.revised) : '—'} sub="SAR" /><Kpi label="Committed" value={report.data ? sar(report.data.budget.committed) : '—'} sub="SAR" /><Kpi label="Actual" value={report.data ? sar(report.data.budget.actual) : '—'} sub="SAR" /><Kpi label="Projects" value={String(report.data?.projects.length ?? 0)} sub="Live portfolio" /></div><Card className="mt-4" title="Project portfolio"><Table cols={['Code', 'Project', 'Status', 'Progress', 'Contract']} rows={(report.data?.projects ?? []).map((x) => [x.code, x.name, localizeStatus(l, x.status), `${x.progressPercent}%`, x.contractValue ? sar(Number(x.contractValue)) : '—'])} /></Card></>
  return <><Head code="SET · LIVE" title={T(l, 'الإعدادات', 'Settings')} sub="Company configuration and policy settings" /><Card title="Company settings"><form className="grid grid-cols-2 gap-3 p-5" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await updateCompanySettings({ name: form.get('name'), legalName: form.get('legalName'), defaultCurrency: form.get('defaultCurrency'), timezone: form.get('timezone'), vatNumber: form.get('vatNumber') }); void queryClient.invalidateQueries({ queryKey: ['company-settings'] }) }}><CoreField name="name" placeholder={settings.data?.name ?? 'Company name'} /><CoreField name="legalName" placeholder={settings.data?.legalName ?? 'Legal name'} /><CoreField name="defaultCurrency" placeholder={settings.data?.defaultCurrency ?? 'Currency'} /><CoreField name="timezone" placeholder={settings.data?.timezone ?? 'Timezone'} /><CoreField name="vatNumber" placeholder={settings.data?.vatNumber ?? 'VAT number'} /><div className="col-span-2 flex justify-end"><Btn primary>Save settings</Btn></div></form></Card></>
}

function Register({ l, k, go }: { l: Lang; k: string; go: (k: string) => void }) {
  if (['boq', 'cost', 'sup', 'mr'].includes(k)) return <CoreScreen l={l} k={k} />
  if (['rfq', 'po', 'grn', 'exp'].includes(k)) return <ProcurementScreen l={l} k={k} />
  const r = REG[k]
  const detail = k === 'mr' ? 'mrd' : k === 'po' ? 'pod' : k === 'rfq' ? 'cmp' : undefined
  return <>
    <Head code={r.code} title={T(l, ...r.t)} sub={T(l, `${r.rows.length} سجلات · مصفّاة حسب المشاريع النشطة`, `${r.rows.length} records · filtered by active projects`)} actions={<><Btn>{T(l, 'تصفية', 'Filter')}</Btn><Btn primary>{T(l, '+ إضافة', '+ Add')}</Btn></>} />
    <Card><div className="flex items-center gap-2 border-b border-line px-4 py-3">{[T(l, 'الكل', 'All'), T(l, 'قيد المراجعة', 'In review'), T(l, 'معتمد', 'Approved'), T(l, 'متأخر', 'Overdue')].map((t, i) =>
      <span key={t} className={`rounded-md px-3 py-1 text-[12px] ${i === 0 ? 'bg-navy text-white' : 'text-steel hover:bg-stone-100'}`}>{t}</span>)}</div>
      <Table onRow={detail ? () => go(detail) : undefined} cols={r.cols.map((c) => T(l, ...c))} rows={r.rows.map((row) => row.map((c, i) => {
        const s = String(c)
        if (i === row.length - 1) return <Chip t={s}>{T(l, ...STAT[s])}</Chip>
        if (i === 1) { const [a, e] = s.split(' — '); return <span className="font-medium">{e ? (l === 'ar' ? a : e) : s}</span> }
        return <span className={i === 0 ? 'num text-steel' : 'num'}>{s}</span>
      }))} /></Card>
  </>
}

function Placeholder({ l, k }: { l: Lang; k: string }) {
  const item = NAV.flatMap((g) => g.items).find((i) => i[0] === k)!
  return <><Head code={k.toUpperCase()} title={T(l, item[1], item[2])} sub={T(l, 'وحدة داعمة', 'Supporting module')} />
    <div className="card grid-paper grid h-72 place-items-center text-steel"><div className="text-center"><I n={k} c="mx-auto size-10 text-amber" /><p className="mt-3 text-[13px]">{T(l, 'المحتوى قيد التصميم', 'Detailed layout pending')}</p></div></div></>
}

/* ---------- login ---------- */
function Login({ l, setL, onIn, error }: { l: Lang; setL: (l: Lang) => void; onIn: (email: string, password: string) => void | Promise<void>; error?: string }) {
  return <div dir={l === 'ar' ? 'rtl' : 'ltr'} className="grid min-h-screen grid-cols-2">
    <div className="blueprint relative overflow-hidden bg-ink p-14 text-white">
      <Logo />
      <svg className="absolute inset-x-0 bottom-0 w-full opacity-60" viewBox="0 0 600 360" fill="none" stroke="#f3a54a" strokeWidth="1">
        <path d="M40 360V180h90v180M130 360V80h120v280M250 360V140h80v220M330 360V40h140v320M470 360V200h90v160" />
        <path d="M150 110h80M150 140h80M150 170h80M150 200h80M350 70h100M350 100h100M350 130h100M350 160h100" strokeDasharray="3 5" opacity=".6" />
        <path d="M400 40V10M400 10h150M520 10v40" /><circle cx="400" cy="10" r="3" fill="#f3a54a" /></svg>
      <div className="relative mt-24 max-w-md"><div className="num text-[11px] tracking-[0.3em] text-amber2">PROJECT CONTROL SYSTEM</div>
        <h1 className="mt-4 text-[38px] leading-tight font-semibold">{T(l, 'تحكّم دقيق في كل مشروع، من جدول الكميات حتى التسليم.', 'Precise control of every project, from BOQ to handover.')}</h1>
        <p className="mt-4 text-[14px] text-white/60">{T(l, 'المشتريات والتكاليف والاعتمادات والإنجاز في منصة واحدة.', 'Procurement, cost, approvals and progress in one platform.')}</p></div>
    </div>
    <div className="grid place-items-center bg-paper"><div className="w-96">
      <div className="mb-8 flex justify-end gap-1 text-[12px]">{(['ar', 'en'] as Lang[]).map((x) => <button key={x} onClick={() => setL(x)} className={`rounded px-2 py-1 ${l === x ? 'bg-navy text-white' : 'text-steel'}`}>{x === 'ar' ? 'العربية' : 'English'}</button>)}</div>
      <h2 className="text-[24px] font-semibold">{T(l, 'تسجيل الدخول', 'Sign in')}</h2><p className="mt-1 text-[13px] text-steel">{T(l, 'شركة المسار للمقاولات', 'Al Masar Contracting Co.')}</p>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</p>}
      <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); const form = new FormData(e.currentTarget); onIn(String(form.get('email') ?? ''), String(form.get('password') ?? '')) }}>
        <label className="block text-[12.5px] font-medium">{T(l, 'البريد الإلكتروني', 'Email')}<input name="email" defaultValue="k.otaibi@almasar.sa" dir="ltr" className="mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3 text-[14px] outline-none focus:border-amber focus:ring-4 focus:ring-orange-100" /></label>
        <label className="block text-[12.5px] font-medium">{T(l, 'كلمة المرور', 'Password')}<input name="password" type="password" defaultValue="Construction123!" dir="ltr" className="mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3 text-[14px] outline-none focus:border-amber focus:ring-4 focus:ring-orange-100" /></label>
        <div className="flex justify-between text-[12px]"><label className="flex items-center gap-2 text-steel"><input type="checkbox" defaultChecked className="accent-[#d9701e]" />{T(l, 'تذكرني', 'Remember me')}</label><a className="text-amber">{T(l, 'نسيت كلمة المرور؟', 'Forgot password?')}</a></div>
        <button className="h-11 w-full rounded-lg bg-navy text-[14px] font-medium text-white hover:bg-ink">{T(l, 'دخول', 'Sign in')}</button>
        <button type="button" className="h-11 w-full rounded-lg border border-line text-[13px]">{T(l, 'الدخول عبر Microsoft SSO', 'Continue with Microsoft SSO')}</button>
      </form></div></div>
  </div>
}
const Logo = () => <div className="relative flex items-center gap-3"><svg viewBox="0 0 32 32" className="size-9"><rect x="1" y="1" width="30" height="30" rx="6" fill="none" stroke="#f3a54a" /><path d="M8 24V12l8-5 8 5v12M8 24h16M13 24v-6h6v6" fill="none" stroke="#fff" strokeWidth="1.6" /></svg>
  <div><div className="text-[15px] font-semibold tracking-wide text-white">MASAR</div><div className="num text-[9.5px] tracking-[0.25em] text-white/50">PROJECT CONTROL</div></div></div>

/* ---------- shell ---------- */
function AppContent() {
  const [l, setL] = useState<Lang>('ar')
  currentLanguage = l
  setActiveLanguage(l)
  const [loginError, setLoginError] = useState<string>()
  const { session, isAuthenticated, isLoading: authLoading, signIn, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedProjectId } = useProjectContext()
  const { data: projectList } = useProjects({}, isAuthenticated)
  const { data: notifications } = useNotifications()
  const k = pathToKey(location.pathname)
  useEffect(() => {
    if (!isAuthenticated || !projectList || !location.pathname.startsWith('/projects/')) return
    const isAuthorized = projectList.items.some((project) => project.id === selectedProjectId)
    if (!isAuthorized && projectList.items[0]) navigate(`/projects/${projectList.items[0].id}`, { replace: true })
  }, [isAuthenticated, location.pathname, navigate, projectList, selectedProjectId])
  const go = (next: string) => {
    const path = keyToPath[next] ?? '/dashboard'
    const scoped = ['pdash', 'boq', 'cost', 'exp', 'mr', 'rfq', 'cmp', 'po', 'grn', 'prog']
    if (!scoped.includes(next)) return navigate(path)
    const projectId = selectedProjectId ?? projectList?.items[0]?.id
    if (!projectId) return navigate('/projects')
    navigate(path.replace(':projectId', projectId))
  }
  const login = (email: string, password: string) => {
    setLoginError(undefined)
    return signIn(email, password).then(() => navigate('/dashboard')).catch((error: unknown) => {
      const message = error instanceof ApiError
        ? error.status === 401
          ? T(l, 'بيانات الدخول غير صحيحة.', 'Invalid email or password.')
          : error.status && error.status >= 500
            ? T(l, 'حدث خطأ في خادم المصادقة.', 'Authentication server error.')
            : T(l, 'تعذر إكمال طلب المصادقة.', 'The authentication request could not be completed.')
        : T(l, 'تعذر الاتصال بخادم المصادقة.', 'Cannot connect to the authentication server.')
      setLoginError(message)
    })
  }
  const loginScreen = <Login l={l} setL={setL} onIn={login} error={loginError} />
  if (authLoading) return loginScreen
  if (!isAuthenticated) return location.pathname === '/login' ? loginScreen : <Navigate to="/login" replace />
  if (location.pathname === '/login') return <Navigate to="/dashboard" replace />
  const active = (x: string) => x === k || (x === 'proj' && k === 'pdash') || (x === 'mr' && k === 'mrd') || (x === 'po' && k === 'pod')
  const openProject = (projectId: string) => navigate(`/projects/${projectId}`)
  const screen = k === 'dash' ? <Executive l={l} go={go} openProject={openProject} /> : k === 'proj' ? <Projects l={l} go={go} openProject={openProject} /> : k === 'pdash' ? <ProjectDash l={l} /> : k === 'supd' ? <LiveSupplierDetail l={l} /> : k === 'mrd' ? <LiveMRDetailComplete l={l} /> : k === 'expd' ? <ExpenseDetailScreen l={l} />
     : k === 'cmp' ? <LiveCompare l={l} /> : k === 'pod' ? <LivePODetail l={l} /> : k === 'grnd' ? <LiveReceiptDetail l={l} /> : k === 'appr' ? <LiveApprovals l={l} /> : k === 'notifications' ? <LiveNotifications l={l} /> : k === 'doc' ? <LiveDocuments l={l} /> : k === 'audit' ? <LiveAuditLog l={l} /> : k === 'set' ? <SettingsScreen l={l} /> : k === 'team' ? <TeamScreen l={l} /> : ['sub', 'prog', 'rep'].includes(k) ? <OperationsScreen l={l} k={k} /> : ['boq', 'cost', 'sup', 'mr'].includes(k) ? <CoreScreen l={l} k={k} /> : ['rfq', 'po', 'grn', 'exp'].includes(k) ? <ProcurementScreen l={l} k={k} /> : REG[k] ? <Register l={l} k={k} go={go} /> : <Placeholder l={l} k={k} />
  const projectRows = projectList ? toProjectRows(projectList.items) : []
  const layoutProjectRows = projectRows.map((row) => [row[9], ...row.slice(1)] as unknown as typeof row)
  const isCompanyAdmin = session?.user.roles.some((role) => role === 'ADMIN' || role === 'OWNER_EXECUTIVE') ?? false
  const visibleNav = NAV.map((group) => ({ ...group, items: group.items.filter(([key]) => isCompanyAdmin || (key !== 'set' && key !== 'audit')) })).filter((group) => group.items.length > 0)
  return <AppLayout l={l} nav={visibleNav} projects={layoutProjectRows} selectedProjectId={selectedProjectId} onProjectSelect={(projectId) => {
    if (!projectId) return navigate('/projects')
    const currentPath = `${location.pathname}${location.search}`
    navigate(replaceProjectContextPath(currentPath, projectId) ?? `/projects/${projectId}`)
  }} userName={session?.user.name ?? ''} userJobTitle={session?.user.jobTitle ?? session?.user.roles[0] ?? ''} unreadNotifications={(notifications ?? []).filter((item) => !item.readAt).length} active={active} go={go} setLanguage={() => setL(l === 'ar' ? 'en' : 'ar')} signOut={() => { void signOut(); navigate('/login') }} translate={T} Icon={I} Logo={Logo}>{screen}</AppLayout>
}

export default function App() {
  return <BrowserRouter><ProjectProvider><Routes>{APP_ROUTE_PATTERNS.map((path) => <Route key={path} path={path} element={<AppContent />} />)}<Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes></ProjectProvider></BrowserRouter>
}
