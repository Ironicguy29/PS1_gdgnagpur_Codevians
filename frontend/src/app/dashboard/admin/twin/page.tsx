import DigitalTwinView from '@/components/digitaltwin/DigitalTwinView';

export const metadata = {
  title: 'Hospital Digital Twin - ArogyaMitra',
  description: 'Interactive real-time spatial oversight of ArogyaMitra Medical Campus.',
};

export default function TwinPage() {
  return <DigitalTwinView />;
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
