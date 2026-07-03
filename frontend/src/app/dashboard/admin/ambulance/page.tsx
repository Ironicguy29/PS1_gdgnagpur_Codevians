'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/providers/ToastProvider';
import api from '@/lib/api';
import AmbulanceMap from '@/components/ambulance/AmbulanceMap';
import { 
  AlertTriangle, Truck, MapPin, Phone, Users, ShieldAlert,
  Activity, Play, CheckCircle2, XCircle, RefreshCw
} from 'lucide-react';

export default function AdminAmbulanceHQ() {
  const { socket } = useSocket();
  const { toast } = useToast();
  
  // Data states
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [activeDispatches, setActiveDispatches] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({
    total_trips: 0,
    avg_response_min: 0,
    avg_trip_min: 0,
    fleet_utilization_pct: 0,
    fleet: { total: 0, available: 0, dispatched: 0, out_of_service: 0, at_hospital: 0 }
  });

  // Selected trip to monitor on map
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  
  // Form states
  const [dispatchType, setDispatchType] = useState<'auto' | 'manual'>('auto');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLat, setPickupLat] = useState('21.1458'); // Default Nagpur center
  const [pickupLng, setPickupLng] = useState('79.0882');
  const [priority, setPriority] = useState<'critical' | 'high' | 'moderate' | 'low'>('high');
  const [selectedAmbId, setSelectedAmbId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen to real-time update events
    const handleLocationUpdate = (data: any) => {
      // If we are tracking this ambulance, update its location in selectedTrip
      setAmbulances(prev => prev.map(a => {
        if (a._id === data.ambulanceId) {
          return {
            ...a,
            current_location: {
              latitude: data.latitude,
              longitude: data.longitude,
              speed: data.speed,
              heading: data.heading,
              updated_at: data.timestamp
            }
          };
        }
        return a;
      }));

      setSelectedTrip((prev: any) => {
        if (prev && prev.ambulance_id?._id === data.ambulanceId) {
          return {
            ...prev,
            liveAmbulanceLocation: {
              latitude: data.latitude,
              longitude: data.longitude,
              speed: data.speed,
              heading: data.heading
            }
          };
        }
        return prev;
      });
    };

    const handleEtaUpdate = (data: any) => {
      setSelectedTrip((prev: any) => {
        if (prev && prev._id === data.tripId) {
          return {
            ...prev,
            eta_minutes_to_patient: data.etaMinToPatient ?? prev.eta_minutes_to_patient,
            eta_minutes_to_hospital: data.etaMinToHospital ?? prev.eta_minutes_to_hospital,
            distance_km_to_patient: data.distanceKmToPatient ?? prev.distance_km_to_patient,
            distance_km_to_hospital: data.distanceKmToHospital ?? prev.distance_km_to_hospital,
          };
        }
        return prev;
      });
      fetchData();
    };

    const handleTripUpdate = (data: any) => {
      toast(`Trip ${data.tripId} status updated to: ${data.status}`, 'info');
      fetchData();
    };

    const handleDispatched = (data: any) => {
      toast(`Ambulance successfully dispatched!`, 'success');
      fetchData();
    };

    socket.on('ambulance.location', handleLocationUpdate);
    socket.on('ambulance.eta_update', handleEtaUpdate);
    socket.on('ambulance.trip_update', handleTripUpdate);
    socket.on('ambulance.dispatched', handleDispatched);

    return () => {
      socket.off('ambulance.location', handleLocationUpdate);
      socket.off('ambulance.eta_update', handleEtaUpdate);
      socket.off('ambulance.trip_update', handleTripUpdate);
      socket.off('ambulance.dispatched', handleDispatched);
    };
  }, [socket]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ambRes, driverRes, activeRes, analyticsRes] = await Promise.all([
        api.get('/ambulance'),
        api.get('/ambulance/drivers'),
        api.get('/ambulance/dispatch/active'),
        api.get('/ambulance/analytics')
      ]);

      setAmbulances(ambRes.data);
      setDrivers(driverRes.data);
      setActiveDispatches(activeRes.data);
      setAnalytics(analyticsRes.data);
      
      // Auto select current active trip if not selected
      if (activeRes.data.length > 0) {
        // Find corresponding trip
        const firstDispatch = activeRes.data[0];
        if (firstDispatch.trip_id) {
          fetchTripDetail(firstDispatch.trip_id._id || firstDispatch.trip_id);
        }
      } else {
        setSelectedTrip(null);
      }
    } catch (e) {
      console.error('Failed to load dispatch data', e);
      toast('Failed to load dispatch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTripDetail = async (tripId: string) => {
    try {
      const { data } = await api.get(`/ambulance/trip/${tripId}`);
      setSelectedTrip(data);
    } catch (err) {
      console.error('Error fetching trip detail', err);
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        pickupLat: Number(pickupLat),
        pickupLng: Number(pickupLng),
        pickupAddress,
        chiefComplaint,
        callerName,
        callerPhone,
        priority
      };

      if (dispatchType === 'manual') {
        if (!selectedAmbId || !selectedDriverId) {
          toast('Please select an ambulance and driver for manual override', 'error');
          setSubmitting(false);
          return;
        }
        payload.ambulanceId = selectedAmbId;
        payload.driverId = selectedDriverId;
      }

      await api.post('/ambulance/dispatch', payload);
      toast('Ambulance Assigned & Dispatched!', 'success');
      
      // Reset form
      setChiefComplaint('');
      setCallerName('');
      setCallerPhone('');
      setPickupAddress('');
      
      fetchData();
    } catch (e: any) {
      toast(e.response?.data?.message || 'Failed to dispatch ambulance', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelDispatch = async (dispatchId: string) => {
    try {
      await api.post(`/ambulance/dispatch/${dispatchId}/cancel`);
      toast('Dispatch request cancelled successfully', 'success');
      setSelectedTrip(null);
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to cancel dispatch', 'error');
    }
  };

  // Helper statuses classes
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-500/20';
      case 'dispatched':
      case 'en_route_to_patient':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-500/20 animate-pulse';
      case 'transporting':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-500/20 animate-pulse';
      case 'arrived_pickup':
      case 'arrived_destination':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-700/20';
    }
  };

  // Extract map details
  const mapAmbLoc = selectedTrip?.liveAmbulanceLocation || 
    (selectedTrip?.ambulance_id?.current_location?.latitude 
      ? selectedTrip.ambulance_id.current_location 
      : selectedTrip?.ambulance_id?.base_location);

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-8 h-8 text-red-500" /> Ambulance HQ & Dispatch
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Real-time fleet optimization, GPS tracking & automatic OSRM route dispatch controls.
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" className="flex items-center gap-2 dark:border-slate-800">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh System
        </Button>
      </div>

      {/* Analytics Widget Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <GlassCard className="p-4 border-l-4 border-l-red-500">
          <p className="text-xs text-slate-400 uppercase font-semibold">Total Fleet</p>
          <p className="text-3xl font-bold mt-1">{analytics?.fleet?.total || ambulances.length}</p>
        </GlassCard>
        <GlassCard className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs text-slate-400 uppercase font-semibold">Available Now</p>
          <p className="text-3xl font-bold mt-1 text-emerald-500">
            {ambulances.filter(a => a.status === 'available').length}
          </p>
        </GlassCard>
        <GlassCard className="p-4 border-l-4 border-l-blue-500">
          <p className="text-xs text-slate-400 uppercase font-semibold">Active Trips</p>
          <p className="text-3xl font-bold mt-1 text-blue-500">{activeDispatches.length}</p>
        </GlassCard>
        <GlassCard className="p-4 border-l-4 border-l-amber-500">
          <p className="text-xs text-slate-400 uppercase font-semibold">Avg Response</p>
          <p className="text-3xl font-bold mt-1">{analytics?.avg_response_min} mins</p>
        </GlassCard>
        <GlassCard className="p-4 border-l-4 border-l-purple-500 col-span-2 md:col-span-1">
          <p className="text-xs text-slate-400 uppercase font-semibold">Fleet Utilization</p>
          <p className="text-3xl font-bold mt-1">{analytics?.fleet_utilization_pct}%</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main interactive map & dispatch details */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-2 overflow-hidden relative">
            <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" /> Live Tracking Map
              </h3>
              {selectedTrip ? (
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full text-xs text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
                  ⚡ Monitoring: {selectedTrip.ambulance_id?.registration_number} ({selectedTrip.status})
                </div>
              ) : (
                <div className="text-xs text-slate-400">Select an active trip below to begin tracking</div>
              )}
            </div>
            
            <AmbulanceMap 
              height="450px"
              ambulance={mapAmbLoc ? {
                latitude: mapAmbLoc.latitude,
                longitude: mapAmbLoc.longitude,
                heading: mapAmbLoc.heading,
                speed: mapAmbLoc.speed
              } : undefined}
              pickup={selectedTrip?.pickup_location ? {
                latitude: selectedTrip.pickup_location.latitude,
                longitude: selectedTrip.pickup_location.longitude,
                address: selectedTrip.pickup_location.address
              } : undefined}
              destination={selectedTrip?.destination_location ? {
                latitude: selectedTrip.destination_location.latitude,
                longitude: selectedTrip.destination_location.longitude,
                address: selectedTrip.destination_location.address
              } : undefined}
              gpsTrail={selectedTrip?.gps_trail || []}
            />

            {/* Selected Trip Details */}
            {selectedTrip && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <div>
                  <p className="text-xs text-slate-400">Driver Details</p>
                  <p className="font-bold mt-0.5 text-sm">{selectedTrip.driver_id?.name || 'Ramesh Kumar'}</p>
                  <p className="text-xs text-slate-500">Call: {selectedTrip.driver_id?.phone || '+919876543219'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Vehicle / Status</p>
                  <p className="font-bold mt-0.5 text-sm">{selectedTrip.ambulance_id?.registration_number} ({selectedTrip.ambulance_id?.type})</p>
                  <p className="text-xs text-slate-500">Status: <span className="capitalize">{selectedTrip.status}</span></p>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>ETA to Patient</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedTrip.eta_minutes_to_patient?.toFixed(1) || '0.0'}m ({selectedTrip.distance_km_to_patient?.toFixed(1) || '0.0'}km)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>ETA to Hospital</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedTrip.eta_minutes_to_hospital?.toFixed(1) || '0.0'}m ({selectedTrip.distance_km_to_hospital?.toFixed(1) || '0.0'}km)</span>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Fleet Management Table */}
          <GlassCard className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-500" /> Fleet Management Status
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 uppercase">
                    <th className="pb-3">Ambulance Info</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Driver</th>
                    <th className="pb-3">Fuel</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800">
                  {ambulances.map((amb) => (
                    <tr key={amb._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="py-3 font-semibold">
                        <div>{amb.registration_number}</div>
                        <div className="text-xs text-slate-400 font-normal">{amb.vehicle_model}</div>
                      </td>
                      <td className="py-3">
                        <span className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded text-xs font-mono font-bold">
                          {amb.type}
                        </span>
                      </td>
                      <td className="py-3">
                        {amb.current_driver_id ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>{amb.current_driver_id.name || 'Assigned'}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${amb.fuel_level_pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold">{amb.fuel_level_pct}%</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(amb.status)}`}>
                          {amb.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {ambulances.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">No ambulances found. Run database seeding.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Dispatch control Form & Active Feed */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" /> Emergency Dispatcher Desk
            </h3>

            <div className="flex gap-2 mb-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setDispatchType('auto')}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${dispatchType === 'auto' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                Auto-Nearest Assign
              </button>
              <button
                type="button"
                onClick={() => setDispatchType('manual')}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${dispatchType === 'manual' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                Manual Override
              </button>
            </div>

            <form onSubmit={handleDispatch} className="space-y-4 text-left">
              <div>
                <Label htmlFor="callerName" className="text-xs text-slate-400">Caller Name</Label>
                <Input
                  id="callerName"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="mt-1 dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <div>
                <Label htmlFor="callerPhone" className="text-xs text-slate-400">Caller Phone</Label>
                <Input
                  id="callerPhone"
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(e.target.value)}
                  placeholder="+919876543210"
                  required
                  className="mt-1 dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <div>
                <Label htmlFor="chiefComplaint" className="text-xs text-slate-400">Chief Complaint / Trauma Details</Label>
                <Input
                  id="chiefComplaint"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Cardiac arrest, chest pain"
                  required
                  className="mt-1 dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <div>
                <Label htmlFor="pickupAddress" className="text-xs text-slate-400">Pickup Location / Address</Label>
                <Input
                  id="pickupAddress"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Sitabuldi Metro Station, Nagpur"
                  required
                  className="mt-1 dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="pickupLat" className="text-xs text-slate-400">Latitude</Label>
                  <Input
                    id="pickupLat"
                    value={pickupLat}
                    onChange={(e) => setPickupLat(e.target.value)}
                    required
                    className="mt-1 dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <Label htmlFor="pickupLng" className="text-xs text-slate-400">Longitude</Label>
                  <Input
                    id="pickupLng"
                    value={pickupLng}
                    onChange={(e) => setPickupLng(e.target.value)}
                    required
                    className="mt-1 dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-400">Triage Priority Level</Label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full mt-1 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 h-10 px-3 rounded-md text-sm"
                >
                  <option value="critical">🔴 Critical (Immediate ALS)</option>
                  <option value="high">🟠 High (Trauma/OPD)</option>
                  <option value="moderate">🟡 Moderate (Basic Transport)</option>
                  <option value="low">🔵 Low (Clinical Discharge)</option>
                </select>
              </div>

              {dispatchType === 'manual' && (
                <>
                  <div>
                    <Label className="text-xs text-slate-400">Select Available Vehicle</Label>
                    <select
                      value={selectedAmbId}
                      onChange={(e) => setSelectedAmbId(e.target.value)}
                      className="w-full mt-1 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 h-10 px-3 rounded-md text-sm"
                      required
                    >
                      <option value="">-- Choose Ambulance --</option>
                      {ambulances
                        .filter(a => a.status === 'available')
                        .map(a => (
                          <option key={a._id} value={a._id}>
                            {a.registration_number} ({a.type} - Fuel {a.fuel_level_pct}%)
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs text-slate-400">Select Available Driver</Label>
                    <select
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="w-full mt-1 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 h-10 px-3 rounded-md text-sm"
                      required
                    >
                      <option value="">-- Choose Driver --</option>
                      {drivers
                        .filter(d => d.status === 'available')
                        .map(d => (
                          <option key={d._id} value={d._id}>
                            {d.name} (License: {d.license_number})
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 shadow-lg shadow-red-200 dark:shadow-none"
              >
                {submitting ? 'Processing Dispatch...' : '🚨 Trigger Ambulance Dispatch'}
              </Button>
            </form>
          </GlassCard>

          {/* Active Dispatches Feed */}
          <GlassCard className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 animate-bounce" /> Active Dispatches
              </span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                {activeDispatches.length} running
              </span>
            </h3>

            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {activeDispatches.map((dispatch) => (
                <div 
                  key={dispatch._id} 
                  className={`p-4 border rounded-xl cursor-pointer hover:border-blue-400 transition-all ${
                    selectedTrip && selectedTrip._id === dispatch.trip_id?._id
                      ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/10'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                  onClick={() => dispatch.trip_id && fetchTripDetail(dispatch.trip_id._id || dispatch.trip_id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 px-2 py-0.5 rounded font-bold">
                      {dispatch.priority}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(dispatch.assigned_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-sm font-bold mt-2 text-slate-800 dark:text-slate-100">
                    {dispatch.chief_complaint}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{dispatch.pickup_location?.address}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{dispatch.caller_name} ({dispatch.caller_phone})</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 gap-2">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 capitalize">
                      Status: {dispatch.status.replace(/_/g, ' ')}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelDispatch(dispatch._id);
                      }}
                      className="text-red-500 hover:text-white hover:bg-red-500 h-8 px-2 border-red-200 hover:border-transparent dark:border-slate-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}

              {activeDispatches.length === 0 && (
                <div className="py-6 text-center text-slate-400 text-sm">
                  No active dispatches currently active.
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
