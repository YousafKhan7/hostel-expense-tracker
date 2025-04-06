import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

/**
 * Component for selecting expense categories
 */
export default function CategorySelector({ 
  groupId, 
  selectedCategoryId, 
  onChange, 
  className = '' 
}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, [groupId]);

  // Update selected category when selectedCategoryId changes
  useEffect(() => {
    if (selectedCategoryId && categories.length > 0) {
      const category = categories.find(cat => cat.id === selectedCategoryId);
      if (category) {
        setSelectedCategory(category);
      }
    } else if (categories.length > 0) {
      // Default to the first category if none selected
      setSelectedCategory(categories[0]);
      onChange?.(categories[0].id);
    }
  }, [selectedCategoryId, categories, onChange]);

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
      
      // Select the first category by default if none is selected
      if (!selectedCategory && fetchedCategories.length > 0) {
        setSelectedCategory(fetchedCategories[0]);
        onChange?.(fetchedCategories[0].id);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
      setLoading(false);
    }
  };

  // Handle category selection
  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    onChange?.(category.id);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className={`animate-pulse h-10 bg-gray-200 rounded ${className}`}></div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-red-600 ${className}`}>{error}</div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No categories available
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        className="bg-white relative w-full border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded="true"
      >
        {selectedCategory ? (
          <div className="flex items-center">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center mr-2"
              style={{ backgroundColor: selectedCategory.color }}
            >
              <span>{selectedCategory.icon}</span>
            </div>
            <span className="block truncate">{selectedCategory.name}</span>
          </div>
        ) : (
          <span className="block truncate text-gray-500">Select a category</span>
        )}
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          <ul tabIndex="-1" role="listbox" aria-labelledby="listbox-label" aria-activedescendant="listbox-option-0">
            {categories.map((category) => (
              <li
                key={category.id}
                id={`listbox-option-${category.id}`}
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
                role="option"
                aria-selected={selectedCategory?.id === category.id}
                onClick={() => handleSelectCategory(category)}
              >
                <div className="flex items-center">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center mr-2"
                    style={{ backgroundColor: category.color }}
                  >
                    <span>{category.icon}</span>
                  </div>
                  <span className={`block truncate ${selectedCategory?.id === category.id ? 'font-medium' : 'font-normal'}`}>
                    {category.name}
                  </span>
                </div>

                {selectedCategory?.id === category.id && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary-600">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 