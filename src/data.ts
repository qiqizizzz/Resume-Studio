import type { ResumeCustomInfo, ResumeData, ResumeItem, ResumeSection, SectionType } from "./types";

const createId = () => crypto.randomUUID();

export const createItem = (): ResumeItem => ({
  id: createId(),
  title: "",
  subtitle: "",
  date: "",
  content: "",
});

export const createCustomInfo = (value = "", label = ""): ResumeCustomInfo => ({
  id: createId(),
  label,
  value,
  displayType: "auto",
  icon: "globe",
  visible: true,
});

export const createSection = (type: SectionType = "custom"): ResumeSection => ({
  id: createId(),
  type,
  title: type === "custom" ? "自定义模块" : sectionNames[type],
  enabled: true,
  items: [createItem()],
});

export const sectionNames: Record<SectionType, string> = {
  education: "教育经历",
  skills: "技能特长",
  work: "工作经历",
  project: "项目经验",
  custom: "自定义模块",
};

export const defaultLayoutSettings = {
  moduleSpacing: 16,
  lineSpacing: 0.7,
  pageMargin: 30,
} as const;

export const createSampleResume = (): ResumeData => ({
  version: 1,
  title: "个人简历",
  description: "",
  accentColor: "#1775a5",
  sectionBarColor: "#e5f0f4",
  paperColor: "#ffffff",
  fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
  moduleTextColor: "#ffffff",
  subtitleTextColor: "#263d48",
  boldTextColor: "#1d2c35",
  fontScale: 1,
  ...defaultLayoutSettings,
  profile: {
    name: "你的姓名",
    headline: "求职方向 / 职位名称",
    age: "",
    gender: "",
    phone: "138 0000 0000",
    email: "name@example.com",
    origin: "",
    location: "江西 南昌",
    website: "github.com/your-name",
    avatar: "",
    customInfos: [createCustomInfo("github.com/your-name")],
  },
  profileVisibility: {
    headline: true,
    age: true,
    gender: true,
    origin: true,
    location: true,
    website: true,
    avatar: true,
  },
  sections: [
    {
      id: createId(),
      type: "education",
      title: "教育经历",
      enabled: true,
      items: [{ id: createId(), title: "华东理工大学", subtitle: "计算机科学与技术（本科）", date: "2023.09 - 2027.06", content: "主修课程：C++、数据结构与算法、计算机网络、图形学、线性代数、数据库等" }],
    },
    {
      id: createId(),
      type: "skills",
      title: "技能特长",
      enabled: true,
      items: [{ id: createId(), title: "", subtitle: "", date: "", content: "- 熟悉 C++ / C# 面向对象编程思想与常用设计模式\n- 熟悉 Unity 引擎和 UGUI，具备完整项目开发经验\n- 熟悉 Git 版本控制与团队协作流程" }],
    },
    {
      id: createId(),
      type: "project",
      title: "项目经验",
      enabled: true,
      items: [{ id: createId(), title: "三维战斗系统", subtitle: "独立开发", date: "2026.06 - 至今", content: "- 使用状态机设计角色行为，拆分移动、闪避和战斗状态\n- 采用对象池复用高频对象，减少运行时 GC 峰值\n- 构建可配置的技能系统与数据驱动 UI" }],
    },
  ],
});

export const normalizeResume = (saved: Partial<ResumeData>): ResumeData => {
  const fallback = createSampleResume();
  const savedProfile: Partial<ResumeData["profile"]> = saved.profile || {};
  const savedVisibility: Partial<ResumeData["profileVisibility"]> = saved.profileVisibility || {};
  const normalizeCustomInfo = (info: Partial<ResumeCustomInfo>, index: number): ResumeCustomInfo => {
    const displayType = info.displayType === "icon" || info.displayType === "text" ? info.displayType : "auto";
    const icon = info.icon === "github" || info.icon === "linkedin" || info.icon === "mail" || info.icon === "git" || info.icon === "gitee" || info.icon === "gitlab" || info.icon === "link" ? info.icon : "globe";
    return {
      id: info.id || `custom-info-${index}-${createId()}`,
      label: typeof info.label === "string" ? info.label : "",
      value: typeof info.value === "string" ? info.value : "",
      displayType,
      icon,
      visible: info.visible !== false,
    };
  };
  const customInfos = Array.isArray(savedProfile.customInfos)
    ? savedProfile.customInfos.map((info, index) => normalizeCustomInfo(info, index))
    : saved.profile
      ? (savedProfile.website ? [{ ...createCustomInfo(savedProfile.website), visible: savedVisibility.website !== false }] : [])
      : fallback.profile.customInfos;
  return {
    ...fallback,
    ...saved,
    title: saved.title || fallback.title,
    description: typeof saved.description === "string" ? saved.description : fallback.description,
    accentColor: saved.accentColor || fallback.accentColor,
    sectionBarColor: saved.sectionBarColor || fallback.sectionBarColor,
    paperColor: saved.paperColor || fallback.paperColor,
    fontFamily: saved.fontFamily || fallback.fontFamily,
    moduleTextColor: saved.moduleTextColor || fallback.moduleTextColor,
    subtitleTextColor: saved.subtitleTextColor || fallback.subtitleTextColor,
    boldTextColor: saved.boldTextColor || fallback.boldTextColor,
    fontScale: typeof saved.fontScale === "number" && saved.fontScale > 0 ? saved.fontScale : fallback.fontScale,
    moduleSpacing: typeof saved.moduleSpacing === "number" && saved.moduleSpacing > 0 ? saved.moduleSpacing : fallback.moduleSpacing,
    lineSpacing: typeof saved.lineSpacing === "number" && saved.lineSpacing > 0 ? saved.lineSpacing : fallback.lineSpacing,
    pageMargin: typeof saved.pageMargin === "number" && saved.pageMargin > 0 ? saved.pageMargin : fallback.pageMargin,
    profile: { ...fallback.profile, ...savedProfile, customInfos },
    profileVisibility: { ...fallback.profileVisibility, ...(saved.profileVisibility || {}) },
    sections: Array.isArray(saved.sections) ? saved.sections : fallback.sections,
  };
};
