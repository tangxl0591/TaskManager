import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, User, AlertCircle } from 'lucide-react';
import { Task, TaskStatus, DropdownOptions, getTaskDelayStats, getStatusColor } from '../types';
import { QUADRANT_OPTIONS, STATUS_OPTIONS } from '../constants';
import { translations, Language } from '../translations';
import MultiSelect from './MultiSelect';

interface QuadrantKanbanProps {
  tasks: Task[];
  lang: Language;
  options: DropdownOptions;
  onEditTask: (task: Task) => void;
  onNewTaskInQuadrant: (quadrantKey: string) => void;
  onUpdateTaskQuadrant: (task: Task, newQuadrant: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const QuadrantKanban: React.FC<QuadrantKanbanProps> = ({
  tasks,
  lang,
  options,
  onEditTask,
  onNewTaskInQuadrant,
  onUpdateTaskQuadrant,
  onDeleteTask
}) => {
  const t = translations[lang];

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterDevices, setFilterDevices] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  // Available statuses in quadrant kanban (excluding Completed)
  const availableStatuses = (options.statuses ? options.statuses.map(s => s.value) : STATUS_OPTIONS).filter(
    s => s !== TaskStatus.COMPLETED && s.toLowerCase() !== 'completed'
  );

  // Filter tasks: ONLY show incomplete or blocked tasks (exclude 'Completed')
  const filteredTasks = tasks.filter(task => {
    // Exclude completed tasks
    if (task.status === TaskStatus.COMPLETED || task.status?.toLowerCase() === 'completed') {
      return false;
    }

    const matchesSearch = searchTerm === '' || 
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.nreNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.owner.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOwner = filterOwner === '' || task.owner === filterOwner;
    const matchesDevice = filterDevices.length === 0 || filterDevices.includes(task.deviceType);
    const matchesStatus = filterStatuses.length === 0 || filterStatuses.includes(task.status);

    return matchesSearch && matchesOwner && matchesDevice && matchesStatus;
  });

  // Group tasks by quadrant
  const getTasksByQuadrant = (quadrantKey: string) => {
    return filteredTasks.filter(task => {
      const q = task.priorityQuadrant || 'Q2_IMPORTANT_NOT_URGENT';
      return q === quadrantKey;
    });
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetQuadrantKey: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (task && (task.priorityQuadrant || 'Q2_IMPORTANT_NOT_URGENT') !== targetQuadrantKey) {
      onUpdateTaskQuadrant(task, targetQuadrantKey);
    }
    setDraggingTaskId(null);
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats Banner */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>{t.quadrantMatrix}</span>
              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                {filteredTasks.length} {lang === 'en' ? 'Active Tasks' : '项进行/待办任务'}
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-2">
              <span>{t.dragOrMove}</span>
              <span className="text-indigo-600 font-medium">({t.quadrantHint})</span>
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {QUADRANT_OPTIONS.map(q => {
              const count = getTasksByQuadrant(q.key).length;
              const title = lang === 'en' ? q.labelEn : q.labelZh;
              return (
                <div key={q.key} className={`px-3 py-1.5 rounded-md text-xs font-medium border flex items-center justify-between gap-2 ${q.badgeClass}`}>
                  <span className="truncate">{title}</span>
                  <span className="font-bold px-1.5 py-0.5 rounded-full bg-white/80 shadow-xs text-gray-900">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="block w-full sm:w-36 pl-2.5 pr-8 py-1.5 text-xs border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md bg-white text-gray-900 border"
            >
              <option value="">{t.allOwners}</option>
              {options.owners.map(o => <option key={o} value={o}>{o}</option>)}
            </select>

            <MultiSelect
              label={t.allDevices}
              options={options.deviceTypes}
              selected={filterDevices}
              onChange={setFilterDevices}
            />

            <MultiSelect
              label={t.allStatuses}
              options={availableStatuses}
              selected={filterStatuses}
              onChange={setFilterStatuses}
            />
          </div>
        </div>
      </div>

      {/* 2x2 Quadrant Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {QUADRANT_OPTIONS.map(quadrant => {
          const quadrantTasks = getTasksByQuadrant(quadrant.key);
          const title = lang === 'en' ? quadrant.labelEn : quadrant.labelZh;
          const subtitle = lang === 'en' ? quadrant.subtitleEn : quadrant.subtitleZh;

          return (
            <div
              key={quadrant.key}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, quadrant.key)}
              className={`rounded-xl border shadow-xs overflow-hidden flex flex-col min-h-[380px] transition-colors ${quadrant.cardBgClass} ${quadrant.cardBorderClass}`}
            >
              {/* Quadrant Header */}
              <div className={`px-4 py-3 flex items-center justify-between ${quadrant.headerBgClass}`}>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm tracking-wide">{title}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-medium">
                    {subtitle}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-gray-900 shadow-xs">
                    {quadrantTasks.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNewTaskInQuadrant(quadrant.key)}
                    className="p-1 rounded-md bg-white/20 hover:bg-white/30 text-white transition-colors"
                    title={t.addTaskInQuadrant}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tasks List Container */}
              <div className="p-3 flex-grow overflow-y-auto space-y-3 max-h-[520px]">
                {quadrantTasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400 border-2 border-dashed border-gray-200/80 rounded-lg">
                    <p className="text-xs font-medium">{t.noTasks}</p>
                    <button
                      type="button"
                      onClick={() => onNewTaskInQuadrant(quadrant.key)}
                      className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t.addTaskInQuadrant}
                    </button>
                  </div>
                ) : (
                  quadrantTasks.map(task => {
                    const { totalDelayDays } = getTaskDelayStats(task.periods, task.status);
                    const isDragging = draggingTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white rounded-lg p-3.5 border shadow-xs transition-all cursor-move group hover:shadow-md ${
                          isDragging ? 'opacity-40 scale-95 border-indigo-400' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* Task Top Bar */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <button
                            onClick={() => onEditTask(task)}
                            className="text-sm font-semibold text-gray-900 hover:text-indigo-600 text-left line-clamp-2 transition-colors flex-grow"
                          >
                            {task.name}
                          </button>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditTask(task)}
                              className="p-1 text-gray-400 hover:text-indigo-600 rounded"
                              title={t.editTask}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title={t.deletePeriod}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2.5 text-xs">
                          <span className="font-mono text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                            {task.nreNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusColor(task.status, options.statuses)}`}>
                            {task.status}
                          </span>
                          <span className="text-[11px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                            {task.taskType}
                          </span>
                          {totalDelayDays > 0 && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                              <AlertCircle className="w-2.5 h-2.5" />
                              {totalDelayDays}d
                            </span>
                          )}
                        </div>

                        {/* Task Meta Footer */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 font-medium text-gray-700">
                              <User className="w-3 h-3 text-gray-400" />
                              {task.owner}
                            </span>
                            <span className="text-gray-300">|</span>
                            <span>{task.deviceType}</span>
                          </div>

                          {/* Quick Quadrant Move Dropdown */}
                          <div className="flex items-center gap-1">
                            <select
                              value={task.priorityQuadrant || 'Q2_IMPORTANT_NOT_URGENT'}
                              onChange={(e) => onUpdateTaskQuadrant(task, e.target.value)}
                              className="text-[10px] bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-gray-600 hover:bg-white hover:border-gray-300 focus:outline-none cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {QUADRANT_OPTIONS.map(q => (
                                <option key={q.key} value={q.key}>
                                  {lang === 'en' ? q.labelEn : q.labelZh}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuadrantKanban;
