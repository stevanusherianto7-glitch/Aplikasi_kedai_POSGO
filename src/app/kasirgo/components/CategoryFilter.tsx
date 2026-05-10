import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  categories, 
  activeCategory, 
  onCategoryChange 
}) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative mb-6">
      <div className="flex items-center gap-2">
        <button
          onClick={scrollLeft}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:bg-slate-100 transition-all shadow-sm"
          aria-label="Scroll categories left"
        >
          <ChevronLeft size={18} className="text-slate-600" />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeCategory === category
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <button
          onClick={scrollRight}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:bg-slate-100 transition-all shadow-sm"
          aria-label="Scroll categories right"
        >
          <ChevronRight size={18} className="text-slate-600" />
        </button>
      </div>
    </div>
  );
};
