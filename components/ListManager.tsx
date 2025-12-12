
import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Language, translations } from '../translations';

interface ListManagerProps {
  title: string;
  items: string[];
  onItemsChange: (newItems: string[]) => void;
  lang: Language;
}

const ListManager: React.FC<ListManagerProps> = ({ title, items, onItemsChange, lang }) => {
  const t = translations[lang];
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onItemsChange([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems);
  };

  return (
    <div className="mb-6">
      <h4 className="font-medium text-gray-800 mb-2">{title}</h4>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.addItemPlaceholder}
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="bg-gray-50 rounded-md border border-gray-200 max-h-40 overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="text-gray-400 text-xs italic text-center p-2">No items</p>
        ) : (
          <ul className="space-y-1">
            {items.map((item, index) => (
              <li key={`${item}-${index}`} className="flex justify-between items-center bg-white px-3 py-1.5 rounded shadow-sm text-sm group">
                <span className="truncate mr-2">{item}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ListManager;
