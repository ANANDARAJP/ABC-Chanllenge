const Reports = ({ onDownload }) => {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-card">
      <h3 className="text-lg font-semibold text-slate-800">Download Reconciliation Report</h3>
      <p className="mt-2 text-sm text-slate-600">
        Export final reconciliation output in Excel format for audits and compliance.
      </p>
      <button
        type="button"
        onClick={onDownload}
        className="mt-5 rounded-xl bg-primary-600 px-5 py-3 font-medium text-white transition hover:bg-primary-700"
      >
        Download Reconciliation Excel
      </button>
    </section>
  );
};

export default Reports;
