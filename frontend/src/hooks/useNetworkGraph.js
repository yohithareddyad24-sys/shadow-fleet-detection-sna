/**
 * Hook for managing Cytoscape network graph state and SNA components.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getNetworkGraph } from '../services/network';

export function useNetworkGraph() {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  const abortControllerRef = useRef(null);

  const loadGraph = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await getNetworkGraph(controller.signal);
      setGraphData(res.data);
      setIsDemo(res.isDemo);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load SNA graph');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGraph();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadGraph]);

  return {
    graphData,
    loading,
    error,
    isDemo,
    refresh: loadGraph,
  };
}
