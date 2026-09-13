import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { loginRequest, graphConfig } from '../msalConfig';
import { TodoTaskList, TodoTask } from '../types';
import { useCallback } from 'react';

export function useGraphApi() {
  const { instance, accounts } = useMsal();

  const getAccessToken = useCallback(async () => {
    const account = accounts[0];
    if (!account) throw new Error('No account found');

    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        const response = await instance.acquireTokenPopup(loginRequest);
        return response.accessToken;
      }
      throw error;
    }
  }, [instance, accounts]);

  const fetchTodoLists = useCallback(async (): Promise<TodoTaskList[]> => {
    const token = await getAccessToken();
    const response = await fetch(`${graphConfig.todoEndpoint}/lists`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Failed to fetch lists: ${response.statusText}`);
    const data = await response.json();
    return data.value;
  }, [getAccessToken]);

  const fetchTasks = useCallback(async (listId: string): Promise<TodoTask[]> => {
    const token = await getAccessToken();
    const response = await fetch(
      `${graphConfig.todoEndpoint}/lists/${listId}/tasks?$orderby=createdDateTime DESC`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    const data = await response.json();
    return data.value;
  }, [getAccessToken]);

  const createTask = useCallback(async (listId: string, title: string): Promise<TodoTask> => {
    const token = await getAccessToken();
    const response = await fetch(`${graphConfig.todoEndpoint}/lists/${listId}/tasks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error(`Failed to create task: ${response.statusText}`);
    return response.json();
  }, [getAccessToken]);

  const updateTask = useCallback(async (listId: string, taskId: string, updates: Partial<TodoTask>): Promise<TodoTask> => {
    const token = await getAccessToken();
    const response = await fetch(`${graphConfig.todoEndpoint}/lists/${listId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error(`Failed to update task: ${response.statusText}`);
    return response.json();
  }, [getAccessToken]);

  const deleteTask = useCallback(async (listId: string, taskId: string): Promise<void> => {
    const token = await getAccessToken();
    const response = await fetch(`${graphConfig.todoEndpoint}/lists/${listId}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Failed to delete task: ${response.statusText}`);
  }, [getAccessToken]);

  const createList = useCallback(async (displayName: string): Promise<TodoTaskList> => {
    const token = await getAccessToken();
    const response = await fetch(`${graphConfig.todoEndpoint}/lists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ displayName }),
    });
    if (!response.ok) throw new Error(`Failed to create list: ${response.statusText}`);
    return response.json();
  }, [getAccessToken]);

  const deleteList = useCallback(async (listId: string): Promise<void> => {
    const token = await getAccessToken();
    const response = await fetch(`${graphConfig.todoEndpoint}/lists/${listId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Failed to delete list: ${response.statusText}`);
  }, [getAccessToken]);

  const getUserInfo = useCallback(async () => {
    const token = await getAccessToken();
    const response = await fetch(`${graphConfig.graphEndpoint}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Failed to fetch user info: ${response.statusText}`);
    return response.json();
  }, [getAccessToken]);

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
