'use client';

import { useState, useEffect } from 'react';
import { Pill, Download, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

interface PrescriptionData {
  id: string;
  doctorName: string;
  date: string;
  visitType: string;
  diagnosis: string;
  medicines: Medicine[];
  notes?: string;
  pickupStatus: 'ready' | 'pending' | 'completed';
}

interface InstantPrescriptionProps {
  patientId: string;
}

export function InstantPrescription({ patientId }: InstantPrescriptionProps) {
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrescriptions();
  }, [patientId]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/prescriptions/patient/${patientId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.prescriptions || []);
        if (data.prescriptions?.length > 0) {
          setSelectedPrescription(data.prescriptions[0]);
        }
      } else {
        setError('Failed to load prescriptions');
      }
    } catch (err) {
      console.log('[v0] Error fetching prescriptions:', err);
      setError('Could not load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const getPickupStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
      case 'ready':
        return 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300';
      default:
        return 'bg-amber-500/20 border-amber-500/50 text-amber-300';
    }
  };

  const getPickupStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'ready':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleDownloadPrescription = async (prescriptionId: string) => {
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/download`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prescription-${prescriptionId}.pdf`;
        a.click();
      }
    } catch (err) {
      console.log('[v0] Error downloading prescription:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-2" />
        <p className="text-sm text-slate-400">Loading prescriptions...</p>
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="p-6 rounded-xl border border-white/10 bg-slate-800/20 text-center space-y-3">
        <Pill className="w-8 h-8 text-slate-500 mx-auto" />
        <div>
          <p className="font-bold text-white">No Prescriptions Yet</p>
          <p className="text-sm text-slate-400 mt-1">Your prescriptions will appear here after your visit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected Prescription Detail */}
      {selectedPrescription && (
        <div className="p-6 rounded-2xl bg-slate-800/50 border border-white/10 space-y-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">{selectedPrescription.doctorName}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(selectedPrescription.date).toLocaleDateString()} • {selectedPrescription.visitType}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1 ${getPickupStatusColor(selectedPrescription.pickupStatus)}`}>
              {getPickupStatusIcon(selectedPrescription.pickupStatus)}
              {selectedPrescription.pickupStatus === 'completed'
                ? 'Picked Up'
                : selectedPrescription.pickupStatus === 'ready'
                ? 'Ready to Pick'
                : 'Pending'}
            </div>
          </div>

          {selectedPrescription.diagnosis && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-xs font-semibold text-blue-300 mb-1">Diagnosis</p>
              <p className="text-sm text-blue-200">{selectedPrescription.diagnosis}</p>
            </div>
          )}

          {/* Medicines */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase">Medicines</p>
            <div className="space-y-2">
              {selectedPrescription.medicines.map((medicine, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-700/50 border border-white/5">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-white text-sm">{medicine.name}</p>
                    <span className="px-2 py-1 rounded bg-slate-600/50 text-xs text-slate-300 font-semibold">
                      {medicine.dosage}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-slate-400">
                    <span>Frequency: {medicine.frequency}</span>
                    <span>Duration: {medicine.duration}</span>
                  </div>
                  {medicine.notes && (
                    <p className="text-xs text-slate-400 mt-2 italic">Note: {medicine.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedPrescription.notes && (
            <div className="p-3 rounded-lg bg-slate-700/50 border border-white/5">
              <p className="text-xs font-semibold text-slate-300 mb-1">Additional Notes</p>
              <p className="text-sm text-slate-400">{selectedPrescription.notes}</p>
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t border-white/5">
            <button
              onClick={() => handleDownloadPrescription(selectedPrescription.id)}
              className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            {selectedPrescription.pickupStatus === 'ready' && (
              <button className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-sm transition-all">
                Pickup at Pharmacy
              </button>
            )}
          </div>
        </div>
      )}

      {/* Prescriptions List */}
      {prescriptions.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase">Other Prescriptions</p>
          <div className="space-y-2">
            {prescriptions.slice(1).map((rx) => (
              <button
                key={rx.id}
                onClick={() => setSelectedPrescription(rx)}
                className="w-full p-3 rounded-lg border border-white/10 bg-slate-800/30 hover:border-white/20 hover:bg-slate-800/50 transition-all text-left"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-white text-sm">{rx.doctorName}</p>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${getPickupStatusColor(rx.pickupStatus)}`}>
                    {rx.pickupStatus === 'completed' ? 'Picked Up' : 'Ready'}
                  </div>
                </div>
                <p className="text-xs text-slate-400">{new Date(rx.date).toLocaleDateString()}</p>
              </button>
            ))}
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
