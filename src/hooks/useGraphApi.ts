import { useCallback } from 'react';
import { AccountInfo, PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';
import { loginRequest } from '../auth/msalConfig';
import { TodoTaskList, TodoTask } from '../types';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const TODO_ENDPOINT = `${GRAPH_BASE}/me/todo`;

export function useGraphApi(account: AccountInfo, msalInstance: PublicClientApplication) {
  const getAccessToken = useCallback(async () => {
    try {
      const response = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        const response = await msalInstance.acquireTokenPopup(loginRequest);
        return response.accessToken;
      }
      throw error;
    }
  }, [account, msalInstance]);

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = await getAccessToken();
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }, [getAccessToken]);

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

  const createTask = useCallback(async (listId: string, title: string): Promise<TodoTask> => {
    const response = await fetchWithAuth(`${TODO_ENDPOINT}/lists/${listId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
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

  return {
    fetchTodoLists,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    createList,
    deleteList,
    getUserInfo,
  };
}
