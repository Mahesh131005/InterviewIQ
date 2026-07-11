import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { practice } from '../services/api';
import SearchBar from '../components/practice/SearchBar';
import FiltersSidebar from '../components/practice/FiltersSidebar';
import ProblemCard from '../components/practice/ProblemCard';
import { Loader2 } from 'lucide-react';

// Custom hook for debouncing search
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function PracticeList() {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  const [filters, setFilters] = useState({
    difficulty: [],
    topic: [],
    company: []
  });
  
  const [sortBy, setSortBy] = useState('popularity');

  useEffect(() => {
    fetchProblems();
  }, [debouncedSearch, filters, sortBy, page]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page,
        limit: 20,
        sort: sortBy
      };
      
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.difficulty.length > 0) params.difficulty = filters.difficulty.join(',');
      if (filters.topic.length > 0) params.topic = filters.topic.join(',');
      if (filters.company.length > 0) params.company = filters.company.join(',');

      const res = await practice.getProblems(params);
      setProblems(res.data.problems);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch problems:', err);
      setError('Failed to load practice problems. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (category, newValues) => {
    setFilters(prev => ({
      ...prev,
      [category]: newValues
    }));
    setPage(1); // Reset to first page on filter change
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Practice Problems</h1>
          <p className="text-foreground opacity-55">Sharpen your coding skills with hundreds of interview questions.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <FiltersSidebar filters={filters} onFilterChange={handleFilterChange} />
          
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
              <div className="sm:w-48 flex-shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-full min-h-[48px] bg-surface border border-border rounded-xl text-foreground px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                >
                  <option value="popularity">Most Popular</option>
                  <option value="acceptance">Highest Acceptance</option>
                  <option value="difficulty">Difficulty</option>
                  <option value="newest">Newest Added</option>
                </select>
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6">
                {error}
              </div>
            )}
            
            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : problems.length === 0 ? (
              <div className="text-center py-20 bg-surface/30 rounded-xl border border-border/50">
                <p className="text-gray-400 text-lg">No problems found matching your criteria.</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({ difficulty: [], topic: [], company: [] });
                  }}
                  className="mt-4 text-primary hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {problems.map(problem => (
                  <ProblemCard key={problem.id} problem={problem} />
                ))}
              </div>
            )}
            
            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 rounded-lg bg-surface border border-border text-foreground disabled:opacity-50 hover:bg-surface-light"
                >
                  Previous
                </button>
                <div className="flex items-center px-4 text-foreground opacity-55">
                  Page {page} of {totalPages}
                </div>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 rounded-lg bg-surface border border-border text-foreground disabled:opacity-50 hover:bg-surface-light"
                >
                  Next
                </button>
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}
