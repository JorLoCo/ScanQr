import axios from 'axios';

//Exportar la interfaz para que pueda ser usada en otros archivos
export interface ScannedCode {
  id: string;
  data: string;
  type: string;
}

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json;encoding=utf-8',
    'Content-Type': 'application/json;encoding=utf-8'
  },
  timeout: 10000
});

export const api = {
  getAllCodes: async (): Promise<ScannedCode[]> => {
    try {
      const response = await apiClient.get<ScannedCode[]>('/codigos');
      return response.data;
    } catch (error) {
      console.error('Error fetching codes:', error);
      return [];
    }
  },

  getCodeById: async (id: string): Promise<ScannedCode | null> => {
    try {
      const response = await apiClient.get<ScannedCode>(`/codigos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching code ${id}:`, error);
      return null;
    }
  },

  createCode: async (data: string, type: string): Promise<ScannedCode> => {
    try {
      const response = await apiClient.post<ScannedCode>('/codigos', { data, type });
      return response.data;
    } catch (error) {
      console.error('Error creating code:', error);
      throw new Error('Failed to create code');
    }
  },

  deleteCode: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/codigos/${id}`);
    } catch (error) {
      console.error(`Error deleting code ${id}:`, error);
      throw new Error('Failed to delete code');
    }
  }
};