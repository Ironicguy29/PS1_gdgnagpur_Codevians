'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/providers/ToastProvider';
import { useSocket } from '@/context/SocketContext';
import api from '@/lib/api';
import AmbulanceMap from '@/components/ambulance/AmbulanceMap';
import { 
  Navigation, User, Phone, MapPin, AlertCircle, CheckCircle, 
  Activity, Play, Square, Compass, Clock, Award, Star
} from 'lucide-react';

export default function DriverDashboard() {
  const { socket } = useSocket();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [currentTrip, setCurrentTrip] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulation states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [simulationPath, setSimulationPath] = useState<[number, number][]>([]);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) {
      const parsed = JSON.parse(u);
      setUser(parsed);
      loadDriverProfile(parsed._id);
    }
  }, []);

  // Listen to dispatches & updates via WebSocket
  useEffect(() => {
    if (!socket || !driverProfile) return;

    const handleTripUpdate = (data: any) => {
      // If the update is about this driver's trip or driverId matches
      if (data.driverId === driverProfile._id || (currentTrip && data.tripId === currentTrip._id)) {
        toast(`Trip alert: status is ${data.status.replace(/_/g, ' ')}`, 'info');
        refreshTrip(driverProfile._id);
      }
    };

    socket.on('ambulance.trip_update', handleTripUpdate);
    socket.on('ambulance.dispatched', (data: any) => {
      if (data.driverId === driverProfile._id) {
        toast('New Emergency Dispatch Assigned to you!', 'success');
        refreshTrip(driverProfile._id);
      }
    });

    // Also poll every 10 seconds just in case
    const pollInterval = setInterval(() => {
      refreshTrip(driverProfile._id);
    }, 10000);

    return () => {
      socket.off('ambulance.trip_update', handleTripUpdate);
      clearInterval(pollInterval);
    };
  }, [socket, driverProfile, currentTrip]);

  const loadDriverProfile = async (userId: string) => {
    setLoading(true);
    try {
      const { data: drivers } = await api.get('/ambulance/drivers');
      const profile = drivers.find((d: any) => d.user_id?._id === userId || d.user_id === userId);
      
      if (profile) {
        setDriverProfile(profile);
        await refreshTrip(profile._id);
      } else {
        toast('No driver profile associated with this account. Please contact admin.', 'error');
      }
    } catch (e) {
      toast('Failed to load driver profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshTrip = async (driverId: string) => {
    try {
      const { data: trip } = await api.get(`/ambulance/drivers/${driverId}/trip`);
      setCurrentTrip(trip);
    } catch (err) {
      // 404 means no active trip
      setCurrentTrip(null);
    }
  };

  // Status Action Transitions
  const advanceTripStatus = async () => {
    if (!currentTrip) return;
    const tripId = currentTrip._id;
    let endpoint = '';
    let successMessage = '';

    switch (currentTrip.status) {
      case 'assigned':
        endpoint = `/ambulance/trip/${tripId}/accept`;
        successMessage = 'Trip accepted! Proceeding to patient location.';
        break;
      case 'driver_accepted':
        endpoint = `/ambulance/trip/${tripId}/en-route`;
        successMessage = 'Departed! Navigating to patient.';
        break;
      case 'en_route_to_patient':
        endpoint = `/ambulance/trip/${tripId}/arrive-patient`;
        successMessage = 'Arrived at patient location!';
        break;
      case 'arrived_pickup':
        endpoint = `/ambulance/trip/${tripId}/start-transport`;
        successMessage = 'Patient loaded. Transporting to hospital!';
        break;
      case 'transporting':
        endpoint = `/ambulance/trip/${tripId}/arrive-hospital`;
        successMessage = 'Arrived at hospital entrance!';
        break;
      case 'arrived_destination':
        endpoint = `/ambulance/trip/${tripId}/complete`;
        successMessage = 'Trip completed successfully! Status set to Available.';
        stopGPSSimulation();
        break;
      default:
        return;
    }

    try {
      await api.post(endpoint);
      toast(successMessage, 'success');
      await refreshTrip(driverProfile._id);
    } catch (e: any) {
      toast(e.response?.data?.message || 'Failed to update trip stage', 'error');
    }
  };

  // GPS SIMULATOR CONTROLLERS
  const startGPSSimulation = async () => {
    if (!currentTrip) return;
    setIsSimulating(true);

    const startLat = currentTrip.ambulance_id?.current_location?.latitude || 21.1458;
    const startLng = currentTrip.ambulance_id?.current_location?.longitude || 79.0882;

    const patientLat = currentTrip.pickup_location.latitude;
    const patientLng = currentTrip.pickup_location.longitude;

    const hospLat = currentTrip.destination_location.latitude;
    const hospLng = currentTrip.destination_location.longitude;

    // Build routes using project-osrm or simple interpolated paths
    let fullPath: [number, number][] = [];

    try {
      // Step 1: OSRM route to patient
      const url1 = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${patientLng},${patientLat}?overview=full&geometries=geojson`;
      const res1 = await fetch(url1);
      const data1 = await res1.json();
      const coords1 = data1.routes?.[0]?.geometry?.coordinates || [];

      // Step 2: OSRM route to hospital
      const url2 = `https://router.project-osrm.org/route/v1/driving/${patientLng},${patientLat};${hospLng},${hospLat}?overview=full&geometries=geojson`;
      const res2 = await fetch(url2);
      const data2 = await res2.json();
      const coords2 = data2.routes?.[0]?.geometry?.coordinates || [];

      // Combine coordinates
      const step1 = coords1.map((c: any) => [c[1], c[0]] as [number, number]);
      const step2 = coords2.map((c: any) => [c[1], c[0]] as [number, number]);

      fullPath = [...step1, ...step2];
    } catch (e) {
      // Fallback: simple interpolation if OSRM fails
      console.warn("OSRM routing failed. Fallback to interpolation.");
      fullPath = interpolatePoints([startLat, startLng], [patientLat, patientLng], 15)
        .concat(interpolatePoints([patientLat, patientLng], [hospLat, hospLng], 15));
    }

    setSimulationPath(fullPath);
    setSimulationIndex(0);

    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    simIntervalRef.current = setInterval(async () => {
      setSimulationIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= fullPath.length) {
          clearInterval(simIntervalRef.current!);
          setIsSimulating(false);
          toast("Simulation route finished!", "success");
          return prevIndex;
        }

        const point = fullPath[nextIndex];
        // Post GPS location update to backend API
        api.post(`/ambulance/${currentTrip.ambulance_id._id}/gps`, {
          latitude: point[0],
          longitude: point[1],
          speed: 48 + Math.random() * 10,
          heading: Math.floor(Math.random() * 360)
        }).catch(err => console.error("Simulated GPS post error:", err));

        return nextIndex;
      });
    }, 2500);
  };

  const stopGPSSimulation = () => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setIsSimulating(false);
    setSimulationIndex(0);
  };

  // Helper point interpolator for fallback
  const interpolatePoints = (start: [number, number], end: [number, number], steps: number): [number, number][] => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      pts.push([
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t
      ]);
    }
    return pts;
  };

  // Cleanup simulation interval
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return 'Accept Assigned Dispatch';
      case 'driver_accepted': return 'Depart to Patient';
      case 'en_route_to_patient': return 'Arrived at Patient';
      case 'arrived_pickup': return 'Start Transport to Hospital';
      case 'transporting': return 'Arrived at Hospital';
      case 'arrived_destination': return 'Complete Trip';
      default: return 'Next Stage';
    }
  };

  const currentGPSPoint = simulationPath[simulationIndex] || null;

  return (
    <DashboardLayout role="driver">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="w-8 h-8 text-amber-500" /> Driver Console
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Welcome back, {driverProfile?.name || 'Driver'}. Manage your status, accept emergency runs, and run navigation.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 rounded-xl border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            Duty: ACTIVE / ON CALL
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <Activity className="w-10 h-10 animate-spin text-red-500" />
        </div>
      ) : !currentTrip ? (
        /* Standby State */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="p-8 md:col-span-2 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
            <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/10 flex items-center justify-center text-amber-500">
              <Activity className="w-10 h-10 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Waiting for Emergency Dispatch</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md">
              Your ambulance vehicle is currently parked and status is set to <span className="font-bold text-emerald-500">Available</span>. Dispatches from Admin HQ will pop up here in real time.
            </p>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard className="p-6 text-left">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Driver Performance
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 text-sm">Total Runs Completed</span>
                  <span className="font-bold text-lg">{driverProfile?.total_trips || 0}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 text-sm">Average rating</span>
                  <span className="font-bold text-lg flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {driverProfile?.avg_rating?.toFixed(1) || '5.0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Current Vehicle</span>
                  <span className="font-mono text-sm uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">
                    MH-31-AM-1234
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      ) : (
        /* Active Emergency Trip State */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Live Navigation Map */}
            <GlassCard className="p-2 overflow-hidden relative">
              <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-500" /> Emergency OSRM Route Navigation
                </h3>
                {isSimulating ? (
                  <span className="flex items-center gap-2 text-xs text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full animate-pulse border border-emerald-500/20">
                    <Play className="w-3.5 h-3.5 fill-emerald-500" /> SIMULATING LIVE GPS DRIVING
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Simulator Inactive</span>
                )}
              </div>

              <AmbulanceMap 
                height="450px"
                ambulance={currentGPSPoint ? {
                  latitude: currentGPSPoint[0],
                  longitude: currentGPSPoint[1]
                } : (currentTrip.ambulance_id?.current_location?.latitude ? currentTrip.ambulance_id.current_location : currentTrip.ambulance_id?.base_location)}
                pickup={currentTrip.pickup_location ? {
                  latitude: currentTrip.pickup_location.latitude,
                  longitude: currentTrip.pickup_location.longitude,
                  address: currentTrip.pickup_location.address
                } : undefined}
                destination={currentTrip.destination_location ? {
                  latitude: currentTrip.destination_location.latitude,
                  longitude: currentTrip.destination_location.longitude,
                  address: currentTrip.destination_location.address
                } : undefined}
                gpsTrail={currentTrip.gps_trail || []}
              />
            </GlassCard>
          </div>

          <div className="space-y-6">
            {/* Trip Action Controls */}
            <GlassCard className="p-6 text-left border-l-4 border-l-red-500">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold uppercase text-xs tracking-wider mb-2">
                <AlertCircle className="w-4 h-4 animate-bounce" /> ACTIVE EMERGENCY DISPATCH
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">
                {currentTrip.chief_complaint}
              </h2>

              <div className="space-y-4 mb-6 text-sm">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Patient Name</p>
                    <p className="font-bold">{currentTrip.caller_name || 'Emergency Caller'}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5" /> {currentTrip.caller_phone || '+919876543210'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Pickup Address</p>
                    <p className="font-bold">{currentTrip.pickup_location.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Triage Priority</p>
                    <span className="text-xs uppercase bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 px-2 py-0.5 rounded font-black mt-1 inline-block">
                      {currentTrip.priority}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status progression actions */}
              <div className="space-y-3">
                <Button
                  onClick={advanceTripStatus}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 rounded-xl text-base shadow-lg shadow-red-200 dark:shadow-none"
                >
                  {getStatusText(currentTrip.status)}
                </Button>
                
                {currentTrip.status !== 'assigned' && currentTrip.status !== 'driver_accepted' && (
                  <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30">
                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Live GPS Simulator Controls</p>
                    
                    {!isSimulating ? (
                      <Button
                        onClick={startGPSSimulation}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10 flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-white" /> Start Simulated Route Driving
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          onClick={stopGPSSimulation}
                          variant="destructive"
                          className="w-full h-10 flex items-center justify-center gap-2"
                        >
                          <Square className="w-4 h-4 fill-white" /> Halt GPS Simulation
                        </Button>
                        <div className="text-center text-xs text-slate-400">
                          Route Progress: {simulationIndex} / {simulationPath.length} steps
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
