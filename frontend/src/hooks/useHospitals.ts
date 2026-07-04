import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchHospitalsAroundNagpur } from '@/services/overpass';
import type { HospitalFacility } from '@/types/hospital';

type HospitalsStatus = 'idle' | 'loading' | 'success' | 'error';

export function useHospitals() {
  const [facilities, setFacilities] = useState<HospitalFacility[]>([]);
  const [status, setStatus] = useState<HospitalsStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);

  const loadHospitals = useCallback(
    async (forceRefresh = false) => {
      setStatus('loading');
      setError(null);

      try {
        const data = await fetchHospitalsAroundNagpur(forceRefresh);

        if (!mountedRef.current) {
          return;
        }

        setFacilities(data);
        setStatus('success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load nearby healthcare facilities.';
        if (!mountedRef.current) {
          return;
        }

        setError(message);
        setStatus('error');
      }
    },
    [],
  );

  useEffect(() => {
    mountedRef.current = true;
    void loadHospitals();
    return () => {
      mountedRef.current = false;
    };
  }, [loadHospitals]);

  return {
    facilities,
    status,
    error,
    isLoading: status === 'loading' || status === 'idle',
    refetch: () => loadHospitals(true),
  };
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
