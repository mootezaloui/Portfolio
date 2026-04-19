export type MascotAction =
  | "idle"
  | "walk"
  | "type"
  | "think"
  | "debug"
  | "deploy"
  | "coffee"
  | "standup"
  | "talk";

export const SPRITE_LOGICAL_WIDTH = 16;
export const SPRITE_LOGICAL_HEIGHT = 24;
export const SPRITE_SCALE = 2;
export const SPRITE_PIXEL_WIDTH = SPRITE_LOGICAL_WIDTH * SPRITE_SCALE;
export const SPRITE_PIXEL_HEIGHT = SPRITE_LOGICAL_HEIGHT * SPRITE_SCALE;

const C = {
  K: "#0a0a0d",   // Black outlining
  SK1: "#ffdfc4", // Skin base (fair)
  SK2: "#e0ad8d", // Skin shadow
  HR1: "#2d2424", // Hair base (dark brown)
  HR2: "#1a1515", // Hair details/shadows
  HR3: "#4a3b3b", // Hair highlights
  CL1: "#1d232e", // Hoodie base (dark navy)
  CL2: "#13171f", // Hoodie shadow
  CL3: "#2c3545", // Hoodie highlight/pocket
  AC1: "#00FF88", // Neon green strings/accents
  PN1: "#2c3a57", // Jeans
  PN2: "#1a2336", // Jeans shadow
  SH1: "#e0e6ed", // Sneakers
  W: "#ffffff",   // White
  E: "#00FF88",   // Green UI
  R: "#ff3366",   // Red UI / Blush
  CU: "#8b949e",  // Screen Bezels
  SHD: "#000000"  // Floor shadow
} as const;

type Px = (x: number, y: number, color: string) => void;
type Rect = (x: number, y: number, w: number, h: number, color: string) => void;

function makePx(ctx: CanvasRenderingContext2D): Px {
  return (x, y, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * SPRITE_SCALE, y * SPRITE_SCALE, SPRITE_SCALE, SPRITE_SCALE);
  };
}

function makeRect(ctx: CanvasRenderingContext2D): Rect {
  return (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * SPRITE_SCALE, y * SPRITE_SCALE, w * SPRITE_SCALE, h * SPRITE_SCALE);
  };
}

function drawFloorShadow(ctx: CanvasRenderingContext2D, rect: Rect) {
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = 0.3;
  rect(4, 23, 8, 1, C.SHD);
  ctx.globalAlpha = 0.15;
  rect(3, 23, 1, 1, C.SHD);
  rect(12, 23, 1, 1, C.SHD);
  ctx.globalAlpha = prev;
}

function drawChibiBody(px: Px, rect: Rect) {
  // Neck
  rect(7, 13, 2, 1, C.SK2);
  
  // Torso / Hoodie
  rect(4, 14, 8, 5, C.CL1);
  rect(5, 14, 6, 1, C.CL3); // Shoulder highlight
  rect(4, 19, 8, 1, C.CL2); // Hem shadow
  
  // < > Logo on chest
  // "<"
  px(6, 15, C.E); px(5, 16, C.E); px(6, 17, C.E);
  // ">"
  px(9, 15, C.E); px(10, 16, C.E); px(9, 17, C.E);
  
  // Front pocket
  rect(5, 18, 6, 1, C.CL3); // Pocket top
}

function drawChibiArms(px: Px, rect: Rect, state: MascotAction, f: number) {
  if (state === "type") {
    // Arms typing on table
    rect(2, 14, 2, 2, C.CL1); // Left Shoulder
    rect(2, 16, 4, 2, C.SK1); // Left Forearm
    rect(12, 14, 2, 2, C.CL1); // Right Shoulder
    rect(10, 16, 4, 2, C.SK1); // Right Forearm
  } else if (state === "walk") {
    // Swinging arms
    const swing = f % 4 < 2 ? 1 : -1;
    rect(3, 14 - swing, 2, 4, C.CL1); px(3, 18 - swing, C.SK1); px(4, 18 - swing, C.SK1); // Right 
    rect(11, 14 + swing, 2, 4, C.CL1); px(11, 18 + swing, C.SK1); px(12, 18 + swing, C.SK1); // Left
  } else if (state === "deploy" || state === "standup") {
    // Arms Raised!
    rect(2, 10, 2, 4, C.CL1); px(2, 9, C.SK1); px(3, 9, C.SK1); // Left
    rect(12, 10, 2, 4, C.CL1); px(12, 9, C.SK1); px(13, 9, C.SK1); // Right
  } else if (state === "coffee") {
    // Holding coffee right arm
    rect(11, 14, 2, 2, C.CL1); // Shoulder
    rect(10, 15, 3, 2, C.SK1); // Reaching for cup
    // Idle left arm
    rect(3, 14, 2, 4, C.CL1); px(3, 18, C.SK1); px(4, 18, C.SK1);
  } else {
    // Idle
    rect(3, 14, 2, 4, C.CL1); px(3, 18, C.SK1); px(4, 18, C.SK1);
    rect(11, 14, 2, 4, C.CL1); px(11, 18, C.SK1); px(12, 18, C.SK1);
  }
}

function drawChibiLegs(px: Px, rect: Rect, state: MascotAction, f: number) {
  if (state === "type") {
    // Sitting legs
    rect(5, 20, 6, 2, C.PN1);
  } else if (state === "walk") {
    const isLeft = f % 4 < 2;
    if (isLeft) {
      rect(5, 20, 2, 3, C.PN1); // L leg down
      rect(5, 23, 3, 1, C.SH1); 
      rect(9, 19, 2, 2, C.PN2); // R leg up
      rect(9, 21, 3, 1, C.SH1); 
    } else {
      rect(5, 19, 2, 2, C.PN2); // L leg up
      rect(5, 21, 3, 1, C.SH1);
      rect(9, 20, 2, 3, C.PN1); // R leg down
      rect(9, 23, 3, 1, C.SH1);
    }
  } else {
    // Standing Idle
    rect(5, 20, 2, 3, C.PN1); 
    rect(5, 23, 3, 1, C.SH1);
    rect(9, 20, 2, 3, C.PN1); 
    rect(9, 23, 3, 1, C.SH1);
  }
}

function drawChibiHead(px: Px, rect: Rect, state: MascotAction, blink: boolean, f: number) {
  // Face Base
  rect(3, 6, 10, 7, C.SK1);
  rect(3, 12, 10, 1, C.SK2); // Chin shadow
  rect(4, 11, 1, 1, C.R); // Blush
  rect(11, 11, 1, 1, C.R);
  
  // Big Volume Hair
  rect(4, 3, 8, 2, C.HR1); // Top
  rect(3, 4, 10, 2, C.HR1); // Upper sides
  rect(5, 3, 4, 1, C.HR3); // Hair highlight
  
  // Side/Back Hair
  rect(2, 5, 2, 5, C.HR2);
  rect(12, 5, 2, 5, C.HR2);
  
  // Bangs
  rect(3, 6, 2, 2, C.HR1);
  rect(11, 6, 2, 2, C.HR1);
  rect(7, 6, 2, 1, C.HR1); // Messy bang middle
  
  // Developer Headset
  rect(1, 6, 2, 4, C.CL1); // L earcup
  rect(13, 6, 2, 4, C.CL1); // R earcup
  rect(3, 4, 10, 1, C.K); // Headband over hair
  rect(2, 10, 3, 1, C.K); // Mic arm
  px(5, 10, C.E); // Glowing mic tip
  
  // Eyes
  const isHappy = state === "deploy" || state === "standup";
  if (blink || isHappy) {
    // Closed / Happy ^^
    rect(4, 9, 2, 1, C.HR2); px(4, 10, C.HR2);
    rect(10, 9, 2, 1, C.HR2); px(11, 10, C.HR2);
  } else if (state === "debug") {
    // Angry ><
    px(4, 8, C.HR2); px(5, 9, C.HR2);
    px(10, 9, C.HR2); px(11, 8, C.HR2);
  } else if (state === "type" || state === "think") {
    // Focused reading (narrow eyes)
    rect(4, 8, 2, 2, C.HR2); px(5, 8, C.W);
    rect(10, 8, 2, 2, C.HR2); px(11, 8, C.W);
  } else {
    // Big Cute Eyes
    rect(4, 8, 2, 3, C.HR2); px(5, 8, C.W);
    rect(10, 8, 2, 3, C.HR2); px(11, 8, C.W);
  }
  
  // Mouth
  if (state === "talk") {
    const talk = f % 4 < 2;
    if (talk) {
      rect(7, 11, 2, 2, C.HR2);
      rect(7, 12, 2, 1, C.R); // Tongue
    } else {
      rect(7, 11, 2, 1, C.HR2); // Open
    }
  } else if (state === "standup" || state === "deploy") {
    px(6, 11, C.HR2); rect(7, 12, 2, 1, C.HR2); px(9, 11, C.HR2); // Smile
  } else if (state === "coffee") {
    rect(7, 11, 2, 1, C.HR2); // Sip O
  } else if (state === "think") {
    px(7, 11, C.HR2); px(8, 11, C.HR2); // Hmm line
  } else {
    rect(7, 12, 2, 1, C.HR2); // Calm smile
  }
  
  // Thinking Bubble Above Head (The Emote!)
  if (state === "think") {
    const tbY = f % 8 > 3 ? 1 : 0; // Gentle float
    
    // Cloud bubble body
    rect(8, 0 + tbY, 7, 5, C.K);    
    rect(9, 1 + tbY, 5, 3, C.W);   
    
    // Bubble Tail loops connecting to head
    px(8, 4 + tbY, C.W); 
    px(7, 5 + tbY, C.W); 
    
    // Animated Ellipsis
    const t = f % 4;
    if (t > 0) px(10, 2 + tbY, C.K);
    if (t > 1) px(11, 2 + tbY, C.K);
    if (t > 2) px(12, 2 + tbY, C.K);
  }
  
  // Debug Alert Above Head
  if (state === "debug") {
    const altY = f % 4 > 1 ? 1 : 0;
    rect(6, 0 + altY, 4, 3, C.R);
    rect(7, 1 + altY, 2, 1, C.W); // ! mark
    rect(7, 3 + altY, 2, 1, C.R); 
    px(7, 4 + altY, C.W); px(8, 4 + altY, C.W); // dot
  }
}

function drawChibiProps(px: Px, rect: Rect, state: MascotAction, f: number) {
  if (state === "type") {
    // Laptop Setup
    rect(3, 17, 10, 4, C.CL2); // Base unit
    rect(4, 15, 8, 4, C.CU); // Screen frame
    rect(5, 16, 6, 2, C.CL1); // Dark screen
    // Green code flow
    const code = f % 4;
    px(5, 16 + code%2, C.E); px(7, 17 - code%2, C.E); px(9, 16 + code%2, C.E);
  } else if (state === "coffee") {
    // Coffee Cup
    rect(10, 11, 3, 3, C.W);
    rect(10, 12, 3, 1, C.SK2); // Grip sleeve
    
    // Steam
    const step = Math.floor(f / 2) % 4;
    if (step === 0) px(11, 9, C.W);
    if (step === 1) px(11, 8, C.W);
    if (step === 2) px(12, 7, C.W);
  } else if (state === "debug") {
    // Red bug on floor
    const by = 20 + (f % 4 > 1 ? 1 : 0);
    rect(12, by, 2, 2, C.R);
    px(11, by, C.K); px(14, by+1, C.K); px(13, by-1, C.K); // Bug legs
  }
}

export interface DrawOptions {
  action: MascotAction;
  frame: number;
  direction: 1 | -1;
  blink: boolean;
}

export function drawMascot(ctx: CanvasRenderingContext2D, opts: DrawOptions) {
  const { action, frame, direction, blink } = opts;
  const px = makePx(ctx);
  const rect = makeRect(ctx);

  ctx.clearRect(0, 0, SPRITE_PIXEL_WIDTH, SPRITE_PIXEL_HEIGHT);

  const flip = direction < 0;
  if (flip) {
    ctx.save();
    ctx.translate(SPRITE_PIXEL_WIDTH, 0);
    ctx.scale(-1, 1);
  }

  const f = Math.floor(frame);
  
  // Deliberate movement! No parasite wobbles in idle or think.
  let bobY = 0;
  if (action === "walk") {
    // Walking bounce is intended physical movement
    bobY = f % 2 === 0 ? -1 : 0;
  }

  if (bobY !== 0) ctx.translate(0, bobY * SPRITE_SCALE);

  // 1. Draw floor shadow (does not bob)
  if (bobY !== 0) ctx.translate(0, -bobY * SPRITE_SCALE);
  drawFloorShadow(ctx, rect);
  if (bobY !== 0) ctx.translate(0, bobY * SPRITE_SCALE);
  
  // 2. Character Parts
  drawChibiLegs(px, rect, action, f);
  drawChibiBody(px, rect);
  drawChibiHead(px, rect, action, blink, f);
  drawChibiArms(px, rect, action, f);
  
  // 3. Optional Props
  drawChibiProps(px, rect, action, f);

  if (bobY !== 0) ctx.translate(0, -bobY * SPRITE_SCALE);
  if (flip) ctx.restore();
}

export const MASCOT_SPEECHES: Record<MascotAction, string[]> = {
  idle: [
    "system idle",
    "$ whoami",
    "runtime warm",
    "awaiting input...",
    "context loaded",
    "operator standing by",
  ],
  walk: [
    "routing to node",
    "walking the graph",
    "brb patching",
    "heading to oncall",
    "ssh'ing into prod",
  ],
  think: [
    "parsing context...",
    "O(n²) suboptimal",
    "policy check...",
    "considering edge case",
    "consulting eval set",
    "recursing...",
  ],
  debug: [
    "NullPointerException???",
    "WHO DID THIS",
    "console.log('here')",
    "blame git blame",
    "prod-only bug",
    "works on my machine",
  ],
  deploy: [
    "shipping to prod",
    "CI green. deploy.",
    "canary rolled out",
    "rolling forward",
    "commit && push && pray",
  ],
  coffee: [
    "caffeine compiles me",
    "first cup of seven",
    "espresso protocol",
    "java, the drink kind",
  ],
  standup: [
    "yesterday: shipped. today: ship more.",
    "blocked by: flaky tests",
    "no blockers (lies)",
    "ETA: soon",
  ],
  type: [
    "clack clack clack",
    "vim mode engaged",
    "semicolons confirmed",
    "140 WPM",
    "tab completion wins",
  ],
  talk: [
    "Tazou.exe online.",
    "operator ready.",
    "I guard the runtime.",
    "ask me systems questions.",
  ],
};
