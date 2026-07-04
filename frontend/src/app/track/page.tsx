import dynamic from 'next/dynamic';

const TrackClient = dynamic(() => import('./TrackClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#0a0e1a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-teal-500/30 border-t-teal-500 animate-spin" />
        <p className="text-slate-400 text-sm tracking-wide">Loading Tracker Beacons…</p>
      </div>
    </div>
  ),
});

export const metadata = {
  title: 'Live Beacon Tracking — ArogyaMitra',
  description: 'Track emergency SOS location and coordinate dispatching services in real-time',
};

export default function TrackPage() {
  return <TrackClient />;
}
