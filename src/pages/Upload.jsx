import UploadBox from '../components/UploadBox';

const Upload = ({ booksFile, twoBFile, onBooksSelect, onTwoBSelect, onProcess, uploadProgress, error }) => {
  return (
    <section className="space-y-6 rounded-2xl bg-white p-6 shadow-card">
      <h3 className="text-lg font-semibold text-slate-800">Upload Reconciliation Files</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <UploadBox label="Books Excel" file={booksFile} onFileSelect={onBooksSelect} progress={uploadProgress.books} />
        <UploadBox label="2B Excel" file={twoBFile} onFileSelect={onTwoBSelect} progress={uploadProgress.twoB} />
      </div>
      {error ? <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
      <button
        type="button"
        onClick={onProcess}
        className="rounded-xl bg-primary-600 px-5 py-3 font-medium text-white transition hover:bg-primary-700"
      >
        Start Reconciliation
      </button>
    </section>
  );
};

export default Upload;
