import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

/**
 * Component for filtering expenses by category
 */
export default function CategoryFilter({ groupId, onFilterChange }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, [groupId]);

  // Fetch categories from Firestore
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');

      // Query for group-specific categories
      const categoryQuery = query(
        collection(db, 'categories'),
        where('groupId', '==', groupId)
      );
      
      const querySnapshot = await getDocs(categoryQuery);
      let fetchedCategories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort categories by name
      fetchedCategories.sort((a, b) => a.name.localeCompare(b.name));
      
      setCategories(fetchedCategories);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
      setLoading(false);
    }
  };

  // Handle category selection for filtering
  const handleCategorySelect = (category) => {
    if (selectedCategory?.id === category.id) {
      // Deselect if already selected (clear filter)
      setSelectedCategory(null);
      onFilterChange?.(null);
    } else {
      setSelectedCategory(category);
      onFilterChange?.(category.id);
    }
  };

  // Clear all filters
  const clearFilter = () => {
    setSelectedCategory(null);
    onFilterChange?.(null);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="flex space-x-2">
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (categories.length === 0) {
    return null; // Don't show filter if no categories
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Filter by Category</h4>
        {selectedCategory && (
          <button
            onClick={clearFilter}
            className="text-xs text-primary-600 hover:text-primary-800"
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategorySelect(category)}
            className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory?.id === category.id 
                ? 'bg-primary-100 text-primary-800 border border-primary-300' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-transparent'
            }`}
          >
            <span 
              className="w-4 h-4 rounded-full flex items-center justify-center mr-1.5"
              style={{ backgroundColor: category.color }}
            >
              {category.icon}
            </span>
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
} 