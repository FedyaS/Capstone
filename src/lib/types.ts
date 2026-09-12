export const ARTICLE_STATUSES = ['NEW', 'SKIMMED', 'READ', 'UNDERSTOOD'] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const TOPIC_STATUSES = ['DONT_UNDERSTAND', 'LEARNING', 'UNDERSTAND'] as const;
export type TopicStatus = (typeof TOPIC_STATUSES)[number];

export const PHASE_STATUSES = ['PENDING', 'ACTIVE', 'DONE'] as const;
export type PhaseStatus = (typeof PHASE_STATUSES)[number];

export interface Article {
  id: string;
  url: string;
  title: string;
  status: ArticleStatus;
  /** 0-10 */
  usefulness: number;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  name: string;
  status: TopicStatus;
  /** 0-10 */
  usefulness: number;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Phase {
  id: string;
  title: string;
  description: string;
  status: PhaseStatus;
  updatedAt: string;
}

export const ARTICLE_STATUS_META: Record<
  ArticleStatus,
  { label: string; text: string; bg: string; ring: string; dot: string }
> = {
  NEW: {
    label: 'New',
    text: 'text-purple-300',
    bg: 'bg-purple-500/15',
    ring: 'ring-purple-400/40',
    dot: 'bg-purple-400',
  },
  SKIMMED: {
    label: 'Skimmed',
    text: 'text-sky-300',
    bg: 'bg-sky-500/15',
    ring: 'ring-sky-400/40',
    dot: 'bg-sky-400',
  },
  READ: {
    label: 'Read',
    text: 'text-amber-300',
    bg: 'bg-amber-500/15',
    ring: 'ring-amber-400/40',
    dot: 'bg-amber-400',
  },
  UNDERSTOOD: {
    label: 'Understood',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/15',
    ring: 'ring-emerald-400/40',
    dot: 'bg-emerald-400',
  },
};

export const TOPIC_STATUS_META: Record<
  TopicStatus,
  { label: string; short: string; text: string; bg: string; ring: string; dot: string }
> = {
  DONT_UNDERSTAND: {
    label: "Don't understand",
    short: "Don't get it",
    text: 'text-purple-300',
    bg: 'bg-purple-500/15',
    ring: 'ring-purple-400/40',
    dot: 'bg-purple-400',
  },
  LEARNING: {
    label: 'Learning',
    short: 'Learning',
    text: 'text-amber-300',
    bg: 'bg-amber-500/15',
    ring: 'ring-amber-400/40',
    dot: 'bg-amber-400',
  },
  UNDERSTAND: {
    label: 'Understand',
    short: 'Understand',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/15',
    ring: 'ring-emerald-400/40',
    dot: 'bg-emerald-400',
  },
};

/** Declared here (not in storage.ts) so client components can import it safely. */
export type StorageMode = 'github' | 'local';

export interface ActionResult {
  ok: boolean;
  message: string;
  /** Where the write landed: a commit URL, or a local path. */
  ref?: string;
}

/** Repo paths — this is the schema of our "database". */
export const PATHS = {
  problem: 'data/problem_statement.md',
  notes: 'data/ai_notes.md',
  articles: 'data/articles.json',
  topics: 'data/topics.json',
  timeline: 'data/timeline.json',
  /** AI-managed — edited by Cursor, never by the app. See .cursor/rules/ai-insights.mdc */
  insights: 'data/insights.json',
} as const;

export const DEFAULT_PHASES: Phase[] = [
  {
    id: 'scoping',
    title: 'Scoping',
    description: 'Lock down the problem statement, scope and success criteria.',
    status: 'ACTIVE',
    updatedAt: '',
  },
  {
    id: 'literature',
    title: 'Literature Review',
    description: 'Collect, skim and rank the papers, articles and prior art.',
    status: 'PENDING',
    updatedAt: '',
  },
  {
    id: 'foundations',
    title: 'Foundations',
    description: 'Close the knowledge gaps — every core topic marked Understand.',
    status: 'PENDING',
    updatedAt: '',
  },
  {
    id: 'methodology',
    title: 'Methodology',
    description: 'Design the approach, architecture and evaluation plan.',
    status: 'PENDING',
    updatedAt: '',
  },
  {
    id: 'build',
    title: 'Build',
    description: 'Implement the system / run the experiments.',
    status: 'PENDING',
    updatedAt: '',
  },
  {
    id: 'evaluation',
    title: 'Evaluation',
    description: 'Measure results against the success criteria, iterate.',
    status: 'PENDING',
    updatedAt: '',
  },
  {
    id: 'writeup',
    title: 'Write-up & Defense',
    description: 'Final report, slide deck and defense rehearsal.',
    status: 'PENDING',
    updatedAt: '',
  },
];
