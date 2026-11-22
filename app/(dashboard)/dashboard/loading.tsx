export default function DashboardLoading() {
  return (
    <div className="dashboard-loading" role="status" aria-label="Loading studio overview" aria-busy="true">
      <span className="sr-only">Loading studio overview</span>
      <div className="dashboard-loading-heading">
        <div>
          <span className="loading-skeleton loading-eyebrow" />
          <span className="loading-skeleton loading-title" />
          <span className="loading-skeleton loading-description" />
        </div>
        <span className="loading-skeleton loading-action" />
      </div>
      <div className="metric-grid dashboard-metrics">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="metric-card" key={index}>
            <span className="loading-skeleton loading-label" />
            <span className="loading-skeleton loading-number" />
            <span className="loading-skeleton loading-foot" />
          </div>
        ))}
      </div>
      <div className="dashboard-grid dashboard-primary-grid">
        <div className="panel dashboard-panel loading-panel">
          <span className="loading-skeleton loading-panel-title" />
          {Array.from({ length: 4 }, (_, index) => <span className="loading-skeleton loading-row" key={index} />)}
        </div>
        <div className="panel dashboard-panel loading-panel">
          <span className="loading-skeleton loading-panel-title" />
          {Array.from({ length: 4 }, (_, index) => <span className="loading-skeleton loading-row" key={index} />)}
        </div>
      </div>
    </div>
  );
}
