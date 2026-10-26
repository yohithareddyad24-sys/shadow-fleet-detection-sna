/**
 * Hook for managing vessel list state with search, filtering, and stale request cancellation.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getVessels } from '../services/vessels';

export function useVessels(initialParams = {}) {
  const [vessels, setVessels] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [params, setParams] = useState(initialParams);

  const abortControllerRef = useRef(null);

  const fetchList = useCallback(async (currentParams) => {
    // Cancel stale request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await getVessels(currentParams, controller.signal);
      setVessels(res.data);
      setTotal(res.total);
      setIsDemo(res.isDemo);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load vessels');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList(params);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [params, fetchList]);

  const updateParams = useCallback((newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const refresh = useCallback(() => {
    fetchList(params);
  }, [fetchList, params]);

  return {
    vessels,
    total,
    loading,
    error,
    isDemo,
    params,
    updateParams,
    refresh,
  };
}
