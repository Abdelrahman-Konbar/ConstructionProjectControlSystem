import type { ProjectStatus } from '@/types/domain'
import { apiRequest } from './client'

export interface ApiProject { id: string; companyId: string; code: string; name: string; clientName?: string | null; location?: string | null; status: ProjectStatus; contractValue?: string | null; budgetValue?: string | null; startDate?: string | null; plannedEndDate?: string | null; actualEndDate?: string | null; progressPercent: string; description?: string | null; projectManager?: { id: string; name: string; jobTitle?: string | null } | null; sites: Array<{ id: string; code: string; name: string; location?: string | null; status: string }> }
export interface ProjectList { items: ApiProject[]; page: number; limit: number; total: number; totalPages: number }
export interface ProjectListParams { page?: number; limit?: number; search?: string; status?: ProjectStatus }
export function listProjects(params: ProjectListParams = {}) { return apiRequest<ProjectList>('/projects', { query: params as Record<string, string | number | boolean | undefined> }) }
export function getProject(id: string) { return apiRequest<ApiProject>(`/projects/${id}`) }
export function createProject(body: Record<string, unknown>) { return apiRequest<ApiProject>('/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) }
export function toProjectRows(items: ApiProject[]) { return items.map((project) => [project.code, project.name, project.name, project.location ?? '—', project.location ?? '—', Number(project.contractValue ?? 0) / 1_000_000, Number(project.progressPercent), 0, project.status === 'ACTIVE' ? 'green' : project.status === 'AT_RISK' ? 'amber' : project.status === 'COMPLETED' || project.status === 'CLOSED' ? 'green' : project.status === 'PLANNING' ? 'blue' : 'red', project.id] as const) }
