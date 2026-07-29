/**
 * Storage Page — List buckets/containers with stats.
 */
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { storageAPI } from '../api/services';

const COLORS = { aws: '#FF9900', azure: '#0078D4', gcp: '#4285F4' };

export default function Storage() {
  const [buckets, setBuckets] = useState([]);
  const [stats, setStats] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const params = filter !== 'all' ? { provider: filter } : {};
        const [listRes, statsRes] = await Promise.all([storageAPI.list(params), storageAPI.stats()]);
        setBuckets(listRes.data.data.buckets);
        setStats(statsRes.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetch();
  }, [filter]);

  const pieData = stats.map(s => ({ name: s.provider.toUpperCase(), value: s.total_size_gb, color: COLORS[s.provider] }));
  const totalStorage = stats.reduce((acc, s) => acc + s.total_size_gb, 0);

  const formatSize = (gb) => gb >= 1000 ? `${(gb / 1000).toFixed(1)} TB` : `${gb} GB`;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>💾 Storage</h1>
        <span className="text-muted">{buckets.length} buckets • {formatSize(totalStorage)} total</span>
      </div>

      {/* Stats Row */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 300px' }}>
        {stats.map(s => (
          <div key={s.provider} className="glass-card animate-delay-1">
            <div className="flex items-center gap-sm mb-1">
              <span className={`provider-tag ${s.provider}`}>{s.provider}</span>
            </div>
            <p className="stat-value" style={{ fontSize: '1.4rem' }}>{formatSize(s.total_size_gb)}</p>
            <p className="text-sm text-muted">{s.bucket_count} buckets • {s.total_objects.toLocaleString()} objects</p>
            <p className="text-sm mt-1" style={{ color: 'var(--accent-primary)' }}>${s.monthly_cost}/mo</p>
          </div>
        ))}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie data={pieData} innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#131a2e', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 10, color: '#f1f5f9' }} formatter={v => formatSize(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar mt-2">
        {['all', 'aws', 'azure', 'gcp'].map(f => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All Providers' : f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem' }}>{[1,2,3].map(i => <div key={i} className="skeleton mb-1" style={{ height: 44 }} />)}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Provider</th>
                  <th>Class</th>
                  <th>Region</th>
                  <th>Size</th>
                  <th>Objects</th>
                  <th>Encryption</th>
                  <th>Monthly Cost</th>
                </tr>
              </thead>
              <tbody>
                {buckets.map(b => (
                  <tr key={b.id}>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{b.name}</strong></td>
                    <td><span className={`provider-tag ${b.provider}`}>{b.provider}</span></td>
                    <td className="text-sm">{b.storage_class}</td>
                    <td className="text-sm">{b.region}</td>
                    <td><strong>{formatSize(b.size_gb)}</strong></td>
                    <td className="text-sm">{b.object_count.toLocaleString()}</td>
                    <td><span className="badge badge-info">{b.encryption}</span></td>
                    <td><strong>${b.monthly_cost}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
