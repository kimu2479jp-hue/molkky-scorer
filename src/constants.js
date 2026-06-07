// API呼び出しのベースURL
// Vercelデプロイ時: 未設定（空文字 → 相対パス /api/...）
// Pi HTTP配信時: VITE_API_BASE=https://molkky-scorer.vercel.app でビルド
export const API_BASE = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) || "";

// ═══ Game Rules ═══
export const MAX_TEAMS=4,MAX_PL=4,MAX_SHUF=16,MAX_NAME=7,WIN=50,RST=25,PEN=37,MF=3;

// ═══ Team Colors ═══
export const C=[
{bg:"#14365a",lt:"#e6f0fb",ac:"#2b7de9",tx:"#14365a",nm:"#c8dfff"},
{bg:"#6b1d30",lt:"#fbe6ec",ac:"#d93a5e",tx:"#6b1d30",nm:"#ffc8d6"},
{bg:"#1a5c3a",lt:"#e6faf0",ac:"#22b566",tx:"#1a5c3a",nm:"#b8ffd8"},
{bg:"#6b5a1d",lt:"#fbf5e6",ac:"#d9a83a",tx:"#6b5a1d",nm:"#ffe8a0"},
];
export const PC=["#c8553d","#b08847","#7a8450","#a86e3e","#2b3a78","#1e5968","#4a1f68","#6b4b3e"];

// ═══ UI Constants ═══
export const H1=30;
export const BLINK_ID="mk-blink-style";
export const MASCOT_S="/molkky_mascot_transparent.png";
export const MASCOT_R="/molkky_mascot_transparent.png";

// ═══ LocalStorage / IDB Keys ═══
export const LS_KEY="mk-fav";
export const LS_FAV_BK="mk-fav-bk";
export const MAX_FAV=99;
export const STATS_KEY="mk-player-stats";
export const PROGRESS_KEY="mk-game-progress";
export const SYNC_CODE_KEY="mk-sync-code";
export const PIN_LOCKOUT_KEY="mk-pin-lockout";
export const PIN_AUTH_TS_KEY="mk-pin-auth-ts";
export const AI_ENABLED_KEY="mk-ai-enabled";
export const ANALYSIS_TOTAL_KEY="mk-analysis-total";
export const ANALYSIS_LIMIT_KEY="mk-analysis-daily";
export const ANALYSIS_DAILY_MAX=20;
export const ANALYSIS_CACHE_DAYS=32;
export const REPLAY_KEY="mk-game-replays";
export const IDB_NAME="mk-molkky-db";
export const IDB_VER=2;
export const MAX_GAMES=100000;
export const MAX_REPLAYS=100000;
export const MAX_SYNC_CODES=1;
export const SHUF_ANIM_KEY="mk-shuffle-anim";

// ═══ Player Level Storage ═══
export const LS_LEVEL_KEY="mk-player-levels";

// ═══ Level Estimation Constants ═══
export const LEVEL_NAMES=["","初心者","エンジョイ勢","中級者","上級者","日本代表レベル"];

export const LEVEL_WEIGHTS={
hitRate:0.20,avgScore:0.20,finishRate:0.15,scoreStdDev:0.10,
winRate:0.10,burstRate:0.10,finishEfficiency:0.10,afterDoubleMiss:0.05,
};

export const LEVEL_BENCHMARKS={
hitRate:[54,70,72,83,92],
avgScore:[3.1,4.5,5.2,6.5,8.0],
finishRate:[0,33,41,60,80],
winRate:[15,35,45,60,75],
burstRate:[40,25,15,8,3],
finishEfficiency:[8.0,5.5,4.0,2.5,1.5],
afterDoubleMiss:[2.5,3.0,5.0,6.5,8.0],
scoreStdDev:[4.5,3.8,3.2,2.5,1.8],
};

export const LEVEL_INVERTED={
hitRate:false,avgScore:false,finishRate:false,winRate:false,
burstRate:true,finishEfficiency:true,afterDoubleMiss:false,scoreStdDev:true,
};

export const SECOND_TURN_BONUS={low:1.3,high:1.5};
export const DEFAULT_PERIOD_MS=6*30*24*60*60*1000;
export const MIN_GAMES_FOR_LEVEL=10;

export const PERIOD_OPTIONS=[
{label:"3ヶ月",value:3*30*24*60*60*1000},
{label:"6ヶ月",value:6*30*24*60*60*1000},
{label:"1年",value:365*24*60*60*1000},
{label:"3年",value:3*365*24*60*60*1000},
{label:"全期間",value:null},
];

export const CONFIDENCE_LEVELS={
NONE:{min:0,max:9,label:"データ蓄積中"},
PROVISIONAL:{min:10,max:29,label:"暫定"},
NORMAL:{min:30,max:99,label:""},
HIGH:{min:100,max:Infinity,label:"高精度"},
};

// ═══ Field Type ═══
export const FIELD_TYPES = [
  { value: "grass", label: "芝" },
  { value: "dirt", label: "土" },
  { value: "sand", label: "砂" },
  { value: "turf", label: "人工芝" },
  { value: "other", label: "その他" },
];
export const FIELD_TYPE_KEY = "mk-field-type";

// Field type labels for location profiles (matches Supabase CHECK constraint)
export const LOCATION_FIELD_TYPES = [
  { value: "grass", label: "芝" },
  { value: "dirt", label: "土" },
  { value: "sand", label: "砂" },
  { value: "artificial_grass", label: "人工芝" },
  { value: "other", label: "その他" },
];

// Badge colors for field type display
export const FIELD_TYPE_BADGE_COLORS = {
  grass: "#22b566",
  dirt: "#8B6914",
  sand: "#C4A35A",
  artificial_grass: "#7CB342",
  other: "#6b7280",
};

// ═══ Venue Type (for location profiles) ═══
export const VENUE_TYPES = [
  { value: "outdoor", label: "屋根なし" },
  { value: "covered", label: "屋根あり" },
  { value: "indoor", label: "屋内" },
];
export const VENUE_TYPE_BADGE_COLORS = {
  outdoor: "#3498db",
  covered: "#e67e22",
  indoor: "#9b59b6",
};

// ═══ Roof Type ═══
export const ROOF_TYPES = [
  { value: "none", label: "なし" },
  { value: "roof", label: "屋根あり" },
  { value: "indoor", label: "屋内" },
];
export const ROOF_TYPE_KEY = "mk-roof-type";

// ═══ Weather Code Map (WMO) ═══
export const WEATHER_MAP = {
  0: { icon: "☀️", label: "快晴" },
  1: { icon: "🌤", label: "晴れ" },
  2: { icon: "⛅", label: "曇りがち" },
  3: { icon: "☁️", label: "曇り" },
  45: { icon: "🌫", label: "霧" },
  48: { icon: "🌫", label: "着氷霧" },
  51: { icon: "🌦", label: "小雨" },
  53: { icon: "🌧", label: "雨" },
  55: { icon: "🌧", label: "強い雨" },
  56: { icon: "🌧", label: "着氷小雨" },
  57: { icon: "🌧", label: "着氷雨" },
  61: { icon: "🌧", label: "小雨" },
  63: { icon: "🌧", label: "雨" },
  65: { icon: "🌧", label: "大雨" },
  66: { icon: "🌧", label: "着氷小雨" },
  67: { icon: "🌧", label: "着氷大雨" },
  71: { icon: "🌨", label: "小雪" },
  73: { icon: "🌨", label: "雪" },
  75: { icon: "🌨", label: "大雪" },
  77: { icon: "🌨", label: "霧雪" },
  80: { icon: "🌦", label: "にわか雨" },
  81: { icon: "🌧", label: "にわか雨" },
  82: { icon: "🌧", label: "激しいにわか雨" },
  85: { icon: "🌨", label: "にわか雪" },
  86: { icon: "🌨", label: "激しいにわか雪" },
  95: { icon: "⛈", label: "雷雨" },
  96: { icon: "⛈", label: "雹を伴う雷雨" },
  99: { icon: "⛈", label: "激しい雹雷雨" },
};

export function getWeatherInfo(code) {
  return WEATHER_MAP[code] || { icon: "❓", label: "不明" };
}

// ═══ Wind Sensor ═══
export function getWindDirectionLabel(degrees) {
  if (degrees == null || isNaN(degrees)) return '';
  const normalized = ((degrees % 360) + 360) % 360;
  const directions = ['北', '北東', '東', '南東', '南', '南西', '西', '北西'];
  const index = Math.round(normalized / 45) % 8;
  return directions[index];
}

export const WIND_SPEED_CAP = 15;
export const WIND_BUFFER_SIZE = 60;
export const WIND_WS_PORT = 8765;
export const WIND_RECONNECT_MS = 5000;
export const WIND_SENSOR_KEY = "mk-wind-sensor";
export const WIND_SENSOR_ENABLED_KEY = "mk-wind-sensor-enabled";

export const WIND_CATEGORIES = [
  { key: "tailwind", min: 337.5, max: 22.5, label: "追い風" },
  { key: "tail_right", min: 22.5, max: 67.5, label: "右後方" },
  { key: "right_cross", min: 67.5, max: 112.5, label: "右横風" },
  { key: "head_right", min: 112.5, max: 157.5, label: "右前方" },
  { key: "headwind", min: 157.5, max: 202.5, label: "向かい風" },
  { key: "head_left", min: 202.5, max: 247.5, label: "左前方" },
  { key: "left_cross", min: 247.5, max: 292.5, label: "左横風" },
  { key: "tail_left", min: 292.5, max: 337.5, label: "左後方" },
];

export const WIND_CATEGORY_LABELS = {
  tailwind: "追い風", tail_right: "右後方", right_cross: "右横風", head_right: "右前方",
  headwind: "向かい風", head_left: "左前方", left_cross: "左横風", tail_left: "左後方",
};

export const WIND_CATEGORY_COLORS = {
  tailwind: "#22c55e", tail_right: "#7dd3fc", right_cross: "#38bdf8", head_right: "#fb923c",
  headwind: "#ef4444", head_left: "#f97316", left_cross: "#38bdf8", tail_left: "#7dd3fc",
  unknown: "#9ca3af",
};

// 横方向成分の3区分ラベル（vertical = 追い風+向かい風 で横成分ゼロ）
export const WIND_LATERAL_LABELS = {
  vertical: "追/向", diagonal: "斜め", cross: "横",
};

// 向き名の3区分ラベル
export const WIND_NAMED_LABELS = {
  tail: "追い風", head: "向かい風", side: "横風",
};

export const ABSOLUTE_DIRECTION_LABELS = {
  N: "北", NE: "北東", E: "東", SE: "南東",
  S: "南", SW: "南西", W: "西", NW: "北西",
};

// ═══ Dev ═══
export const DEV_MASTER_LIST=["キムラ"];

// ═══ Shared Styles ═══
export const SS={
gW:{height:"100dvh",display:"flex",flexDirection:"column",background:"#eef1f5",overflow:"hidden",overscrollBehavior:"none"},
tBtn:{padding:"6px 12px",border:"1px solid rgba(255,255,255,0.2)",borderRadius:6,background:"transparent",color:"var(--text-inverse)",fontSize:14,fontWeight:600,cursor:"pointer"},
ov:{position:"fixed",inset:0,background:"var(--bg-overlay)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:12},
mod:{background:"var(--bg-surface)",borderRadius:18,padding:20,width:"100%",maxWidth:600,maxHeight:"90vh",overflow:"auto",WebkitOverflowScrolling:"touch"},
clsB:{width:38,height:38,border:"none",borderRadius:8,background:"#f0f0f0",fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
};
