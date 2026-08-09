export type SectionType = "education" | "skills" | "work" | "project" | "custom";

export interface ResumeProfile {
  name: string;
  headline: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  origin: string;
  location: string;
  website: string;
  avatar: string;
  customInfos: ResumeCustomInfo[];
}

export type CustomInfoDisplayType = "auto" | "icon" | "text";
export type CustomInfoIcon = "globe" | "github" | "linkedin" | "mail" | "git" | "gitee" | "gitlab" | "link";

export interface ResumeCustomInfo {
  id: string;
  label: string;
  value: string;
  displayType: CustomInfoDisplayType;
  icon: CustomInfoIcon;
  visible: boolean;
}

export interface ProfileVisibility {
  headline: boolean;
  age: boolean;
  gender: boolean;
  origin: boolean;
  location: boolean;
  website: boolean;
  avatar: boolean;
}

export interface ResumeItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  content: string;
}

export interface ResumeSection {
  id: string;
  type: SectionType;
  title: string;
  enabled: boolean;
  items: ResumeItem[];
}

export interface ResumeData {
  version: 1;
  title: string;
  description: string;
  profile: ResumeProfile;
  profileVisibility: ProfileVisibility;
  sections: ResumeSection[];
  accentColor: string;
  sectionBarColor: string;
  paperColor: string;
  fontFamily: string;
  moduleTextColor: string;
  subtitleTextColor: string;
  boldTextColor: string;
  fontScale: number;
  moduleSpacing: number;
  lineSpacing: number;
  pageMargin: number;
}

export interface ResumeStudioApi {
  load: () => Promise<ResumeData | null>;
  save: (resume: ResumeData) => Promise<boolean>;
  backup: (resume: ResumeData) => Promise<boolean>;
  importData: () => Promise<{ data: unknown; error: "format" | "json" | null } | null>;
  selectAvatar: () => Promise<string | null>;
  exportPdf: (fileName: string) => Promise<boolean>;
}
