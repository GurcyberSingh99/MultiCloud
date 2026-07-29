/**
 * Dashboard Overview — Main landing page with KPI cards, provider breakdown, and quick stats.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { billingAPI, monitoringAPI, analyticsAPI, vmAPI, alertsAPI } from '../api/services';
import './Dashboard.css';

const PROVIDER_COLORS = { aws: '#FF9900', azure: '#0078D4', gcp: '#4285F4' };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [dailyCosts, setDailyCosts] = useState([]);
  const [distribution, setDistribution] = useState(null);
  const [utilization, setUtilization] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [billingRes, dailyRes, distRes, utilRes, alertRes] = await Promise.all([
          billingAPI.summary(),
          billingAPI.daily(14),
          analyticsAPI.distribution(),
          monitoringAPI.utilization(),
          alertsAPI.list(),
        ]);
        setStats(billingRes.data.data);
        setDailyCosts(dailyRes.data.data.daily_costs.slice(-14));
        setDistribution(distRes.data.data);
        setUtilization(utilRes.data.data);
        setAlerts(alertRes.data.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-card stat-card"><div className="skeleton" style={{ height: 80 }} /></div>
        ))}
      </div>
    );
  }

  const vmPieData = distribution?.vms?.map(v => ({ name: v.provider.toUpperCase(), value: v.count, color: PROVIDER_COLORS[v.provider] })) || [];
  const totalVMs = distribution?.vms?.reduce((acc, v) => acc + v.count, 0) || 0;
  const totalRunning = distribution?.vms?.reduce((acc, v) => acc + v.running, 0) || 0;

  return (
    <div className="dashboard-page animate-in">
      {/* Cloud API Quick Action Banner */}
      <div className="glass-card mb-2" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 1.75rem',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            fontSize: '1.8rem',
            background: 'rgba(99, 102, 241, 0.15)',
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>🔑</div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '0.2rem' }}>
              Multi-Cloud API Keys &amp; Configuration
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Manage, validate, and update API credentials for <strong>AWS</strong>, <strong>Azure</strong>, and <strong>GCP</strong>.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="badge" style={{ background: 'rgba(255, 153, 0, 0.15)', color: '#FF9900', border: '1px solid rgba(255,153,0,0.3)' }}>AWS ● Active</span>
            <span className="badge" style={{ background: 'rgba(0, 120, 212, 0.15)', color: '#0078D4', border: '1px solid rgba(0,120,212,0.3)' }}>Azure ● Active</span>
            <span className="badge" style={{ background: 'rgba(66, 133, 244, 0.15)', color: '#4285F4', border: '1px solid rgba(66,133,244,0.3)' }}>GCP ● Active</span>
          </div>
          <Link to="/credentials" className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            ⚙️ Configure API Keys
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-4 mb-2">

        <div className="glass-card stat-card animate-delay-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Monthly Cost</p>
              <p className="stat-value">${stats?.total_cost?.toLocaleString() || '—'}</p>
              <p className="stat-change up">↑ vs last month</p>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>💰</div>
          </div>
        </div>

        <div className="glass-card stat-card animate-delay-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Active Resources</p>
              <p className="stat-value">{totalRunning} <span className="text-sm text-muted">/ {totalVMs}</span></p>
              <p className="stat-change up">Running VMs</p>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>🖥️</div>
          </div>
        </div>

        <div className="glass-card stat-card animate-delay-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Avg CPU Usage</p>
              <p className="stat-value">{utilization?.avg_cpu_usage || 0}%</p>
              <p className="stat-change">{utilization?.running_resources || 0} resources</p>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>📈</div>
          </div>
        </div>

        <div className="glass-card stat-card animate-delay-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Active Alerts</p>
              <p className="stat-value">{alerts?.summary?.unacknowledged || 0}</p>
              <div className="flex gap-sm">
                <span className="badge badge-critical" style={{ fontSize: '0.7rem' }}>{alerts?.summary?.critical || 0} critical</span>
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{alerts?.summary?.warning || 0} warn</span>
              </div>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>🔔</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Daily Costs Chart */}
        <div className="glass-card">
          <h3 className="mb-1">Cost Trend (14 Days)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyCosts} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="awsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF9900" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF9900" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="azureGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0078D4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0078D4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gcpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4285F4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4285F4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#131a2e', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 10, color: '#f1f5f9' }}
                  formatter={(v) => [`$${v.toFixed(2)}`, '']}
                  labelFormatter={(v) => v}
                />
                <Legend />
                <Area type="monotone" dataKey="aws" name="AWS" stroke="#FF9900" fill="url(#awsGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="azure" name="Azure" stroke="#0078D4" fill="url(#azureGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="gcp" name="GCP" stroke="#4285F4" fill="url(#gcpGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Distribution Pie */}
        <div className="glass-card">
          <h3 className="mb-1">VM Distribution</h3>
          <div className="chart-container flex items-center justify-between" style={{ flexDirection: 'column' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={vmPieData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {vmPieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#131a2e', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 10, color: '#f1f5f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {vmPieData.map(item => (
                <div key={item.name} className="pie-legend-item">
                  <span className="legend-dot" style={{ background: item.color }} />
                  <span>{item.name}</span>
                  <span className="text-muted">{item.value} VMs</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Provider Cost Breakdown */}
      <div className="grid grid-3 mt-2">
        {stats?.by_provider?.map((provider) => (
          <div key={provider.provider} className="glass-card provider-card">
            <div className="flex items-center gap-sm mb-1">
              <span className={`provider-tag ${provider.provider}`}>{provider.provider}</span>
              <span className={`stat-change ${provider.change_percent >= 0 ? 'up' : 'down'}`}>
                {provider.change_percent >= 0 ? '↑' : '↓'} {Math.abs(provider.change_percent)}%
              </span>
            </div>
            <p className="stat-value" style={{ fontSize: '1.5rem' }}>${provider.total_cost.toLocaleString()}</p>
            <div className="provider-services mt-1">
              {provider.top_services?.slice(0, 3).map((svc) => (
                <div key={svc.name} className="service-row">
                  <span className="text-sm">{svc.name}</span>
                  <span className="text-sm text-muted">${svc.cost.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
