import { useRef, useState } from 'react';
import { FiUploadCloud } from 'react-icons/fi';

const allowedExtensions = ['xlsx', 'xls'];

const UploadBox = ({ label, file, onFileSelect, progress }) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      onFileSelect(null, `${label}: Please upload a valid .xlsx or .xls file.`);
      return;
    }

    onFileSelect(selectedFile, null);
  };

  return (
    <div className="space-y-3">
      <p className="font-medium text-slate-700">{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files[0]);
        }}
        className={`cursor-pointer rounded-2xl border-2 border-dashed bg-slate-50 p-6 transition ${
          isDragging ? 'border-primary-500 bg-primary-50' : 'border-slate-300 hover:border-primary-500'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <div className="flex flex-col items-center gap-3 text-center">
          <FiUploadCloud className="text-3xl text-primary-600" />
          <p className="text-sm text-slate-600">Drag & drop or click to upload</p>
          <p className="text-xs text-slate-500">Supported formats: .xlsx, .xls</p>
        </div>
      </div>
      {file ? <p className="text-sm text-primary-700">Uploaded: {file.name}</p> : null}
      {progress > 0 ? (
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </div>
  );
};

export default UploadBox;
