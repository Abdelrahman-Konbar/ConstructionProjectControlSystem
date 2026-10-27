import type { Project } from '@/types/domain'

export const mockProjects: Project[] = [
  { id: 'PRJ-2407', companyId: 'company-al-masar', code: 'PRJ-2407', name: 'Al Reem Residential Tower', city: 'Riyadh', contractValue: 184.5, progress: 62, spent: 58, status: 'on-track' },
  { id: 'PRJ-2411', companyId: 'company-al-masar', code: 'PRJ-2411', name: 'Business Oasis Complex', city: 'Jeddah', contractValue: 96.2, progress: 41, spent: 47, status: 'at-risk' },
  { id: 'PRJ-2415', companyId: 'company-al-masar', code: 'PRJ-2415', name: 'Al Nakheel Specialist Hospital', city: 'Dammam', contractValue: 241, progress: 28, spent: 35, status: 'delayed' },
  { id: 'PRJ-2420', companyId: 'company-al-masar', code: 'PRJ-2420', name: 'Horizon Model Schools', city: 'Khobar', contractValue: 38.7, progress: 83, spent: 80, status: 'on-track' },
  { id: 'PRJ-2423', companyId: 'company-al-masar', code: 'PRJ-2423', name: 'Port Logistics Warehouses', city: 'Jubail', contractValue: 52.4, progress: 12, spent: 10, status: 'mobilizing' },
]

/** Legacy presentation rows retained until the dashboard is connected to the API. */
export const mockProjectRows: readonly (readonly [string, string, string, string, string, number, number, number, 'green' | 'amber' | 'red' | 'blue'])[] = [
  ['PRJ-2407', 'برج الريم السكني', 'Al Reem Residential Tower', 'الرياض', 'Riyadh', 184.5, 62, 58, 'green'],
  ['PRJ-2411', 'مجمع واحة الأعمال', 'Business Oasis Complex', 'جدة', 'Jeddah', 96.2, 41, 47, 'amber'],
  ['PRJ-2415', 'مستشفى النخيل التخصصي', 'Al Nakheel Specialist Hospital', 'الدمام', 'Dammam', 241.0, 28, 35, 'red'],
  ['PRJ-2420', 'مدارس الأفق النموذجية', 'Horizon Model Schools', 'الخبر', 'Khobar', 38.7, 83, 80, 'green'],
  ['PRJ-2423', 'مستودعات الميناء اللوجستية', 'Port Logistics Warehouses', 'الجبيل', 'Jubail', 52.4, 12, 10, 'blue'],
] as const
