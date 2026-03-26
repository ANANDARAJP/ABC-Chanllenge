import { FiAlertTriangle, FiCheckCircle, FiShield } from 'react-icons/fi';

const riskColor = {
  Low: 'text-emerald-600 bg-emerald-50',
  Medium: 'text-amber-600 bg-amber-50',
  High: 'text-rose-600 bg-rose-50'
};

const InsightsPanel = ({ insights }) => {
  return (
    <section className="space-y-4 rounded-2xl bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">AI Insights</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskColor[insights.riskLevel]}`}>
          {insights.riskLevel} Risk
        </span>
      </div>

      <p className="text-sm text-slate-600">{insights.summary}</p>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-rose-50 p-3 text-rose-700">
          <div className="mb-2 flex items-center gap-2 font-medium">
            <FiAlertTriangle /> Duplicate Invoice Alerts
          </div>
          <p className="text-sm">{insights.duplicateAlerts}</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
          <div className="mb-2 flex items-center gap-2 font-medium">
            <FiShield /> Tax Mismatch Alerts
          </div>
          <p className="text-sm">{insights.taxMismatchAlerts}</p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 font-medium text-slate-800">
          <FiCheckCircle className="text-primary-600" /> Suggested Actions
        </div>
        <ul className="list-disc space-y-1 pl-6 text-sm text-slate-600">
          {insights.actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default InsightsPanel;
