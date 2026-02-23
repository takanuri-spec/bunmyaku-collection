import axios from 'axios';
import type { ContextCard, CardType } from '../types';
import { CROSS_LANG_API_URL, LANG } from '../config';

/** 他インスタンスから取得したカード（ソース言語付き） */
export interface CrossLangCard extends ContextCard {
  _sourceLang: 'ja' | 'en';
}

/** 類似候補 */
export interface SimilarCandidate {
  card: CrossLangCard;
  score: number;   // 0–100
  reason: string;
}

/** 差分分析結果 */
export interface ImportDelta {
  summary: string;        // 差分の要約（目標言語で）
  deltaContent: string;   // インポートするコンテンツ（編集可）
  suggestedAction: 'append' | 'new_card';
}

/**
 * 他インスタンスのカード一覧を取得する
 * CROSS_LANG_API_URL が空の場合は空配列を返す
 */
export async function fetchCrossLangCards(): Promise<CrossLangCard[]> {
  if (!CROSS_LANG_API_URL) return [];
  const url = `${CROSS_LANG_API_URL}/cross-lang/cards`;
  const response = await axios.get<{ lang: 'ja' | 'en'; cards: ContextCard[] }>(url, {
    timeout: 8000,
  });
  const { lang, cards } = response.data;
  return cards.map((c) => ({ ...c, _sourceLang: lang }));
}

/**
 * Gemini を使って targetCard に類似した候補カードをランキングする
 * 類似度 40 以上のカードのみ返す（スコア降順）
 */
export async function findSimilarCards(
  targetCard: ContextCard,
  candidates: CrossLangCard[],
): Promise<SimilarCandidate[]> {
  if (candidates.length === 0) return [];

  const candidateList = candidates
    .map(
      (c, i) =>
        `[${i}] Type: ${c.type} | Title: ${c.title}\nContent (excerpt): ${c.content.slice(0, 250)}`,
    )
    .join('\n\n');

  const prompt = `You are analyzing business context cards for a sales context management tool.

Target card (find similarities for this):
Type: ${targetCard.type}
Title: ${targetCard.title}
Content (excerpt): ${targetCard.content.slice(0, 350)}

Candidate cards from another language instance:
${candidateList}

Instructions:
- Rate each candidate's similarity to the target card (0-100).
- Focus on: same customer/deal/company, overlapping business information, shared context.
- Provide a concise reason (1 sentence, in English).
- Only include candidates with score >= 40.
- Sort by score descending.

Return a JSON array ONLY (no explanation outside JSON):
[{"index": 0, "score": 85, "reason": "Same customer deal context with overlapping KPI data"}]`;

  const response = await axios.post('/gemini', {
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 1024 },
  });

  const text: string = response.data.candidates[0].content.parts[0].text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  const results = JSON.parse(jsonMatch[0]) as { index: number; score: number; reason: string }[];
  return results
    .filter((r) => r.index >= 0 && r.index < candidates.length && r.score >= 40)
    .map((r) => ({
      card: candidates[r.index],
      score: r.score,
      reason: r.reason,
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Gemini を使ってソースカードとターゲットカードの差分を分析する
 * 新規情報を目標言語（LANG）で返す
 */
export async function getImportDelta(
  sourceCard: CrossLangCard,
  targetCard: ContextCard,
): Promise<ImportDelta> {
  const targetLang = LANG;
  const sourceLang = sourceCard._sourceLang;

  const langInstruction =
    targetLang === 'ja'
      ? 'Output all text in Japanese (日本語).'
      : 'Output all text in English.';

  const prompt = `You are a bilingual business analyst comparing two context cards about the same business situation.

Card A (${sourceLang.toUpperCase()} — source, potentially has newer or different information):
Title: ${sourceCard.title}
Content:
${sourceCard.content}

Card B (${targetLang.toUpperCase()} — current card to potentially update):
Title: ${targetCard.title}
Content:
${targetCard.content}

Task:
1. Identify what information is NEW or MEANINGFULLY DIFFERENT in Card A that is NOT captured in Card B.
2. If the cards cover essentially the same information, the deltaContent should be minimal or empty.
3. ${langInstruction}
4. suggestedAction: use "append" if the new info supplements Card B naturally; use "new_card" if it covers a distinctly different angle or is very different in scope.

Return JSON ONLY (no text outside JSON):
{
  "summary": "1-2 sentence summary of what is new/different",
  "deltaContent": "The new/different information to import, written in the target language, in clean markdown-friendly format. Empty string if nothing significant.",
  "suggestedAction": "append"
}`;

  const response = await axios.post('/gemini', {
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 2048 },
  });

  const text: string = response.data.candidates[0].content.parts[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse delta analysis from Gemini');

  const result = JSON.parse(jsonMatch[0]) as ImportDelta;
  // Validate suggestedAction
  if (result.suggestedAction !== 'append' && result.suggestedAction !== 'new_card') {
    result.suggestedAction = 'append';
  }
  return result;
}

/**
 * 追記用のマーカー付きコンテンツを生成する
 */
export function buildAppendContent(
  deltaContent: string,
  sourceLang: 'ja' | 'en',
): string {
  const otherLang = sourceLang.toUpperCase();
  if (LANG === 'ja') {
    return `\n\n---\n\n**[${otherLang}インスタンスより追記]**\n${deltaContent}`;
  }
  return `\n\n---\n\n**[Appended from ${otherLang} instance]**\n${deltaContent}`;
}

/**
 * 新規カード用のタイトルを生成する
 */
export function buildNewCardTitle(
  sourceTitle: string,
  sourceLang: 'ja' | 'en',
): string {
  const otherLang = sourceLang.toUpperCase();
  if (LANG === 'ja') {
    return `${sourceTitle}（${otherLang}より）`;
  }
  return `${sourceTitle} (from ${otherLang})`;
}

/**
 * カード種別として有効かどうかチェック
 */
export function isValidCardType(type: string): type is CardType {
  return type === 'customer' || type === 'sales' || type === 'operations';
}
