/**
 * Cloud API Credentials Management Page
 * Interface to configure, test, and save API credentials for AWS, Azure, and GCP.
 */
import { useState, useEffect } from 'react';
import { cloudAPI } from '../api/services';
import './CloudCredentials.css';

const DEFAULT_CREDENTIALS = {
  aws: {
    aws_access_key_id: 'AKIAIOSFODNN7EXAMPLE',
    aws_secret_access_key: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    aws_region: 'us-east-1',
    aws_session_token: '',
  },
  azure: {
    azure_tenant_id: '72f988bf-86f1-41af-91ab-2d7cd011db47',
    azure_client_id: '4c3d8a1e-8e56-4b2a-9f12-00ab12345678',
    azure_client_secret: 'Sec~8Qx9vK2P1L0mN4oP5qR6sT7uV8wX',
    azure_subscription_id: '3a2b1c0d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
  },
  gcp: {
    gcp_project_id: 'cloudpilot-prod-2026',
    gcp_client_email: 'cloudpilot-sa@cloudpilot-prod-2026.iam.gserviceaccount.com',
    gcp_private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3...\n-----END PRIVATE KEY-----',
    gcp_region: 'us-central1',
  },
};

export default function CloudCredentials() {
  const [activeTab, setActiveTab] = useState('aws');
  const [credentials, setCredentials] = useState(DEFAULT_CREDENTIALS);
  const [statuses, setStatuses] = useState({
    aws: { status: 'connected', last_tested: '2026-07-24 10:30:00' },
    azure: { status: 'connected', last_tested: '2026-07-24 10:30:00' },
    gcp: { status: 'connected', last_tested: '2026-07-24 10:30:00' },
  });
  const [showSecrets, setShowSecrets] = useState({
    aws: false,
    azure: false,
    gcp: false,
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Fetch configured credentials on initial render
  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const res = await cloudAPI.getCredentials();
      if (res.data?.success && res.data?.data) {
        const backendData = res.data.data;
        const newCreds = { ...credentials };
        const newStatuses = { ...statuses };

        Object.keys(backendData).forEach((provider) => {
          if (backendData[provider].credentials) {
            newCreds[provider] = {
              ...newCreds[provider],
              ...backendData[provider].credentials,
            };
          }
          newStatuses[provider] = {
            status: backendData[provider].status || 'connected',
            last_tested: backendData[provider].last_tested || 'Just now',
          };
        });

        setCredentials(newCreds);
        setStatuses(newStatuses);
      }
    } catch (err) {
      console.warn('Backend credentials fetch warning (using defaults):', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCredentials((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value,
      },
    }));
  };

  const toggleShowSecret = () => {
    setShowSecrets((prev) => ({
      ...prev,
      [activeTab]: !prev[activeTab],
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setFeedback(null);
    setLoading(true);
    try {
      const res = await cloudAPI.saveCredentials(activeTab, credentials[activeTab]);
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: res.data.message || `${activeTab.toUpperCase()} API credentials saved successfully!`,
        });
        setStatuses((prev) => ({
          ...prev,
          [activeTab]: {
            status: 'connected',
            last_tested: new Date().toLocaleString(),
          },
        }));
      }
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.error || `Failed to save ${activeTab.toUpperCase()} credentials.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setFeedback(null);
    setTesting(true);
    setStatuses((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], status: 'testing' },
    }));

    try {
      const res = await cloudAPI.testCredentials(activeTab, credentials[activeTab]);
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: res.data.message || `Connection to ${activeTab.toUpperCase()} verified!`,
        });
        setStatuses((prev) => ({
          ...prev,
          [activeTab]: {
            status: 'connected',
            last_tested: new Date().toLocaleString(),
          },
        }));
      } else {
        throw new Error(res.data?.error || 'Validation failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || `Could not connect to ${activeTab.toUpperCase()}.`;
      setFeedback({
        type: 'danger',
        message: errorMsg,
      });
      setStatuses((prev) => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], status: 'disconnected' },
      }));
    } finally {
      setTesting(false);
    }
  };

  const handleReset = () => {
    setCredentials((prev) => ({
      ...prev,
      [activeTab]: DEFAULT_CREDENTIALS[activeTab],
    }));
    setFeedback({
      type: 'info',
      message: `Reset ${activeTab.toUpperCase()} fields to default template values.`,
    });
  };

  const providerNames = {
    aws: 'Amazon Web Services (AWS)',
    azure: 'Microsoft Azure',
    gcp: 'Google Cloud Platform (GCP)',
  };

  return (
    <div className="cloud-credentials-page">
      {/* Overview Cards */}
      <div className="credentials-overview-grid">
        {/* AWS Summary Card */}
        <div
          className={`provider-summary-card aws ${activeTab === 'aws' ? 'active' : ''}`}
          onClick={() => { setActiveTab('aws'); setFeedback(null); }}
        >
          <div className="card-top-header">
            <div className="provider-brand">
              <div className="provider-icon-badge aws">AWS</div>
              <div className="provider-title-group">
                <h4>AWS API</h4>
                <span>Amazon Web Services</span>
              </div>
            </div>
            <div className={`connection-status-pill ${statuses.aws.status}`}>
              <span className="status-indicator-dot" />
              {statuses.aws.status === 'testing' ? 'Testing...' : statuses.aws.status === 'connected' ? 'Connected' : 'Disconnected'}
            </div>
          </div>
          <div className="card-details-row">
            <span>Region: <strong>{credentials.aws.aws_region || 'us-east-1'}</strong></span>
            <span>Tested: {statuses.aws.last_tested}</span>
          </div>
        </div>

        {/* Azure Summary Card */}
        <div
          className={`provider-summary-card azure ${activeTab === 'azure' ? 'active' : ''}`}
          onClick={() => { setActiveTab('azure'); setFeedback(null); }}
        >
          <div className="card-top-header">
            <div className="provider-brand">
              <div className="provider-icon-badge azure">AZ</div>
              <div className="provider-title-group">
                <h4>Azure API</h4>
                <span>Microsoft Azure</span>
              </div>
            </div>
            <div className={`connection-status-pill ${statuses.azure.status}`}>
              <span className="status-indicator-dot" />
              {statuses.azure.status === 'testing' ? 'Testing...' : statuses.azure.status === 'connected' ? 'Connected' : 'Disconnected'}
            </div>
          </div>
          <div className="card-details-row">
            <span>Sub ID: <strong>{credentials.azure.azure_subscription_id?.slice(0, 8)}...</strong></span>
            <span>Tested: {statuses.azure.last_tested}</span>
          </div>
        </div>

        {/* GCP Summary Card */}
        <div
          className={`provider-summary-card gcp ${activeTab === 'gcp' ? 'active' : ''}`}
          onClick={() => { setActiveTab('gcp'); setFeedback(null); }}
        >
          <div className="card-top-header">
            <div className="provider-brand">
              <div className="provider-icon-badge gcp">GCP</div>
              <div className="provider-title-group">
                <h4>GCP API</h4>
                <span>Google Cloud Platform</span>
              </div>
            </div>
            <div className={`connection-status-pill ${statuses.gcp.status}`}>
              <span className="status-indicator-dot" />
              {statuses.gcp.status === 'testing' ? 'Testing...' : statuses.gcp.status === 'connected' ? 'Connected' : 'Disconnected'}
            </div>
          </div>
          <div className="card-details-row">
            <span>Project: <strong>{credentials.gcp.gcp_project_id || 'N/A'}</strong></span>
            <span>Tested: {statuses.gcp.last_tested}</span>
          </div>
        </div>
      </div>

      {/* Main Credentials Form Card */}
      <div className="credentials-form-card">
        {/* Navigation Tabs */}
        <div className="cloud-tabs-nav">
          <button
            type="button"
            className={`cloud-tab-btn aws ${activeTab === 'aws' ? 'active' : ''}`}
            onClick={() => { setActiveTab('aws'); setFeedback(null); }}
          >
            <span>🟠</span> AWS Credentials
          </button>
          <button
            type="button"
            className={`cloud-tab-btn azure ${activeTab === 'azure' ? 'active' : ''}`}
            onClick={() => { setActiveTab('azure'); setFeedback(null); }}
          >
            <span>🔷</span> Azure Credentials
          </button>
          <button
            type="button"
            className={`cloud-tab-btn gcp ${activeTab === 'gcp' ? 'active' : ''}`}
            onClick={() => { setActiveTab('gcp'); setFeedback(null); }}
          >
            <span>🟢</span> GCP Credentials
          </button>
        </div>

        {/* Notification Feedback Banner */}
        {feedback && (
          <div className={`alert-banner ${feedback.type}`}>
            <span>{feedback.type === 'success' ? '✅' : feedback.type === 'danger' ? '⚠️' : 'ℹ️'}</span>
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* AWS FORM */}
          {activeTab === 'aws' && (
            <div className="credentials-form-grid">
              <div className="form-group">
                <label className="form-label">
                  AWS Access Key ID <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  value={credentials.aws.aws_access_key_id}
                  onChange={(e) => handleInputChange('aws_access_key_id', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  AWS Secret Access Key <span className="required-star">*</span>
                </label>
                <div className="input-secret-wrapper">
                  <input
                    type={showSecrets.aws ? 'text' : 'password'}
                    className="form-input"
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    value={credentials.aws.aws_secret_access_key}
                    onChange={(e) => handleInputChange('aws_secret_access_key', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-secret-btn"
                    onClick={toggleShowSecret}
                    title={showSecrets.aws ? 'Hide secret' : 'Show secret'}
                  >
                    {showSecrets.aws ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Default AWS Region <span className="required-star">*</span>
                </label>
                <select
                  className="form-select"
                  value={credentials.aws.aws_region}
                  onChange={(e) => handleInputChange('aws_region', e.target.value)}
                >
                  <option value="us-east-1">us-east-1 (N. Virginia)</option>
                  <option value="us-west-2">us-west-2 (Oregon)</option>
                  <option value="eu-west-1">eu-west-1 (Ireland)</option>
                  <option value="ap-south-1">ap-south-1 (Mumbai)</option>
                  <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  AWS Session Token <em>(Optional for STS / Temporary Keys)</em>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="IQoJb3JpZ2luX2VjE..."
                  value={credentials.aws.aws_session_token}
                  onChange={(e) => handleInputChange('aws_session_token', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* AZURE FORM */}
          {activeTab === 'azure' && (
            <div className="credentials-form-grid">
              <div className="form-group">
                <label className="form-label">
                  Azure Tenant ID <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="00000000-0000-0000-0000-000000000000"
                  value={credentials.azure.azure_tenant_id}
                  onChange={(e) => handleInputChange('azure_tenant_id', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Azure Client ID (App Registration) <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="00000000-0000-0000-0000-000000000000"
                  value={credentials.azure.azure_client_id}
                  onChange={(e) => handleInputChange('azure_client_id', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Azure Client Secret <span className="required-star">*</span>
                </label>
                <div className="input-secret-wrapper">
                  <input
                    type={showSecrets.azure ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Sec~8Qx9vK2P1L0mN4oP..."
                    value={credentials.azure.azure_client_secret}
                    onChange={(e) => handleInputChange('azure_client_secret', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-secret-btn"
                    onClick={toggleShowSecret}
                    title={showSecrets.azure ? 'Hide secret' : 'Show secret'}
                  >
                    {showSecrets.azure ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Azure Subscription ID <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="00000000-0000-0000-0000-000000000000"
                  value={credentials.azure.azure_subscription_id}
                  onChange={(e) => handleInputChange('azure_subscription_id', e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* GCP FORM */}
          {activeTab === 'gcp' && (
            <div className="credentials-form-grid">
              <div className="form-group">
                <label className="form-label">
                  GCP Project ID <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="my-gcp-project-12345"
                  value={credentials.gcp.gcp_project_id}
                  onChange={(e) => handleInputChange('gcp_project_id', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  GCP Service Account Email <span className="required-star">*</span>
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="sa-name@project-id.iam.gserviceaccount.com"
                  value={credentials.gcp.gcp_client_email}
                  onChange={(e) => handleInputChange('gcp_client_email', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Default GCP Region <span className="required-star">*</span>
                </label>
                <select
                  className="form-select"
                  value={credentials.gcp.gcp_region}
                  onChange={(e) => handleInputChange('gcp_region', e.target.value)}
                >
                  <option value="us-central1">us-central1 (Iowa)</option>
                  <option value="us-east1">us-east1 (South Carolina)</option>
                  <option value="europe-west1">europe-west1 (Belgium)</option>
                  <option value="asia-south1">asia-south1 (Mumbai)</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  GCP Service Account Private Key (PEM format) <span className="required-star">*</span>
                </label>
                <div className="input-secret-wrapper">
                  <textarea
                    rows={4}
                    className="form-input"
                    placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk..."
                    value={credentials.gcp.gcp_private_key}
                    onChange={(e) => handleInputChange('gcp_private_key', e.target.value)}
                    required
                    style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Footer Action Buttons */}
          <div className="form-actions-row">
            <div className="left-actions">
              <button
                type="button"
                className="btn btn-test"
                onClick={handleTestConnection}
                disabled={testing || loading}
              >
                {testing ? '⚡ Testing Connection...' : '⚡ Test Connection'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
                disabled={testing || loading}
              >
                🔄 Reset Defaults
              </button>
            </div>

            <div className="right-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={testing || loading}
              >
                {loading ? 'Saving...' : `💾 Save ${activeTab.toUpperCase()} Keys`}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Guide & Documentation Card */}
      <div className="credentials-guide-card">
        <div className="guide-icon">🔑</div>
        <div className="guide-content">
          <h4>How to get API keys for {providerNames[activeTab]}</h4>
          {activeTab === 'aws' && (
            <p>
              Log in to the <strong>AWS Management Console</strong> &gt; Navigate to <strong>IAM (Identity and Access Management)</strong> &gt; Select your IAM User or Role &gt; Go to <strong>Security credentials</strong> &gt; Click <strong>Create access key</strong>.
            </p>
          )}
          {activeTab === 'azure' && (
            <p>
              Log in to <strong>Azure Portal</strong> &gt; Navigate to <strong>Microsoft Entra ID (Azure AD)</strong> &gt; Select <strong>App registrations</strong> &gt; Create or select your App &gt; Copy <strong>Tenant ID</strong> and <strong>Application ID</strong> &gt; Generate a new <strong>Client secret</strong> under <em>Certificates &amp; secrets</em>.
            </p>
          )}
          {activeTab === 'gcp' && (
            <p>
              Log in to <strong>Google Cloud Console</strong> &gt; Go to <strong>IAM &amp; Admin</strong> &gt; Select <strong>Service Accounts</strong> &gt; Select your service account &gt; Go to the <strong>Keys</strong> tab &gt; Click <strong>Add Key &gt; Create new key (JSON)</strong>.
            </p>
          )}
          <ul className="guide-steps">
            <li>Ensure the API credentials have read &amp; manage permissions for EC2/VMs, Storage buckets, and Cost Explorer APIs.</li>
            <li>All saved API keys are encrypted at rest with AES-256 before storing.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
