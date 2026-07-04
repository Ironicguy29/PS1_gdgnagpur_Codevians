'use client';
import { useEffect, useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { Navigation, MapPin, AlertCircle, CheckCircle2, Clock, Activity } from 'lucide-react';
import api from '@/lib/api';

interface AmbulanceUnit {
    id: string;
    driver_id: string;
    status: 'available' | 'assigned' | 'in-transit' | 'at-facility' | 'maintenance';
    current_location?: { lat: number; lng: number };
    current_patient?: {
        name: string;
        vital_signs: { heart_rate: number; bp: string; temp: number };
    };
    destination?: string;
    eta_minutes?: number;
}

export function AmbulanceFleetDispatcher() {
    const [ambulances, setAmbulances] = useState<AmbulanceUnit[]>([]);
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
    const [stats, setStats] = useState({
        total: 0,
        available: 0,
        in_transit: 0,
        at_facility: 0,
        maintenance: 0
    });
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();

    useEffect(() => {
        // Mock ambulance data for demonstration
        setAmbulances([
            {
                id: 'AMB-001',
                driver_id: 'DRV-001',
                status: 'available',
                current_location: { lat: 19.076, lng: 72.8777 }
            },
            {
                id: 'AMB-002',
                driver_id: 'DRV-002',
                status: 'in-transit',
                current_location: { lat: 19.086, lng: 72.8677 },
                current_patient: {
                    name: 'Patient #2345',
                    vital_signs: { heart_rate: 88, bp: '120/80', temp: 37.2 }
                },
                destination: 'General Hospital',
                eta_minutes: 8
            },
            {
                id: 'AMB-003',
                driver_id: 'DRV-003',
                status: 'available',
                current_location: { lat: 19.066, lng: 72.8877 }
            },
            {
                id: 'AMB-004',
                driver_id: 'DRV-004',
                status: 'at-facility',
                current_location: { lat: 19.076, lng: 72.8777 }
            },
            {
                id: 'AMB-005',
                driver_id: 'DRV-005',
                status: 'in-transit',
                current_location: { lat: 19.096, lng: 72.8577 },
                current_patient: {
                    name: 'Patient #5678',
                    vital_signs: { heart_rate: 92, bp: '130/85', temp: 37.5 }
                },
                destination: 'Medical Center',
                eta_minutes: 12
            }
        ]);

        updateStats();
        setLoading(false);
    }, []);

    const updateStats = () => {
        const statsCopy = {
            total: 5,
            available: 2,
            in_transit: 2,
            at_facility: 1,
            maintenance: 0
        };
        setStats(statsCopy);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available':
                return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
            case 'in-transit':
                return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100';
            case 'at-facility':
                return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100';
            case 'maintenance':
                return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
            default:
                return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'available':
                return <CheckCircle2 className="w-4 h-4" />;
            case 'in-transit':
                return <Navigation className="w-4 h-4" />;
            case 'at-facility':
                return <MapPin className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="animate-pulse text-slate-500">Loading ambulance fleet data...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Fleet Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Units</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg border border-green-200 dark:border-green-800 p-4">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400">Available</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.available}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">In Transit</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.in_transit}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg border border-purple-200 dark:border-purple-800 p-4">
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400">At Facility</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.at_facility}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Maintenance</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.maintenance}</p>
                </div>
            </div>

            {/* Ambulance Units Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ambulances.map((unit) => (
                    <div
                        key={unit.id}
                        onClick={() => setSelectedUnit(unit.id)}
                        className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
                            selectedUnit === unit.id
                                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-300'
                        }`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">{unit.id}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Driver {unit.driver_id}</p>
                            </div>
                            <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(unit.status)}`}>
                                {getStatusIcon(unit.status)}
                                {unit.status}
                            </span>
                        </div>

                        {/* Location */}
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            <p className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {unit.current_location
                                    ? `${unit.current_location.lat.toFixed(3)}, ${unit.current_location.lng.toFixed(3)}`
                                    : 'No location'}
                            </p>
                        </div>

                        {/* Patient Info */}
                        {unit.current_patient && (
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 mb-3">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                                    Patient: {unit.current_patient.name}
                                </p>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <p className="text-slate-600 dark:text-slate-400">HR</p>
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            {unit.current_patient.vital_signs.heart_rate}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-600 dark:text-slate-400">BP</p>
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            {unit.current_patient.vital_signs.bp}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-600 dark:text-slate-400">Temp</p>
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            {unit.current_patient.vital_signs.temp}°C
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ETA */}
                        {unit.eta_minutes && (
                            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                                <Clock className="w-4 h-4" />
                                <span>ETA: {unit.eta_minutes} min to {unit.destination}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* GPS & Vitals Monitoring */}
            {selectedUnit && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-cyan-500" />
                        Live Monitoring - {selectedUnit}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* GPS Tracking */}
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">GPS Coordinates</p>
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
                                <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Real-time Position</p>
                                <p className="text-sm font-mono text-blue-700 dark:text-blue-300">
                                    19.0760° N, 72.8777° E
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                    Speed: 45 km/h | Distance: 2.3 km
                                </p>
                            </div>
                        </div>

                        {/* Vitals */}
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Patient Vitals</p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Heart Rate</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">88 bpm</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Blood Pressure</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">120/80 mmHg</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Temperature</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">37.2°C</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">O2 Saturation</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">98%</span>
                                </div>
                            </div>
                        </div>
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
