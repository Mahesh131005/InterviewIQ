import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Book, Play, AlertCircle } from 'lucide-react'
import { Button } from '../components/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card'
import { companies, interviews } from '../services/api'

const TOPICS = [
    'Array', 'String', 'Linked List', 'Tree', 'Graph',
    'Dynamic Programming', 'Binary Search', 'Sorting',
    'Hash Table', 'Math'
]

export default function InterviewSetup() {
    const [companyList, setCompanyList] = useState([])
    const [selectedCompany, setSelectedCompany] = useState('')
    const [selectedTopic, setSelectedTopic] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await companies.getAll()
                setCompanyList(res.data.companies || [])
            } catch (err) {
                console.error('Failed to fetch companies:', err)
                setError('Failed to load companies.')
            } finally {
                setLoading(false)
            }
        }
        fetchCompanies()
    }, [])

    const handleStart = async () => {
        if (!selectedCompany && !selectedTopic) {
            setError('Please select either a company or a topic to practice.')
            return
        }

        setSubmitting(true)
        setError('')
        try {
            // If only topic is selected, we might need a dummy company or backend support
            // For now, if no company is selected, default to the first available company for context
            const companyId = selectedCompany || (companyList[0]?.id)

            // Start interview (topic is passed as a preference)
            const res = await interviews.start(companyId, selectedTopic)
            navigate('/interviews', { state: { interviewId: res.data.interview.id, topic: selectedTopic } }) // Redirects to the active coding interview
        } catch (err) {
            console.error('Failed to start interview:', err)
            setError(err.response?.data?.error || 'Failed to start interview. Please try again.')
            setSubmitting(false)
        }
    }

    if (loading) {
        return <div className="min-h-screen bg-background flex justify-center items-center text-white">Loading...</div>
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold mb-2">Interview Setup</h1>
                    <p className="text-gray-400">Choose your practice target</p>
                </div>

                {error && (
                    <div className="p-4 mb-6 bg-danger/10 border border-danger/50 text-danger rounded-lg flex items-center gap-3 justify-center">
                        <AlertCircle size={20} />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Company Selection */}
                    <Card glass className={`cursor-pointer transition-all ${selectedCompany ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`}
                        onClick={() => { setSelectedTopic(''); setSelectedCompany(selectedCompany ? '' : companyList[0]?.id) }}>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                                    <Building2 size={24} />
                                </div>
                                <CardTitle>Target Company</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-400 mb-4">Practice questions frequently asked by specific companies.</p>
                            <select
                                className="w-full bg-surface text-foreground border border-border rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary"
                                value={selectedCompany}
                                onChange={(e) => { setSelectedCompany(e.target.value); setSelectedTopic('') }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <option value="">Select a Company...</option>
                                {companyList.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.total_questions} questions)</option>
                                ))}
                            </select>
                        </CardContent>
                    </Card>

                    {/* Topic Selection */}
                    <Card glass className={`cursor-pointer transition-all ${selectedTopic ? 'ring-2 ring-secondary' : 'hover:border-secondary/50'}`}
                        onClick={() => { setSelectedCompany(''); setSelectedTopic(selectedTopic ? '' : TOPICS[0]) }}>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center text-secondary">
                                    <Book size={24} />
                                </div>
                                <CardTitle>DSA Topic</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-400 mb-4">Focus on improving a specific Data Structure or Algorithm.</p>
                            <select
                                className="w-full bg-surface text-foreground border border-border rounded-lg p-3 outline-none focus:ring-2 focus:ring-secondary"
                                value={selectedTopic}
                                onChange={(e) => { setSelectedTopic(e.target.value); setSelectedCompany('') }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <option value="">Select a Topic...</option>
                                {TOPICS.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-center">
                    <Button
                        size="lg"
                        className="w-full md:w-auto px-12 py-6 gap-3 text-lg"
                        onClick={handleStart}
                        disabled={submitting || (!selectedCompany && !selectedTopic)}
                    >
                        <Play size={24} />
                        {submitting ? 'Preparing Environment...' : 'Start Interview'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
