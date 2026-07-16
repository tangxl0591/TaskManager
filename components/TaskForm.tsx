
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { TaskFormData, TaskStatus, DropdownOptions, getPeriodDelay, getTaskDelayStats } from '../types';
import { STATUS_OPTIONS } from '../constants';
import { translations, Language } from '../translations';
import Button from './Button';

interface TaskFormProps {
  initialData?: TaskFormData;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  lang: Language;
  options: DropdownOptions;
}

const TaskForm: React.FC<TaskFormProps> = ({ initialData, onSubmit, onCancel, lang, options }) => {
  const t = translations[lang];
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>(
    initialData?.content && initialData.content.trim().length > 0 ? 'preview' : 'write'
  );
  
  // Safe defaults if options lists are empty
  const defaultOwner = options.owners[0] || '';
  const defaultDevice = options.deviceTypes[0] || '';
  const defaultPlatform = options.platforms[0] || '';
  const defaultAndroid = options.androidVersions[0] || '';
  const defaultTaskType = options.taskTypes[0] || '';

  const [formData, setFormData] = useState<TaskFormData>(() => {
    if (initialData) {
      const periods = initialData.periods || (initialData.startDate ? [{
        id: 'p_init_' + Date.now(),
        startDate: initialData.startDate,
        endDate: initialData.endDate || '',
        actualEndDate: initialData.status === 'Completed' || initialData.status === '已完成' ? (initialData.endDate || '') : ''
      }] : []);
      return {
        ...initialData,
        periods
      };
    }
    return {
      name: '',
      owner: defaultOwner,
      deviceType: defaultDevice,
      startDate: '',
      endDate: '',
      nreNumber: '',
      status: TaskStatus.PENDING,
      platform: defaultPlatform,
      androidVersion: defaultAndroid,
      taskType: defaultTaskType,
      content: '',
      periods: [{
        id: 'p_init_' + Date.now(),
        startDate: '',
        endDate: '',
        actualEndDate: ''
      }]
    };
  });

  const addPeriod = () => {
    const lastPeriod = formData.periods[formData.periods.length - 1];
    const nextStartDate = lastPeriod?.endDate || '';
    const newPeriod = {
      id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      startDate: nextStartDate,
      endDate: '',
      actualEndDate: ''
    };
    setFormData(prev => ({
      ...prev,
      periods: [...prev.periods, newPeriod]
    }));
  };

  const updatePeriodField = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      periods: prev.periods.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const removePeriod = (id: string) => {
    if (formData.periods.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      periods: prev.periods.filter(p => p.id !== id)
    }));
  };

  const { delayCount, totalDelayDays } = getTaskDelayStats(formData.periods);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      let updatedPeriods = [...prev.periods];
      
      // Auto-pause latest period if overall task is set to Blocked
      if (name === 'status' && (value === TaskStatus.BLOCKED || value === 'Blocked' || value === '已暂停')) {
        const lastIndex = updatedPeriods.length - 1;
        if (lastIndex >= 0 && !updatedPeriods[lastIndex].isPaused) {
          updatedPeriods[lastIndex] = {
            ...updatedPeriods[lastIndex],
            isPaused: true,
            pauseStartDate: new Date().toISOString().split('T')[0]
          };
        }
      }
      
      return {
        ...prev,
        [name]: value,
        periods: updatedPeriods
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Find overall start and end dates from periods using filter(Boolean)
      const validStartDates = formData.periods
        .map(p => p.startDate)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      const validEndDates = formData.periods
        .map(p => p.endDate)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      
      const taskStartDate = validStartDates.length > 0 ? validStartDates[0] : '';
      const taskEndDate = validEndDates.length > 0 ? validEndDates[validEndDates.length - 1] : '';
      
      // Calculate delay stats to store in JSON
      const { delayCount: finalDelayCount, totalDelayDays: finalDelayDuration } = getTaskDelayStats(formData.periods, formData.status);
      const periodsWithDelays = formData.periods.map(p => ({
        ...p,
        delayDays: getPeriodDelay(p, formData.status)
      }));

      const submissionData = {
        ...formData,
        startDate: taskStartDate,
        endDate: taskEndDate,
        periods: periodsWithDelays,
        delayCount: finalDelayCount,
        delayDuration: finalDelayDuration
      };
      await onSubmit(submissionData);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {options.taskTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
            {options.owners.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
            {options.deviceTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
            {options.platforms.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
            {options.androidVersions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* Delay Statistics Block (Read-Only) */}
        <div className="sm:col-span-2 bg-slate-50 rounded-lg p-4 border border-slate-200 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-700 mb-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            {lang === 'en' ? 'Delay Statistics (Read-Only)' : '延误统计 (无法修改)'}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-md border border-slate-100 flex flex-col shadow-xs">
              <span className="text-xs text-slate-500 font-medium">{t.delayCount}</span>
              <span className={`text-lg font-bold mt-1 ${delayCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                {delayCount}
              </span>
            </div>
            <div className="bg-white p-3 rounded-md border border-slate-100 flex flex-col shadow-xs">
              <span className="text-xs text-slate-500 font-medium">{t.delayDuration}</span>
              <span className={`text-lg font-bold mt-1 ${totalDelayDays > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                {totalDelayDays} {lang === 'en' ? 'Days' : '天'}
              </span>
            </div>
          </div>
        </div>

        {/* Time Periods Editor Section */}
        <div className="sm:col-span-2 space-y-4 pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              {t.periods}
            </h4>
            <button
              type="button"
              onClick={addPeriod}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors border border-indigo-100"
            >
              + {t.addPeriod}
            </button>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {formData.periods.map((period, index) => {
              const delay = getPeriodDelay(period);
              return (
                <div key={period.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t.periodNo ? t.periodNo.replace('{no}', (index + 1).toString()) : `时间段 ${index + 1}`}
                    </span>
                    <div className="flex items-center gap-2">
                      {delay > 0 ? (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-800">
                          {t.delayDaysText ? t.delayDaysText.replace('{days}', delay.toString()) : `延误 ${delay} 天`}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-100 text-green-800">
                          {t.noDelay}
                        </span>
                      )}
                      {formData.periods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePeriod(period.id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                        >
                          {t.deletePeriod}
                        </button>
                      )}
                    </div>
                  </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{t.startDate}</label>
                      <input
                        type="date"
                        className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                        value={period.startDate}
                        onChange={(e) => updatePeriodField(period.id, 'startDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{t.endDate}</label>
                      <input
                        type="date"
                        className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                        value={period.endDate}
                        onChange={(e) => updatePeriodField(period.id, 'endDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{t.actualEndDate}</label>
                      <input
                        type="date"
                        placeholder="yyyy-mm-dd"
                        className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                        value={period.actualEndDate || ''}
                        onChange={(e) => updatePeriodField(period.id, 'actualEndDate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-gray-100 pt-3 mt-3">
                    <div className="flex items-center gap-2 h-full pt-4">
                      <input
                        type="checkbox"
                        id={`isPaused_${period.id}`}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={period.isPaused || false}
                        onChange={(e) => updatePeriodField(period.id, 'isPaused', e.target.checked)}
                      />
                      <label htmlFor={`isPaused_${period.id}`} className="text-xs font-semibold text-gray-700 cursor-pointer select-none">
                        {t.isPaused}
                      </label>
                    </div>
                    {period.isPaused && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{t.pauseStartDate}</label>
                        <input
                          type="date"
                          required
                          className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                          value={period.pauseStartDate || new Date().toISOString().split('T')[0]}
                          onChange={(e) => updatePeriodField(period.id, 'pauseStartDate', e.target.value)}
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{t.pausedDays}</label>
                      <input
                        type="number"
                        min="0"
                        placeholder={t.pausedDaysPlaceholder}
                        className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                        value={period.pausedDays || ''}
                        onChange={(e) => updatePeriodField(period.id, 'pausedDays', e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
            {((options.statuses && options.statuses.length > 0) ? options.statuses.map(s => s.value) : STATUS_OPTIONS).map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
