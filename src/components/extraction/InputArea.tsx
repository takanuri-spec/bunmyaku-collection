import { useState, useRef } from 'react';
import axios from 'axios';
import { t } from '../../i18n';

interface Props {
  onExtract: (text: string) => Promise<void>;
  loading: boolean;
}

const ACCEPTED_EXT = '.pptx,.docx,.xlsx';

export function InputArea({ onExtract, loading }: Props) {
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedFilename, setParsedFilename] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onExtract(text.trim());
  };

  const handleFile = async (file: File) => {
    setParseError(null);
    setParsedFilename(null);
    setParsing(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post<{ text: string; filename: string }>('/parse-file', formData);
      setText(res.data.text);
      setParsedFilename(res.data.filename);
    } catch (e) {
      const msg = axios.isAxiosError(e)
        ? (e.response?.data?.error ?? e.message)
        : 'ファイルの解析に失敗しました';
      setParseError(msg);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {t('inputLabel')}
        <span className="ml-2 text-gray-400 font-normal">{t('inputSubLabel')}</span>
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        placeholder={t('inputPlaceholder')}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        disabled={loading || parsing}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={loading || parsing || !text.trim()}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              {t('extractingBtn')}
            </>
          ) : (
            t('extractBtn')
          )}
        </button>
        {text.trim() && !loading && !parsing && (
          <button
            onClick={() => { setText(''); setParsedFilename(null); setParseError(null); }}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            {t('clearBtn')}
          </button>
        )}
      </div>

      {/* ファイルドロップゾーン */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-1 border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors select-none ${
          dragOver
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXT}
          onChange={handleFileInput}
          className="hidden"
        />
        {parsing ? (
          <div className="flex items-center justify-center gap-2 text-sm text-indigo-600">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
            ファイルを解析中...
          </div>
        ) : parsedFilename ? (
          <p className="text-sm">
            <span className="text-green-600 font-medium">✓ {parsedFilename}</span>
            <span className="text-gray-400 ml-2 text-xs">— テキストを読み込みました。別のファイルをドロップして差し替え可能</span>
          </p>
        ) : (
          <div className="text-sm text-gray-400">
            <p>PowerPoint (.pptx) / Word (.docx) / Excel (.xlsx) をここにドロップ</p>
            <p className="text-xs mt-1">またはクリックしてファイルを選択</p>
          </div>
        )}
      </div>

      {parseError && (
        <p className="text-xs text-red-600 mt-1">{parseError}</p>
      )}
    </div>
  );
}
