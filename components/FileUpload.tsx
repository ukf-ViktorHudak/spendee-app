import React, { useCallback } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isAnalyzing }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-6 border-2 border-dashed border-gray-700 rounded-2xl bg-card/50 hover:bg-card/80 transition-all">
      <input
        type="file"
        accept=".pdf, .jpg, .jpeg, .png"
        onChange={handleInputChange}
        className="hidden"
        id="file-upload"
        disabled={isAnalyzing}
      />
      <label
        htmlFor="file-upload"
        className={`cursor-pointer flex flex-col items-center gap-4 ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="p-6 bg-blue-600/20 rounded-full text-blue-400">
          {isAnalyzing ? (
            <Loader2 className="w-12 h-12 animate-spin" />
          ) : (
            <UploadCloud className="w-12 h-12" />
          )}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">
            {isAnalyzing ? 'Analyzing Financial Data...' : 'Upload Bank Statement'}
          </h3>
          <p className="text-gray-400 max-w-sm">
            Upload your PDF or Image bank statement. Our AI will extract transactions, detect subscriptions, and provide insights.
          </p>
          <div className="text-xs text-gray-500 mt-4 uppercase tracking-wider font-semibold">
            Supported Formats: PDF, JPG, PNG
          </div>
        </div>
      </label>
    </div>
  );
};