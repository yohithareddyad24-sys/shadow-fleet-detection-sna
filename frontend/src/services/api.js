/**
 * Core HTTP Client for Shadow Fleet AI.
 * Handles timeouts, AbortController signals, request IDs, network errors, and JSON parsing.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

let requestIdCounter = 0;

export class ApiError extends Error {
  constructor(message, status = 0, isNetworkError = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Universal fetch wrapper with timeout, signal, and request tracking.
 */
export async function apiClient(endpoint, options = {}) {
  const requestId = ++requestIdCounter;
  const timeoutMs = options.timeout || 6000;
  
  // Setup AbortController for stale requests and timeouts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  // If consumer passed their own signal, abort when it aborts
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const headers = {
      'Accept': 'application/json',
      'X-Request-ID': `req-${requestId}`,
      ...(options.headers || {}),
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson?.detail) errorMessage = errorJson.detail;
      } catch (_) {
        // Fall back to status text
      }
      throw new ApiError(errorMessage, response.status, false);
    }

    const data = await response.json();
    return { data, isDemo: false, status: response.status };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out or was aborted', 408, true);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network connection failed', 0, true);
  }
}

export async function pingBackend() {
  try {
    const res = await apiClient('/api/health', { timeout: 2000 });
    return { online: true, data: res.data };
  } catch (err) {
    return { online: false, data: null, error: err.message };
  }
}

// Re-export convenience wrappers for existing views
import { getVessels, getVesselByMmsi } from './vessels';
import { getFleetMetrics } from './analytics';
import { getNetworkGraph, runAcoPathfinder } from './network';
import { 
  getInvestigationCases, 
  createInvestigationCase as createCase,
  updateInvestigationCase as updateCase,
  addCaseNote as appendNote 
} from './alerts';

export const fetchVessels = async (params = {}) => {
  const res = await getVessels({ pageSize: 500, ...params });
  return res.data || [];
};

export const checkBackendHealth = pingBackend;

export const fetchMetricsSummary = async (signal) => {
  const res = await getFleetMetrics(signal);
  return res.data;
};

export const fetchVesselDetails = async (mmsi, signal) => {
  const res = await getVesselByMmsi(mmsi, signal);
  return res.data;
};

export const fetchNetworkGraph = async (signal) => {
  const res = await getNetworkGraph(signal);
  return res.data;
};

export const runAcoOptimizer = async (params, signal) => {
  const res = await runAcoPathfinder(params, signal);
  return res.data;
};

export const fetchInvestigationCases = async (signal) => {
  const res = await getInvestigationCases(signal);
  return res.data;
};

export const createInvestigationCase = async (caseData, signal) => {
  const res = await createCase(caseData, signal);
  return res.data;
};

export const updateInvestigationCase = async (caseId, updates) => {
  const res = await updateCase(caseId, updates);
  return res.data;
};

export const addCaseNote = async (caseId, noteText, author) => {
  const res = await appendNote(caseId, noteText, author);
  return res.data;
};


