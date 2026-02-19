type ActionType = "session" | "download" | "share" | "save" | "edit";

type CounterAction = Exclude<ActionType, "session">;

type EngagementState = {
  lastActiveDate: string | null;
  currentStreak: number;
  bestStreak: number;
  totalDays: number;
  todayDate: string | null;
  todayActions: number;
  totals: Record<CounterAction, number>;
};

export type EngagementSnapshot = {
  currentStreak: number;
  bestStreak: number;
  totalDays: number;
  todayActions: number;
  challengeGoal: number;
  challengeProgress: number;
  totalScore: number;
  level: number;
  nextLevelAt: number;
  totals: Record<CounterAction, number>;
};

const STORAGE_KEY = "meme-creator-engagement-v1";
const CHALLENGE_GOAL = 6;
const SCORE_PER_ACTION: Record<CounterAction, number> = {
  download: 3,
  share: 5,
  save: 4,
  edit: 1,
};
const SCORE_STEP = 30;

const defaultState = (): EngagementState => ({
  lastActiveDate: null,
  currentStreak: 0,
  bestStreak: 0,
  totalDays: 0,
  todayDate: null,
  todayActions: 0,
  totals: {
    download: 0,
    share: 0,
    save: 0,
    edit: 0,
  },
});

const todayKey = () => new Date().toISOString().slice(0, 10);

const dayDiff = (fromDay: string, toDay: string) => {
  const from = new Date(`${fromDay}T00:00:00Z`).getTime();
  const to = new Date(`${toDay}T00:00:00Z`).getTime();
  const diff = (to - from) / 86400000;
  return Number.isFinite(diff) ? Math.round(diff) : 0;
};

const load = (): EngagementState => {
  if (typeof window === "undefined") return defaultState();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw) as Partial<EngagementState>;
    return {
      ...defaultState(),
      ...parsed,
      totals: {
        ...defaultState().totals,
        ...(parsed.totals ?? {}),
      },
    };
  } catch {
    return defaultState();
  }
};

const persist = (state: EngagementState) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const refreshDayState = (state: EngagementState, day: string) => {
  if (!state.lastActiveDate) {
    state.lastActiveDate = day;
    state.currentStreak = 1;
    state.bestStreak = 1;
    state.totalDays = 1;
    state.todayDate = day;
    state.todayActions = 0;
    return;
  }

  if (state.lastActiveDate === day) {
    if (state.todayDate !== day) {
      state.todayDate = day;
      state.todayActions = 0;
    }
    return;
  }

  const diff = dayDiff(state.lastActiveDate, day);
  state.currentStreak = diff === 1 ? state.currentStreak + 1 : 1;
  state.bestStreak = Math.max(state.bestStreak, state.currentStreak);
  state.totalDays += 1;
  state.lastActiveDate = day;
  state.todayDate = day;
  state.todayActions = 0;
};

const toSnapshot = (state: EngagementState): EngagementSnapshot => {
  const totalScore =
    state.totals.download * SCORE_PER_ACTION.download +
    state.totals.share * SCORE_PER_ACTION.share +
    state.totals.save * SCORE_PER_ACTION.save +
    state.totals.edit * SCORE_PER_ACTION.edit;
  const level = Math.floor(totalScore / SCORE_STEP) + 1;
  const nextLevelAt = level * SCORE_STEP;

  return {
    currentStreak: state.currentStreak,
    bestStreak: state.bestStreak,
    totalDays: state.totalDays,
    todayActions: state.todayActions,
    challengeGoal: CHALLENGE_GOAL,
    challengeProgress: Math.min(CHALLENGE_GOAL, state.todayActions),
    totalScore,
    level,
    nextLevelAt,
    totals: state.totals,
  };
};

export const trackEngagement = (action: ActionType): EngagementSnapshot => {
  const state = load();
  const day = todayKey();
  refreshDayState(state, day);

  if (action !== "session") {
    state.totals[action] += 1;
    state.todayActions += 1;
  }

  persist(state);
  return toSnapshot(state);
};

export const readEngagementSnapshot = (): EngagementSnapshot => {
  const state = load();
  const day = todayKey();
  refreshDayState(state, day);
  persist(state);
  return toSnapshot(state);
};
