import { useCallback, useMemo } from 'react';
import { getValidAccessToken } from '../auth/deviceCodeFlow';
import { TodoTaskList, TodoTask } from '../types';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const TODO_ENDPOINT = `${GRAPH_BASE}/me/todo`;

export function useGraphApi() {
  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = await getValidAccessToken();
    if (!token) throw new Error('Not authenticated');

    // Convert Graph API URL to proxy URL
    const proxyUrl = url.replace(
      'https://graph.microsoft.com/v1.0/',
      '/api/graph/'
    );

    return fetch(proxyUrl, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }, []);

  const fetchTodoLists = useCallback(async (): Promise<TodoTaskList[]> => {
    const response = await fetchWithAuth(`${TODO_ENDPOINT}/lists`);
    if (!response.ok) throw new Error(`Failed to fetch lists: ${response.statusText}`);
    const data = await response.json();
    return data.value;
  }, [fetchWithAuth]);

  const fetchTasks = useCallback(async (listId: string): Promise<TodoTask[]> => {
    const response = await fetchWithAuth(
      `${TODO_ENDPOINT}/lists/${listId}/tasks?$orderby=createdDateTime DESC`
    );
    if (!response.ok) throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    const data = await response.json();
    return data.value;
  }, [fetchWithAuth]);

  const createTask = useCallback(async (
    listId: string,
    title: string,
    dueDateTime?: { dateTime: string; timeZone: string }
  ): Promise<TodoTask> => {
    const taskData: any = { title };
    if (dueDateTime) {
      taskData.dueDateTime = dueDateTime;
    }
    
    const response = await fetchWithAuth(`${TODO_ENDPOINT}/lists/${listId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    if (!response.ok) throw new Error(`Failed to create task: ${response.statusText}`);
    return response.json();
  }, [fetchWithAuth]);

  const updateTask = useCallback(async (listId: string, taskId: string, updates: Partial<TodoTask>): Promise<TodoTask> => {
    const response = await fetchWithAuth(`${TODO_ENDPOINT}/lists/${listId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error(`Failed to update task: ${response.statusText}`);
    return response.json();
  }, [fetchWithAuth]);

  const deleteTask = useCallback(async (listId: string, taskId: string): Promise<void> => {
    const response = await fetchWithAuth(`${TODO_ENDPOINT}/lists/${listId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Failed to delete task: ${response.statusText}`);
  }, [fetchWithAuth]);

  const createList = useCallback(async (displayName: string): Promise<TodoTaskList> => {
    const response = await fetchWithAuth(`${TODO_ENDPOINT}/lists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ displayName }),
    });
    if (!response.ok) throw new Error(`Failed to create list: ${response.statusText}`);
    return response.json();
  }, [fetchWithAuth]);

  const deleteList = useCallback(async (listId: string): Promise<void> => {
    const response = await fetchWithAuth(`${TODO_ENDPOINT}/lists/${listId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Failed to delete list: ${response.statusText}`);
  }, [fetchWithAuth]);

  const getUserInfo = useCallback(async () => {
    const response = await fetchWithAuth(`${GRAPH_BASE}/me`);
    if (!response.ok) throw new Error(`Failed to fetch user info: ${response.statusText}`);
    return response.json();
  }, [fetchWithAuth]);

  return useMemo(() => ({
    fetchTodoLists,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    createList,
    deleteList,
    getUserInfo,
  }), [fetchTodoLists, fetchTasks, createTask, updateTask, deleteTask, createList, deleteList, getUserInfo]);
}
