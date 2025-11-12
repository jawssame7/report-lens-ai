import { AlertCircle, Trash2, Upload } from 'lucide-react';
import type { ChangeEvent, DragEvent } from 'react';
import { useRef, useState } from 'react';
import { formatBytes } from '../utils/formatters';

interface UploadPanelProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  error?: string | null;
  maxFiles: number;
  maxTotalBytes: number;
}

export const UploadPanel = ({
  files,
  onFilesChange,
  onAnalyze,
  isAnalyzing,
  error,
  maxFiles,
  maxTotalBytes,
}: UploadPanelProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const triggerFileDialog = () => inputRef.current?.click();

  const upsertFiles = (newFiles: FileList | null) => {
    if (!newFiles?.length) return;

    const combined = [...files, ...Array.from(newFiles)].slice(0, maxFiles);
    onFilesChange(combined);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    upsertFiles(event.dataTransfer.files);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => setDragActive(false);

  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    upsertFiles(event.target.files);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const exceedsSize = totalSize > maxTotalBytes;

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <p className="card-eyebrow">ファイルアップロード</p>
          <h2>
            最大 {maxFiles} ファイル / 合計 {formatBytes(maxTotalBytes)}
          </h2>
          <p className="card-subtitle">
            PDF / Excel / Word / CSV / PowerPoint / 画像 をまとめて解析します。
          </p>
        </div>
        <button
          type="button"
          className="secondary"
          onClick={triggerFileDialog}
          disabled={files.length >= maxFiles}
        >
          ファイルを選択
        </button>
      </div>

      <div
        className={`dropzone ${dragActive ? 'active' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={triggerFileDialog}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerFileDialog();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="ファイルをドラッグ&ドロップまたはクリックして選択"
      >
        <Upload size={24} />
        <p>ここにドラッグ & ドロップ、またはクリックして選択</p>
        <span>対応形式: PDF, Excel, Word, CSV, PowerPoint, JPG, PNG</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={onFileInput}
        />
      </div>

      {files.length > 0 && (
        <ul className="file-list">
          {files.map((file) => (
            <li key={file.name}>
              <div>
                <p>{file.name}</p>
                <span>{formatBytes(file.size)}</span>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={(event) => {
                  event.stopPropagation();
                  onFilesChange(files.filter((item) => item !== file));
                }}
                aria-label={`${file.name} を削除`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {(error || exceedsSize) && (
        <div className="alert">
          <AlertCircle size={18} />
          <span>{error ?? '合計サイズが 100MB を超えています。'}</span>
        </div>
      )}

      <div className="card-footer">
        <p>
          アップロード済み: {files.length} 件 / {formatBytes(totalSize)}
        </p>
        <button
          type="button"
          className="primary"
          onClick={onAnalyze}
          disabled={isAnalyzing || !files.length || exceedsSize}
        >
          {isAnalyzing ? 'Gemini が分析中…' : 'Gemini で分析する'}
        </button>
      </div>
    </section>
  );
};
