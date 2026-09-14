import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGraphApi } from './useGraphApi';
import * as deviceCodeFlow from '../auth/deviceCodeFlow';

declare const global: any;

// モック
vi.mock('../auth/deviceCodeFlow', () => ({
  getValidAccessToken: vi.fn(),
}));

global.fetch = vi.fn();

describe('useGraphApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchTodoLists', () => {
    it('タスクリストを正常に取得できる', async () => {
      const mockToken = 'valid-access-token';
      const mockLists = {
        value: [
          { id: 'list-1', displayName: '買い物リスト' },
          { id: 'list-2', displayName: '仕事リスト' },
        ],
      };

      vi.mocked(deviceCodeFlow.getValidAccessToken).mockResolvedValue(mockToken);
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLists,
      });

      const { result } = renderHook(() => useGraphApi());

      let lists;
      await act(async () => {
        lists = await result.current.fetchTodoLists();
      });

      expect(lists).toEqual(mockLists.value);
      expect(global.fetch).toHaveBeenCalledWith('/api/graph/me/todo/lists', {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
    });

    it('認証されていない場合はエラーをスローする', async () => {
      vi.mocked(deviceCodeFlow.getValidAccessToken).mockResolvedValue(null);

      const { result } = renderHook(() => useGraphApi());

      await expect(result.current.fetchTodoLists()).rejects.toThrow('Not authenticated');
    });

    it('APIエラー時に例外をスローする', async () => {
      vi.mocked(deviceCodeFlow.getValidAccessToken).mockResolvedValue('valid-token');
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(() => useGraphApi());

      await expect(result.current.fetchTodoLists()).rejects.toThrow(
        'Failed to fetch lists'
      );
    });
  });

  describe('fetchTasks', () => {
    it('タスクを正常に取得できる', async () => {
      const mockToken = 'valid-access-token';
      const mockTasks = {
        value: [
          { id: 'task-1', title: 'タスク1', status: 'notStarted' },
          { id: 'task-2', title: 'タスク2', status: 'completed' },
        ],
      };

      vi.mocked(deviceCodeFlow.getValidAccessToken).mockResolvedValue(mockToken);
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      const { result } = renderHook(() => useGraphApi());

      let tasks;
      await act(async () => {
        tasks = await result.current.fetchTasks('list-1');
      });

      expect(tasks).toEqual(mockTasks.value);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/graph/me/todo/lists/list-1/tasks?$orderby=createdDateTime DESC',
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });
  });

  describe('createTask', () => {
    it('タスクを正常に作成できる', async () => {
      const mockToken = 'valid-access-token';
      const mockTask = {
        id: 'new-task',
        title: '新しいタスク',
        status: 'notStarted',
      };

      vi.mocked(deviceCodeFlow.getValidAccessToken).mockResolvedValue(mockToken);
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask,
      });

      const { result } = renderHook(() => useGraphApi());

      let task;
      await act(async () => {
        task = await result.current.createTask('list-1', '新しいタスク');
      });

      expect(task).toEqual(mockTask);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/graph/me/todo/lists/list-1/tasks',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
          body: JSON.stringify({ title: '新しいタスク' }),
        }
      );
    });
  });

  describe('updateTask', () => {
    it('タスクを正常に更新できる', async () => {
      const mockToken = 'valid-access-token';
      const mockTask = {
        id: 'task-1',
        title: '更新されたタスク',
        status: 'completed',
      };

      vi.mocked(deviceCodeFlow.getValidAccessToken).mockResolvedValue(mockToken);
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask,
      });

      const { result } = renderHook(() => useGraphApi());

      let task;
      await act(async () => {
        task = await result.current.updateTask('list-1', 'task-1', {
          status: 'completed',
        });
      });

      expect(task).toEqual(mockTask);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/graph/me/todo/lists/list-1/tasks/task-1',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
          body: JSON.stringify({ status: 'completed' }),
        }
      );
    });
  });

  describe('deleteTask', () => {
    it('タスクを正常に削除できる', async () => {
      const mockToken = 'valid-access-token';

      vi.mocked(deviceCodeFlow.getValidAccessToken).mockResolvedValue(mockToken);
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      const { result } = renderHook(() => useGraphApi());

      await act(async () => {
        await result.current.deleteTask('list-1', 'task-1');
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/graph/me/todo/lists/list-1/tasks/task-1',
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });
  });

  describe('createList', () => {
    it('リストを正常に作成できる', async () => {
      const mockToken = 'valid-access-token';
      const mockList = {
        id: 'new-list',
        displayName: '新しいリスト',
      };

      vi.mocked(deviceCodeFlow.getValidAccessToken).mockResolvedValue(mockToken);
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockList,
      });

      const { result } = renderHook(() => useGraphApi());

      let list;
      await act(async () => {
        list = await result.current.createList('新しいリスト');
      });

      expect(list).toEqual(mockList);
      expect(global.fetch).toHaveBeenCalledWith('/api/graph/me/todo/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ displayName: '新しいリスト' }),
      });
    });
  });

  describe('deleteList', () => {
    it('リストを正常に削除できる', async () => {
      const mockToken = 'valid-access-token';

      vi.mocked(deviceCodeFlow.getValidAccessToken).mockResolvedValue(mockToken);
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });

      const { result } = renderHook(() => useGraphApi());

      await act(async () => {
        await result.current.deleteList('list-1');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/graph/me/todo/lists/list-1', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
    });
  });

  describe('getUserInfo', () => {
    it('ユーザー情報を正常に取得できる', async () => {
      const mockToken = 'valid-access-token';
      const mockUser = {
        displayName: '田中太郎',
        userPrincipalName: 'tanaka@example.com',
      };

      vi.mocked(deviceCodeFlow.getValidAccessToken).mockResolvedValue(mockToken);
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const { result } = renderHook(() => useGraphApi());

      let user;
      await act(async () => {
        user = await result.current.getUserInfo();
      });

      expect(user).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith('/api/graph/me', {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
    });
  });
});
