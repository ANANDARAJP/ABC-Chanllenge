import { motion } from 'framer-motion';

const Loader = ({ progress = 0, text = 'Processing invoices...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-sm">
      <div className="w-[90%] max-w-xl rounded-2xl bg-white p-8 shadow-card">
        <p className="mb-4 text-center text-lg font-semibold text-slate-800">{text}</p>
        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeInOut', duration: 0.5 }}
            className="h-full rounded-full bg-primary-500"
          />
        </div>
        <p className="mt-3 text-center text-sm text-slate-500">{progress}% completed</p>
      </div>
    </div>
  );
};

export default Loader;
