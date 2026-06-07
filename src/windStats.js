// ═══ Wind Miss Stats ═══
// 風速計（Calypso）が1投ごとに記録した風データと試合の投擲履歴を突き合わせ、
// 「どの風のときにミスが増えるか」を選手別に集計する純関数群。
// 副作用なし・データ変換のみ。読み込み（loadReplays / loadWindData）は呼び出し側の責務。
// PR2b で StatsModal から buildWindMissStats を呼び、棒グラフ表示する予定。

// ═══ 区分関数（単一値 → 区分キー。不正入力は null）═══

/**
 * 風速（m/s）を速度帯キーに変換する。
 * 閾値 2.0 / 4.0 / 6.0 は windSensor.js の getWindRampColor と一致させる
 * （境界値ちょうどは上位カテゴリに属する = 「< 未満」方式）。
 * @param {number} windSpeed
 * @returns {"0-2"|"2-4"|"4-6"|"6+"|null} 数値でない場合は null
 */
export function speedBand(windSpeed) {
  if (typeof windSpeed !== "number" || !isFinite(windSpeed)) return null;
  if (windSpeed < 2.0) return "0-2";
  if (windSpeed < 4.0) return "2-4";
  if (windSpeed < 6.0) return "4-6";
  return "6+";
}

/**
 * 8方位キーを「横方向成分の強さ」3区分に変換する（本命指標）。
 * vertical=縦（横成分ゼロ）, diagonal=斜め（横成分中）, cross=横（横成分最大）。
 * 8方位キー以外（"unknown" や null 等）は null を返す。
 * @param {string} windCategory
 * @returns {"vertical"|"diagonal"|"cross"|null}
 */
export function lateralGroup(windCategory) {
  switch (windCategory) {
    case "tailwind":
    case "headwind":
      return "vertical";
    case "tail_right":
    case "tail_left":
    case "head_right":
    case "head_left":
      return "diagonal";
    case "right_cross":
    case "left_cross":
      return "cross";
    default:
      return null;
  }
}

/**
 * 8方位キーを「向きの名前」3区分に変換する（補助指標）。
 * tail=追い風, head=向かい風, side=横風。8方位キー以外は null を返す。
 * @param {string} windCategory
 * @returns {"tail"|"head"|"side"|null}
 */
export function namedGroup(windCategory) {
  switch (windCategory) {
    case "tailwind":
    case "tail_right":
    case "tail_left":
      return "tail";
    case "headwind":
    case "head_right":
    case "head_left":
      return "head";
    case "right_cross":
    case "left_cross":
      return "side";
    default:
      return null;
  }
}

// ═══ 補助関数（カウント {miss,score,fault} → 指標）═══

/**
 * カウントからミス率を返す。分母は miss+score（フォルトは分母に含めない）。
 * @param {{miss:number,score:number,fault:number}} bucket
 * @returns {number|null} 0〜1 の数値。分母 0 のときは null
 */
export function missRate(bucket) {
  const denom = bucket.miss + bucket.score;
  if (denom === 0) return null;
  return bucket.miss / denom;
}

/**
 * カウントからサンプル数（ミス率の分母）を返す。miss+score（フォルトは含めない）。
 * @param {{miss:number,score:number,fault:number}} bucket
 * @returns {number}
 */
export function sampleN(bucket) {
  return bucket.miss + bucket.score;
}

// ═══ メイン集計 ═══

// byOctant のキー（出力構造の順序もこれに合わせる）
const OCTANT_KEYS = [
  "tailwind", "tail_right", "right_cross", "head_right",
  "headwind", "head_left", "left_cross", "tail_left",
];
// 8方位キー判定用（in 演算子はプロトタイプ連鎖も見るため Set で own 判定する）
const OCTANT_SET = new Set(OCTANT_KEYS);

/** カウント {miss,score,fault} を新規生成（参照共有を避けるため毎回呼ぶ） */
function makeCount() {
  return { miss: 0, score: 0, fault: 0 };
}

/** 選手1人分の初期集計ツリーを新規生成（全バケット初期化済み） */
function makePlayerResult() {
  const byOctant = {};
  OCTANT_KEYS.forEach(k => { byOctant[k] = makeCount(); });
  return {
    throwLevel: {
      byLateral: { vertical: makeCount(), diagonal: makeCount(), cross: makeCount() },
      bySpeed: { "0-2": makeCount(), "2-4": makeCount(), "4-6": makeCount(), "6+": makeCount() },
      byNamed: { tail: makeCount(), head: makeCount(), side: makeCount() },
      byLateralSpeed: {
        vertical: { "0-2": makeCount(), "2-4": makeCount(), "4-6": makeCount(), "6+": makeCount() },
        diagonal: { "0-2": makeCount(), "2-4": makeCount(), "4-6": makeCount(), "6+": makeCount() },
        cross: { "0-2": makeCount(), "2-4": makeCount(), "4-6": makeCount(), "6+": makeCount() },
      },
      byOctant,
      gamesUsed: 0,
      totalThrows: 0,
    },
    matchLevel: {
      byLateral: { vertical: makeCount(), diagonal: makeCount(), cross: makeCount() },
      bySpeed: { "0-2": makeCount(), "2-4": makeCount(), "4-6": makeCount(), "6+": makeCount() },
      byNamed: { tail: makeCount(), head: makeCount(), side: makeCount() },
      gamesUsed: 0,
    },
  };
}

/** type が miss/score/fault のいずれかなら bucket の該当 type を +1（想定外 type は無視） */
function addType(bucket, type) {
  if (type === "miss" || type === "score" || type === "fault") {
    bucket[type] += 1;
  }
}

/** カウント src を dst へ加算（miss/score/fault それぞれ） */
function addCount(dst, src) {
  dst.miss += src.miss;
  dst.score += src.score;
  dst.fault += src.fault;
}

/** 投擲ペア (w,h) を 1 件、投擲レベル集計へ反映する。集計した選手を gamePlayers に記録 */
function aggregateThrow(result, nameSet, gamePlayers, w, h) {
  const nm = h.playerName;
  if (!nameSet.has(nm)) return;
  const t = h.type;
  const tl = result[nm].throwLevel;

  tl.totalThrows += 1;   // type に関わらず全投擲をカウント
  gamePlayers.add(nm);

  // 速度系: windSpeed が数値のときのみ
  const sb = speedBand(w.windSpeed);
  if (sb) addType(tl.bySpeed[sb], t);

  // 方向系: windCategory が有効な区分のときのみ（速度系とは独立に判定）
  const lg = lateralGroup(w.windCategory);
  if (lg) addType(tl.byLateral[lg], t);

  // クロス集計（横方向成分 × 速度帯）: sb と lg が両方有効なときのみ。
  // 後続UI PRの折れ線3本と点タップ詳細の唯一のデータ源。
  if (sb && lg) addType(tl.byLateralSpeed[lg][sb], t);

  const ng = namedGroup(w.windCategory);
  if (ng) addType(tl.byNamed[ng], t);

  if (OCTANT_SET.has(w.windCategory)) addType(tl.byOctant[w.windCategory], t);
}

/**
 * 試合群の履歴と風データを突き合わせ、選手別の「風 × ミス」集計を返す純関数。
 * 投擲レベル（1投ごとの風で集計）を優先し、突き合わせ不能な古い試合のみ
 * 試合レベル（試合全体のサマリー風で集計）で救済する。両レベルで二重計上しない。
 *
 * @param {object} params
 * @param {string[]} params.gameKeys 集計対象の gameId（ISO日時文字列）の配列
 * @param {Object<string, {history: Array}>} params.replays loadReplays() と同形
 * @param {Object<string, {turnWindData: Array, windSummary: object}|null>} params.windDataByKey
 *        該当データが無い試合は値が null または該当キー欠落
 * @param {string[]} params.playerNames 集計対象の選手名の配列
 * @returns {Object<string, object>} 選手名をキーにした集計（全バケット初期化済み）
 */
export function buildWindMissStats({ gameKeys, replays, windDataByKey, playerNames }) {
  const names = Array.isArray(playerNames) ? playerNames : [];
  const keys = Array.isArray(gameKeys) ? gameKeys : [];
  const nameSet = new Set(names);

  const result = {};
  names.forEach(nm => { result[nm] = makePlayerResult(); });

  keys.forEach(gameId => {
    const replay = replays && replays[gameId];
    if (!replay || !replay.history) return;   // 履歴が無いと miss/score 判定不可
    const history = replay.history;

    const wd = windDataByKey && windDataByKey[gameId];
    const twd = wd && wd.turnWindData;
    const summary = wd && wd.windSummary;

    // ─── 投擲レベルの突き合わせ可否を判定 ───
    // 注意: 空配列の .every() は true を返すため、必ず length>0 を先にガードする。
    let usedInThrowLevel = false;
    if (twd && twd.length > 0) {
      const gamePlayers = new Set();   // この試合で1投以上集計した選手
      if (twd.every(w => w && typeof w.histIdx === "number")) {
        // 【新パス】各 w の histIdx で history を引く
        usedInThrowLevel = true;
        twd.forEach(w => {
          if (!w || typeof w.histIdx !== "number") return;
          const h = history[w.histIdx];
          if (!h) return;
          aggregateThrow(result, nameSet, gamePlayers, w, h);
        });
      } else if (twd.length === history.length) {
        // 【旧パス】index 対応
        usedInThrowLevel = true;
        for (let i = 0; i < twd.length; i++) {
          const w = twd[i];
          const h = history[i];
          if (!w || !h) continue;
          aggregateThrow(result, nameSet, gamePlayers, w, h);
        }
      }
      gamePlayers.forEach(nm => { result[nm].throwLevel.gamesUsed += 1; });
    }

    // ─── 試合レベルの集計（投擲レベルで使えなかった試合のみ救済）───
    if (!usedInThrowLevel && summary && history.length > 0) {
      const sb = speedBand(summary.avgWindSpeed);
      const lg = lateralGroup(summary.dominantCategory);
      const ng = namedGroup(summary.dominantCategory);

      // 選手ごとに {miss,score,fault} を type 別カウント
      const perPlayer = {};
      history.forEach(h => {
        const nm = h && h.playerName;
        if (!nameSet.has(nm)) return;
        if (!perPlayer[nm]) perPlayer[nm] = makeCount();
        addType(perPlayer[nm], h.type);
      });

      Object.keys(perPlayer).forEach(nm => {
        const c = perPlayer[nm];
        const ml = result[nm].matchLevel;
        if (sb) addCount(ml.bySpeed[sb], c);
        if (lg) addCount(ml.byLateral[lg], c);
        if (ng) addCount(ml.byNamed[ng], c);
        ml.gamesUsed += 1;   // 1投以上あった各選手について試合あたり1回
      });
    }
  });

  return result;
}
