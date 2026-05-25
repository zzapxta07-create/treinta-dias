import { useState, useCallback } from 'react';
import api from '../api/index.js';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const call = useCallback(async (method, url, data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api[method](url, data);
      return res.data.data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error desconocido';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get    = useCallback((url)       => call('get',    url),       [call]);
  const post   = useCallback((url, data) => call('post',   url, data), [call]);
  const put    = useCallback((url, data) => call('put',    url, data), [call]);
  const del    = useCallback((url)       => call('delete', url),       [call]);

  return { loading, error, get, post, put, del };
}
