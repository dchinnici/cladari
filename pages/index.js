
export default function CarlaBlackeaeProfile() {
  return (
    <div style={{
      padding: '2rem',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: 'sans-serif',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    }}>
      <h1 style={{ color: '#065f46' }}>Anthurium 'CarlaBlackeae'</h1>
      <p><strong>Cladari Plant ID:</strong> CLD-001</p>
<img
  src="/carlablackeae.jpg"
  alt="Anthurium Carlablackeae"
  style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }}
/>

      <hr style={{ margin: '1rem 0' }} />

      <h2>Lineage / Parentage</h2>
      <p>Unknown hybrid origin — suspected Cardiolonchium group.</p>

      <h2>Section / Clade</h2>
      <p>Cardiolonchium (suspected)</p>

      <h2>Cladari Confidence Score</h2>
      <p style={{ color: '#b45309' }}>Medium</p>

      <h2>Verification Status</h2>
      <p>In Progress</p>

      <h2>Traits & Notes</h2>
      <ul>
        <li>Flagship specimen</li>
        <li>High-value foliage</li>
        <li>Core demo plant for MVP testing</li>
      </ul>

      <hr style={{ marginTop: '2rem' }} />
      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
        Cladari Provenance Profile • Generated via QR scan
      </p>
    </div>
  );
}
