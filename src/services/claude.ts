import axios from 'axios';
import type { CardType, ExtractionDraft, ContextCard } from '../types';
import { CARD_TYPE_LABELS } from '../types';
import { getPromptSettings } from './promptSettings';
import { LANG } from '../config';

const TYPE_DEFINITIONS: Record<CardType, string> = LANG === 'en' ? {
  customer: `- Customer's business situation, challenges, KPIs, financial status, and strategic risks
- Decision-makers' intentions, positions, and constraints
- Buyer's role and power map (who holds authority, who has influence, who may oppose, decision process)
- From the customer's perspective: "why now, what's the problem, what do they need"`,
  sales: `- Our sales strategy, approach, timeline, and winning thesis
- Lead's style, strengths, priorities, and opinions
- Team members' roles, expertise, and balance of power (who leads, who supports)
- Internal alignment, approval routes, and stakeholder management`,
  operations: `- Specific requirements, deliverables, processes, schedules, and constraints
- Business rules, policies, exceptions, and notes
- Owners, roles, departments, and collaboration partners
- "What to do, how to proceed, what is needed"`,
} : {
  customer: `- 顧客企業の状況・経営課題・KPI・財務状況・中期計画リスク
- 意思決定者の思惑・ポジション・制約
- バイヤーの立ち位置とパワーマップ（実権・影響力・反対しうる人・意思決定プロセス）
- 顧客視点で「なぜ今、何が問題で、何を求めているか」`,
  sales: `- 自社営業の戦略・アプローチ方針・タイムライン・勝ち筋
- 営業リード（主担当）の方針・スタイル・強み・こだわり
- 参画メンバーの個性・専門性・パワーバランス
- 社内での推進体制・社内根回し・承認ルート`,
  operations: `- 具体的な業務要件・成果物・プロセス・スケジュール・制約条件
- 業務ルール・ポリシー・例外処理・注意事項
- 担当者・役割分担・関連部署・連携先
- 「何をやるか、どう進めるか、何が必要か」`,
};

async function callGemini(userMessage: string, systemPrompt?: string): Promise<string> {
  const body: Record<string, unknown> = {
    model: 'gemini-2.0-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 4096,
    },
  };

  if (systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  const response = await axios.post('/gemini', body);

  const candidates = response.data.candidates;
  if (!candidates || candidates.length === 0) throw new Error('Gemini から応答がありませんでした');
  return candidates[0].content.parts[0].text as string;
}

export async function extractContexts(inputText: string, focusHint?: string): Promise<ExtractionDraft[]> {
  const focusLine = focusHint?.trim() ? `\n重点テーマ・絞り込み: ${focusHint.trim()}\n` : '';
  const text = await callGemini(
    `以下のテキストから3種類の文脈を抽出してください。${focusLine}\n\n---\n${inputText}\n---`,
    getPromptSettings().extractionSystem
  );

  // JSON を抽出（コードブロックが含まれる場合を考慮）
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Gemini の応答から JSON を抽出できませんでした');
  return JSON.parse(jsonMatch[0]) as ExtractionDraft[];
}

export async function refineCard(
  type: string,
  currentContent: string,
  instruction: string
): Promise<string> {
  const systemPrompt = getPromptSettings().refineSystem;

  const userMessage = `【カード種別】${type}
【現在の内容】
${currentContent}

【改善指示】
${instruction}`;

  return callGemini(userMessage, systemPrompt);
}

export async function mergeContexts(caseName: string, cards: ContextCard[]): Promise<string> {
  const systemPrompt = getPromptSettings().mergeSystem;

  const cardsSummary = cards
    .map((c) => `【${CARD_TYPE_LABELS[c.type]}コンテクスト: ${c.title}】\n${c.content}`)
    .join('\n\n---\n\n');

  return callGemini(
    `案件名: ${caseName}\n\n以下のコンテクストカードを統合してください。\n\n${cardsSummary}`,
    systemPrompt
  );
}

export async function extractSpecialized(
  type: CardType,
  focusHint: string,
  inputText: string
): Promise<ExtractionDraft[]> {
  const typeLabel = CARD_TYPE_LABELS[type];
  const typeDef = TYPE_DEFINITIONS[type];

  const template = getPromptSettings().specializedSystemTemplate;
  const systemPrompt = template
    .replace(/\{typeLabel\}/g, typeLabel)
    .replace(/\{typeDef\}/g, typeDef)
    .replace(/\{type\}/g, type);

  const focusLine = focusHint.trim() ? `\n重点テーマ・絞り込み: ${focusHint.trim()}\n` : '';
  const userMessage = `以下の文書から「${typeLabel}」に関する情報を仔細・網羅的に1枚のカードにまとめてください。${focusLine}\n\n---\n${inputText}\n---`;

  const text = await callGemini(userMessage, systemPrompt);
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Gemini の応答から JSON を抽出できませんでした');
  return JSON.parse(jsonMatch[0]) as ExtractionDraft[];
}
