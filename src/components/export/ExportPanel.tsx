import { useState } from 'react';
import type { ContextCard, ContextCase } from '../../types';
import { mergeContexts } from '../../services/claude';
import { exportsApi } from '../../services/api';
import { t } from '../../i18n';
import { LOCALE } from '../../config';

interface Props {
  contextCase: ContextCase;
  cards: ContextCard[];
  onExported?: () => void;
}

type ExportFormat = 'markdown' | 'json';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildJsonExport(contextCase: ContextCase, cards: ContextCard[], mergedContent: string) {
  return {
    exportedAt: new Date().toISOString(),
    case: {
      id: contextCase.id,
      name: contextCase.name,
      description: contextCase.description,
    },
    mergedContext: mergedContent,
    sourceCards: cards.map((c) => ({
      id: c.id,
      type: c.type,
      title: c.title,
      content: c.content,
      tags: c.tags,
    })),
  };
}

export function ExportPanel({ contextCase, cards, onExported }: Props) {
  const [generating, setGenerating] = useState(false);
  const [mergedContent, setMergedContent] = useState('');
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [saving, setSaving] = useState(false);
  const [savedLog, setSavedLog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (cards.length === 0) return;
    setGenerating(true);
    setError(null);
    setSavedLog(false);
    try {
      const result = await mergeContexts(contextCase.name, cards);
      setMergedContent(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('mergeFailed'));
    } finally {
      setGenerating(false);
    }
  };

  const handleExportAndSave = async () => {
    if (!mergedContent.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const safeName = contextCase.name.replace(/[^\w\u3000-\u9fff]/g, '_');
      if (format === 'markdown') {
        const mdContent = `# ${contextCase.name} — ${t('unifiedContextLabel')}\n\n> ${t('exportedLabel')}: ${new Date().toLocaleString(LOCALE)}\n\n---\n\n${mergedContent}`;
        downloadFile(mdContent, `${safeName}_context.md`, 'text/markdown');
      } else {
        const json = buildJsonExport(contextCase, cards, mergedContent);
        downloadFile(JSON.stringify(json, null, 2), `${safeName}_context.json`, 'application/json');
      }

      await exportsApi.create({
        caseId: contextCase.id,
        caseName: contextCase.name,
        mergedContent,
        sourceCardIds: cards.map((c) => c.id),
        createdAt: new Date().toISOString(),
      });
      setSavedLog(true);
      onExported?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('exportFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (cards.length === 0) {
    return (
      <div className="border border-dashed border-gray-200 rounded-lg p-4 text-sm text-gray-400">
        {t('noCardsForExport')}
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">{t('exportTitle')}</h3>
        <span className="text-xs text-gray-400">{cards.length} {t('cardsMergedLabel')}</span>
      </div>

      {!mergedContent && (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              {t('generatingBtn')}
            </>
          ) : (
            t('generateBtn')
          )}
        </button>
      )}

      {mergedContent && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{t('reviewBeforeExport')}</p>
            <button
              onClick={() => { setMergedContent(''); setSavedLog(false); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              {t('regenerateBtn')}
            </button>
          </div>

          <textarea
            value={mergedContent}
            onChange={(e) => setMergedContent(e.target.value)}
            rows={20}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
          />

          <div className="flex items-center gap-3 pt-1">
            <div className="flex rounded-md border border-gray-300 overflow-hidden text-sm">
              <button
                onClick={() => setFormat('markdown')}
                className={`px-3 py-1.5 transition-colors ${format === 'markdown' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Markdown
              </button>
              <button
                onClick={() => setFormat('json')}
                className={`px-3 py-1.5 border-l border-gray-300 transition-colors ${format === 'json' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                JSON
              </button>
            </div>

            <button
              onClick={handleExportAndSave}
              disabled={saving}
              className="flex-1 bg-green-600 text-white py-1.5 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {saving ? t('exportSavingBtn') : `${format === 'markdown' ? '.md' : '.json'} ${t('downloadAndSaveBtn')}`}
            </button>
          </div>

          {savedLog && (
            <p className="text-xs text-green-600">{t('exportLogSavedMsg')}</p>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
