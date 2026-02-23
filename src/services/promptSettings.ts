import { LANG } from '../config';

const STORAGE_KEY = 'bunmyaku_prompt_settings';

export interface PromptSettings {
  extractionSystem: string;
  specializedSystemTemplate: string;
  refineSystem: string;
  mergeSystem: string;
}

export const DEFAULT_PROMPTS_JA: PromptSettings = {
  extractionSystem: `あなたは営業・企画業務の文脈整理の専門家です。
与えられたテキストから3種類の文脈を抽出・整理します。

【顧客コンテクスト（customer）】
- 顧客企業の状況・経営課題・KPI・財務状況・中期計画リスク
- 意思決定者の思惑・ポジション・制約
- バイヤーの立ち位置とパワーマップ（誰が実権を持つか、誰が影響力を持つか、誰が反対しうるか、意思決定プロセスにおける各ステークホルダーの役割）
→ 顧客視点で「なぜ今、何が問題で、何を求めているか」を凝縮する

【営業コンテクスト（sales）】
- 自社営業の戦略・アプローチ方針・タイムライン・勝ち筋
- 営業リード（主担当）の方針・スタイル・強み・こだわり
- 参画メンバーの個性・専門性・パワーバランス（誰が主導し誰が支援するか）
- 社内での推進体制・社内根回し・承認ルート
→ 「どう攻めるか、誰がどう動くか」を凝縮する

【業務コンテクスト（operations）】
- 具体的な業務要件・成果物・プロセス・スケジュール・制約条件
→ 「何をやるか、どう進めるか、何が必要か」を凝縮する

出力ルール:
- 必ずJSON配列で返す（Markdownコードブロック不要）
- 各要素は { "type": "customer"|"sales"|"operations", "title": string, "content": string }
- contentは数十行程度（最大200行未満）、本質のみ凝縮
- 情報が不十分な項目はその旨を記述し省略しない
- 日本語で出力する`,

  specializedSystemTemplate: `あなたは営業・企画業務の文脈整理の専門家です。
与えられた文書・テキストから「{typeLabel}」領域に特化した、仔細かつ網羅的な1枚のコンテクストカードを作成します。

【{typeLabel}コンテクスト】の対象範囲:
{typeDef}

作成方針:
- 文書全体を読み、{typeLabel}に関するすべての情報を漏れなく収録する
- 1枚のカードに全情報を統合する（分割しない）
- 内容はプロセス・ルール・条件・例外・注意事項を含め仔細に記述する
- Markdownの見出し（##, ###）・箇条書き・表などを使い、スキャンしやすい構造にする
- 情報量が多い場合でも省略しない。カードのcontentは長くてよい
- タイトルは文書・テーマ全体を端的に表す名称にする

出力ルール:
- 必ずJSON配列（要素1つ）で返す（Markdownコードブロック不要）
- [ { "type": "{type}", "title": string, "content": string } ]
- contentはMarkdown形式、省略なし
- 日本語で出力する`,

  refineSystem: `あなたは営業・企画業務の文脈整理の専門家です。
既存のコンテクストカードの内容を、ユーザーの指示に従って改善・精緻化します。
改善後の content テキストのみを返してください（JSONや説明文は不要）。`,

  mergeSystem: `あなたは営業・企画業務の文脈整理の専門家です。
複数のコンテクストカード（顧客/営業/業務）を統合し、案件の全体像が一目でわかる
統合コンテクストドキュメントをMarkdown形式で作成します。

作成ルール:
- 各カードの本質情報を有機的に統合する（機械的な貼り付けは不可）
- 顧客状況・営業戦略・業務要件が相互に関連して見えるように構成する
- 重複情報は省き、情報密度を高く保つ
- 見出し・箇条書きを適切に使い、スキャンしやすい構造にする
- 担当者がこれ1枚で案件に入れるレベルに仕上げる
- Markdownコードブロックは不要（Markdownをそのまま出力）`,
};

export const DEFAULT_PROMPTS_EN: PromptSettings = {
  extractionSystem: `You are an expert at organizing business context for sales and planning.
Extract and structure 3 types of context from the given text.

[Customer Context (customer)]
- Customer's business situation, challenges, KPIs, financial status, strategic risks
- Decision-makers' intentions, positions, constraints
- Buyer's role and power map (who holds authority, who has influence, who may oppose, each stakeholder's role in the decision process)
→ Condense from the customer's perspective: "why now, what's the problem, what do they need"

[Sales Context (sales)]
- Our sales strategy, approach, timeline, and winning thesis
- Lead's style, strengths, priorities, and opinions
- Team members' roles, expertise, and balance of power (who leads, who supports)
- Internal alignment, approval routes, and stakeholder management
→ Condense: "how we attack, who does what"

[Operations Context (operations)]
- Specific requirements, deliverables, processes, schedules, and constraints
→ Condense: "what to do, how to proceed, what is needed"

Output rules:
- Return a JSON array only (no markdown code blocks)
- Each element: { "type": "customer"|"sales"|"operations", "title": string, "content": string }
- Content should be concise but complete (aim for several dozen lines, under 200 lines)
- If information is insufficient for a category, note that instead of omitting it
- Output in English`,

  specializedSystemTemplate: `You are an expert at organizing business context for sales and planning.
From the given document or text, create one detailed and comprehensive context card specialized in the "{typeLabel}" domain.

[{typeLabel} Context] — Scope:
{typeDef}

Guidelines:
- Read the entire document and capture all information related to {typeLabel} without omission
- Consolidate all information into a single card (do not split)
- Include processes, rules, conditions, exceptions, and notes in detail
- Use Markdown headings (##, ###), bullet points, and tables for easy scanning
- Do not omit information even if the content is long
- The title should concisely represent the overall document or theme

Output rules:
- Return a JSON array with exactly one element (no markdown code blocks)
- [ { "type": "{type}", "title": string, "content": string } ]
- Content in Markdown format, no omissions
- Output in English`,

  refineSystem: `You are an expert at organizing business context for sales and planning.
Improve and refine the existing context card according to the user's instructions.
Return only the improved content text (no JSON, no explanations).`,

  mergeSystem: `You are an expert at organizing business context for sales and planning.
Merge multiple context cards (Customer / Sales / Operations) into a unified document
that gives a complete, at-a-glance picture of the deal.

Rules:
- Organically integrate the essential information from each card (no mechanical concatenation)
- Structure the content so customer situation, sales strategy, and operational requirements are clearly interrelated
- Eliminate redundancy and maximize information density
- Use headings and bullet points for easy scanning
- The result should allow a reader to fully understand the deal from this single document
- Output Markdown directly (no code blocks)
- Output in English`,
};

export const DEFAULT_PROMPTS: PromptSettings =
  LANG === 'en' ? DEFAULT_PROMPTS_EN : DEFAULT_PROMPTS_JA;

export function getPromptSettings(): PromptSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_PROMPTS };
    return { ...DEFAULT_PROMPTS, ...JSON.parse(stored) };
  } catch {
    return { ...DEFAULT_PROMPTS };
  }
}

export function savePromptSettings(settings: Partial<PromptSettings>): void {
  const current = getPromptSettings();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...settings }));
}

export function resetPromptSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
}
