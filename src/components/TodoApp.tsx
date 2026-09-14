import { useState, useEffect, useCallback } from 'react';
import { useGraphApi } from '../hooks/useGraphApi';
import { TodoTaskList, TodoTask } from '../types';
import {
  Plus,
  Trash2,
  Check,
  Circle,
  LogOut,
  ListTodo,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Star,
  Calendar,
} from 'lucide-react';

interface TodoAppProps {
  onLogout: () => void;
}

export function TodoApp({ onLogout }: TodoAppProps) {
  const api = useGraphApi();

  const [lists, setLists] = useState<TodoTaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newListName, setNewListName] = useState('');
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [smartFilter, setSmartFilter] = useState<'all' | 'today' | 'week' | 'overdue' | null>(null);

  useEffect(() => {
    loadLists();
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const user = await api.getUserInfo();
      setUserName(user.displayName || user.userPrincipalName || '');
    } catch {
      // ignore
    }
  };

  const loadLists = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchTodoLists();
      setLists(data);
      if (data.length > 0 && !selectedListId) {
        setSelectedListId(data[0].id);
      }
    } catch (err) {
      setError('リストの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = useCallback(async (listId: string) => {
    setTasksLoading(true);
    try {
      const data = await api.fetchTasks(listId);
      setTasks(data);
    } catch (err) {
      setError('タスクの取得に失敗しました');
      console.error(err);
    } finally {
      setTasksLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (smartFilter) {
      // スマートリストが選択されている場合、すべてのリストからタスクを取得
      const loadAllTasks = async () => {
        setTasksLoading(true);
        try {
          const allTasks: TodoTask[] = [];
          for (const list of lists) {
            const listTasks = await api.fetchTasks(list.id);
            allTasks.push(...listTasks);
          }
          setTasks(allTasks);
        } catch (err) {
          setError('タスクの取得に失敗しました');
          console.error(err);
        } finally {
          setTasksLoading(false);
        }
      };
      loadAllTasks();
    } else if (selectedListId) {
      loadTasks(selectedListId);
    }
  }, [selectedListId, smartFilter, lists, loadTasks, api]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedListId) return;

    try {
      const dueDateTime = newTaskDueDate
        ? { dateTime: new Date(newTaskDueDate).toISOString(), timeZone: 'UTC' }
        : undefined;
      
      const task = await api.createTask(selectedListId, newTaskTitle.trim(), dueDateTime);
      setTasks([task, ...tasks]);
      setNewTaskTitle('');
      setNewTaskDueDate('');
    } catch (err) {
      setError('タスクの作成に失敗しました');
      console.error(err);
    }
  };

  const handleToggleTask = async (task: TodoTask) => {
    const newStatus = task.status === 'completed' ? 'notStarted' : 'completed';
    try {
      const updated = await api.updateTask(selectedListId!, task.id, { status: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? updated : t));
    } catch (err) {
      setError('タスクの更新に失敗しました');
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(selectedListId!, taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      setError('タスクの削除に失敗しました');
      console.error(err);
    }
  };

  const handleUpdateDueDate = async (taskId: string, dueDate: string | null) => {
    try {
      const dueDateTime = dueDate
        ? { dateTime: new Date(dueDate).toISOString(), timeZone: 'UTC' }
        : null;
      
      const updated = await api.updateTask(selectedListId!, taskId, {
        dueDateTime: dueDateTime as any,
      });
      setTasks(tasks.map(t => t.id === taskId ? updated : t));
    } catch (err) {
      setError('締切日の更新に失敗しました');
      console.error(err);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      const list = await api.createList(newListName.trim());
      setLists([...lists, list]);
      setSelectedListId(list.id);
      setNewListName('');
      setShowNewListForm(false);
    } catch (err) {
      setError('リストの作成に失敗しました');
      console.error(err);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('このリストを削除しますか？')) return;
    try {
      await api.deleteList(listId);
      const remaining = lists.filter(l => l.id !== listId);
      setLists(remaining);
      if (selectedListId === listId) {
        setSelectedListId(remaining.length > 0 ? remaining[0].id : null);
        setTasks([]);
      }
    } catch (err) {
      setError('リストの削除に失敗しました');
      console.error(err);
    }
  };

  const handleLogout = () => {
    onLogout();
  };

  const selectedList = lists.find(l => l.id === selectedListId);
  
  // フィルタリングロジック
  const getFilteredTasks = () => {
    if (!smartFilter) {
      return tasks;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      if (!task.dueDateTime) return false;
      
      const dueDate = new Date(task.dueDateTime.dateTime);
      const dueDateOnly = new Date(dueDate);
      dueDateOnly.setHours(0, 0, 0, 0);
      
      switch (smartFilter) {
        case 'today':
          return dueDateOnly.getTime() === today.getTime();
        case 'week': {
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          return dueDate >= today && dueDate <= weekEnd;
        }
        case 'overdue':
          return dueDateOnly < today;
        default:
          return true;
      }
    });
  };
  
  const filteredTasks = getFilteredTasks();
  const activeTasks = filteredTasks.filter(t => t.status !== 'completed');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <ListTodo className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Microsoft To Do</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadLists}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="更新"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600 hidden sm:block">{userName}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">ログアウト</span>
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar - Lists */}
        <aside className="w-72 flex-shrink-0 hidden md:block">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">スマートリスト</h2>
            </div>
            <div className="p-2">
              <div
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                  smartFilter === 'today'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setSmartFilter(smartFilter === 'today' ? null : 'today')}
              >
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-sm font-medium">今日</span>
                <span className="text-xs text-gray-500">
                  {tasks.filter(t => {
                    if (!t.dueDateTime || t.status === 'completed') return false;
                    const dueDate = new Date(t.dueDateTime.dateTime);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dueDateOnly = new Date(dueDate);
                    dueDateOnly.setHours(0, 0, 0, 0);
                    return dueDateOnly.getTime() === today.getTime();
                  }).length}
                </span>
              </div>
              <div
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                  smartFilter === 'week'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setSmartFilter(smartFilter === 'week' ? null : 'week')}
              >
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-sm font-medium">今週</span>
                <span className="text-xs text-gray-500">
                  {tasks.filter(t => {
                    if (!t.dueDateTime || t.status === 'completed') return false;
                    const dueDate = new Date(t.dueDateTime.dateTime);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const weekEnd = new Date(today);
                    weekEnd.setDate(weekEnd.getDate() + 7);
                    return dueDate >= today && dueDate <= weekEnd;
                  }).length}
                </span>
              </div>
              <div
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                  smartFilter === 'overdue'
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setSmartFilter(smartFilter === 'overdue' ? null : 'overdue')}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-sm font-medium">期限切れ</span>
                <span className="text-xs text-red-600">
                  {tasks.filter(t => {
                    if (!t.dueDateTime || t.status === 'completed') return false;
                    const dueDate = new Date(t.dueDateTime.dateTime);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dueDateOnly = new Date(dueDate);
                    dueDateOnly.setHours(0, 0, 0, 0);
                    return dueDateOnly < today;
                  }).length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">リスト</h2>
            </div>
            <div className="p-2">
              {lists.map(list => (
                <div
                  key={list.id}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                    selectedListId === list.id && !smartFilter
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedListId(list.id);
                    setSmartFilter(null);
                  }}
                >
                  <ListTodo className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-sm font-medium truncate">{list.displayName}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteList(list.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedListId === list.id && !smartFilter ? 'rotate-90' : ''}`} />
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-gray-100">
              {showNewListForm ? (
                <form onSubmit={handleCreateList} className="flex gap-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="リスト名"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    作成
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowNewListForm(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  新しいリスト
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile list selector */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-10">
          <select
            value={selectedListId || ''}
            onChange={(e) => setSelectedListId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {lists.map(list => (
              <option key={list.id} value={list.id}>{list.displayName}</option>
            ))}
          </select>
        </div>

        {/* Main content - Tasks */}
        <main className="flex-1 min-w-0">
          {(selectedList || smartFilter) ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {smartFilter === 'today' && '今日'}
                      {smartFilter === 'week' && '今週'}
                      {smartFilter === 'overdue' && '期限切れ'}
                      {!smartFilter && selectedList?.displayName}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {activeTasks.length}件の未完了タスク
                    </p>
                  </div>
                </div>
              </div>

              {/* New task form */}
              {!smartFilter && (
                <form onSubmit={handleCreateTask} className="p-4 border-b border-gray-100">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="新しいタスクを追加..."
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!newTaskTitle.trim()}
                      className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">追加</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-gray-700"
                    />
                    {newTaskDueDate && (
                      <button
                        type="button"
                        onClick={() => setNewTaskDueDate('')}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        クリア
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* Tasks list */}
              {tasksLoading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="p-12 text-center">
                  <Circle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">タスクがありません</p>
                  <p className="text-sm text-gray-400 mt-1">上のフォームから新しいタスクを追加しましょう</p>
                </div>
              ) : (
                <div>
                  {/* Active tasks */}
                  {activeTasks.length > 0 && (
                    <div className="divide-y divide-gray-50">
                      {activeTasks.map(task => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onToggle={() => handleToggleTask(task)}
                          onDelete={() => handleDeleteTask(task.id)}
                          onUpdateDueDate={(dueDate) => handleUpdateDueDate(task.id, dueDate)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Completed tasks */}
                  {completedTasks.length > 0 && (
                    <div className="border-t border-gray-200">
                      <div className="px-4 py-2 bg-gray-50">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          完了 ({completedTasks.length})
                        </p>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {completedTasks.map(task => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            onToggle={() => handleToggleTask(task)}
                            onDelete={() => handleDeleteTask(task.id)}
                            onUpdateDueDate={(dueDate) => handleUpdateDueDate(task.id, dueDate)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <ListTodo className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">リストを選択してください</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function TaskItem({ task, onToggle, onDelete, onUpdateDueDate }: { 
  task: TodoTask; 
  onToggle: () => void; 
  onDelete: () => void;
  onUpdateDueDate: (dueDate: string | null) => void;
}) {
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [editDueDate, setEditDueDate] = useState(
    task.dueDateTime ? new Date(task.dueDateTime.dateTime).toISOString().split('T')[0] : ''
  );
  
  const isCompleted = task.status === 'completed';

  const handleDueDateSave = () => {
    onUpdateDueDate(editDueDate || null);
    setIsEditingDueDate(false);
  };

  const handleDueDateCancel = () => {
    setEditDueDate(task.dueDateTime ? new Date(task.dueDateTime.dateTime).toISOString().split('T')[0] : '');
    setIsEditingDueDate(false);
  };

  // 締切日の状態を判定
  const getDueDateStatus = () => {
    if (!task.dueDateTime || isCompleted) return null;
    
    const dueDate = new Date(task.dueDateTime.dateTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDateOnly = new Date(dueDate);
    dueDateOnly.setHours(0, 0, 0, 0);
    
    const diffTime = dueDateOnly.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays <= 7) return 'thisWeek';
    return 'future';
  };

  const dueDateStatus = getDueDateStatus();

  const getDueDateColor = () => {
    switch (dueDateStatus) {
      case 'overdue': return 'text-red-600';
      case 'today': return 'text-orange-600';
      case 'thisWeek': return 'text-blue-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={`group flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${isCompleted ? 'opacity-60' : ''}`}>
      <button
        onClick={onToggle}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          isCompleted
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-blue-500'
        }`}
      >
        {isCompleted && <Check className="w-3.5 h-3.5 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-1">
          {task.importance === 'high' && (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <Star className="w-3 h-3" /> 重要
            </span>
          )}
          {isEditingDueDate ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                autoFocus
              />
              <button
                onClick={handleDueDateSave}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                保存
              </button>
              <button
                onClick={handleDueDateCancel}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                キャンセル
              </button>
            </div>
          ) : (
            task.dueDateTime && (
              <button
                onClick={() => setIsEditingDueDate(true)}
                className={`flex items-center gap-1 text-xs ${getDueDateColor()} hover:underline`}
              >
                <Calendar className="w-3 h-3" />
                {new Date(task.dueDateTime.dateTime).toLocaleDateString('ja-JP')}
                {dueDateStatus === 'overdue' && <span className="ml-1">（期限切れ）</span>}
                {dueDateStatus === 'today' && <span className="ml-1">（今日）</span>}
              </button>
            )
          )}
          {!task.dueDateTime && !isEditingDueDate && (
            <button
              onClick={() => setIsEditingDueDate(true)}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-opacity"
            >
              <Calendar className="w-3 h-3" />
              締切日を設定
            </button>
          )}
        </div>
      </div>

      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
