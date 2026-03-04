// Vercel Serverless Function: /api/analyze
// Proxies player stats to Anthropic API and returns analysis text

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  try {
    const p = req.body;
    if (!p || typeof p.gameCount !== "number") {
      return res.status(400).json({ error: "Invalid request body" });
    }

    // Safe number: convert undefined/null/NaN to 0
    const n = (v) => (typeof v === "number" && !isNaN(v)) ? v : 0;
    const pct = (v) => (n(v) * 100).toFixed(1);
    const pt = (v) => n(v).toFixed(1);

    const prompt = `あなたはモルック（フィンランドの投擲スポーツ）のベテラン解説者であり、コピーライターです。
以下のスタッツからプレイヤーの個性を読み取り、その人のプレイスタイルを表現する「キャッチコピー」を書いてください。

【スタッツ】
試合数: ${p.gameCount}
勝率: ${pct(p.winRate)}%
ミス率: ${pct(p.missRate)}%
上がり決定率: ${pct(p.finishRate)}%（38点以上から50点丁度を1投で決めた割合）
投擲平均点: ${pt(p.avgPts)}pt
ブレイク平均: ${pt(p.breakAvg)}pt（先攻の初投平均）
お邪魔成功率: ${pct(p.ojamaRate)}%（相手が上がれる場面で妨害に成功した割合）
2ミス後リカバリ平均: ${pt(p.recAvg)}pt（連続ミス後に取り返す平均点）
先攻勝率: ${p.firstWinRate != null ? pct(p.firstWinRate) + "%" : "データなし"}
後攻勝率: ${p.lastWinRate != null ? pct(p.lastWinRate) + "%" : "データなし"}

【出力ルール — 厳守】
1. 3〜4行の流れる文章で書く。一つの文が行を跨いでも構わない
2. 合計文字数は50〜85文字にする（句読点含む）
3. 数値をそのまま書かない。割合や回数に言い換える。ただし数を表すときは漢数字ではなく算用数字（アラビア数字）を使う。例：×「八割」→○「8割」、×「三回に一回」→○「3回に1回」。ことわざや慣用句の中の漢数字はそのまま残す。例：○「一石二鳥」「二面性」「一歩」
4. 比喩・擬人化・ユーモア・意外な例えを積極的に使う
5. 「○○タイプ」「○○型」のような単純な分類で終わらせず、そのプレイヤーにしかない物語を感じさせる表現にする
6. 弱点にも触れて良いが、必ず前向きに言い換えるか愛嬌のある表現にする
7. 公序良俗に反する表現・政治宗教差別的表現は禁止
8. 絵文字は使わない
9. 前置きや説明は不要。キャッチコピー本文のみ出力する

【良い例（参考にするが真似しないこと）】
普段こそ鳴りを潜めているが、ここぞの覚醒モードはまさに敵無し無双状態！その名に相応しい圧倒的なミラクルショットで場を沸かすエンターテイナー。

一投目の破壊力は場の空気を一変させる。先手を取れば向かうところ敵なし、後攻では少し寂しいのはご愛嬌。開幕の雷鳴で相手の心をへし折る、先制パンチの申し子。`;

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 250,
        messages: [{ role: "user", content: prompt }]
      })
    });

    /* Safely parse response – Anthropic may return non-JSON on 5xx */
    const rawBody = await apiRes.text();
    let data;
    try { data = JSON.parse(rawBody); }
    catch (_) { return res.status(502).json({ error: "Anthropic returned non-JSON (HTTP " + apiRes.status + "): " + rawBody.slice(0, 200) }); }

    if (!apiRes.ok || data.error) {
      const msg = data.error?.message || data.error?.type || "Anthropic API error (HTTP " + apiRes.status + ")";
      return res.status(502).json({ error: msg });
    }

    const text = (data.content || [])
      .filter(c => c.type === "text")
      .map(c => c.text)
      .join("")
      .trim();

    if (!text) return res.status(502).json({ error: "Anthropic returned empty content" });

    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: "[Server] " + (e.message || "Internal server error") });
  }
}
