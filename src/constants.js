// ═══ Game Rules ═══
export const MAX_TEAMS=4,MAX_PL=4,MAX_SHUF=16,MAX_NAME=7,WIN=50,RST=25,PEN=37,MF=3;

// ═══ Team Colors ═══
export const C=[
{bg:"#14365a",lt:"#e6f0fb",ac:"#2b7de9",tx:"#14365a",nm:"#c8dfff"},
{bg:"#6b1d30",lt:"#fbe6ec",ac:"#d93a5e",tx:"#6b1d30",nm:"#ffc8d6"},
{bg:"#1a5c3a",lt:"#e6faf0",ac:"#22b566",tx:"#1a5c3a",nm:"#b8ffd8"},
{bg:"#6b5a1d",lt:"#fbf5e6",ac:"#d9a83a",tx:"#6b5a1d",nm:"#ffe8a0"},
];
export const PC=["#2b7de9","#d93a5e","#22b566","#d9a83a","#9b59b6","#e67e22","#1abc9c","#e74c3c"];

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
