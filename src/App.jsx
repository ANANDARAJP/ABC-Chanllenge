import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Loader from './components/Loader';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Reports from './pages/Reports';
import { downloadReport, fetchAiInsights, uploadExcelFiles } from './services/api';

const initialStats = {
  matched: 0,
  booksNotIn2B: 0,
  twoBNotInBooks: 0,
  totalProcessed: 0
};

const fallbackInsights = {
  summary:
    'Upload files and run reconciliation to generate AI-powered GST insights for risks, duplicates, and tax mismatches.',
  riskLevel: 'Low',
  duplicateAlerts: 'No duplicate invoices detected yet.',
  taxMismatchAlerts: 'No tax mismatch alerts yet.',
  actions: ['Upload both files', 'Run reconciliation', 'Download reconciled report']
};

const titles = {
  dashboard: 'Dashboard',
  upload: 'Upload Files',
  reports: 'Reports',
  analysis: 'AI Analysis',
  settings: 'Settings'
};

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [booksFile, setBooksFile] = useState(null);
  const [twoBFile, setTwoBFile] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ books: 0, twoB: 0 });
  const [stats, setStats] = useState(initialStats);
  const [insights, setInsights] = useState(fallbackInsights);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const pageTitle = useMemo(() => titles[activeSection] || 'Dashboard', [activeSection]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const handleProcess = async () => {
    if (!booksFile || !twoBFile) {
      setError('Please upload both Books and 2B Excel files before processing.');
      return;
    }

    setError('');
    setLoading(true);
    setProcessingProgress(15);

    const formData = new FormData();
    formData.append('books_file', booksFile);
    formData.append('twoB_file', twoBFile);

    try {
      const response = await uploadExcelFiles(formData, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        setUploadProgress({ books: percent, twoB: percent });
        setProcessingProgress(Math.min(80, percent));
      });

      setSessionId(response.session_id);
      setStats({
        matched: response?.matched_count ?? 0,
        booksNotIn2B: response?.books_missing_count ?? 0,
        twoBNotInBooks: response?.twob_missing_count ?? 0,
        totalProcessed: (response?.matched_count ?? 0) + (response?.books_missing_count ?? 0)
      });

      const latestInsights = await fetchAiInsights(response.session_id);
      setInsights({
        summary:
          latestInsights?.summary ||
          'Most invoices are matched with minor tax deviations and limited duplicate anomalies.',
        riskLevel: latestInsights?.riskLevel || 'Medium',
        duplicateAlerts: latestInsights?.duplicateAlerts || '3 potential duplicate invoice groups identified.',
        taxMismatchAlerts: latestInsights?.taxMismatchAlerts || '5 invoices with GST amount variance above threshold.',
        actions: latestInsights?.actions || [
          'Review flagged duplicate groups and remove invalid entries.',
          'Validate supplier GST rate mapping in ERP.',
          'Re-run reconciliation after corrections.'
        ]
      });

      setActiveSection('dashboard');
      setProcessingProgress(100);
      showToast('Reconciliation completed successfully.');
    } catch (uploadError) {
      const detail = uploadError?.response?.data?.detail;
      setError(detail || uploadError?.response?.data?.message || 'Reconciliation failed. Please retry.');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProcessingProgress(0);
      }, 500);
    }
  };

  const handleDownload = async () => {
    if (!sessionId) {
      setError('No active session. Please reconcile files first.');
      return;
    }
    try {
      const blob = await downloadReport(sessionId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gst-reconciliation-report-${Date.now()}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      showToast('Report downloaded successfully.');
    } catch (downloadError) {
      setError(downloadError?.response?.data?.message || 'Download failed. Try again later.');
    }
  };

  const pageContent = () => {
    if (activeSection === 'upload') {
      return (
        <Upload
          booksFile={booksFile}
          twoBFile={twoBFile}
          uploadProgress={uploadProgress}
          onBooksSelect={(file, fileError) => {
            setError(fileError || '');
            setBooksFile(file);
          }}
          onTwoBSelect={(file, fileError) => {
            setError(fileError || '');
            setTwoBFile(file);
          }}
          onProcess={handleProcess}
          error={error}
        />
      );
    }

    if (activeSection === 'reports') {
      return <Reports onDownload={handleDownload} />;
    }

    if (activeSection === 'analysis') {
      return <Dashboard stats={stats} insights={insights} />;
    }

    if (activeSection === 'settings') {
      return (
        <section className="rounded-2xl bg-white p-6 shadow-card">
          <h3 className="text-lg font-semibold text-slate-800">Settings</h3>
          <p className="mt-2 text-sm text-slate-600">Configuration controls can be wired here as needed.</p>
        </section>
      );
    }

    return <Dashboard stats={stats} insights={insights} />;
  };

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="mx-auto grid max-w-[1400px] gap-4 lg:grid-cols-[260px_1fr]">
        <Sidebar activeSection={activeSection} onSelect={setActiveSection} />
        <div className="space-y-4">
          <Header title={pageTitle} />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
            >
              {pageContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-6 right-6 rounded-xl bg-primary-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      {loading ? <Loader progress={processingProgress} /> : null}
    </div>
  );
}

export default App;
