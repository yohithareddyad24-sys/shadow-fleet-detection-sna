/**
 * Hook for managing Ant Colony Optimization path search runs.
 */

import { useState, useCallback, useRef } from 'react';
import { runAcoPathfinder } from '../services/network';

export function useAcoPathfinder() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  const abortControllerRef = useRef(null);

  const executePathfinder = useCallback(async (params) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await runAcoPathfinder(params, controller.signal);
      setResult(res.data);
      setIsDemo(res.isDemo);
      return res.data;
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'ACO optimization run failed');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    loading,
    error,
    isDemo,
    executePathfinder,
    clearResult,
  };
}
