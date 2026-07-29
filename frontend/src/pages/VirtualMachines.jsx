/**
 * Virtual Machines Page — List, search, filter, and manage VMs.
 */
import { useState, useEffect } from 'react';
import { vmAPI } from '../api/services';

export default function VirtualMachines() {
  const [vms, setVms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchVMs = async () => {
    try {
      const params = {};
      if (filter !== 'all') params.provider = filter;
      if (search) params.search = search;
      const res = await vmAPI.list(params);
      setVms(res.data.data.vms);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVMs(); }, [filter, search]);

  const handleAction = async (vmId, provider, action) => {
    setActionLoading(vmId);
    try {
      await vmAPI.action(vmId, { action, provider });
      await fetchVMs();
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const runningCount = vms.filter(v => v.status === 'running').length;
  const stoppedCount = vms.filter(v => v.status === 'stopped').length;

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="page-header">
        <h1>🖥️ Virtual Machines</h1>
        <div className="header-actions">
          <span className="badge badge-running">{runningCount} Running</span>
          <span className="badge badge-stopped">{stoppedCount} Stopped</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        {['all', 'aws', 'azure', 'gcp'].map(f => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All Providers' : f.toUpperCase()}
          </button>
        ))}
        <input
          type="text"
          className="input-field"
          placeholder="Search VMs..."
          style={{ maxWidth: 240 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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
                  <th>Type</th>
                  <th>Region</th>
                  <th>Status</th>
                  <th>CPU / RAM</th>
                  <th>IP Address</th>
                  <th>Monthly Cost</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vms.map(vm => (
                  <tr key={vm.id}>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{vm.name}</strong></td>
                    <td><span className={`provider-tag ${vm.provider}`}>{vm.provider}</span></td>
                    <td className="font-mono text-sm">{vm.instance_type}</td>
                    <td className="text-sm">{vm.region}</td>
                    <td><span className={`badge badge-${vm.status}`}>{vm.status}</span></td>
                    <td className="text-sm">{vm.cpu_cores} vCPU / {vm.memory_gb}GB</td>
                    <td className="font-mono text-sm">{vm.public_ip}</td>
                    <td><strong>${vm.monthly_cost}</strong></td>
                    <td>
                      <div className="flex gap-sm">
                        {vm.status === 'running' ? (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleAction(vm.id, vm.provider, 'stop')}
                            disabled={actionLoading === vm.id}
                          >
                            {actionLoading === vm.id ? '...' : 'Stop'}
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleAction(vm.id, vm.provider, 'start')}
                            disabled={actionLoading === vm.id}
                          >
                            {actionLoading === vm.id ? '...' : 'Start'}
                          </button>
                        )}
                      </div>
                    </td>
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
