import CoordinationFeedPanel from '@/app/portal/vendor/components/CoordinationFeedPanel';

export default function VendorPortalPage() {
  return (
    <section>
      <h1 style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Vendor Workspace
      </h1>
      <p style={{ color: '#4e4339' }}>
        Assigned-event tasks, load-in notes, timing updates, and acknowledgement feed.
      </p>

      <div className="grid">
        <CoordinationFeedPanel />
      </div>
    </section>
  );
}
