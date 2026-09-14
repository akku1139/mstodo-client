import { describe, it, expect } from 'vitest';

// 締切日関連のユーティリティ関数をテスト
describe('Due Date Utilities', () => {
  describe('getDueDateStatus', () => {
    const getDueDateStatus = (dueDateTime: string | undefined, isCompleted: boolean) => {
      if (!dueDateTime || isCompleted) return null;
      
      const dueDate = new Date(dueDateTime);
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

    it('完了タスクはnullを返す', () => {
      const result = getDueDateStatus('2024-01-01T00:00:00Z', true);
      expect(result).toBeNull();
    });

    it('締切日がないタスクはnullを返す', () => {
      const result = getDueDateStatus(undefined, false);
      expect(result).toBeNull();
    });

    it('昨日が期限のタスクはoverdueを返す', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = getDueDateStatus(yesterday.toISOString(), false);
      expect(result).toBe('overdue');
    });

    it('今日が期限のタスクはtodayを返す', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const result = getDueDateStatus(today.toISOString(), false);
      expect(result).toBe('today');
    });

    it('3日後が期限のタスクはthisWeekを返す', () => {
      const in3Days = new Date();
      in3Days.setDate(in3Days.getDate() + 3);
      const result = getDueDateStatus(in3Days.toISOString(), false);
      expect(result).toBe('thisWeek');
    });

    it('7日後が期限のタスクはthisWeekを返す', () => {
      const in7Days = new Date();
      in7Days.setDate(in7Days.getDate() + 7);
      const result = getDueDateStatus(in7Days.toISOString(), false);
      expect(result).toBe('thisWeek');
    });

    it('8日後が期限のタスクはfutureを返す', () => {
      const in8Days = new Date();
      in8Days.setDate(in8Days.getDate() + 8);
      const result = getDueDateStatus(in8Days.toISOString(), false);
      expect(result).toBe('future');
    });
  });

  describe('filterTasksByDueDate', () => {
    const filterTasksByDueDate = (
      tasks: Array<{ dueDateTime?: { dateTime: string }; status: string }>,
      filter: 'today' | 'week' | 'overdue' | null
    ) => {
      if (!filter) return tasks;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return tasks.filter(task => {
        if (!task.dueDateTime) return false;
        
        const dueDate = new Date(task.dueDateTime.dateTime);
        const dueDateOnly = new Date(dueDate);
        dueDateOnly.setHours(0, 0, 0, 0);
        
        switch (filter) {
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

    it('nullフィルターはすべてのタスクを返す', () => {
      const tasks = [
        { dueDateTime: { dateTime: new Date().toISOString() }, status: 'notStarted' },
        { status: 'notStarted' },
      ];
      const result = filterTasksByDueDate(tasks, null);
      expect(result).toHaveLength(2);
    });

    it('todayフィルターは今日のタスクのみを返す', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tasks = [
        { dueDateTime: { dateTime: today.toISOString() }, status: 'notStarted' },
        { dueDateTime: { dateTime: yesterday.toISOString() }, status: 'notStarted' },
      ];
      
      const result = filterTasksByDueDate(tasks, 'today');
      expect(result).toHaveLength(1);
    });

    it('overdueフィルターは期限切れのタスクのみを返す', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const tasks = [
        { dueDateTime: { dateTime: yesterday.toISOString() }, status: 'notStarted' },
        { dueDateTime: { dateTime: tomorrow.toISOString() }, status: 'notStarted' },
      ];
      
      const result = filterTasksByDueDate(tasks, 'overdue');
      expect(result).toHaveLength(1);
    });

    it('weekフィルターは今週のタスクのみを返す', () => {
      const in3Days = new Date();
      in3Days.setDate(in3Days.getDate() + 3);
      
      const in10Days = new Date();
      in10Days.setDate(in10Days.getDate() + 10);
      
      const tasks = [
        { dueDateTime: { dateTime: in3Days.toISOString() }, status: 'notStarted' },
        { dueDateTime: { dateTime: in10Days.toISOString() }, status: 'notStarted' },
      ];
      
      const result = filterTasksByDueDate(tasks, 'week');
      expect(result).toHaveLength(1);
    });

    it('締切日がないタスクはフィルターに含まれない', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      
      const tasks = [
        { dueDateTime: { dateTime: today.toISOString() }, status: 'notStarted' },
        { status: 'notStarted' },
      ];
      
      const result = filterTasksByDueDate(tasks, 'today');
      expect(result).toHaveLength(1);
    });
  });

  describe('formatDueDate', () => {
    const formatDueDate = (dueDateTime: string) => {
      return new Date(dueDateTime).toLocaleDateString('ja-JP');
    };

    it('日付を日本語形式でフォーマットする', () => {
      const date = '2024-03-15T10:00:00Z';
      const result = formatDueDate(date);
      expect(result).toMatch(/2024\/3\/15/);
    });
  });
});
