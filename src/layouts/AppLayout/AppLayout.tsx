import type { ComponentType, ReactNode } from 'react'
import type { Lang } from '@/i18n/translations'

type NavGroup = { g: [string, string]; items: [string, string, string][] }
type ProjectRow = readonly [string, string, string, string, string, number, number, number, string, string]
type Icon = ComponentType<{ n: string; c?: string }>

interface AppLayoutProps {
  l: Lang; nav: NavGroup[]; projects: readonly ProjectRow[]; selectedProjectId?: string; onProjectSelect: (projectId?: string) => void; userName: string; userJobTitle: string; unreadNotifications: number; active: (key: string) => boolean; go: (key: string) => void; setLanguage: () => void; signOut: () => void; translate: (lang: Lang, ar: string, en: string) => string; Icon: Icon; Logo: ComponentType; children: ReactNode
}

export function AppLayout({ l, nav, projects, selectedProjectId, onProjectSelect, userName, userJobTitle, unreadNotifications, active, go, setLanguage, signOut, translate: T, Icon: I, Logo, children }: AppLayoutProps) {
  return <div dir={l === 'ar' ? 'rtl' : 'ltr'} className="flex min-h-screen">
    <aside className="blueprint sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-ink text-white/70">
      <div className="border-b border-white/10 px-5 py-5"><Logo /></div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">{nav.map((g) => <div key={g.g[0]}>
        <div className="num mb-1.5 px-3 text-[10px] tracking-[0.2em] text-white/35 uppercase">{T(l, ...g.g)}</div>
        {g.items.map(([id, ar, en]) => <button key={id} onClick={() => go(id)} className={`relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] transition ${active(id) ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>
          {active(id) && <span className="absolute inset-y-1.5 start-0 w-0.5 rounded bg-amber" />}<I n={id} />{T(l, ar, en)}
          {id === 'appr' && unreadNotifications > 0 && <span className="num ms-auto rounded bg-amber px-1.5 text-[10.5px] text-white">{unreadNotifications}</span>}</button>)}</div>)}</nav>
      <div className="border-t border-white/10 p-4 text-[12px]"><div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-amber font-semibold text-white">خ</span>
        <div><div className="text-white">{userName}</div><div className="text-white/45">{userJobTitle}</div></div></div></div>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-line bg-sand/85 px-8 backdrop-blur">
        <select value={selectedProjectId ?? ''} onChange={(event) => onProjectSelect(event.target.value || undefined)} className="h-9 rounded-lg border border-line bg-paper px-3 text-[13px]"><option value="">{T(l, 'كل المشاريع', 'All projects')}</option>{projects.map((p) => <option key={p[0]} value={p[0]}>{l === 'ar' ? p[1] : p[2]}</option>)}</select>
        <div className="relative w-96"><I n="search" c="absolute top-2.5 start-3 size-4 text-steel" /><input placeholder={T(l, 'ابحث عن مشروع، أمر شراء، مورد…', 'Search projects, POs, suppliers…')} className="h-9 w-full rounded-lg border border-line bg-paper ps-9 pe-12 text-[13px] outline-none focus:border-amber" /><kbd className="num absolute top-2 end-2 rounded border border-line px-1.5 text-[10px] text-steel">⌘K</kbd></div>
        <div className="ms-auto flex items-center gap-2">
          <button onClick={setLanguage} className="h-9 rounded-lg border border-line bg-paper px-3 text-[12px] font-medium">{l === 'ar' ? 'EN' : 'ع'}</button>
          <button onClick={() => go('notifications')} className="relative grid size-9 place-items-center rounded-lg border border-line bg-paper"><I n="bell" c="size-4" />{unreadNotifications > 0 && <span className="absolute top-1.5 end-1.5 size-2 rounded-full bg-amber ring-2 ring-paper" />}</button>
          <button onClick={signOut} className="h-9 px-2 text-[12px] text-steel">{T(l, 'خروج', 'Sign out')}</button></div>
      </header>
      <main className="grid-paper min-h-[calc(100vh-4rem)] px-8 py-7">{children}</main>
    </div>
  </div>
}
