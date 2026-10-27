import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import { getAccessToken } from './authSession';
export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        Accept: 'text/plain',
        'Content-Type': 'application/json',
    },
});
export const getUserServices = async (userId) =>
    api.get(`/ServiceMaster/getuserservices?userId=${encodeURIComponent(userId)}`);
export const getSubscriptionHistory = async (userId) =>
    api.get(`/UserSubscriptionDetail/get?userId=${encodeURIComponent(userId)}`);
export const getServiceCatalog = async () =>
    api.get('/ServiceMaster/get');

api.interceptors.request.use((config) => {
    if (!API_BASE_URL) {
        throw new Error('EXPO_PUBLIC_API_URL is required. Configure an approved API environment URL.');
    }
    // const accessToken = getAccessToken();
    // if (accessToken && config.headers) {
    //     config.headers.Authorization = `Bearer ${accessToken}`;
    // }
    return config;
});
api.interceptors.response.use((response) => response.data, (error) => Promise.reject({
    status: error?.response?.status,
    message: error?.response?.data?.message || error?.message || 'Request failed',
    errors: error?.response?.data?.errors,
}));
