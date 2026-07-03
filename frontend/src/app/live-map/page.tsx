import dynamic from 'next/dynamic';

const LiveMapClient = dynamic(() => import('./LiveMapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#0a0e1a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-teal-500/30 border-t-teal-500 animate-spin" />
        <p className="text-slate-400 text-sm tracking-wide">Loading Live Map…</p>
      </div>
    </div>
  ),
});

export const metadata = {
  title: 'Live Hospital Map — ArogyaMitra',
  description: 'Find hospitals near you in real-time with 3D map view',
};

export default function LiveMapPage() {
  return <LiveMapClient />;
}
