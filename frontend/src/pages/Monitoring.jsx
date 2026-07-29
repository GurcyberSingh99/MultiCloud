/**
 * Monitoring Page — Real-time metrics, health status grid, and utilization gauges.
 */
import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { monitoringAPI } from '../api/services';

export default function Monitoring() {
  const [health, setHealth] = useState(null);
  const [utilization, setUtilization] = useState(null);
  const [cpuMetrics, setCpuMetrics] = useState([]);
  const [memMetrics, setMemMetrics] = useState([]);
  const [selectedResource, setSelectedResource] = useState('aws-vm-001');
  const [period, setPeriod] = useState('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [healthRes, utilRes] = await Promise.all([
          monitoringAPI.health(),
          monitoringAPI.utilization(),
        ]);
        setHealth(healthRes.data.data);
        setUtilization(utilRes.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const [cpuRes, memRes] = await Promise.all([
          monitoringAPI.metrics({ resource_id: selectedResource, metric: 'cpu', period }),
          monitoringAPI.metrics({ resource_id: selectedResource, metric: 'memory', period }),
        ]);
        setCpuMetrics(cpuRes.data.data.data_points.map(p => ({ ...p, time: p.timestamp.slice(11, 16) })));
        setMemMetrics(memRes.data.data.data_points.map(p => ({ ...p, time: p.timestamp.slice(11, 16) })));
      } catch (err) { console.error(err); }
    }
    fetchMetrics();
  }, [selectedResource, period]);

  if (loading) return <div className="glass-card"><div className="skeleton" style={{ height: 400 }} /></div>;

  const GaugeCard = ({ label, value, color }) => (
    <div className="glass-card" style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 0.75rem' }}>
        <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bg-tertiary)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${value} ${100 - value}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700 }}>
          {value}%
        </span>
      </div>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>📈 Monitoring</h1>
        <div className="header-actions">
          <select
            className="input-field"
            style={{ width: 200 }}
            value={selectedResource}
            onChange={e => setSelectedResource(e.target.value)}
          >
            {health?.resources?.filter(r => r.health !== 'stopped').map(r => (
              <option key={r.resource_id} value={r.resource_id}>{r.resource_name} ({r.provider})</option>
            ))}
          </select>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            {['1h', '6h', '24h', '7d'].map(p => (
              <button key={p} className={`filter-chip ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Utilization Gauges */}
      <div className="grid grid-4 mb-2">
        <GaugeCard label="Avg CPU" value={utilization?.avg_cpu_usage || 0} color="#818cf8" />
        <GaugeCard label="Avg Memory" value={utilization?.avg_memory_usage || 0} color="#3b82f6" />
        <GaugeCard label="Avg Disk" value={utilization?.avg_disk_usage || 0} color="#f59e0b" />
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <p className="stat-value" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{utilization?.running_resources || 0}</p>
          <p className="text-sm text-muted">Active Resources</p>
          <p className="text-sm text-muted">of {utilization?.total_resources || 0} total</p>
        </div>
      </div>

      {/* CPU & Memory Charts */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="glass-card">
          <h3 className="mb-1">CPU Usage</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cpuMetrics} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ background: '#131a2e', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 10, color: '#f1f5f9' }} formatter={v => `${v.toFixed(1)}%`} />
                <Area type="monotone" dataKey="value" name="CPU" stroke="#818cf8" fill="url(#cpuGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <h3 className="mb-1">Memory Usage</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={memMetrics} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ background: '#131a2e', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 10, color: '#f1f5f9' }} formatter={v => `${v.toFixed(1)}%`} />
                <Area type="monotone" dataKey="value" name="Memory" stroke="#3b82f6" fill="url(#memGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Health Status Grid */}
      <div className="glass-card mt-2">
        <h3 className="mb-1">Resource Health</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {health?.resources?.map(r => (
            <div
              key={r.resource_id}
              className="glass-card"
              style={{ padding: '1rem', cursor: 'pointer', border: selectedResource === r.resource_id ? '1px solid var(--accent-primary)' : undefined }}
              onClick={() => r.health !== 'stopped' && setSelectedResource(r.resource_id)}
            >
              <div className="flex items-center justify-between mb-1">
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{r.resource_name}</strong>
                <span className={`badge badge-${r.health}`}>{r.health}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted">
                <span className={`provider-tag ${r.provider}`}>{r.provider}</span>
                <span>CPU: {r.cpu_usage}% | MEM: {r.memory_usage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
