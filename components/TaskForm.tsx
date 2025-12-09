import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { TaskFormData, TaskStatus } from '../types';
import { OWNERS, DEVICE_TYPES, PLATFORMS, ANDROID_VERSIONS, TASK_TYPES, STATUS_OPTIONS } from '../constants';
import { translations, Language } from '../translations';
import Button from './Button';

interface TaskFormProps {
  initialData?: TaskFormData;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  lang: Language;
}

const TaskForm: React.FC<TaskFormProps> = ({ initialData, onSubmit, onCancel, lang }) => {
  const t = translations[lang];
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Change: If initialData has content, default to 'preview', otherwise 'write'
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>(
    initialData?.content && initialData.content.trim().length > 0 ? 'preview' : 'write'
  );
  
  const [formData, setFormData] = useState<TaskFormData>(initialData || {
    name: '',
    owner: OWNERS[0],
    deviceType: DEVICE_TYPES[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    nreNumber: '',
    status: TaskStatus.PENDING,
    platform: PLATFORMS[0],
    androidVersion: ANDROID_VERSIONS[0],
    taskType: TASK_TYPES[0],
    workHours: 0,
    content: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Ensure workHours is a number
      const submissionData = {
        ...formData,
        workHours: Number(formData.workHours)
      };
      await onSubmit(submissionData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Updated class: Added bg-white and text-gray-900 for explicit white background and black text
  const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border bg-white text-gray-900";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        {/* Task Name - Full Width */}
        <div className="sm:col-span-2">
          <label htmlFor="name" className={labelClass}>{t.taskName}</label>
          <input
            type="text"
            name="name"
            id="name"
            required
            className={inputClass}
            placeholder="e.g. Project Alpha BSP Bringup"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        {/* NRE Number */}
        <div>
          <label htmlFor="nreNumber" className={labelClass}>{t.nreNumber}</label>
          <input
            type="text"
            name="nreNumber"
            id="nreNumber"
            required
            className={inputClass}
            placeholder="e.g. NRE-2024-001"
            value={formData.nreNumber}
            onChange={handleChange}
          />
        </div>

         {/* Task Type */}
         <div>
          <label htmlFor="taskType" className={labelClass}>{t.taskType}</label>
          <select
            name="taskType"
            id="taskType"
            className={inputClass}
            value={formData.taskType}
            onChange={handleChange}
          >
            {TASK_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* Owner */}
        <div>
          <label htmlFor="owner" className={labelClass}>{t.owner}</label>
          <select
            name="owner"
            id="owner"
            className={inputClass}
            value={formData.owner}
            onChange={handleChange}
          >
            {OWNERS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* Device Type */}
        <div>
          <label htmlFor="deviceType" className={labelClass}>{t.deviceType}</label>
          <select
            name="deviceType"
            id="deviceType"
            className={inputClass}
            value={formData.deviceType}
            onChange={handleChange}
          >
            {DEVICE_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* Platform */}
        <div>
          <label htmlFor="platform" className={labelClass}>{t.platform}</label>
          <select
            name="platform"
            id="platform"
            className={inputClass}
            value={formData.platform}
            onChange={handleChange}
          >
            {PLATFORMS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* Android Version */}
        <div>
          <label htmlFor="androidVersion" className={labelClass}>{t.androidVersion}</label>
          <select
            name="androidVersion"
            id="androidVersion"
            className={inputClass}
            value={formData.androidVersion}
            onChange={handleChange}
          >
            {ANDROID_VERSIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* Work Hours */}
        <div>
          <label htmlFor="workHours" className={labelClass}>{t.workHours}</label>
          <input
            type="number"
            name="workHours"
            id="workHours"
            min="0"
            required
            className={inputClass}
            value={formData.workHours}
            onChange={handleChange}
          />
        </div>

        {/* Dates */}
        <div>
          <label htmlFor="startDate" className={labelClass}>{t.startDate}</label>
          <input
            type="date"
            name="startDate"
            id="startDate"
            required
            className={inputClass}
            value={formData.startDate}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="endDate" className={labelClass}>{t.endDate}</label>
          <input
            type="date"
            name="endDate"
            id="endDate"
            required
            className={inputClass}
            value={formData.endDate}
            onChange={handleChange}
          />
        </div>

        {/* Status */}
        <div className="sm:col-span-2">
          <label htmlFor="status" className={labelClass}>{t.status}</label>
          <select
            name="status"
            id="status"
            className={inputClass}
            value={formData.status}
            onChange={handleChange}
          >
            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* Task Content (Markdown) */}
        <div className="sm:col-span-2">
          <div className="flex justify-between items-end mb-2">
            <label className={labelClass}>{t.taskContent}</label>
            <div className="flex space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('write')}
                className={`px-3 py-1 rounded-md transition-colors ${activeTab === 'write' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {t.write}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md transition-colors ${activeTab === 'preview' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {t.preview}
              </button>
            </div>
          </div>
          
          {activeTab === 'write' ? (
            <textarea
              name="content"
              rows={8}
              className={inputClass}
              placeholder={t.contentPlaceholder}
              value={formData.content}
              onChange={handleChange}
            />
          ) : (
            <div className="w-full rounded-md border border-gray-300 bg-gray-50 p-4 min-h-[192px] prose prose-sm max-w-none overflow-y-auto">
               {formData.content ? (
                 <ReactMarkdown>{formData.content}</ReactMarkdown>
               ) : (
                 <p className="text-gray-400 italic">Nothing to preview</p>
               )}
            </div>
          )}
        </div>

      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t.cancel}
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {t.saveTask}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;