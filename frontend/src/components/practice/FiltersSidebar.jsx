import React from 'react';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const TOPICS = ['Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Sorting', 'Greedy', 'Depth-First Search', 'Database', 'Binary Search', 'Tree', 'Matrix', 'Two Pointers', 'Bit Manipulation', 'Stack', 'Design', 'Graph', 'Simulation', 'Prefix Sum', 'Backtracking', 'Sliding Window', 'Linked List', 'Heap'];
const COMPANIES = ['Google', 'Amazon', 'Meta', 'Microsoft', 'Apple', 'Bloomberg', 'Uber', 'Netflix', 'Adobe', 'Goldman Sachs'];

export default function FiltersSidebar({ filters, onFilterChange }) {
  
  const handleCheckboxChange = (category, value) => {
    const currentList = filters[category] || [];
    const newList = currentList.includes(value)
      ? currentList.filter(item => item !== value)
      : [...currentList, value];
    
    onFilterChange(category, newList);
  };

  const FilterSection = ({ title, category, options }) => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider opacity-70">{title}</h3>
      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
        {options.map(option => {
          const isSelected = (filters[category] || []).includes(option);
          return (
            <label key={option} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-gray-500 group-hover:border-primary/50'}`}>
                {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className={`text-sm ${isSelected ? 'text-foreground font-medium' : 'text-foreground opacity-60 group-hover:opacity-90'} transition-colors capitalize`}>
                {option}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="w-64 flex-shrink-0">
      <div className="bg-surface/30 border border-border/50 rounded-xl p-5 sticky top-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Filters</h2>
          <button 
            onClick={() => {
              onFilterChange('difficulty', []);
              onFilterChange('topic', []);
              onFilterChange('company', []);
            }}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Clear All
          </button>
        </div>
        
        <FilterSection title="Difficulty" category="difficulty" options={DIFFICULTIES} />
        <FilterSection title="Topics" category="topic" options={TOPICS} />
        <FilterSection title="Companies" category="company" options={COMPANIES} />
      </div>
    </div>
  );
}
