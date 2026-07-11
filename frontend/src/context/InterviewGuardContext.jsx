import React, { createContext, useContext, useState } from 'react'

/**
 * InterviewGuardContext
 *
 * Tracks whether a formal interview is currently active so the
 * Layout can intercept navigation and warn the user before leaving.
 *
 * Usage in CodingInterview.jsx:
 *   const { setActiveInterview } = useInterviewGuard()
 *   useEffect(() => {
 *     if (interviewId) setActiveInterview(interviewId)
 *     return () => setActiveInterview(null)
 *   }, [interviewId])
 */
const InterviewGuardContext = createContext(null)

export function InterviewGuardProvider({ children }) {
  const [activeInterviewId, setActiveInterviewId] = useState(null)

  const setActiveInterview = (id) => setActiveInterviewId(id)
  const clearActiveInterview = () => setActiveInterviewId(null)

  return (
    <InterviewGuardContext.Provider value={{ activeInterviewId, setActiveInterview, clearActiveInterview }}>
      {children}
    </InterviewGuardContext.Provider>
  )
}

export function useInterviewGuard() {
  const ctx = useContext(InterviewGuardContext)
  if (!ctx) throw new Error('useInterviewGuard must be used inside InterviewGuardProvider')
  return ctx
}
