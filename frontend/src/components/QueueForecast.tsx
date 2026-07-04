'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Clock, MapPin } from 'lucide-react';

interface ForecastData {
  doctorId: string;
  doctorName: string;
  currentWaitTime: number;
  forecastedWaitTime: number;
  queueLength: number;
  delayStatus: 'on-time' | 'delayed' | 'critical';
  delayMinutes: number;
  facility: string;
  estimatedCallTime: string;
}

interface QueueForecastProps {
  patientLocation?: { lat: number; lng: number };
  selectedDoctorId?: string;
}

export function QueueForecast({ patientLocation, selectedDoctorId }: QueueForecastProps) {
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState<ForecastData | null>(null);

  useEffect(() => {
    fetchQueueForecast();
  }, [selectedDoctorId]);

  const fetchQueueForecast = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/queue/forecast${selectedDoctorId ? `?doctorId=${selectedDoctorId}` : ''}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setForecasts(data.forecasts || []);
        if (data.forecasts?.length > 0) {
          setSelectedForecast(data.forecasts[0]);
        }
      }
    } catch (error) {
      console.log('[v0] Error fetching forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDelayColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-rose-500/20 border-rose-500/50 text-rose-300';
      case 'delayed':
        return 'bg-amber-500/20 border-amber-500/50 text-amber-300';
      default:
        return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
    }
  };

  const getDelayIcon = (status: string) => {
    if (status === 'critical' || status === 'delayed') {
      return <AlertTriangle className="w-4 h-4" />;
    }
    return <TrendingUp className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-800/50 rounded-xl" />
        ))}
      </div>
    );
  }

  if (forecasts.length === 0) {
    return (
      <div className="p-6 rounded-xl border border-white/10 bg-slate-800/20 text-center">
        <p className="text-slate-400 text-sm">No queue information available right now</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected Forecast Detail */}
      {selectedForecast && (
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-cyan-500/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">{selectedForecast.doctorName}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                <MapPin className="w-3 h-3" />
                {selectedForecast.facility}
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1 ${getDelayColor(selectedForecast.delayStatus)}`}>
              {getDelayIcon(selectedForecast.delayStatus)}
              {selectedForecast.delayStatus === 'on-time'
                ? 'On Time'
                : `${selectedForecast.delayMinutes} min delay`}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-slate-700/50 border border-white/5">
              <div className="text-xs text-slate-400 font-semibold mb-1">Current Wait</div>
              <div className="text-2xl font-bold text-cyan-400">
                {selectedForecast.currentWaitTime}m
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/50 border border-white/5">
              <div className="text-xs text-slate-400 font-semibold mb-1">Forecasted Wait</div>
              <div className="text-2xl font-bold text-blue-400">
                {selectedForecast.forecastedWaitTime}m
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/50 border border-white/5">
              <div className="text-xs text-slate-400 font-semibold mb-1">Queue Length</div>
              <div className="text-2xl font-bold text-purple-400">
                {selectedForecast.queueLength}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
            <Clock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-300">Estimated Call Time</p>
              <p className="text-xs text-blue-200">{selectedForecast.estimatedCallTime}</p>
            </div>
          </div>
        </div>
      )}

      {/* Forecasts List */}
      {forecasts.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase">Other Doctors</p>
          <div className="grid gap-2">
            {forecasts.slice(1).map((forecast) => (
              <button
                key={forecast.doctorId}
                onClick={() => setSelectedForecast(forecast)}
                className="p-3 rounded-lg border border-white/10 bg-slate-800/30 hover:border-white/20 hover:bg-slate-800/50 transition-all text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-white text-sm">{forecast.doctorName}</p>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${getDelayColor(forecast.delayStatus)}`}>
                    {forecast.delayStatus === 'on-time'
                      ? 'On Time'
                      : `${forecast.delayMinutes}m delay`}
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-slate-400">
                  <span>Wait: {forecast.currentWaitTime}m</span>
                  <span>Queue: {forecast.queueLength}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Smart Alert */}
      {forecasts.some(f => f.delayStatus !== 'on-time') && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-1">Queue Delays Detected</p>
            <p className="text-xs text-amber-200">
              Some facilities have longer waits today. Consider visiting during a less busy time or choosing an on-time doctor.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
