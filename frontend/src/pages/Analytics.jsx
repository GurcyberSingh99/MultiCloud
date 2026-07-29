/**
 * Analytics Page — Distribution, trends, optimization, and provider comparison.
 */
import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { analyticsAPI } from '../api/services';

const COLORS = { aws: '#FF9900', azure: '#0078D4', gcp: '#4285F4' };

export default function Analytics() {
  const [distribution, setDistribution] = useState(null);
  const [trends, setTrends] = useState([]);
  const [optimization, setOptimization] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [distRes, trendRes, optRes, compRes] = await Promise.all([
          analyticsAPI.distribution(),
          analyticsAPI.trends(),
          analyticsAPI.optimization(),
          analyticsAPI.comparison(),
        ]);
        setDistribution(distRes.data.data);
        setTrends(trendRes.data.data.trends);
        setOptimization(optRes.data.data);
        setComparison(compRes.data.data.comparison);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  if (loading) return <div className="glass-card"><div className="skeleton" style={{ height: 400 }} /></div>;

  // Prepare trend data for cost chart
  const costTrends = trends.map(t => ({
    label: t.label,
    AWS: t.aws.cost,
    Azure: t.azure.cost,
    GCP: t.gcp.cost,
  }));

  const effortColors = { low: 'var(--success)', medium: 'var(--warning)', high: 'var(--danger)' };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>📉 Analytics</h1>
        <span className="text-muted">{distribution?.total_resources} total resources</span>
      </div>

      {/* Optimization Banner */}
      {optimization && (
        <div className="glass-card mb-2" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.08))', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 style={{ color: 'var(--success)' }}>💡 Cost Optimization Opportunities</h3>
              <p className="text-sm text-muted mt-1">{optimization.recommendation_count} recommendations identified</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="stat-value" style={{ color: 'var(--success)', fontSize: '1.75rem' }}>
                ${optimization.total_potential_savings.toLocaleString()}
              </p>
              <p className="text-sm text-muted">potential monthly savings</p>
            </div>
          </div>
        </div>
      )}

      {/* Cost Trends + Distribution */}
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="glass-card">
          <h3 className="mb-1">Cost Trends (6 Months)</h3>
          <div className="chart-container" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={costTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#131a2e', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 10, color: '#f1f5f9' }} formatter={v => `$${v.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="AWS" stroke="#FF9900" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Azure" stroke="#0078D4" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="GCP" stroke="#4285F4" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Provider Comparison */}
        <div className="glass-card">
          <h3 className="mb-1">Provider Comparison</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {comparison.map(c => (
              <div key={c.provider} style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`provider-tag ${c.provider}`}>{c.provider}</span>
                  <strong>${c.monthly_cost.toLocaleString()}</strong>
                </div>
                <div className="grid grid-2" style={{ gap: '0.35rem' }}>
                  <div className="text-sm"><span className="text-muted">VMs: </span>{c.running_vms}/{c.total_vms}</div>
                  <div className="text-sm"><span className="text-muted">vCPUs: </span>{c.total_vcpus}</div>
                  <div className="text-sm"><span className="text-muted">$/VM: </span>${c.cost_per_vm}</div>
                  <div className="text-sm"><span className="text-muted">$/vCPU: </span>${c.cost_per_vcpu}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Optimization Recommendations */}
      <div className="glass-card mt-2">
        <h3 className="mb-1">Optimization Recommendations</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {optimization?.recommendations?.map(rec => (
            <div key={rec.id} className="glass-card" style={{ padding: '1rem 1.25rem' }}>
              <div className="flex items-center justify-between mb-1" style={{ marginBottom: '0.35rem' }}>
                <div className="flex items-center gap-sm">
                  <span className={`provider-tag ${rec.provider}`}>{rec.provider}</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{rec.title}</strong>
                </div>
                <div className="flex items-center gap-sm">
                  <span style={{ color: effortColors[rec.effort], fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    {rec.effort} effort
                  </span>
                  <span className="stat-value" style={{ fontSize: '1.1rem', color: 'var(--success)' }}>
                    ${rec.potential_savings}/mo
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted">{rec.description}</p>
              {rec.affected_resources.length > 0 && (
                <div className="flex gap-sm mt-1" style={{ flexWrap: 'wrap' }}>
                  {rec.affected_resources.map(r => (
                    <span key={r} className="badge badge-info" style={{ fontSize: '0.7rem' }}>{r}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
