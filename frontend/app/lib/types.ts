export type ScholarProfile = {
  userId: string;
  name: string;
  affiliation: string;
  avatarUrl: string;
  citationsAll: number;
  hIndexAll: number;
  i10IndexAll: number;
  // { "2021": 25, "2022": 40 } — citations received per calendar year (recent
  // ~6-year window from Scholar). Empty until the backend re-syncs with the
  // histogram parser, so always read defensively.
  citationsByYear: Record<string, number>;
  syncedAt: string | null;
};

export type Publication = {
  id: number;
  scholarId: string;
  title: string;
  authors: string;
  venue: string;
  year: number | null;
  citedBy: number;
  citedByUrl: string;
  url: string;
  coreRank: string;
  coreAcronym: string;
};

export type PublicationsPayload = {
  profile: ScholarProfile;
  publications: Publication[];
};

export type NewsItem = {
  id: number;
  date: string;
  text: string;
};

export type Project = {
  id: number;
  name: string;
  description: string;
  tags: string[];
  repoUrl: string;
  stars?: number;
  highlight?: boolean;
  order?: number;
};

export type EducationItem = {
  id: number;
  institution: string;
  degree: string;
  period: string;
  detail?: string;
  order?: number;
};

export type ExperienceItem = {
  id: number;
  org: string;
  role: string;
  period: string;
  detail?: string;
  order?: number;
};

export type SkillGroup = {
  id: number;
  group: string;
  items: string[];
  order?: number;
};

export type SiteProfile = {
  name: string;
  title: string;
  affiliation: string;
  email: string;
  links: {
    github: string;
    linkedin: string;
    scholar: string;
    cv: string;
  };
  summary: string[];
  researchDirection: string;
  interests: string[];
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: SkillGroup[];
};

export type BlogPostMeta = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
};

export type QAComment = {
  id: number;
  parentId: number | null;
  body: string;
  displayName: string;
  isOwner: boolean;
  isRegistered: boolean;
  isEdited: boolean;
  canModify: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: QAComment[];
};

export type AgentSkillSource = "plugin" | "npx-package" | "self-authored" | "linked-project";

export type AgentSkillCategory = "skill" | "command" | "agent";

export type AgentSkillEntry = {
  id: number;
  slug: string;
  name: string;
  description: string;
  source: AgentSkillSource;
  origin: string;
  category: AgentSkillCategory;
  tags: string[];
  highlightBlurb: string;
  highlightOrder: number | null;
  order: number;
};
