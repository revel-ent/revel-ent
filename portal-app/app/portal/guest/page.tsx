import GuestConciergeTool from '@/app/portal/guest/components/GuestConciergeTool';

export default function GuestPortalPage() {
  return (
    <section>
      <h1 style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Guest Concierge
      </h1>
      <p style={{ color: '#4e4339' }}>
        Read-only event guidance: schedule, attire notes, arrival tips, and FAQ.
      </p>

      <div className="grid">
        <GuestConciergeTool />
      </div>
    </section>
  );
}
