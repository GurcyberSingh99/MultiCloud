/**
 * Alerts Page — Alert list with severity badges, filtering, and acknowledge actions.
 */
import { useState, useEffect } from 'react';
import { alertsAPI } from '../api/services';

export default function Alerts() {
  const [alerts, setAlerts] = useState(null);
  const [rules, setRules] = useState([]);
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [alertRes, rulesRes, histRes] = await Promise.all([
          alertsAPI.list(),
          alertsAPI.rules(),
          alertsAPI.history(),
        ]);
        setAlerts(alertRes.data.data);
        setRules(rulesRes.data.data.rules);
        setHistory(histRes.data.data.history);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  const handleAck = async (id) => {
    try {
      await alertsAPI.acknowledge(id);
      const res = await alertsAPI.list();
      setAlerts(res.data.data);
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="glass-card"><div className="skeleton" style={{ height: 400 }} /></div>;

  const filteredAlerts = alerts?.alerts?.filter(a =>
    filter === 'all' || a.severity === filter || a.provider === filter
  ) || [];

  const formatTime = (iso) => {
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>🔔 Alerts</h1>
        <div className="header-actions">
          <span className="badge badge-critical">{alerts?.summary?.critical} Critical</span>
          <span className="badge badge-warning">{alerts?.summary?.warning} Warning</span>
          <span className="badge badge-info">{alerts?.summary?.info} Info</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-bar">
        {['active', 'rules', 'history'].map(t => (
          <button key={t} className={`filter-chip ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
        {tab === 'active' && (
          <>
            <span style={{ color: 'var(--border-color)', margin: '0 0.25rem' }}>|</span>
            {['all', 'critical', 'warning', 'info'].map(f => (
              <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
                {f}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Active Alerts */}
      {tab === 'active' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {filteredAlerts.map(alert => (
            <div key={alert.id} className="glass-card" style={{ padding: '1rem 1.25rem', opacity: alert.acknowledged ? 0.6 : 1 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md" style={{ flex: 1 }}>
                  <span style={{ fontSize: '1.3rem' }}>
                    {alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : 'ℹ️'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-sm mb-1" style={{ marginBottom: '0.25rem' }}>
                      <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
                      <span className={`provider-tag ${alert.provider}`}>{alert.provider}</span>
                      <span className="text-sm text-muted">{alert.resource}</span>
                      <span className="text-sm text-muted">• {formatTime(alert.created_at)}</span>
                    </div>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{alert.message}</p>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <button className="btn btn-sm btn-secondary" onClick={() => handleAck(alert.id)}>
                    Acknowledge
                  </button>
                )}
                {alert.acknowledged && <span className="text-sm text-muted">✓ Ack'd</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alert Rules */}
      {tab === 'rules' && (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Metric</th>
                <th>Condition</th>
                <th>Duration</th>
                <th>Severity</th>
                <th>Providers</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id}>
                  <td><strong style={{ color: 'var(--text-primary)' }}>{rule.name}</strong></td>
                  <td className="text-sm">{rule.metric}</td>
                  <td className="font-mono text-sm">{rule.operator} {rule.threshold}</td>
                  <td className="text-sm">{rule.duration}</td>
                  <td><span className={`badge badge-${rule.severity}`}>{rule.severity}</span></td>
                  <td>{rule.providers.map(p => <span key={p} className={`provider-tag ${p}`} style={{ marginRight: 4 }}>{p}</span>)}</td>
                  <td><span className={`badge badge-${rule.enabled ? 'running' : 'stopped'}`}>{rule.enabled ? 'Active' : 'Disabled'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {history.map(h => (
            <div key={h.id} className="glass-card" style={{ padding: '0.85rem 1.25rem' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <span className={`badge badge-${h.severity}`}>{h.severity}</span>
                  <span className={`provider-tag ${h.provider}`}>{h.provider}</span>
                  <strong className="text-sm">{h.resource}</strong>
                  <span className="text-sm text-muted">— {h.message}</span>
                </div>
                <div className="flex items-center gap-sm">
                  <span className={`badge badge-${h.status === 'resolved' ? 'running' : h.status === 'triggered' ? 'critical' : 'warning'}`}>{h.status}</span>
                  <span className="text-sm text-muted">{formatTime(h.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
