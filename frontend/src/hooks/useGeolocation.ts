import { useState, useEffect, useCallback } from 'react';

export interface GeolocationState {
  coordinates: { lat: number; lng: number } | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    accuracy: null,
    error: null,
    loading: true,
  });

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setState({
        coordinates: null,
        accuracy: null,
        error: 'Geolocation is not supported by your browser.',
        loading: false,
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        });
      },
      (error) => {
        let errorMsg = 'An unknown error occurred while retrieving location.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission denied. Please enable location access in your browser settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Location information is unavailable. Try again or search manually.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Request to get user location timed out. Try again.';
        }
        setState({
          coordinates: null,
          accuracy: null,
          error: errorMsg,
          loading: false,
        });
      },
      options
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return {
    ...state,
    refetch: requestLocation,
  };
}
