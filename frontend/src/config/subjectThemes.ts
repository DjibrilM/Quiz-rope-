export interface SubjectTheme {
  label: string;
  headerAccentClass: string;
  badgeClass: string;
  optionBgClass: string;
  optionBorderClass: string;
  textClass: string;
  accentColor: string;
}

const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  MATH: {
    label: "Math",
    headerAccentClass: "bg-amber-500",
    badgeClass: "bg-amber-500",
    optionBgClass: "bg-amber-500/5",
    optionBorderClass: "border-amber-500/20",
    textClass: "text-amber-400",
    accentColor: "#F59E0B",
  },
  SCIENCE: {
    label: "Science",
    headerAccentClass: "bg-emerald-500",
    badgeClass: "bg-emerald-500",
    optionBgClass: "bg-emerald-500/5",
    optionBorderClass: "border-emerald-500/20",
    textClass: "text-emerald-400",
    accentColor: "#10B981",
  },
  ENGLISH: {
    label: "English",
    headerAccentClass: "bg-violet-500",
    badgeClass: "bg-violet-500",
    optionBgClass: "bg-violet-500/5",
    optionBorderClass: "border-violet-500/20",
    textClass: "text-violet-400",
    accentColor: "#8B5CF6",
  },
  HISTORY: {
    label: "History",
    headerAccentClass: "bg-rose-500",
    badgeClass: "bg-rose-500",
    optionBgClass: "bg-rose-500/5",
    optionBorderClass: "border-rose-500/20",
    textClass: "text-rose-400",
    accentColor: "#F43F5E",
  },
  GEOGRAPHY: {
    label: "Geography",
    headerAccentClass: "bg-sky-500",
    badgeClass: "bg-sky-500",
    optionBgClass: "bg-sky-500/5",
    optionBorderClass: "border-sky-500/20",
    textClass: "text-sky-400",
    accentColor: "#0EA5E9",
  },
};

const FALLBACK_THEME: SubjectTheme = {
  label: "Question",
  headerAccentClass: "bg-slate-500",
  badgeClass: "bg-slate-500",
  optionBgClass: "bg-slate-500/5",
  optionBorderClass: "border-slate-500/20",
  textClass: "text-slate-400",
  accentColor: "#9B59B6",
};

export function getSubjectTheme(subject: string): SubjectTheme {
  return SUBJECT_THEMES[subject.toUpperCase()] ?? FALLBACK_THEME;
}
