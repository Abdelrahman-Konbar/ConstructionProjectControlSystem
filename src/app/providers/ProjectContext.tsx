import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface ProjectContextValue { selectedProjectId?: string }
const ProjectContext = createContext<ProjectContextValue>({})

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const selectedProjectId = pathname.match(/^\/projects\/([^/]+)/)?.[1]
  const value = useMemo(() => ({ selectedProjectId }), [selectedProjectId])
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProjectContext() { return useContext(ProjectContext) }
