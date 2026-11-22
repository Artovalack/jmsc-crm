export default function AppLoading() {
  return (
    <main className="app-loading-screen" role="status" aria-label="Loading JMSC Studio Desk">
      <span className="app-loading-mark" aria-hidden="true">JM</span>
      <strong>JMSC Studio Desk</strong>
      <span className="app-loading-indicator" aria-hidden="true" />
      <span className="sr-only">Loading your studio...</span>
    </main>
  );
}
