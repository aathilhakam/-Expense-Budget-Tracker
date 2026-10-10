import api from './api.js';

export const getBudgets = async (params = {}) => (await api.get('/budgets', { params })).data.budgets;
export const createBudget = async (payload) => (await api.post('/budgets', payload)).data.budget;
export const updateBudget = async (id, payload) => (await api.put(`/budgets/${id}`, payload)).data.budget;
export const deleteBudget = (id) => api.delete(`/budgets/${id}`);
