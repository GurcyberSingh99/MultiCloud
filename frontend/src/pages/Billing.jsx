/**
 * Billing & Cost Page — Cost breakdown charts and budget tracking.
 */
import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { billingAPI } from '../api/services';

export default function Billing() {
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [services, setServices] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [sumRes, dailyRes, svcRes, fcRes, budRes] = await Promise.all([
          billingAPI.summary(),
          billingAPI.daily(30),
          billingAPI.services(),
          billingAPI.forecast(),
          billingAPI.budgets(),
        ]);
        setSummary(sumRes.data.data);
        setDaily(dailyRes.data.data.daily_costs);
        setServices(svcRes.data.data.services);
        setForecast(fcRes.data.data);
        setBudgets(budRes.data.data.budgets);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  if (loading) return <div className="glass-card"><div className="skeleton" style={{ height: 400 }} /></div>;

  const providerColors = { aws: '#FF9900', azure: '#0078D4', gcp: '#4285F4' };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>💰 Billing & Costs</h1>
        <span className="text-muted">${summary?.total_cost?.toLocaleString()} this month</span>
      </div>

      {/* Budget Cards */}
      <div className="grid grid-3 mb-2">
        {budgets.map(b => (
          <div key={b.provider} className="glass-card">
            <div className="flex items-center justify-between mb-1">
              <span className={`provider-tag ${b.provider}`}>{b.provider}</span>
              <span className={`badge badge-${b.status}`}>{b.status}</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="stat-value" style={{ fontSize: '1.3rem' }}>${b.actual.toLocaleString()}</span>
              <span className="text-sm text-muted">/ ${b.budget.toLocaleString()}</span>
            </div>
            {/* Progress Bar */}
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 50, height: 8, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(b.utilization_percent, 100)}%`,
                height: '100%',
                borderRadius: 50,
                background: b.status === 'critical' ? 'var(--danger)' : b.status === 'warning' ? 'var(--warning)' : 'var(--success)',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-sm text-muted">{b.utilization_percent}% used</span>
              <span className="text-sm" style={{ color: 'var(--success)' }}>${b.remaining.toLocaleString()} left</span>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Cost Chart */}
      <div className="glass-card mb-2">
        <h3 className="mb-1">Daily Cost Breakdown (30 Days)</h3>
        <div className="chart-container" style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => v.slice(8)} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ background: '#131a2e', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 10, color: '#f1f5f9' }} formatter={v => `$${v.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="aws" name="AWS" fill="#FF9900" radius={[2, 2, 0, 0]} />
              <Bar dataKey="azure" name="Azure" fill="#0078D4" radius={[2, 2, 0, 0]} />
              <Bar dataKey="gcp" name="GCP" fill="#4285F4" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Services + Forecast */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Top Services */}
        <div className="glass-card">
          <h3 className="mb-1">Top Services by Cost</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {services.slice(0, 8).map((svc, i) => (
              <div key={i} className="flex items-center justify-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-sm">
                  <span className={`provider-tag ${svc.provider}`}>{svc.provider}</span>
                  <span>{svc.name}</span>
                </div>
                <strong>${svc.cost.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Forecast */}
        <div className="glass-card">
          <h3 className="mb-1">Cost Forecast</h3>
          {forecast?.by_provider?.map(f => (
            <div key={f.provider} style={{ marginBottom: '1.25rem' }}>
              <div className="flex items-center justify-between mb-1">
                <span className={`provider-tag ${f.provider}`}>{f.provider}</span>
                <span className={`stat-change ${f.trend === 'up' ? 'up' : 'down'}`}>
                  {f.trend === 'up' ? '↑' : '↓'} {Math.abs(f.change_percent)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Current</span>
                <strong>${f.current_monthly.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Next Month</span>
                <span style={{ color: f.trend === 'up' ? 'var(--danger)' : 'var(--success)' }}>
                  ${f.projected_next_month.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">3 Months</span>
                <span style={{ color: f.trend === 'up' ? 'var(--danger)' : 'var(--success)' }}>
                  ${f.projected_3_months.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
