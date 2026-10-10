import api from './api.js';

export const getTransactions = async (params = {}) =>
  (await api.get('/transactions', { params })).data.transactions;
export const createTransaction = async (payload) =>
  (await api.post('/transactions', payload)).data.transaction;
export const updateTransaction = async (id, payload) =>
  (await api.put(`/transactions/${id}`, payload)).data.transaction;
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);
