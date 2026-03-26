import { FiBarChart2, FiFileText, FiSettings, FiUploadCloud } from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: FiBarChart2 },
  { id: 'upload', label: 'Upload Files', icon: FiUploadCloud },
  { id: 'reports', label: 'Reports', icon: FiFileText },
  { id: 'analysis', label: 'AI Analysis', icon: BsStars },
  { id: 'settings', label: 'Settings', icon: FiSettings }
];

const Sidebar = ({ activeSection, onSelect }) => {
  return (
    <aside className="w-full lg:w-64 rounded-2xl bg-white p-4 shadow-card">
      <h1 className="mb-8 text-xl font-bold text-primary-700">GST Recon AI</h1>
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-300 ${
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="text-lg" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
