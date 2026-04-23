/**
 * API Configuration
 * Centralized API settings for the application
 */

// In Docker: uses relative path (proxied by nginx)
// Local dev: set window.API_BASE_URL in index.html
const API_BASE_URL = (window as any).API_BASE_URL || '/api';

const API_ENDPOINTS = {
  PROJECTS: API_BASE_URL + '/projects',
  AREAS: API_BASE_URL + '/areas',
  COMPANIES: API_BASE_URL + '/companies'
} as const;
