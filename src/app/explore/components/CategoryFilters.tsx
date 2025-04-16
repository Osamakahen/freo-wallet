'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategoryFiltersProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilters: React.FC<CategoryFiltersProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          activeCategory === 'all'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        onClick={() => onCategoryChange('all')}
      >
        All
      </motion.button>
      {categories.map((category) => (
        <motion.button
          key={category.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeCategory === category.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => onCategoryChange(category.id)}
        >
          {category.name}
        </motion.button>
      ))}
    </div>
  );
};

export default CategoryFilters; 