import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Calendar, Smartphone, Cpu, Layers, Globe, BarChart2, List, Clock, Edit, Tag, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { dbService } from './services/dbService';
import { Task, TaskFormData, StatusColorMap, TaskStatus } from './types';
import { OWNERS, DEVICE_TYPES, STATUS_OPTIONS } from './constants';
import { translations, Language } from './translations';
import Modal from './components/Modal';
import TaskForm from './components/TaskForm';
import Button from './components/Button';
import Dashboard from './components/Dashboard';
import MultiSelect from './components/MultiSelect';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('zh');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'year' | 'owner'>('year');
  const [exportValue, setExportValue] = useState<string>('');

  // View State
  const [currentView, setCurrentView] = useState<'list' | 'dashboard'>('list');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  
  // Changed to array for multi-selection
  const [filterDevices, setFilterDevices] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);

  const t = translations[lang];

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dbService.getAllTasks();
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
      setError("Failed to connect to the server. Please ensure 'npm run server' is running.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    dbService.initialize();
    fetchTasks();
  }, []);

  const handleOpenNewTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (data: TaskFormData) => {
    try {
      if (editingTask) {
        // Update existing
        await dbService.updateTask({ ...editingTask, ...data });
      } else {
        // Create new
        await dbService.addTask(data);
      }
      await fetchTasks();
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error("Failed to save task", error);
      alert("Error saving to database");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      try {
        await dbService.deleteTask(id);
        await fetchTasks();
      } catch (error) {
        console.error("Failed to delete task", error);
      }
    }
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  // Export Logic
  const getUniqueYears = () => {
    const years = new Set(tasks.map(t => t.startDate.split('-')[0]));
    return Array.from(years).sort().reverse();
  };

  const handleOpenExport = () => {
    const years = getUniqueYears();
    setExportType('year');
    if (years.length > 0) {
      setExportValue(years[0]);
    }
    setIsExportModalOpen(true);
  };

  const executeExport = () => {
    let filtered: Task[] = [];
    let filename = 'tasks_export.csv';

    if (exportType === 'year') {
      filtered = tasks.filter(t => t.startDate.startsWith(exportValue));
      filename = `tasks_${exportValue}.csv`;
    } else {
      filtered = tasks.filter(t => t.owner === exportValue);
      filename = `tasks_${exportValue}.csv`;
    }

    if (filtered.length === 0) {
      alert(t.noTasks);
      return;
    }

    // Define CSV Headers and Rows
    // Excluding 'content' as requested
    const headers = [
      t.taskName, t.taskType, t.owner, t.deviceType, t.platform, 
      t.androidVersion, t.nreNumber, t.status, t.startDate, t.endDate, t.workHours
    ];

    const rows = filtered.map(task => [
      `"${task.name.replace(/"/g, '""')}"`,
      `"${task.taskType}"`,
      `"${task.owner}"`,
      `"${task.deviceType}"`,
      `"${task.platform}"`,
      `"${task.androidVersion}"`,
      `"${task.nreNumber}"`,
      `"${task.status}"`,
      `"${task.startDate}"`,
      `"${task.endDate}"`,
      task.workHours
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    // Create download link with BOM for Excel compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExportModalOpen(false);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.nreNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOwner = filterOwner ? task.owner === filterOwner : true;
    
    // Multi-select logic
    const matchesDevice = filterDevices.length > 0 ? filterDevices.includes(task.deviceType) : true;
    const matchesStatus = filterStatuses.length > 0 ? filterStatuses.includes(task.status) : true;

    return matchesSearch && matchesOwner && matchesDevice && matchesStatus;
  });

  // Helper to calculate overdue days
  const getOverdueDays = (endDateStr: string, status: string): number => {
    // If completed, not overdue
    if (status === TaskStatus.COMPLETED) return 0;
    
    if (!endDateStr) return 0;
    
    const now = new Date();
    // Reset time to compare dates only
    now.setHours(0, 0, 0, 0);
    
    // Parse YYYY-MM-DD
    const [y, m, d] = endDateStr.split('-').map(Number);
    const end = new Date(y, m - 1, d);
    
    if (now > end) {
      const diffTime = now.getTime() - end.getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
    
    return 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t.appTitle}</h1>
              </div>
              <div className="ml-8 hidden md:flex space-x-4">
                <button
                  onClick={() => setCurrentView('list')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${currentView === 'list' ? 'bg-gray-100 text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <List className="w-4 h-4" />
                  {t.viewList}
                </button>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${currentView === 'dashboard' ? 'bg-gray-100 text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <BarChart2 className="w-4 h-4" />
                  {t.viewDashboard}
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={toggleLang}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
              >
                <Globe className="w-4 h-4" />
                {lang === 'en' ? '中文' : 'English'}
              </button>
              <div className="hidden md:flex text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  {t.dbType}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Actions */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {currentView === 'list' ? t.taskList : t.dashboard}
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 gap-2">
            <Button variant="secondary" onClick={handleOpenExport}>
              <Download className="-ml-1 mr-2 h-5 w-5" />
              {t.exportTasks}
            </Button>
            <Button onClick={handleOpenNewTask}>
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              {t.newTask}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md bg-red-50 p-4 mb-6 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={fetchTasks}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Connection
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : currentView === 'dashboard' ? (
          <Dashboard tasks={tasks} lang={lang} />
        ) : (
          <>
            {/* Filter Bar */}
            <div className="bg-white rounded-t-lg border-b border-gray-200 px-4 py-5 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                
                {/* Search */}
                <div className="relative max-w-xs w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Dropdown Filters */}
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                   <select 
                      value={filterOwner} 
                      onChange={(e) => setFilterOwner(e.target.value)}
                      className="block w-full sm:w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white text-gray-900"
                   >
                      <option value="">{t.allOwners}</option>
                      {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                   </select>

                   {/* MultiSelect for Devices */}
                   <MultiSelect 
                     label={t.allDevices}
                     options={DEVICE_TYPES}
                     selected={filterDevices}
                     onChange={setFilterDevices}
                   />

                   {/* MultiSelect for Statuses */}
                   <MultiSelect 
                     label={t.allStatuses}
                     options={STATUS_OPTIONS}
                     selected={filterStatuses}
                     onChange={setFilterStatuses}
                   />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white shadow rounded-b-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{t.taskName}</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{t.taskType}</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{t.owner}</th>
                      {/* Merged Header */}
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{t.deviceInfo}</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{t.nreNumber}</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{t.status}</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{t.startDate}</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{t.endDate}</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{t.workHours}</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center">
                          <div className="flex justify-center">
                            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                          <p className="mt-2 text-sm text-gray-500">{t.loading}</p>
                        </td>
                      </tr>
                    ) : filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center text-sm text-gray-500">
                          {t.noTasks}
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map((task) => {
                        const overdueDays = getOverdueDays(task.endDate, task.status);
                        
                        return (
                        <tr key={task.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <button 
                                onClick={() => handleOpenEditTask(task)}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline truncate max-w-[200px] text-left" 
                                title="Edit Task"
                              >
                                {task.name}
                              </button>
                              {overdueDays > 0 && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-red-500 font-medium">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>{t.overdue.replace('{days}', overdueDays.toString())}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                             <div className="flex items-center gap-1.5">
                                <Tag className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-700">{task.taskType}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                    {task.owner.charAt(0)}
                                </div>
                                <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">{task.owner}</div>
                                </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                                <div className="text-sm text-gray-900 font-medium flex items-center gap-1">
                                    <Smartphone className="w-3.5 h-3.5 text-gray-500"/>
                                    {task.deviceType}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                    <Cpu className="w-3 h-3"/> {task.platform}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                    {task.androidVersion}
                                </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded inline-block">
                              {task.nreNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${StatusColorMap[task.status] || 'bg-gray-100 text-gray-800'}`}>
                              {task.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3"/> {task.startDate}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className={`flex items-center gap-1 ${overdueDays > 0 ? 'text-red-500 font-medium' : ''}`}>
                                <Calendar className="w-3 h-3"/> {task.endDate}
                            </div>
                          </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-400"/> {task.workHours || 0} h
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleOpenEditTask(task)}
                                className="text-indigo-400 hover:text-indigo-600 transition-colors p-1 rounded hover:bg-indigo-50"
                                title="Edit Task"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                                title="Delete Task"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )})
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Add/Edit Task Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? t.editTask : t.newTask}
      >
        <TaskForm 
          key={editingTask ? editingTask.id : 'new'} // Reset form state when task changes
          initialData={editingTask || undefined}
          onSubmit={handleSaveTask} 
          onCancel={() => setIsModalOpen(false)}
          lang={lang} 
        />
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={t.exportTasks}
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">{t.exportCriteria}</h4>
            
            <div className="flex flex-col space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="exportType" 
                  value="year" 
                  checked={exportType === 'year'} 
                  onChange={() => {
                     setExportType('year');
                     const years = getUniqueYears();
                     if(years.length > 0) setExportValue(years[0]);
                     else setExportValue('');
                  }}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-gray-700">{t.byYear}</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="exportType" 
                  value="owner" 
                  checked={exportType === 'owner'} 
                  onChange={() => {
                     setExportType('owner');
                     setExportValue(OWNERS[0]);
                  }}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-gray-700">{t.byOwner}</span>
              </label>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {exportType === 'year' ? t.selectYear : t.selectOwner}
              </label>
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white text-gray-900 border"
                value={exportValue}
                onChange={(e) => setExportValue(e.target.value)}
              >
                {exportType === 'year' ? (
                  getUniqueYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))
                ) : (
                  OWNERS.map(owner => (
                    <option key={owner} value={owner}>{owner}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsExportModalOpen(false)}>
              {t.cancel}
            </Button>
            <Button type="button" onClick={executeExport} disabled={!exportValue}>
              {t.export}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;