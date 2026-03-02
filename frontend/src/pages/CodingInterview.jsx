import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Play, Clock, AlertCircle, Lightbulb } from 'lucide-react'
import { Button } from '../components/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card'
import { interviews, companies } from '../services/api'

export default function CodingInterview() {
  const [code, setCode] = useState('')
  const [timeLeft, setTimeLeft] = useState(1800)
  const [problem, setProblem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [interviewId, setInterviewId] = useState(null)
  const [error, setError] = useState('')
  const [language, setLanguage] = useState('cpp') // Default language
  const [isRunning, setIsRunning] = useState(false)
  const [isGettingHint, setIsGettingHint] = useState(false)
  const [hint, setHint] = useState('')
  const [runResult, setRunResult] = useState(null)
  const [customInput, setCustomInput] = useState('')
  const [useCustomInput, setUseCustomInput] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const getBoilerplate = (lang) => {
    switch (lang) {
      case 'cpp':
        return '#include <iostream>\nusing namespace std;\n\nint main() {\n  // Read input and print output\n  return 0;\n}';
      case 'java':
        return 'import java.util.*;\n\npublic class Solution {\n  public static void main(String[] args) {\n    // Read input and print output\n  }\n}';
      case 'python':
        return 'import sys\n\ndef main():\n  # Read input from sys.stdin and default print\n  pass\n\nif __name__ == "__main__":\n  main()';
      default:
        return '';
    }
  }

  // Effect to update code when language changes, only if code is empty or matches boilerplate
  useEffect(() => {
    const isBoilerplate = Object.values({
      cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n  // Read input and print output\n  return 0;\n}',
      java: 'import java.util.*;\n\npublic class Solution {\n  public static void main(String[] args) {\n    // Read input and print output\n  }\n}',
      python: 'import sys\n\ndef main():\n  # Read input from sys.stdin and default print\n  pass\n\nif __name__ == "__main__":\n  main()'
    }).includes(code) || !code;

    if (isBoilerplate) setCode(getBoilerplate(language));
  }, [language]);


  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true)

        let currentInterviewId = location.state?.interviewId;
        const storedInterviewId = sessionStorage.getItem('currentInterviewId');

        // If navigated with a new explicit ID, clear the cache
        if (currentInterviewId && currentInterviewId !== storedInterviewId) {
          sessionStorage.removeItem('currentProblem');
          sessionStorage.removeItem('currentInterviewId');
          sessionStorage.removeItem('interviewTimeLeft');
          sessionStorage.removeItem('currentTopic');
        }

        // Restore interview ID if no explicit state
        if (!currentInterviewId && storedInterviewId) {
          currentInterviewId = storedInterviewId;
        }

        if (!currentInterviewId) {
          // Fetch companies to get a valid UUID
          const companiesRes = await companies.getAll()
          const companyList = companiesRes.data.companies
          if (!companyList || companyList.length === 0) {
            throw new Error('No companies found in database.')
          }

          // Find a company that actually has questions available (e.g. Google)
          const validCompany = companyList.find(c => c.total_questions > 0 || c.name === 'Google') || companyList[0]
          const selectedCompanyId = validCompany.id // Use a valid company for demo

          const res = await interviews.start(selectedCompanyId)
          currentInterviewId = res.data.interview.id
        }

        setInterviewId(currentInterviewId)
        sessionStorage.setItem('currentInterviewId', currentInterviewId)

        // Try getting cached problem for this interview session
        const cachedProblem = sessionStorage.getItem('currentProblem');
        if (cachedProblem) {
          setProblem(JSON.parse(cachedProblem));
        } else {
          const currentTopic = location.state?.topic || sessionStorage.getItem('currentTopic') || '';
          if (currentTopic) sessionStorage.setItem('currentTopic', currentTopic);

          const qRes = await interviews.getNextQuestion(currentInterviewId, currentTopic)
          const q = qRes.data.question
          setProblem(q)
          sessionStorage.setItem('currentProblem', JSON.stringify(q));
        }

        // Restore active time remaining
        const cachedTime = sessionStorage.getItem('interviewTimeLeft');
        if (cachedTime) {
          setTimeLeft(parseInt(cachedTime, 10));
        }

      } catch (err) {
        console.error('Failed to load problem:', err)
        setError(err.response?.data?.error || 'Failed to load interview problem. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProblem()
  }, [location.state])

  const handleRunCode = async () => {
    if (!problem) return;
    setIsRunning(true);
    setRunResult(null);
    try {
      const { submissions } = await import('../services/api');
      const res = await submissions.runCode(problem.id, code, language, useCustomInput ? customInput : undefined);
      setRunResult(res.data.execution);
    } catch (err) {
      setRunResult({ error: err.response?.data?.details || err.response?.data?.error || err.message || 'Failed to execute code' });
    } finally {
      setIsRunning(false);
    }
  }

  const handleGetHint = async () => {
    if (!problem || !code) return;
    setIsGettingHint(true);
    setHint('');
    try {
      const { submissions } = await import('../services/api');
      const res = await submissions.generateHint(problem.id, code, language);
      setHint(res.data.hint);
    } catch (err) {
      console.error(err);
      setHint("Failed to get hint. Please try again.");
    } finally {
      setIsGettingHint(false);
    }
  }

  // Timer effect
  useEffect(() => {
    if (loading || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const nextTime = prev - 1;
        sessionStorage.setItem('interviewTimeLeft', nextTime);
        return nextTime;
      });
    }, 1000)
    return () => clearInterval(interval)
  }, [loading, timeLeft])

  // Auto-submit when time is up
  useEffect(() => {
    if (timeLeft === 0 && !loading && problem && interviewId) {
      handleSubmit();
    }
  }, [timeLeft, loading, problem, interviewId]);

  const handleSubmit = () => {
    if (!problem || !interviewId) return;

    // Navigate to explanation page with state
    navigate('/explanation', {
      state: {
        interviewId,
        questionId: problem.id,
        code,
        language,

        questionDescription: problem.description
      }
    })
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex justify-center items-center text-white">Loading Interview...</div>
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 text-center">
        <AlertCircle size={48} className="text-danger mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6">
        {/* Problem Statement */}
        <div className="space-y-6">
          <Card glass>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle>{problem.title}</CardTitle>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${problem.difficulty === 'Easy' ? 'bg-success/20 text-success' :
                  problem.difficulty === 'Medium' ? 'bg-warning/20 text-warning' :
                    'bg-danger/20 text-danger'
                  }`}>
                  {problem.difficulty}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-bold mb-2">Description</h3>
                <div
                  className="text-gray-400 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: problem.description }}
                />
              </div>

              {problem.sample_input && (
                <div>
                  <h3 className="font-bold mb-3">Example</h3>
                  <div className="bg-surface rounded-lg p-4 space-y-2 mb-3">
                    <p className="text-sm"><span className="text-primary font-bold">Input:</span> {problem.sample_input}</p>
                    <p className="text-sm"><span className="text-secondary font-bold">Output:</span> {problem.sample_output}</p>
                  </div>
                </div>
              )}

              {problem.constraints && problem.constraints.length > 0 && (
                <div>
                  <h3 className="font-bold mb-3">Constraints</h3>
                  <ul className="space-y-2">
                    {(Array.isArray(problem.constraints)
                      ? problem.constraints
                      : typeof problem.constraints === 'string'
                        ? problem.constraints.split(',').map(s => s.trim()).filter(Boolean)
                        : []
                    ).map((constraint, idx) => (
                      <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {constraint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {problem.input_format && (
                <div>
                  <h3 className="font-bold mb-3">Input Format</h3>
                  <div className="bg-surface rounded-lg p-4 space-y-2 mb-3 border border-border">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{problem.input_format}</p>
                  </div>
                </div>
              )}

              {problem.output_format && (
                <div>
                  <h3 className="font-bold mb-3">Output Format</h3>
                  <div className="bg-surface rounded-lg p-4 space-y-2 mb-3 border border-border">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{problem.output_format}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Code Editor & Controls */}
        < div className="space-y-6" >
          {/* Timer */}
          < Card glass className="bg-gradient-to-r from-warning/10 to-danger/10" >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={24} className="text-warning" />
                <div>
                  <p className="text-sm text-gray-400">Time Remaining</p>
                  <p className="text-2xl font-bold text-warning">{formatTime(timeLeft)}</p>
                </div>
              </div>
              <AlertCircle size={24} className="text-warning" />
            </div>
          </Card >

          {/* Code Editor */}
          < Card glass className="overflow-hidden flex flex-col" >
            <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Solution</CardTitle>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-surface text-sm border border-border rounded px-2 py-1 outline-none text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="python">Python</option>
              </select>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-96 bg-surface text-foreground font-mono text-sm p-4 resize-none border-none focus:outline-none focus:ring-2 focus:ring-primary rounded-none"
                placeholder="Write your solution here..."
                spellCheck={false}
              />
            </CardContent>
          </Card >

          {/* Custom Testcase Area */}
          < Card glass className="p-4" >
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="useCustomInput"
                checked={useCustomInput}
                onChange={(e) => setUseCustomInput(e.target.checked)}
                className="w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary focus:ring-1"
              />
              <label htmlFor="useCustomInput" className="text-sm cursor-pointer select-none font-bold">Use Custom Testcase</label>
            </div>
            {
              useCustomInput && (
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="w-full h-24 bg-surface text-foreground font-mono text-sm p-3 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary mt-2"
                  placeholder="Enter custom input here..."
                  spellCheck={false}
                />
              )
            }
          </Card >

          {/* Actions */}
          < div className="flex gap-3" >
            <Button
              variant="outline"
              className="flex-1 gap-2 border border-warning text-warning hover:bg-warning hover:text-white"
              onClick={handleGetHint}
              disabled={isGettingHint}
            >
              <Lightbulb size={18} />
              {isGettingHint ? 'Thinking...' : 'Ask for Hint'}
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleRunCode}
              disabled={isRunning}
            >
              <Play size={18} />
              {isRunning ? 'Running...' : 'Run Code (Locally)'}
            </Button>
            <Button onClick={handleSubmit} className="flex-1 gap-2 border border-primary text-primary hover:bg-primary hover:text-white" variant="outline">
              Submit Solution
            </Button>
          </div >

          {hint && (
            <Card glass className="bg-warning/10 border-warning/30 p-4">
              <div className="flex gap-3 items-start">
                <Lightbulb className="text-warning shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="text-warning font-bold mb-1">Interviewer Nudge</h4>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{hint}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Console Output */}
          {
            runResult && (
              <Card glass className="bg-surface/50 border-border">
                <CardHeader className="py-3 px-4 border-b border-border">
                  <CardTitle className="text-sm">Console Output</CardTitle>
                </CardHeader>
                <CardContent className="p-4 font-mono text-sm max-h-64 overflow-y-auto">
                  {runResult.error && runResult.error.includes('Failed Test Case') ? (
                    <div>
                      <span className="text-warning font-bold mb-2 block">Test Case Failed:</span>
                      <div className="text-gray-300 whitespace-pre-wrap bg-surface p-3 rounded border border-border">
                        {runResult.error}
                      </div>
                    </div>
                  ) : runResult.error ? (
                    <div>
                      <span className="text-danger font-bold mb-2 block">Compiler / Execution Error:</span>
                      <div className="text-danger whitespace-pre-wrap bg-danger/10 p-3 rounded border border-danger/20">
                        {runResult.error}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {runResult.passed_testcases !== undefined ? (
                        (!useCustomInput || (useCustomInput && runResult.expected_output)) ? (
                          <p className={
                            (!useCustomInput && runResult.passed_testcases === runResult.total_testcases) ||
                              (useCustomInput && runResult.expected_output?.trim() === (runResult.actual_output || '').trim())
                              ? 'text-success font-bold'
                              : 'text-danger font-bold'
                          }>
                            Passed: {useCustomInput && runResult.expected_output?.trim() === (runResult.actual_output || '').trim() ? 1 : !useCustomInput ? runResult.passed_testcases : 0} / {runResult.total_testcases} testcases
                          </p>
                        ) : (
                          <p className="text-warning font-bold">Execution Completed</p>
                        )
                      ) : (
                        <p className="text-success font-bold">Execution Completed</p>
                      )}

                      {useCustomInput && (
                        <>
                          {runResult.expected_output ? (
                            runResult.expected_output.trim() === (runResult.actual_output || '').trim() ? (
                              <p className="text-success text-xs mt-1 font-bold">Output matched the reference solution!</p>
                            ) : (
                              <p className="text-danger text-xs mt-1 font-bold block whitespace-pre-wrap">
                                Output did not match the reference solution.
                                {'\n'}Expected: {runResult.expected_output}
                              </p>
                            )
                          ) : (
                            <p className="text-warning text-xs mt-1">Output cannot be verified (reference code does not output to stdout).</p>
                          )}
                        </>
                      )}

                      {!useCustomInput && runResult.passed_testcases === runResult.total_testcases && (
                        <p className="text-success text-xs mt-1 font-bold">All test cases passed!</p>
                      )}

                      <p className="text-gray-400 mt-2 mb-2">Runtime: {runResult.runtime_ms?.toFixed(2) || 0} ms</p>

                      {runResult.actual_output && (
                        <div className="mt-3">
                          <p className="text-gray-300 font-bold mb-1">Standard Output:</p>
                          <div className="bg-background rounded p-2 text-gray-300 whitespace-pre-wrap border border-border">
                            {runResult.actual_output}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          }

          {/* Info Box */}
          <Card glass>
            <div className="flex gap-3">
              <AlertCircle size={20} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Next Step</p>
                <p className="text-xs text-gray-400">After submitting, you'll explain your approach and receive AI feedback.</p>
              </div>
            </div>
          </Card>
        </div >
      </div >
    </div >
  )
}
