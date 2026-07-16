import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Language } from '../translations';
import { StatusOption } from '../types';

interface StatusManagerProps {
  title: string;
  items: StatusOption[];
  onItemsChange: (newItems: StatusOption[]) => void;
  lang: Language;
}

const COLOR_PRESETS = [
  { name: 'Gray', class: 'bg-gray-100 text-gray-800 border-gray-200' },
  { name: 'Blue', class: 'bg-blue-100 text-blue-800 border-blue-200' },
  { name: 'Purple', class: 'bg-purple-100 text-purple-800 border-purple-200' },
  { name: 'Green', class: 'bg-green-100 text-green-800 border-green-200' },
  { name: 'Red', class: 'bg-red-100 text-red-800 border-red-200' },
  { name: 'Amber', class: 'bg-amber-100 text-amber-800 border-amber-200' },
  { name: 'Indigo', class: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { name: 'Pink', class: 'bg-pink-100 text-pink-800 border-pink-200' }
];

const StatusManager: React.FC<StatusManagerProps> = ({ title, items, onItemsChange, lang }) => {
  const [newValue, setNewValue] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0].class);

  const handleAdd = () => {
    if (newValue.trim()) {
      // Avoid duplicate status value
      if (items.some(item => item.value.toLowerCase() === newValue.trim().toLowerCase())) {
        alert(lang === 'en' ? 'Status already exists!' : '该状态已存在！');
        return;
      }
      onItemsChange([
        ...items,
        {
          value: newValue.trim(),
          labelZh: newValue.trim(),
          labelEn: newValue.trim(),
          color: selectedColor
        }
      ]);
      setNewValue('');
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
      
      {/* Input section */}
      <div className="space-y-3 mb-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={lang === 'en' ? 'Add new status name...' : '输入新状态名称...'}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border bg-white text-gray-900"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Color picker */}
        <div>
          <span className="block text-xs font-medium text-gray-500 mb-1.5">
            {lang === 'en' ? 'Choose Status Badge Color:' : '选择状态标签颜色：'}
          </span>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => {
              const isSelected = selectedColor === preset.class;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setSelectedColor(preset.class)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-all duration-150 ${preset.class} ${
                    isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 font-bold scale-105' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* List display */}
      <div className="bg-gray-50 rounded-md border border-gray-200 max-h-48 overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="text-gray-400 text-xs italic text-center p-2">No items</p>
        ) : (
          <ul className="space-y-1">
            {items.map((item, index) => (
              <li key={`${item.value}-${index}`} className="flex justify-between items-center bg-white px-3 py-1.5 rounded shadow-sm text-sm group">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${item.color}`}>
                  {item.value}
                </span>
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

export default StatusManager;
