import { FiBell, FiUser } from 'react-icons/fi';

const Header = ({ title }) => {
  return (
    <header className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-card">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 lg:text-2xl">{title}</h2>
        <p className="text-sm text-slate-500">Automated GST invoice reconciliation with AI insights</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-full bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200"
          aria-label="Notifications"
        >
          <FiBell />
        </button>
        <button
          type="button"
          className="rounded-full bg-primary-100 p-3 text-primary-700 transition hover:bg-primary-200"
          aria-label="User Profile"
        >
          <FiUser />
        </button>
      </div>
    </header>
  );
};

export default Header;
