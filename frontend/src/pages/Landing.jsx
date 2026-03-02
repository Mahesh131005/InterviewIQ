import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Code, Brain, BarChart3, Zap } from 'lucide-react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Master Coding Interviews with AI
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Practice coding problems, solve behavioral questions, and get real-time feedback powered by cutting-edge AI technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight size={20} />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, idx) => (
              <Card key={idx} glass className="animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 text-white">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <div className="glass rounded-2xl p-12 text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Ready to ace your interviews?</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Join thousands of developers who have improved their interview skills with our AI interviewer.
            </p>
            <Link to="/register">
              <Button size="lg">Start Free Today</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 md:px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <p className="text-gray-400">Active Users</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">50K+</div>
              <p className="text-gray-400">Practice Sessions</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">95%</div>
              <p className="text-gray-400">Success Rate</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

const features = [
  {
    icon: <Code size={24} />,
    title: 'Coding Problems',
    description: 'Practice with real interview-level coding questions across all difficulty levels.',
  },
  {
    icon: <Brain size={24} />,
    title: 'Behavioral Questions',
    description: 'Master soft skills with AI-powered behavioral interview simulations.',
  },
  {
    icon: <BarChart3 size={24} />,
    title: 'Analytics & Insights',
    description: 'Track your progress and get detailed analytics on your performance.',
  },
  {
    icon: <Zap size={24} />,
    title: 'Real-time Feedback',
    description: 'Instant AI feedback on your code, explanations, and interview skills.',
  },
]
