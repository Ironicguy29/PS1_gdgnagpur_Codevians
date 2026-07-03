'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/providers/ToastProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import AmbulanceMap from '@/components/ambulance/AmbulanceMap';
import { 
  Siren, Phone, MapPin, Truck, ShieldAlert, Navigation, 
  Activity, CheckCircle, Clock, User
} from 'lucide-react';

export function EmergencyAmbulanceWidget() {
  const { socket } = useSocket();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [activeTrip, setActiveTrip] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Request form
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) {
      const parsed = JSON.parse(u);
      setUser(parsed);
      fetchActiveTrip(parsed._id);
    }
  }, []);

  useEffect(() => {
    if (!socket || !user) return;

    const handleLocationUpdate = (data: any) => {
      if (activeTrip && activeTrip.ambulance_id?._id === data.ambulanceId) {
        setActiveTrip((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            liveAmbulanceLocation: {
              latitude: data.latitude,
              longitude: data.longitude,
              speed: data.speed,
              heading: data.heading
            }
          };
        });
      }
    };

    const handleEtaUpdate = (data: any) => {
      if (activeTrip && activeTrip._id === data.tripId) {
        setActiveTrip((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            eta_minutes_to_patient: data.etaMinToPatient ?? prev.eta_minutes_to_patient,
            eta_minutes_to_hospital: data.etaMinToHospital ?? prev.eta_minutes_to_hospital,
            distance_km_to_patient: data.distanceKmToPatient ?? prev.distance_km_to_patient,
            distance_km_to_hospital: data.distanceKmToHospital ?? prev.distance_km_to_hospital,
          };
        });
      }
    };

    const handleTripUpdate = (data: any) => {
      if (activeTrip && data.tripId === activeTrip._id) {
        toast(`Ambulance status: ${data.status.replace(/_/g, ' ')}`, 'info');
        fetchActiveTrip(user._id);
      }
    };

    const handleDispatched = (data: any) => {
      if (data.patientId === user._id) {
        toast('An ambulance has been dispatched to your location!', 'success');
        fetchActiveTrip(user._id);
      }
    };

    socket.on('ambulance.location', handleLocationUpdate);
    socket.on('ambulance.eta_update', handleEtaUpdate);
    socket.on('ambulance.trip_update', handleTripUpdate);
    socket.on('ambulance.dispatched', handleDispatched);

    // Poll every 10 seconds to keep sync
    const poll = setInterval(() => {
      fetchActiveTrip(user._id);
    }, 10000);

    return () => {
      socket.off('ambulance.location', handleLocationUpdate);
      socket.off('ambulance.eta_update', handleEtaUpdate);
      socket.off('ambulance.trip_update', handleTripUpdate);
      socket.off('ambulance.dispatched', handleDispatched);
      clearInterval(poll);
    };
  }, [socket, user, activeTrip]);

  const fetchActiveTrip = async (patientId: string) => {
    try {
      const { data } = await api.get(`/ambulance/patient/${patientId}/trip`);
      setActiveTrip(data);
    } catch (err) {
      setActiveTrip(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAmbulance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setRequesting(true);

    try {
      // Auto dispatch payload
      await api.post('/ambulance/dispatch', {
        chiefComplaint,
        pickupAddress,
        pickupLat: 21.1458 + (Math.random() - 0.5) * 0.02, // Simulate random location around Nagpur
        pickupLng: 79.0882 + (Math.random() - 0.5) * 0.02,
        callerName: user.name,
        callerPhone: user.phone || '+919876543210',
        priority: 'high'
      });

      toast('Emergency request logged. Dispatching nearest ambulance!', 'success');
      setShowRequestForm(false);
      
      // Give the backend a moment to assign the ambulance
      setTimeout(() => {
        fetchActiveTrip(user._id);
      }, 1000);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to dispatch ambulance', 'error');
    } finally {
      setRequesting(false);
    }
  };

  const getStepActive = (status: string, step: number) => {
    const statuses = ['assigned', 'driver_accepted', 'en_route_to_patient', 'arrived_pickup', 'transporting', 'arrived_destination'];
    const idx = statuses.indexOf(status);
    return idx >= step;
  };

  if (loading) {
    return (
      <div className="flex h-20 items-center justify-center">
        <Activity className="w-6 h-6 animate-spin text-red-600" />
      </div>
    );
  }

  const mapAmbLoc = activeTrip?.liveAmbulanceLocation || 
    (activeTrip?.ambulance_id?.current_location?.latitude 
      ? activeTrip.ambulance_id.current_location 
      : activeTrip?.ambulance_id?.base_location);

  return (
    <div className="w-full">
      {!activeTrip ? (
        !showRequestForm ? (
          /* Initial Widget CTA */
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-full animate-pulse">
                <Siren className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4 className="text-red-700 dark:text-red-400 font-bold">Smart Ambulance Tracking</h4>
                <p className="text-xs text-red-600/80 dark:text-red-400/70">Request emergency dispatch with real-time GPS & route tracking.</p>
              </div>
            </div>
            <Button
              variant="destructive"
              className="rounded-full px-6 shadow-lg shadow-red-200 dark:shadow-none hover:scale-105 transition-transform"
              onClick={() => setShowRequestForm(true)}
            >
              Request Ambulance
            </Button>
          </div>
        ) : (
          /* Request Details Form */
          <GlassCard className="p-6 border-l-4 border-l-red-500">
            <h3 className="font-bold text-lg mb-4 text-left flex items-center gap-2">
              <Siren className="w-5 h-5 text-red-600 animate-pulse" /> Emergency Ambulance Request
            </h3>
            <form onSubmit={handleRequestAmbulance} className="space-y-4 text-left">
              <div>
                <Label htmlFor="symptoms" className="text-xs text-slate-400">Chief Symptoms / Emergency Details</Label>
                <Input
                  id="symptoms"
                  required
                  placeholder="Cardiac pain, severe trauma, breeding issue..."
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="mt-1 dark:bg-slate-900 dark:border-slate-800"
                />
              </div>

              <div>
                <Label htmlFor="address" className="text-xs text-slate-400">Pickup Address / Land Mark</Label>
                <Input
                  id="address"
                  required
                  placeholder="E.g. Civil Lines, Nagpur"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="mt-1 dark:bg-slate-900 dark:border-slate-800"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowRequestForm(false)}
                  className="dark:border-slate-800"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={requesting}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  {requesting ? 'Routing Nearest Vehicle...' : '🚨 Request Live Dispatch'}
                </Button>
              </div>
            </form>
          </GlassCard>
        )
      ) : (
        /* Active Ambulance Tracking view */
        <GlassCard className="p-6 border-l-4 border-l-red-600 text-left space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold uppercase text-xs tracking-wider">
                <Siren className="w-4 h-4 animate-bounce" /> Emergency Trip Status
              </div>
              <h3 className="font-black text-xl text-slate-900 dark:text-white mt-1">
                Ambulance {activeTrip.status.replace(/_/g, ' ').toUpperCase()}
              </h3>
            </div>
            
            {/* ETAs */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-semibold">
              {activeTrip.status === 'transporting' ? (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                  <span>ETA Hospital: {activeTrip.eta_minutes_to_hospital?.toFixed(1) || '0.0'} mins ({activeTrip.distance_km_to_hospital?.toFixed(1) || '0.0'} km)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Clock className="w-4 h-4" />
                  <span>ETA to you: {activeTrip.eta_minutes_to_patient?.toFixed(1) || '0.0'} mins ({activeTrip.distance_km_to_patient?.toFixed(1) || '0.0'} km)</span>
                </div>
              )}
            </div>
          </div>

          {/* Stepper bar */}
          <div className="relative flex items-center justify-between w-full mt-4 select-none">
            <div className="absolute left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />
            <div 
              className="absolute left-0 h-0.5 bg-red-500 z-0 transition-all duration-500" 
              style={{
                width: activeTrip.status === 'dispatched' || activeTrip.status === 'assigned' ? '0%' :
                       activeTrip.status === 'en_route_to_patient' ? '33%' :
                       activeTrip.status === 'arrived_pickup' ? '66%' : '100%'
              }}
            />

            {[
              { label: 'Assigned', step: 0 },
              { label: 'En Route', step: 2 },
              { label: 'Arrived', step: 3 },
              { label: 'Hospital', step: 5 }
            ].map((s) => {
              const active = getStepActive(activeTrip.status, s.step);
              return (
                <div key={s.label} className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    active ? 'bg-red-600 border-red-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-400'
                  }`}>
                    {active ? <CheckCircle className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-slate-500 uppercase">{s.label}</span>
                </div>
              );
            })}
          </div>

          {/* Live tracking Map Wrapper */}
          <div className="p-1 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950">
            <AmbulanceMap 
              height="350px"
              ambulance={mapAmbLoc ? {
                latitude: mapAmbLoc.latitude,
                longitude: mapAmbLoc.longitude
              } : undefined}
              pickup={activeTrip.pickup_location ? {
                latitude: activeTrip.pickup_location.latitude,
                longitude: activeTrip.pickup_location.longitude,
                address: activeTrip.pickup_location.address
              } : undefined}
              destination={activeTrip.destination_location ? {
                latitude: activeTrip.destination_location.latitude,
                longitude: activeTrip.destination_location.longitude,
                address: activeTrip.destination_location.address
              } : undefined}
              gpsTrail={activeTrip.gps_trail || []}
            />
          </div>

          {/* Contact driver card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Assigned Ambulance</p>
                <p className="font-bold text-slate-800 dark:text-white">{activeTrip.ambulance_id?.registration_number}</p>
                <p className="text-xs text-slate-500 capitalize">{activeTrip.ambulance_id?.vehicle_model || 'Advanced Life Support'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-3 md:pt-0 md:pl-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Your Paramedic Driver</p>
                  <p className="font-bold text-slate-800 dark:text-white">{activeTrip.driver_id?.name || 'Ramesh Kumar'}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {activeTrip.driver_id?.phone || '+919876543210'}</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
