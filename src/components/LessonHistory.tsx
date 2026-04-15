import React, { useState, useMemo } from 'react';
import { Clock, Trash2, BookOpen, ChevronRight, Filter, CheckSquare, Square, X, AlertTriangle } from 'lucide-react';
import { Lesson, deleteLesson, deleteLessons } from '../services/lessonService';

interface LessonHistoryProps {
  lessons: Lesson[];
  onSelectLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onDeleteLessons?: (lessonIds: string[]) => void;
  selectedLessonId?: string;
}

type DateFilter = 'all' | 'today' | 'yesterday' | 'last7' | 'last30';

const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
];

const LessonHistory: React.FC<LessonHistoryProps> = ({
  lessons,
  onSelectLesson,
  onDeleteLesson,
  onDeleteLessons,
  selectedLessonId,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const filteredLessons = useMemo(() => {
    if (dateFilter === 'all') return lessons;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);

    return lessons.filter((lesson) => {
      const date = new Date(lesson.created_at);
      if (dateFilter === 'today') return date >= startOfToday;
      if (dateFilter === 'yesterday') return date >= startOfYesterday && date < startOfToday;
      if (dateFilter === 'last7') return date >= new Date(now.getTime() - 7 * 86400000);
      if (dateFilter === 'last30') return date >= new Date(now.getTime() - 30 * 86400000);
      return true;
    });
  }, [lessons, dateFilter]);

  const toggleSelectMode = () => {
    setSelectMode((v) => !v);
    setSelectedIds(new Set());
    setConfirmBulkDelete(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLessons.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLessons.map((l) => l.id)));
    }
  };

  const handleSingleDelete = async (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation();
    const success = await deleteLesson(lessonId);
    if (success) onDeleteLesson(lessonId);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    const ids = Array.from(selectedIds);
    const success = await deleteLessons(ids);
    if (success) {
      ids.forEach((id) => onDeleteLesson(id));
      if (onDeleteLessons) onDeleteLessons(ids);
    }
    setIsDeleting(false);
    setSelectedIds(new Set());
    setConfirmBulkDelete(false);
    setSelectMode(false);
  };

  const allSelected = filteredLessons.length > 0 && selectedIds.size === filteredLessons.length;

  return (
    <div className="bg-white rounded-2xl shadow-lg h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-[#4CAF50]" />
            <h2 className="text-lg font-bold text-gray-900">Lesson History</h2>
            {lessons.length > 0 && (
              <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {filteredLessons.length}
              </span>
            )}
          </div>
          {lessons.length > 0 && (
            <button
              onClick={toggleSelectMode}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                selectMode
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {selectMode ? (
                <>
                  <X size={13} />
                  Cancel
                </>
              ) : (
                <>
                  <CheckSquare size={13} />
                  Select
                </>
              )}
            </button>
          )}
        </div>

        {/* Date Filter */}
        {lessons.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={12} className="text-gray-400 shrink-0" />
            {DATE_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateFilter(opt.value)}
                className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${
                  dateFilter === opt.value
                    ? 'bg-[#4CAF50] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Select All + Bulk Delete Bar */}
      {selectMode && filteredLessons.length > 0 && (
        <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            {allSelected ? (
              <CheckSquare size={16} className="text-[#4CAF50]" />
            ) : (
              <Square size={16} className="text-gray-400" />
            )}
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>

          {selectedIds.size > 0 && (
            <button
              onClick={() => setConfirmBulkDelete(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all"
            >
              <Trash2 size={13} />
              Delete {selectedIds.size} selected
            </button>
          )}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmBulkDelete && (
        <div className="mx-5 mt-3 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">
              Delete {selectedIds.size} lesson{selectedIds.size !== 1 ? 's' : ''}?
            </p>
            <p className="text-xs text-red-600 mt-0.5">This cannot be undone.</p>
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-all disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Confirm delete'}
              </button>
              <button
                onClick={() => setConfirmBulkDelete(false)}
                className="text-xs font-semibold text-gray-600 hover:text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson List */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        {lessons.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-gray-400">
            <BookOpen size={44} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No lessons yet</p>
            <p className="text-xs mt-1 text-gray-400">Generate your first lesson to get started</p>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
            <Filter size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No lessons for this period</p>
            <button
              onClick={() => setDateFilter('all')}
              className="text-xs text-[#4CAF50] hover:underline mt-1"
            >
              Show all lessons
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLessons.map((lesson) => {
              const isSelected = selectedIds.has(lesson.id);
              const isActive = selectedLessonId === lesson.id;

              return (
                <div
                  key={lesson.id}
                  onClick={() => {
                    if (selectMode) {
                      toggleSelect(lesson.id);
                    } else {
                      onSelectLesson(lesson);
                    }
                  }}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all group ${
                    selectMode && isSelected
                      ? 'border-[#4CAF50] bg-green-50'
                      : isActive && !selectMode
                      ? 'border-[#4CAF50] bg-green-50'
                      : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {selectMode && (
                      <div className="shrink-0 mt-0.5">
                        {isSelected ? (
                          <CheckSquare size={16} className="text-[#4CAF50]" />
                        ) : (
                          <Square size={16} className="text-gray-300 group-hover:text-gray-400" />
                        )}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {lesson.lesson_name || `${lesson.subject}: ${lesson.topic}`}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-1.5 mb-1.5">
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-md font-medium">
                          {lesson.year_group}
                        </span>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-md font-medium">
                          {lesson.ability_level}
                        </span>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-md font-medium">
                          {lesson.lesson_duration}min
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={11} />
                        <span>{formatDate(lesson.created_at)}</span>
                      </div>
                    </div>

                    {!selectMode && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={(e) => handleSingleDelete(e, lesson.id)}
                          className="p-1.5 hover:bg-red-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Delete lesson"
                        >
                          <Trash2 size={14} className="text-red-400 hover:text-red-600" />
                        </button>
                        <ChevronRight
                          size={16}
                          className={`transition-all ${
                            isActive ? 'text-[#4CAF50]' : 'text-gray-300 group-hover:text-gray-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonHistory;
