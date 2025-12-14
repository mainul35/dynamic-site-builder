import axios from 'axios';

/**
 * Base API URL
 * In development: Vite proxy forwards /api to http://localhost:8080/api
 * In production: Served by Spring Boot, same origin
 */
const API_BASE_URL = '/api';

/**
 * Axios instance with default configuration
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
