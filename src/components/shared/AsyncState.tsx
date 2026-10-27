import type { ReactNode } from 'react'
import { getActiveLanguage, localizeUiText } from '@/i18n/translations'

const text = (value: ReactNode, fallback: string) => typeof value === 'string' ? localizeUiText(getActiveLanguage(), value) : value ?? localizeUiText(getActiveLanguage(), fallback)
export function LoadingState({ children = 'Loading…' }: { children?: ReactNode }) { return <div className="card grid h-40 place-items-center text-[13px] text-steel">{text(children, 'Loading…')}</div> }
export function ErrorState({ children = 'Something went wrong.' }: { children?: ReactNode }) { return <div className="card grid h-40 place-items-center text-[13px] text-red-700">{text(children, 'Something went wrong.')}</div> }
export function EmptyState({ children = 'No records found.' }: { children?: ReactNode }) { return <div className="card grid h-40 place-items-center text-[13px] text-steel">{text(children, 'No records found.')}</div> }
