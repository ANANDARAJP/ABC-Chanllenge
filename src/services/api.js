import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 30000
});

export const uploadExcelFiles = async (formData, onUploadProgress) => {
  const response = await api.post('/upload-excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  });
  return response.data;
};

export const downloadReport = async () => {
  const response = await api.get('/download-report', {
    responseType: 'blob'
  });
  return response.data;
};

export const fetchAiInsights = async () => {
  const response = await api.get('/ai-insights');
  return response.data;
};

export default api;
