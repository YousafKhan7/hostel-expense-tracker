import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

const DEFAULT_CATEGORIES = [
  { name: 'Food & Drinks', color: '#F87171', icon: '🍔' },
  { name: 'Rent', color: '#60A5FA', icon: '🏠' },
  { name: 'Utilities', color: '#34D399', icon: '💡' },
  { name: 'Transportation', color: '#FBBF24', icon: '🚗' },
  { name: 'Entertainment', color: '#A78BFA', icon: '🎬' },
  { name: 'Shopping', color: '#EC4899', icon: '🛍️' },
  { name: 'Travel', color: '#38BDF8', icon: '✈️' },
  { name: 'Healthcare', color: '#FB7185', icon: '🏥' },
  { name: 'Education', color: '#818CF8', icon: '📚' },
  { name: 'Other', color: '#9CA3AF', icon: '📌' }
];

/**
 * Component for managing expense categories
 */
export default function CategoryManager({ groupId, onCategorySelect }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCategory, setNewCategory] = useState({ name: '', color: '#9CA3AF', icon: '📌' });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

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

      // If no categories exist yet, create default ones
      if (fetchedCategories.length === 0) {
        await createDefaultCategories();
        return; // fetchCategories will be called again after creating defaults
      }

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

  // Create default categories for new groups
  const createDefaultCategories = async () => {
    try {
      const batch = [];
      
      for (const category of DEFAULT_CATEGORIES) {
        batch.push(addDoc(collection(db, 'categories'), {
          ...category,
          groupId,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
      }
      
      await Promise.all(batch);
      await fetchCategories(); // Fetch again after creating defaults
    } catch (err) {
      console.error('Error creating default categories:', err);
      setError('Failed to create default categories');
      setLoading(false);
    }
  };

  // Add a new category
  const handleAddCategory = async () => {
    try {
      if (!newCategory.name.trim()) {
        setError('Category name is required');
        return;
      }

      setLoading(true);
      
      await addDoc(collection(db, 'categories'), {
        name: newCategory.name.trim(),
        color: newCategory.color,
        icon: newCategory.icon,
        groupId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      setNewCategory({ name: '', color: '#9CA3AF', icon: '📌' });
      setIsAddingCategory(false);
      await fetchCategories();
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Failed to add category');
      setLoading(false);
    }
  };

  // Update an existing category
  const handleUpdateCategory = async () => {
    try {
      if (!editingCategory || !editingCategory.name.trim()) {
        setError('Category name is required');
        return;
      }

      setLoading(true);
      
      await updateDoc(doc(db, 'categories', editingCategory.id), {
        name: editingCategory.name.trim(),
        color: editingCategory.color,
        icon: editingCategory.icon,
        updatedAt: new Date()
      });
      
      setEditingCategory(null);
      await fetchCategories();
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Failed to update category');
      setLoading(false);
    }
  };

  // Delete a category
  const handleDeleteCategory = async (categoryId) => {
    try {
      if (!window.confirm('Are you sure you want to delete this category?')) {
        return;
      }

      setLoading(true);
      
      await deleteDoc(doc(db, 'categories', categoryId));
      await fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category');
      setLoading(false);
    }
  };

  // Available icon options
  const iconOptions = [
    '🍔', '🍕', '🍣', '🏠', '💡', '🚗', '🎬', '🛍️', '✈️', '🏥', 
    '📚', '📌', '💼', '🎮', '🎵', '🧾', '⚽', '🎨', '🔧', '💻'
  ];

  if (loading && categories.length === 0) {
    return (
      <div className="animate-pulse p-4">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded mb-2"></div>
        <div className="h-8 bg-gray-200 rounded mb-2"></div>
        <div className="h-8 bg-gray-200 rounded mb-2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Categories</h3>
        <button
          onClick={() => setIsAddingCategory(!isAddingCategory)}
          className="btn btn-sm btn-outline"
        >
          {isAddingCategory ? 'Cancel' : 'Add Category'}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Add new category form */}
      {isAddingCategory && (
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Category</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="input w-full"
                placeholder="Enter category name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="w-full h-10 p-1 rounded border border-gray-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon
              </label>
              <div className="grid grid-cols-10 gap-2">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewCategory({ ...newCategory, icon })}
                    className={`w-8 h-8 flex items-center justify-center rounded ${
                      newCategory.icon === icon ? 'bg-primary-100 border-2 border-primary-500' : 'bg-gray-100'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button
                onClick={handleAddCategory}
                className="btn btn-primary"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit category form */}
      {editingCategory && (
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Edit Category</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={editingCategory.name}
                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                className="input w-full"
                placeholder="Enter category name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="color"
                value={editingCategory.color}
                onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                className="w-full h-10 p-1 rounded border border-gray-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon
              </label>
              <div className="grid grid-cols-10 gap-2">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setEditingCategory({ ...editingCategory, icon })}
                    className={`w-8 h-8 flex items-center justify-center rounded ${
                      editingCategory.icon === icon ? 'bg-primary-100 border-2 border-primary-500' : 'bg-gray-100'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setEditingCategory(null)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCategory}
                className="btn btn-primary"
              >
                Update Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category list */}
      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul className="divide-y divide-gray-200">
          {categories.map((category) => (
            <li key={category.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => onCategorySelect && onCategorySelect(category)}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: category.color }}
                  >
                    <span>{category.icon}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                </div>
                
                <div className="flex items-center">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="text-gray-400 hover:text-gray-500 mr-2"
                    aria-label="Edit category"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-gray-400 hover:text-red-500"
                    aria-label="Delete category"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 