import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, Circle } from 'lucide-react';
import { Card } from '../Card';

export default function ProblemCard({ problem }) {
  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'solved': return <CheckCircle className="text-green-500" size={20} />;
      case 'attempted': return <Clock className="text-yellow-500" size={20} />;
      default: return <Circle className="text-gray-600" size={20} />;
    }
  };

  const acceptanceRate = problem.total_attempts > 0 
    ? Math.round((problem.accepted_attempts / problem.total_attempts) * 100) 
    : 0;

  return (
    <Link to={`/practice/${problem.id}`} className="block transition-transform hover:-translate-y-1">
      <Card glass className="h-full hover:bg-white/5 transition-colors cursor-pointer border border-border/50">
        <div className="p-4 flex items-start gap-4">
          <div className="mt-1 flex-shrink-0">
            {getStatusIcon(problem.user_status)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate mb-2">
              {problem.title}
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
              </span>
              
              {problem.topics?.slice(0, 3).map(topic => (
                <span key={topic} className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/20">
                  {topic}
                </span>
              ))}
              {problem.topics?.length > 3 && (
                <span className="px-2 py-0.5 rounded text-xs bg-surface text-gray-400 border border-border">
                  +{problem.topics.length - 3}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-foreground opacity-55">
              <span>Acceptance: {acceptanceRate}%</span>
              <span>•</span>
              <span className="truncate">
                {problem.companies?.slice(0, 2).join(', ')}
                {problem.companies?.length > 2 ? ' ...' : ''}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
