import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Check, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { practice } from '../services/api';

export default function ProblemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

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
        setLoading(true);
        const res = await practice.getProblemDetails(id);
        setProblem(res.data.problem);
      } catch (err) {
        console.error('Failed to load problem:', err);
        setError(err.response?.data?.error || 'Failed to load problem details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [id]);

  const handleSubmit = async () => {
    if (!problem) return;
    setIsSubmitting(true);
    setSubmitResult(null);
    
    try {
      const res = await practice.submitSolution(id, code, language);
      setSubmitResult(res.data);
    } catch (err) {
      setSubmitResult({ 
        status: 'error',
        error: err.response?.data?.details || err.response?.data?.error || err.message || 'Failed to execute code' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex justify-center items-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
          <AlertCircle size={48} className="text-danger mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={() => navigate('/practice')}>Return to Practice List</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 p-4 md:p-6">
        <button 
          onClick={() => navigate('/practice')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Problems
        </button>
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
          {/* Left Panel: Problem Statement */}
          <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2 h-full">
            <Card glass className="h-full border-border/50">
              <CardHeader className="sticky top-0 bg-surface/80 backdrop-blur-md z-10 border-b border-border/50 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>{problem.title}</CardTitle>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${problem.difficulty === 'easy' ? 'bg-green-400/20 text-green-400' :
                    problem.difficulty === 'medium' ? 'bg-yellow-400/20 text-yellow-400' :
                      'bg-red-400/20 text-red-400'
                    }`}>
                    {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <div
                    className="text-gray-300 whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: problem.description }}
                  />
                </div>

                {problem.sample_input && (
                  <div>
                    <h3 className="font-bold text-white mb-3">Example</h3>
                    <div className="bg-surface/50 rounded-lg p-4 space-y-2 mb-3 border border-border/50">
                      <p className="text-sm"><span className="text-primary font-bold">Input:</span> <span className="font-mono text-gray-300">{problem.sample_input}</span></p>
                      <p className="text-sm"><span className="text-secondary font-bold">Output:</span> <span className="font-mono text-gray-300">{problem.sample_output}</span></p>
                    </div>
                  </div>
                )}

                {problem.constraints && problem.constraints.length > 0 && (
                  <div>
                    <h3 className="font-bold text-white mb-3">Constraints</h3>
                    <ul className="space-y-2 bg-surface/30 p-4 rounded-lg border border-border/50">
                      {(Array.isArray(problem.constraints)
                        ? problem.constraints
                        : typeof problem.constraints === 'string'
                          ? problem.constraints.split('\n').map(s => s.trim()).filter(Boolean)
                          : []
                      ).map((constraint, idx) => (
                        <li key={idx} className="text-sm text-gray-400 flex items-start gap-2 font-mono">
                          <span className="text-primary mt-1">•</span>
                          {constraint}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Code Editor & Controls */}
          <div className="space-y-6 flex flex-col h-full">
            <Card glass className="flex-1 flex flex-col border-border/50">
              <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-10">
                <CardTitle className="text-lg">Solution</CardTitle>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-surface text-sm border border-border rounded-lg px-3 py-1.5 outline-none text-foreground focus:ring-2 focus:ring-primary transition-all cursor-pointer"
                >
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                </select>
              </CardHeader>
              <CardContent className="flex-1 p-0 flex flex-col">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 w-full bg-surface/30 text-foreground font-mono text-sm p-4 resize-none border-none focus:outline-none focus:ring-0 rounded-b-xl"
                  placeholder="Write your solution here..."
                  spellCheck={false}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 shrink-0">
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="flex-1 gap-2 border border-primary text-primary hover:bg-primary hover:text-white transition-all py-6" 
                variant="outline"
              >
                {isSubmitting ? (
                  <><Loader2 size={18} className="animate-spin" /> Evaluating...</>
                ) : (
                  <><Check size={18} /> Submit Solution</>
                )}
              </Button>
            </div>

            {/* Console Output */}
            {submitResult && (
              <Card glass className="bg-surface/50 border-border/50 shrink-0">
                <CardHeader className="py-3 px-4 border-b border-border/50 flex flex-row justify-between items-center">
                  <CardTitle className="text-sm">Submission Result</CardTitle>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    submitResult.status === 'solved' ? 'bg-success/20 text-success' :
                    submitResult.status === 'error' ? 'bg-danger/20 text-danger' :
                    'bg-warning/20 text-warning'
                  }`}>
                    {submitResult.status === 'solved' ? 'Accepted' : 
                     submitResult.status === 'error' ? 'Error' : 
                     'Wrong Answer'}
                  </span>
                </CardHeader>
                <CardContent className="p-4 font-mono text-sm max-h-48 overflow-y-auto custom-scrollbar">
                  {submitResult.error && submitResult.error.includes('Failed Test Case') ? (
                    <div>
                      <span className="text-warning font-bold mb-2 block">Test Case Failed:</span>
                      <div className="text-gray-300 whitespace-pre-wrap bg-surface p-3 rounded border border-border">
                        {submitResult.error}
                      </div>
                    </div>
                  ) : submitResult.error ? (
                    <div>
                      <span className="text-danger font-bold mb-2 block">Error:</span>
                      <div className="text-danger whitespace-pre-wrap bg-danger/10 p-3 rounded border border-danger/20">
                        {submitResult.error}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className={submitResult.status === 'solved' ? 'text-success font-bold' : 'text-warning font-bold'}>
                        Passed: {submitResult.passed_testcases} / {submitResult.total_testcases} testcases
                      </p>
                      
                      {submitResult.runtime_ms !== undefined && (
                        <p className="text-gray-400">
                          Runtime: <span className="text-white">{submitResult.runtime_ms.toFixed(2)} ms</span>
                        </p>
                      )}
                      
                      {submitResult.memory_mb !== undefined && (
                        <p className="text-gray-400">
                          Memory: <span className="text-white">{submitResult.memory_mb.toFixed(2)} MB</span>
                        </p>
                      )}
                      
                      {submitResult.status === 'solved' && (
                        <p className="text-success mt-2 text-xs">Great job! Your solution passed all tests.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
