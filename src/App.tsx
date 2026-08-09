import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import MDEditor from "@uiw/react-md-editor";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Previewer } from "pagedjs";
import { SiGitee, SiGitlab, SiGithub } from "@icons-pack/react-simple-icons";
import {
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  FileUp,
  FilePlus2,
  GitBranch,
  Globe2,
  GripVertical,
  ImagePlus,
  BriefcaseBusiness,
  ChevronUp,
  Link2,
  Mail,
  Palette,
  Plus,
  Save,
  SlidersHorizontal,
  Star,
  Type,
  Trash2,
  X,
} from "lucide-react";
import { createCustomInfo, createItem, createSampleResume, createSection, defaultLayoutSettings, normalizeResume, sectionNames } from "./data";
import type { CustomInfoDisplayType, CustomInfoIcon, ProfileVisibility, ResumeCustomInfo, ResumeData, ResumeItem, ResumeSection, SectionType } from "./types";
import "@uiw/react-md-editor/markdown-editor.css";
import "./App.css";

type Selection = "profile" | string;
type PreviewerInstance = Previewer & {
  chunker?: { destroy?: () => void; pagesArea?: Element };
  polisher?: { destroy?: () => void; styleEl?: Element };
};

const fontOptions = [
  { zh: "微软雅黑", en: "Microsoft YaHei", value: '"Microsoft YaHei", "PingFang SC", sans-serif' },
  { zh: "苹方 / 思源黑体", en: "PingFang / Source Han Sans", value: '"PingFang SC", "Source Han Sans SC", sans-serif' },
  { zh: "宋体", en: "SimSun", value: 'SimSun, "Songti SC", serif' },
  { zh: "黑体", en: "SimHei", value: 'SimHei, "Heiti SC", sans-serif' },
  { zh: "楷体", en: "KaiTi", value: 'KaiTi, "Kaiti SC", serif' },
  { zh: "Arial", en: "Arial", value: 'Arial, "Microsoft YaHei", sans-serif' },
];

const customInfoDisplayOptions: Array<{ zh: string; en: string; value: CustomInfoDisplayType }> = [
  { zh: "自动识别图标", en: "Auto-detect icon", value: "auto" },
  { zh: "选择网站图标", en: "Choose website icon", value: "icon" },
  { zh: "文字标题", en: "Text title", value: "text" },
];

const customInfoIconOptions: Array<{ zh: string; en: string; value: CustomInfoIcon }> = [
  { zh: "通用网站", en: "Generic website", value: "globe" },
  { zh: "GitHub", en: "GitHub", value: "github" },
  { zh: "LinkedIn", en: "LinkedIn", value: "linkedin" },
  { zh: "邮箱", en: "Email", value: "mail" },
  { zh: "Gitee", en: "Gitee", value: "gitee" },
  { zh: "GitLab", en: "GitLab", value: "gitlab" },
  { zh: "代码仓库", en: "Code repository", value: "git" },
  { zh: "链接", en: "Link", value: "link" },
];

type Language = "zh" | "en";
type SaveState = "draft" | "saving" | "saved" | "imported";

const languageCopy = {
  zh: {
    languageButton: "English",
    switchLanguage: "切换为英文",
    brandSubtitle: "本地简历编辑器",
    style: { button: "模版样式", aria: "模版样式设置", eyebrow: "外观设置", title: "模版样式", hint: "调整后会立即同步到预览和 PDF 导出", accent: "模块主色", sectionBar: "标题栏底色", paper: "简历背景色", close: "关闭模版样式", done: "完成" },
    font: { button: "字体样式", aria: "字体样式设置", eyebrow: "文字设置", title: "字体样式", hint: "字号按默认层级等比例缩放，预览和 PDF 会同步更新", family: "字体", moduleColor: "模块字体颜色", subtitleColor: "副标题颜色", boldColor: "Markdown 加粗颜色", size: "字体大小", small: "较小", defaultSize: "默认", large: "较大", close: "关闭字体样式", done: "完成" },
    layout: { button: "排版设置", aria: "排版设置", eyebrow: "页面设置", title: "排版设置", spacing: "模块上下间距", line: "行间距", margin: "上下边距", close: "关闭排版设置", reset: "重置", done: "完成" },
    save: { draft: "本地草稿", saving: "正在保存", saved: "已保存到本地", imported: "已导入数据" },
    actions: { star: "Star 项目", starAria: "打开 GitHub 项目并支持 Star", import: "导入数据", backup: "备份数据", export: "导出 PDF" },
    navigation: { eyebrow: "简历结构", title: "模块顺序", profile: "基本信息", add: "新增模块", note: "拖动模块左侧手柄可调整简历中的显示顺序" },
    editor: { eyebrow: "编辑模块", resumeTitle: "简历标题", description: "简历描述", titlePlaceholder: "例如：个人简历", descriptionPlaceholder: "例如：前端开发工程师", avatar: "头像", avatarAlt: "头像预览", chooseAvatar: "选择头像", hideAvatar: "隐藏头像", showAvatar: "显示头像", extraEyebrow: "补充信息", extraTitle: "自定义信息", addInfo: "添加信息", addEntry: "新增条目", moduleTitle: "模块标题", moduleType: "模块类型", showModule: "在简历中显示此模块" },
    fields: { name: "姓名", headline: "求职标题", age: "年龄", gender: "性别", phone: "手机号码", email: "邮箱", origin: "籍贯", location: "所在地", agePlaceholder: "例如：21岁", genderPlaceholder: "例如：女" },
    entry: { drag: "拖动调整经历顺序", label: "经历条目", expand: "展开经历条目", collapse: "折叠经历条目", delete: "删除条目", name: "名称", subtitle: "副标题", time: "时间", namePlaceholder: "例如：某某大学 / 项目名称", subtitlePlaceholder: "例如：专业 / 担任角色", timePlaceholder: "例如：2026.06 - 至今", markdown: "描述内容（Markdown）" },
    custom: { autoIcon: "自动识别图标", selectIcon: "选择网站图标", textTitle: "文字标题", textPlaceholder: "文字标题，例如：博客", value: "信息内容", valuePlaceholder: "信息内容，例如：https://github.com/", display: "信息展示方式", hide: "隐藏信息", show: "显示信息", delete: "删除自定义信息", info: "信息" },
    preview: { aria: "多页简历预览", eyebrow: "实时预览", title: "连续 A4 页面", rendering: "正在分页", synced: "已同步", error: "分页预览暂时不可用，请检查内容后重试" },
    resume: { fallbackTitle: "个人简历", profile: "基本信息", name: "姓名", headline: "求职方向", age: "年龄", gender: "性别", phone: "电话", email: "邮箱", origin: "籍贯", location: "所在地" },
    sectionNames: { education: "教育经历", skills: "技能特长", work: "工作经历", project: "项目经验", custom: "自定义模块" },
    visibility: { hide: "隐藏", show: "显示" },
    alerts: { invalidData: "导入失败：文件格式错误，请选择有效的 JSON 简历数据", invalidStructure: "导入失败：JSON 结构错误，请使用备份数据生成的文件", format: "导入失败：只支持 JSON 格式文件", json: "导入失败：JSON 文件解析失败" },
  },
  en: {
    languageButton: "中文",
    switchLanguage: "Switch to Chinese",
    brandSubtitle: "Local resume editor",
    style: { button: "Template", aria: "Template settings", eyebrow: "Appearance", title: "Template", hint: "Changes are synced to the preview and PDF export", accent: "Accent color", sectionBar: "Section bar color", paper: "Resume background", close: "Close template settings", done: "Done" },
    font: { button: "Typography", aria: "Typography settings", eyebrow: "Typography", title: "Typography", hint: "The scale keeps the default hierarchy proportional in the preview and PDF", family: "Font", moduleColor: "Module text color", subtitleColor: "Subtitle color", boldColor: "Markdown bold color", size: "Font size", small: "Smaller", defaultSize: "Default", large: "Larger", close: "Close typography settings", done: "Done" },
    layout: { button: "Layout", aria: "Layout settings", eyebrow: "Page settings", title: "Layout", spacing: "Section spacing", line: "Line spacing", margin: "Page margins", close: "Close layout settings", reset: "Reset", done: "Done" },
    save: { draft: "Local draft", saving: "Saving", saved: "Saved locally", imported: "Data imported" },
    actions: { star: "Star project", starAria: "Open the GitHub project and leave a star", import: "Import data", backup: "Backup data", export: "Export PDF" },
    navigation: { eyebrow: "Resume structure", title: "Section order", profile: "Profile", add: "Add section", note: "Drag the handle on the left to reorder sections" },
    editor: { eyebrow: "Edit section", resumeTitle: "Resume title", description: "Description", titlePlaceholder: "For example: Resume", descriptionPlaceholder: "For example: Frontend Developer", avatar: "Avatar", avatarAlt: "Avatar preview", chooseAvatar: "Choose avatar", hideAvatar: "Hide avatar", showAvatar: "Show avatar", extraEyebrow: "Additional details", extraTitle: "Custom information", addInfo: "Add information", addEntry: "Add entry", moduleTitle: "Section title", moduleType: "Section type", showModule: "Show this section in the resume" },
    fields: { name: "Name", headline: "Target role", age: "Age", gender: "Gender", phone: "Phone", email: "Email", origin: "Home", location: "Location", agePlaceholder: "For example: 21", genderPlaceholder: "For example: Female" },
    entry: { drag: "Reorder experience entry", label: "Experience entry", expand: "Expand experience entry", collapse: "Collapse experience entry", delete: "Delete entry", name: "Name", subtitle: "Subtitle", time: "Date", namePlaceholder: "For example: University / Project name", subtitlePlaceholder: "For example: Major / Role", timePlaceholder: "For example: Jun 2026 - Present", markdown: "Description (Markdown)" },
    custom: { autoIcon: "Auto-detect icon", selectIcon: "Choose website icon", textTitle: "Text title", textPlaceholder: "Text title, e.g. Blog", value: "Value", valuePlaceholder: "Value, e.g. https://github.com/", display: "Display mode", hide: "Hide information", show: "Show information", delete: "Delete custom information", info: "Information" },
    preview: { aria: "Multi-page resume preview", eyebrow: "Live preview", title: "Continuous A4 pages", rendering: "Paginating", synced: "Synced", error: "The paginated preview is temporarily unavailable. Check the content and try again." },
    resume: { fallbackTitle: "Resume", profile: "Profile", name: "Name", headline: "Target role", age: "Age", gender: "Gender", phone: "Phone", email: "Email", origin: "Home", location: "Location" },
    sectionNames: { education: "Education", skills: "Skills", work: "Work experience", project: "Projects", custom: "Custom section" },
    visibility: { hide: "Hide ", show: "Show " },
    alerts: { invalidData: "Import failed: choose a valid JSON resume file", invalidStructure: "Import failed: the JSON structure is invalid. Use a file created by the backup action", format: "Import failed: only JSON files are supported", json: "Import failed: the JSON file could not be parsed" },
  },
} as const;

type UiCopy = (typeof languageCopy)[Language];

const getSectionTitle = (section: ResumeSection, copy: UiCopy) => {
  const defaultTitle = sectionNames[section.type];
  return !section.title || section.title === defaultTitle ? copy.sectionNames[section.type] : section.title;
};

const IconButton = ({ label, onClick, children, disabled = false }: { label: string; onClick: () => void; children: ReactNode; disabled?: boolean }) => (
  <button className="icon-button" type="button" title={label} aria-label={label} onClick={onClick} disabled={disabled}>
    {children}
  </button>
);

const getMarkdownEditorHeight = (content: string) => {
  const visualLineCount = content.split(/\r?\n/).reduce((count, line) => count + Math.max(1, Math.ceil(Math.max(line.length, 1) / 82)), 0);
  return Math.max(100, 44 + visualLineCount * 19);
};

const SortableSectionRow = ({ section, active, onSelect, onToggle, onDelete, copy }: { section: ResumeSection; active: boolean; onSelect: () => void; onToggle: () => void; onDelete: () => void; copy: UiCopy }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={`section-row ${active ? "is-active" : ""} ${isDragging ? "is-dragging" : ""}`}>
      <button className="drag-handle" type="button" aria-label={`${copy.visibility.hide === "隐藏" ? "拖动" : "Drag"} ${getSectionTitle(section, copy)}`} title={copy.navigation.note} {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>
      <button className="section-select" type="button" onClick={onSelect}>{getSectionTitle(section, copy)}</button>
      <button className="visibility-toggle" type="button" title={section.enabled ? `${copy.visibility.hide}${copy.editor.moduleTitle}` : `${copy.visibility.show}${copy.editor.moduleTitle}`} onClick={onToggle} aria-label={section.enabled ? `${copy.visibility.hide}${copy.editor.moduleTitle}` : `${copy.visibility.show}${copy.editor.moduleTitle}`}>
        {section.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
      <IconButton label={`${copy.entry.delete} ${getSectionTitle(section, copy)}`} onClick={onDelete}><Trash2 size={15} /></IconButton>
    </div>
  );
};

const SortableItem = ({ item, onChange, onDelete, copy }: { item: ResumeItem; onChange: (patch: Partial<ResumeItem>) => void; onDelete: () => void; copy: UiCopy }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [contentDraft, setContentDraft] = useState(item.content);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const markdownEditorRef = useRef<HTMLDivElement>(null);
  const contentDraftRef = useRef(item.content);
  const contentTimerRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (item.content !== contentDraftRef.current) {
      contentDraftRef.current = item.content;
      setContentDraft(item.content);
    }
  }, [item.content]);

  useEffect(() => () => {
    if (contentTimerRef.current !== null) window.clearTimeout(contentTimerRef.current);
  }, []);

  const flushContent = () => {
    if (contentTimerRef.current !== null) {
      window.clearTimeout(contentTimerRef.current);
      contentTimerRef.current = null;
    }
    onChangeRef.current({ content: contentDraftRef.current });
  };

  const handleContentChange = (content?: string) => {
    const nextContent = content ?? "";
    contentDraftRef.current = nextContent;
    setContentDraft(nextContent);
    if (contentTimerRef.current !== null) window.clearTimeout(contentTimerRef.current);
    contentTimerRef.current = window.setTimeout(() => {
      contentTimerRef.current = null;
      onChangeRef.current({ content: contentDraftRef.current });
    }, 220);
  };

  const [markdownEditorHeight, setMarkdownEditorHeight] = useState(() => getMarkdownEditorHeight(contentDraft));

  useLayoutEffect(() => {
    const measureEditor = () => {
      const container = markdownEditorRef.current;
      const editor = container?.querySelector<HTMLElement>(".w-md-editor");
      const textarea = container?.querySelector<HTMLTextAreaElement>(".w-md-editor-text-input");
      const toolbar = container?.querySelector<HTMLElement>(".w-md-editor-toolbar");
      if (!editor || !textarea) return;
      const previousHeight = textarea.style.height;
      textarea.style.height = "auto";
      const contentHeight = textarea.scrollHeight;
      textarea.style.height = previousHeight;
      const nextHeight = Math.max(100, contentHeight + (toolbar?.offsetHeight || 34) + 2);
      setMarkdownEditorHeight((currentHeight) => Math.abs(currentHeight - nextHeight) > 1 ? nextHeight : currentHeight);
    };

    const frame = window.requestAnimationFrame(measureEditor);
    const observer = typeof ResizeObserver === "undefined" || !markdownEditorRef.current
      ? null
      : new ResizeObserver(measureEditor);
    if (observer && markdownEditorRef.current) observer.observe(markdownEditorRef.current);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [contentDraft]);

  return (
    <article ref={setNodeRef} style={style} className={`entry-editor ${isDragging ? "is-dragging" : ""}`}>
      <div className="entry-editor__bar">
        <button className="drag-handle" type="button" title={copy.entry.drag} aria-label={copy.entry.drag} {...attributes} {...listeners}><GripVertical size={17} /></button>
        <span>{copy.entry.label}</span>
        <IconButton label={isCollapsed ? copy.entry.expand : copy.entry.collapse} onClick={() => setIsCollapsed((collapsed) => !collapsed)}>{isCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}</IconButton>
        <IconButton label={copy.entry.delete} onClick={onDelete}><Trash2 size={16} /></IconButton>
      </div>
      {!isCollapsed && <>
        <div className="entry-fields">
          <Field copy={copy} label={copy.entry.name} value={item.title} onChange={(title) => onChange({ title })} placeholder={copy.entry.namePlaceholder} />
          <Field copy={copy} label={copy.entry.subtitle} value={item.subtitle} onChange={(subtitle) => onChange({ subtitle })} placeholder={copy.entry.subtitlePlaceholder} />
          <Field copy={copy} label={copy.entry.time} value={item.date} onChange={(date) => onChange({ date })} placeholder={copy.entry.timePlaceholder} />
        </div>
        <label className="markdown-label">{copy.entry.markdown}</label>
        <div ref={markdownEditorRef} data-color-mode="light" className="markdown-editor">
          <MDEditor value={contentDraft} onChange={handleContentChange} onBlur={flushContent} preview="edit" height={markdownEditorHeight} visibleDragbar={false} highlightEnable={false} />
        </div>
      </>}
    </article>
  );
};

const Field = ({ label, value, onChange, placeholder = "", visible, onToggleVisibility, copy }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; visible?: boolean; onToggleVisibility?: () => void; copy: UiCopy }) => (
  <label className="field">
    <span className="field-label">{label}{onToggleVisibility && <button className="field-visibility" type="button" title={visible ? `${copy.visibility.hide}${label}` : `${copy.visibility.show}${label}`} aria-label={visible ? `${copy.visibility.hide}${label}` : `${copy.visibility.show}${label}`} onClick={onToggleVisibility}>{visible ? <Eye size={15} /> : <EyeOff size={15} />}</button>}</span>
    <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
  </label>
);

const detectCustomInfoIcon = (value: string): CustomInfoIcon => {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("github.com")) return "github";
  if (normalized.includes("linkedin.com")) return "linkedin";
  if (normalized.includes("gitee.com")) return "gitee";
  if (normalized.includes("gitlab.com")) return "gitlab";
  if (normalized.startsWith("mailto:") || normalized.includes("@")) return "mail";
  return "globe";
};

const CustomInfoMarker = ({ info, copy }: { info: ResumeCustomInfo; copy: UiCopy }) => {
  if (info.displayType === "text") return <span className="custom-info-marker__text">{info.label || copy.custom.info}</span>;
  const icon = info.displayType === "auto" ? detectCustomInfoIcon(info.value) : info.icon;
  if (icon === "github") return <SiGithub size={15} aria-hidden="true" />;
  if (icon === "linkedin") return <BriefcaseBusiness size={15} strokeWidth={2} aria-hidden="true" />;
  if (icon === "mail") return <Mail size={15} strokeWidth={2} aria-hidden="true" />;
  if (icon === "gitee") return <SiGitee size={15} aria-hidden="true" />;
  if (icon === "gitlab") return <SiGitlab size={15} aria-hidden="true" />;
  if (icon === "git") return <GitBranch size={15} strokeWidth={2} aria-hidden="true" />;
  if (icon === "link") return <Link2 size={15} strokeWidth={2} aria-hidden="true" />;
  return <Globe2 size={15} strokeWidth={2} aria-hidden="true" />;
};

const CustomInfoRow = ({ info, onChange, onToggleVisibility, onDelete, copy, language }: { info: ResumeCustomInfo; onChange: (patch: Partial<ResumeCustomInfo>) => void; onToggleVisibility: () => void; onDelete: () => void; copy: UiCopy; language: Language }) => (
  <div className="custom-info-row">
    <div className="custom-info-row__identity">
      {info.displayType === "icon" ? (
        <select value={info.icon} aria-label={copy.custom.selectIcon} onChange={(event) => onChange({ icon: event.target.value as CustomInfoIcon })}>
          {customInfoIconOptions.map((option) => <option key={option.value} value={option.value}>{language === "en" ? option.en : option.zh}</option>)}
        </select>
      ) : info.displayType === "text" ? (
        <input value={info.label} aria-label={copy.custom.textTitle} placeholder={copy.custom.textPlaceholder} onChange={(event) => onChange({ label: event.target.value })} />
      ) : (
        <div className="custom-info-auto"><Globe2 size={15} />{copy.custom.autoIcon}</div>
      )}
    </div>
    <input className="custom-info-row__value" value={info.value} aria-label={copy.custom.value} placeholder={copy.custom.valuePlaceholder} onChange={(event) => onChange({ value: event.target.value })} />
    <select className="custom-info-row__display" value={info.displayType} aria-label={copy.custom.display} onChange={(event) => onChange({ displayType: event.target.value as CustomInfoDisplayType })}>
      {customInfoDisplayOptions.map((option) => <option key={option.value} value={option.value}>{language === "en" ? option.en : option.zh}</option>)}
    </select>
    <button className="field-visibility custom-info-row__visibility" type="button" title={info.visible ? copy.custom.hide : copy.custom.show} aria-label={info.visible ? copy.custom.hide : copy.custom.show} onClick={onToggleVisibility}>{info.visible ? <Eye size={15} /> : <EyeOff size={15} />}</button>
    <IconButton label={copy.custom.delete} onClick={onDelete}><Trash2 size={15} /></IconButton>
  </div>
);

const normalizeMarkdown = (value: string) => value
  .replace(/\*\*\s*([^*\n]+?)\s*\*\*/g, "**$1**")
  .replace(/\*\*([^*\n]*?)([，。；、：？！])\*\*/g, "**$1**$2")
  .replace(/\*([^*\n]*?)([，。；、：？！])\*/g, "*$1*$2");

const preserveMarkdownBlankLines = (value: string) => {
  const lines = normalizeMarkdown(value).split(/\r?\n/);
  const output: string[] = [];
  let index = 0;
  while (index < lines.length) {
    if (lines[index].trim()) {
      output.push(lines[index]);
      index += 1;
      continue;
    }
    let end = index;
    while (end < lines.length && !lines[end].trim()) end += 1;
    const blankCount = end - index;
    for (let blank = 0; blank < blankCount; blank += 1) output.push("", "\u00a0", "");
    index = end;
  }
  return output.join("\n");
};

const collectPreviewStylesheets = (): Array<Record<string, string>> => {
  const cssText = Array.from(document.styleSheets).flatMap((stylesheet) => {
    const owner = stylesheet.ownerNode as HTMLElement | null;
    if (owner?.hasAttribute("data-pagedjs-inserted-styles") || owner?.hasAttribute("data-pagedjs-inserted")) return [];
    try {
      return Array.from(stylesheet.cssRules)
        .filter((rule) => rule.type === CSSRule.STYLE_RULE || rule.type === CSSRule.PAGE_RULE)
        .map((rule) => rule.cssText)
        .filter((rule) => rule.startsWith("@page") || rule.includes(".resume-") || rule.includes(".basic-info-") || rule.includes(".custom-info-"));
    } catch {
      return [];
    }
  }).join("\n");
  return cssText ? [{ [window.location.href]: cssText }] : [];
};

const ResumeDocument = memo(({ resume, copy }: { resume: ResumeData; copy: UiCopy }) => {
  const visibility = resume.profileVisibility;
  const style = {
    "--accent": resume.accentColor,
    "--section-bar": resume.sectionBarColor,
    "--paper": resume.paperColor,
    "--resume-font-family": resume.fontFamily,
    "--font-scale": resume.fontScale,
    "--module-text": resume.moduleTextColor,
    "--subtitle-text": resume.subtitleTextColor,
    "--bold-text": resume.boldTextColor,
    "--module-spacing": `${resume.moduleSpacing * 0.3125}mm`,
    "--module-profile-spacing": `${resume.moduleSpacing * 0.0625}mm`,
    "--module-entry-spacing": `${resume.moduleSpacing * 0.1875}mm`,
    "--line-spacing": resume.lineSpacing,
    "--page-margin": `${resume.pageMargin * 0.4}mm`,
  } as CSSProperties;

  return (
    <article className="resume-document" style={style}>
      <header className="resume-title-bar">
        <h1>{resume.title || copy.resume.fallbackTitle}</h1>
        {resume.description.trim() && <p>{resume.description}</p>}
      </header>
      <section className="resume-section resume-profile-section">
        <h2><span>{copy.resume.profile}</span></h2>
        <div className="resume-profile-content">
          <div className="basic-info-grid">
            <div className="basic-info-item"><span>{copy.resume.name}</span><strong>{resume.profile.name}</strong></div>
            {visibility.headline && <div className="basic-info-item"><span>{copy.resume.headline}</span><strong>{resume.profile.headline}</strong></div>}
            {visibility.age && <div className="basic-info-item"><span>{copy.resume.age}</span><strong>{resume.profile.age}</strong></div>}
            {visibility.gender && <div className="basic-info-item"><span>{copy.resume.gender}</span><strong>{resume.profile.gender}</strong></div>}
            <div className="basic-info-item"><span>{copy.resume.phone}</span><strong>{resume.profile.phone}</strong></div>
            <div className="basic-info-item"><span>{copy.resume.email}</span><strong>{resume.profile.email}</strong></div>
            {visibility.origin && <div className="basic-info-item"><span>{copy.resume.origin}</span><strong>{resume.profile.origin}</strong></div>}
            {visibility.location && <div className="basic-info-item"><span>{copy.resume.location}</span><strong>{resume.profile.location}</strong></div>}
            {resume.profile.customInfos.filter((info) => info.visible && info.value.trim()).map((info) => (
              <div className={`custom-info-item ${info.displayType === "text" ? "basic-info-item basic-info-item--wide custom-info-item--text" : "custom-info-item--website"}`} key={info.id}>
                <span className="custom-info-marker"><CustomInfoMarker info={info} copy={copy} /></span>
                <strong>{info.value}</strong>
              </div>
            ))}
          </div>
          {visibility.avatar && resume.profile.avatar && <img className="resume-avatar" src={resume.profile.avatar} alt={copy.editor.avatarAlt} />}
        </div>
      </section>
      {resume.sections.filter((section) => section.enabled).map((section) => (
        <section className="resume-section" key={section.id}>
          <h2><span>{getSectionTitle(section, copy)}</span></h2>
          {section.items.map((item) => (
            <article className="resume-entry" key={item.id}>
              {(item.title || item.subtitle || item.date) && (
                <div className="resume-entry__heading">
                  <strong>{item.title}</strong>
                  <span>{item.subtitle}</span>
                  <time>{item.date}</time>
                </div>
              )}
              {item.content && <div className="resume-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{preserveMarkdownBlankLines(item.content)}</ReactMarkdown></div>}
            </article>
          ))}
        </section>
      ))}
    </article>
  );
});

const ResumePreview = ({ resume, sourceRef, copy, onImport, onBackup, onExport }: { resume: ResumeData; sourceRef: RefObject<HTMLDivElement | null>; copy: UiCopy; onImport: () => void; onBackup: () => void; onExport: () => void }) => {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [error, setError] = useState("");
  const isRenderingRef = useRef(false);
  const queuedMarkupRef = useRef<string | null>(null);
  const previewerRef = useRef<PreviewerInstance | null>(null);
  const mountedRef = useRef(true);

  const destroyPreviewer = () => {
    const previewer = previewerRef.current;
    previewerRef.current = null;
    if (previewer?.chunker?.pagesArea) previewer.chunker.destroy?.();
    if (previewer?.polisher?.styleEl) previewer.polisher.destroy?.();
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      queuedMarkupRef.current = null;
      destroyPreviewer();
    };
  }, []);

  useEffect(() => {
    const renderPreview = async (markup: string): Promise<void> => {
      if (isRenderingRef.current) {
        queuedMarkupRef.current = markup;
        return;
      }

      const target = targetRef.current;
      if (!target || !mountedRef.current) return;
      isRenderingRef.current = true;
      setIsRendering(true);
      setError("");

      try {
        const { Previewer } = await import("pagedjs");
        destroyPreviewer();
        target.replaceChildren();
        const previewer = new Previewer() as PreviewerInstance;
        previewerRef.current = previewer;
        await previewer.preview(markup, collectPreviewStylesheets(), target);
      } catch {
        if (mountedRef.current) setError(copy.preview.error);
      } finally {
        isRenderingRef.current = false;
        const queuedMarkup = queuedMarkupRef.current;
        queuedMarkupRef.current = null;
        if (queuedMarkup && mountedRef.current) {
          window.setTimeout(() => void renderPreview(queuedMarkup), 80);
        } else if (mountedRef.current) {
          setIsRendering(false);
        }
      }
    };

    const timer = window.setTimeout(() => {
      const markup = sourceRef.current?.innerHTML;
      if (markup) void renderPreview(markup);
    }, 700);
    return () => {
      window.clearTimeout(timer);
    };
  }, [resume, sourceRef, copy]);

  const previewStyle = { "--paper": resume.paperColor } as CSSProperties;

  return (
    <section className="preview-panel" style={previewStyle} aria-label={copy.preview.aria}>
      <div className="preview-panel__header">
        <div><span className="eyebrow">{copy.preview.eyebrow}</span><strong>{copy.preview.title}</strong></div>
        <div className="preview-panel__actions">
          <button className="secondary-command" type="button" onClick={onImport}><FileUp size={16} />{copy.actions.import}</button>
          <button className="secondary-command" type="button" onClick={onBackup}><Save size={16} />{copy.actions.backup}</button>
          <button className="primary-command" type="button" onClick={onExport}><Download size={17} />{copy.actions.export}</button>
        </div>
        <span className="preview-status">{isRendering ? copy.preview.rendering : copy.preview.synced}</span>
      </div>
      {error && <p className="preview-error">{copy.preview.error}</p>}
      <div className="preview-scroll"><div ref={targetRef} className="preview-pages" /></div>
    </section>
  );
};

const App = () => {
  const [language, setLanguage] = useState<Language>(() => window.localStorage.getItem("resume-studio-language") === "en" ? "en" : "zh");
  const copy = languageCopy[language];
  const [resume, setResume] = useState<ResumeData>(() => createSampleResume());
  const [previewResume, setPreviewResume] = useState<ResumeData>(() => createSampleResume());
  const [selection, setSelection] = useState<Selection>("profile");
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [isFontStyleOpen, setIsFontStyleOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("draft");
  const sourceRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.localStorage.setItem("resume-studio-language", language);
  }, [language]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPreviewResume(resume), 900);
    return () => window.clearTimeout(timer);
  }, [resume]);

  useEffect(() => {
    const load = async () => {
      const saved = await window.resumeStudio?.load();
      if (saved?.version === 1 && Array.isArray(saved.sections)) setResume(normalizeResume(saved));
      else {
        const browserDraft = window.localStorage.getItem("resume-studio-draft");
        if (browserDraft) {
          try { setResume(normalizeResume(JSON.parse(browserDraft) as Partial<ResumeData>)); } catch { window.localStorage.removeItem("resume-studio-draft"); }
        }
      }
      setIsLoaded(true);
    };
    void load();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    setSaveState("saving");
    const timer = window.setTimeout(async () => {
      window.localStorage.setItem("resume-studio-draft", JSON.stringify(resume));
      if (window.resumeStudio) await window.resumeStudio.save(resume);
      setSaveState("saved");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [resume, isLoaded]);

  const selectedSection = useMemo(() => resume.sections.find((section) => section.id === selection), [resume.sections, selection]);
  const patchProfile = (patch: Partial<ResumeData["profile"]>) => setResume((current) => ({ ...current, profile: { ...current.profile, ...patch } }));
  const toggleProfileVisibility = (field: keyof ProfileVisibility) => setResume((current) => ({ ...current, profileVisibility: { ...current.profileVisibility, [field]: !current.profileVisibility[field] } }));
  const patchLayout = (patch: Partial<Pick<ResumeData, "moduleSpacing" | "lineSpacing" | "pageMargin">>) => setResume((current) => ({ ...current, ...patch }));
  const resetLayout = () => setResume((current) => ({ ...current, ...defaultLayoutSettings }));
  const patchCustomInfo = (id: string, patch: Partial<ResumeCustomInfo>) => setResume((current) => ({ ...current, profile: { ...current.profile, customInfos: current.profile.customInfos.map((info) => info.id === id ? { ...info, ...patch } : info) } }));
  const toggleCustomInfoVisibility = (id: string) => setResume((current) => ({ ...current, profile: { ...current.profile, customInfos: current.profile.customInfos.map((info) => info.id === id ? { ...info, visible: !info.visible } : info) } }));
  const addCustomInfo = () => setResume((current) => ({ ...current, profile: { ...current.profile, customInfos: [...current.profile.customInfos, createCustomInfo()] } }));
  const deleteCustomInfo = (id: string) => setResume((current) => ({ ...current, profile: { ...current.profile, customInfos: current.profile.customInfos.filter((info) => info.id !== id) } }));
  const patchSection = (id: string, patch: Partial<ResumeSection>) => setResume((current) => ({ ...current, sections: current.sections.map((section) => section.id === id ? { ...section, ...patch } : section) }));
  const toggleSectionVisibility = (id: string) => setResume((current) => ({ ...current, sections: current.sections.map((section) => section.id === id ? { ...section, enabled: !section.enabled } : section) }));

  const reorderSections = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setResume((current) => {
      const oldIndex = current.sections.findIndex((section) => section.id === active.id);
      const newIndex = current.sections.findIndex((section) => section.id === over.id);
      return { ...current, sections: arrayMove(current.sections, oldIndex, newIndex) };
    });
  };

  const reorderItems = (section: ResumeSection, { active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = section.items.findIndex((item) => item.id === active.id);
    const newIndex = section.items.findIndex((item) => item.id === over.id);
    patchSection(section.id, { items: arrayMove(section.items, oldIndex, newIndex) });
  };

  const addSection = () => {
    const section = createSection();
    setResume((current) => ({ ...current, sections: [...current.sections, section] }));
    setSelection(section.id);
  };

  const deleteSection = (id: string) => {
    setResume((current) => ({ ...current, sections: current.sections.filter((section) => section.id !== id) }));
    if (selection === id) setSelection("profile");
  };

  const changeSectionType = (section: ResumeSection, type: SectionType) => {
    patchSection(section.id, { type, title: section.title === sectionNames[section.type] ? sectionNames[type] : section.title });
  };

  const chooseAvatar = async () => {
    if (window.resumeStudio) {
      const avatar = await window.resumeStudio.selectAvatar();
      if (avatar) patchProfile({ avatar });
      return;
    }
    avatarInputRef.current?.click();
  };

  const handleAvatarFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") patchProfile({ avatar: reader.result });
    });
    reader.readAsDataURL(file);
  };

  const exportPdf = async () => {
    if (window.resumeStudio) {
      setPreviewResume(resume);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 80));
      await window.resumeStudio.exportPdf(resume.profile.name || (language === "en" ? "My Resume" : "我的简历"));
    }
    else window.print();
  };

  const backup = async () => {
    if (window.resumeStudio) await window.resumeStudio.backup(resume);
    else {
      const blob = new Blob([JSON.stringify(resume, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = language === "en" ? "resume.backup.json" : "我的简历.resume.json";
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  const applyImportedData = (data: unknown) => {
    if (typeof data !== "object" || data === null) {
      window.alert(copy.alerts.invalidData);
      return;
    }
    const candidate = data as Partial<ResumeData>;
    if (candidate.version !== 1 || !Array.isArray(candidate.sections)) {
      window.alert(copy.alerts.invalidStructure);
      return;
    }
    setResume(normalizeResume(candidate));
    setSelection("profile");
    setSaveState("imported");
  };

  const importData = async () => {
    if (window.resumeStudio) {
      const result = await window.resumeStudio.importData();
      if (!result) return;
      if (result.error) {
        window.alert(result.error === "format" ? copy.alerts.format : copy.alerts.json);
        return;
      }
      applyImportedData(result.data);
      return;
    }
    importInputRef.current?.click();
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      window.alert(copy.alerts.format);
      return;
    }
    try {
      applyImportedData(JSON.parse(await file.text()) as unknown);
    } catch {
      window.alert(copy.alerts.json);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          <div className="app-brand"><FilePlus2 size={22} /><span>Resume Studio</span><small>{copy.brandSubtitle}</small></div>
          <div className="style-menu">
            <button className="style-command" type="button" aria-expanded={isStyleModalOpen} onClick={() => { setIsStyleModalOpen((open) => !open); setIsFontStyleOpen(false); setIsLayoutOpen(false); }}><Palette size={16} />{copy.style.button}</button>
            {isStyleModalOpen && <section className="style-dropdown" role="dialog" aria-label={copy.style.aria} onClick={(event) => event.stopPropagation()}>
              <div className="style-dropdown__header"><div><span className="eyebrow">{copy.style.eyebrow}</span><h2>{copy.style.title}</h2></div><IconButton label={copy.style.close} onClick={() => setIsStyleModalOpen(false)}><X size={18} /></IconButton></div>
              <p className="style-dropdown__hint">{copy.style.hint}</p>
              <div className="dropdown-color-list">
                <ColorField label={copy.style.accent} value={resume.accentColor} onChange={(accentColor) => setResume((current) => ({ ...current, accentColor }))} />
                <ColorField label={copy.style.sectionBar} value={resume.sectionBarColor} onChange={(sectionBarColor) => setResume((current) => ({ ...current, sectionBarColor }))} />
                <ColorField label={copy.style.paper} value={resume.paperColor} onChange={(paperColor) => setResume((current) => ({ ...current, paperColor }))} />
              </div>
              <div className="style-dropdown__footer"><button className="primary-command" type="button" onClick={() => setIsStyleModalOpen(false)}>{copy.style.done}</button></div>
            </section>}
          </div>
          <div className="style-menu">
            <button className="style-command" type="button" aria-expanded={isFontStyleOpen} onClick={() => { setIsFontStyleOpen((open) => !open); setIsStyleModalOpen(false); setIsLayoutOpen(false); }}><Type size={16} />{copy.font.button}</button>
            {isFontStyleOpen && <section className="style-dropdown font-dropdown" role="dialog" aria-label={copy.font.aria} onClick={(event) => event.stopPropagation()}>
              <div className="style-dropdown__header"><div><span className="eyebrow">{copy.font.eyebrow}</span><h2>{copy.font.title}</h2></div><IconButton label={copy.font.close} onClick={() => setIsFontStyleOpen(false)}><X size={18} /></IconButton></div>
              <p className="style-dropdown__hint">{copy.font.hint}</p>
              <div className="font-setting-list">
                <label className="field"><span>{copy.font.family}</span><select value={resume.fontFamily} onChange={(event) => setResume((current) => ({ ...current, fontFamily: event.target.value }))}>
                  {fontOptions.map((option) => <option key={option.value} value={option.value}>{language === "en" ? option.en : option.zh}</option>)}
                </select></label>
                <ColorField label={copy.font.moduleColor} value={resume.moduleTextColor} onChange={(moduleTextColor) => setResume((current) => ({ ...current, moduleTextColor }))} />
                <ColorField label={copy.font.subtitleColor} value={resume.subtitleTextColor} onChange={(subtitleTextColor) => setResume((current) => ({ ...current, subtitleTextColor }))} />
                <ColorField label={copy.font.boldColor} value={resume.boldTextColor} onChange={(boldTextColor) => setResume((current) => ({ ...current, boldTextColor }))} />
                <label className="font-scale-field"><span>{copy.font.size} <strong>{Math.round(resume.fontScale * 100)}%</strong></span><input type="range" min="0.8" max="1.3" step="0.05" value={resume.fontScale} onChange={(event) => setResume((current) => ({ ...current, fontScale: Number(event.target.value) }))} /><div className="font-scale-range"><small>{copy.font.small}</small><small>{copy.font.defaultSize}</small><small>{copy.font.large}</small></div></label>
              </div>
              <div className="style-dropdown__footer"><button className="primary-command" type="button" onClick={() => setIsFontStyleOpen(false)}>{copy.font.done}</button></div>
            </section>}
          </div>
          <div className="style-menu">
            <button className="style-command" type="button" aria-expanded={isLayoutOpen} onClick={() => { setIsLayoutOpen((open) => !open); setIsStyleModalOpen(false); setIsFontStyleOpen(false); }}><SlidersHorizontal size={16} />{copy.layout.button}</button>
            {isLayoutOpen && <section className="style-dropdown layout-dropdown" role="dialog" aria-label={copy.layout.aria} onClick={(event) => event.stopPropagation()}>
              <div className="style-dropdown__header"><div><span className="eyebrow">{copy.layout.eyebrow}</span><h2>{copy.layout.title}</h2></div><IconButton label={copy.layout.close} onClick={() => setIsLayoutOpen(false)}><X size={18} /></IconButton></div>
              <div className="layout-setting-list">
                <label className="layout-setting"><span>{copy.layout.spacing} <strong>{resume.moduleSpacing}</strong></span><input type="range" min="8" max="32" step="1" value={resume.moduleSpacing} onChange={(event) => patchLayout({ moduleSpacing: Number(event.target.value) })} /></label>
                <label className="layout-setting"><span>{copy.layout.line} <strong>{resume.lineSpacing.toFixed(2)}</strong></span><input type="range" min="0.4" max="1.2" step="0.05" value={resume.lineSpacing} onChange={(event) => patchLayout({ lineSpacing: Number(event.target.value) })} /></label>
                <label className="layout-setting"><span>{copy.layout.margin} <strong>{resume.pageMargin}</strong></span><input type="range" min="16" max="48" step="1" value={resume.pageMargin} onChange={(event) => patchLayout({ pageMargin: Number(event.target.value) })} /></label>
              </div>
              <div className="style-dropdown__footer"><button className="secondary-command" type="button" onClick={resetLayout}>{copy.layout.reset}</button><button className="primary-command" type="button" onClick={() => setIsLayoutOpen(false)}>{copy.layout.done}</button></div>
            </section>}
          </div>
        </div>
        <div className="header-actions">
          <span className="save-state"><Save size={15} />{copy.save[saveState]}</span>
          <button className="language-command" type="button" onClick={() => setLanguage((current) => current === "zh" ? "en" : "zh")} title={copy.switchLanguage} aria-label={copy.switchLanguage}>{copy.languageButton}</button>
          <a className="github-star-command" href="https://github.com/qiqizizzz/Resume-Studio" target="_blank" rel="noreferrer" aria-label={copy.actions.starAria}><SiGithub size={15} /><Star className="github-star-command__star" size={14} fill="currentColor" /><span>{copy.actions.star}</span></a>
          <input ref={importInputRef} className="visually-hidden-input" type="file" accept=".json,application/json" onChange={(event) => { void handleImportFile(event.target.files?.[0]); event.target.value = ""; }} />
        </div>
      </header>
      <main className="workbench">
        <aside className="navigation-panel">
          <div className="panel-heading"><div><span className="eyebrow">{copy.navigation.eyebrow}</span><h2>{copy.navigation.title}</h2></div><IconButton label={copy.navigation.add} onClick={addSection}><Plus size={18} /></IconButton></div>
          <button className={`profile-row ${selection === "profile" ? "is-active" : ""}`} type="button" onClick={() => setSelection("profile")}><span>{copy.navigation.profile}</span><ChevronDown size={16} /></button>
          <DndContext collisionDetection={closestCenter} onDragEnd={reorderSections}>
            <SortableContext items={resume.sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
              <div className="section-list">
                {resume.sections.map((section) => <SortableSectionRow key={section.id} section={section} active={selection === section.id} onSelect={() => setSelection(section.id)} onToggle={() => toggleSectionVisibility(section.id)} onDelete={() => deleteSection(section.id)} copy={copy} />)}
              </div>
            </SortableContext>
          </DndContext>
          <button className="add-section" type="button" onClick={addSection}><Plus size={16} />{copy.navigation.add}</button>
          <p className="panel-note">{copy.navigation.note}</p>
        </aside>
        <section className="editor-panel">
          {selection === "profile" ? (
            <>
              <div className="editor-title"><div><span className="eyebrow">{copy.editor.eyebrow}</span><h2>{copy.navigation.profile}</h2></div><div className="resume-header-fields"><label className="field title-field title-field--header"><span>{copy.editor.resumeTitle}</span><input value={resume.title} onChange={(event) => setResume((current) => ({ ...current, title: event.target.value }))} placeholder={copy.editor.titlePlaceholder} /></label><label className="field description-field description-field--header"><span>{copy.editor.description}</span><input value={resume.description} onChange={(event) => setResume((current) => ({ ...current, description: event.target.value }))} placeholder={copy.editor.descriptionPlaceholder} /></label></div></div>
              <div className="profile-editor">
                <div className="avatar-editor">
                  {resume.profile.avatar && resume.profileVisibility.avatar ? <img src={resume.profile.avatar} alt={copy.editor.avatarAlt} /> : <div className="avatar-placeholder">{copy.editor.avatar}</div>}
                  <button className="secondary-command" type="button" onClick={chooseAvatar}><ImagePlus size={16} />{copy.editor.chooseAvatar}</button>
                  <button className="avatar-visibility" type="button" title={resume.profileVisibility.avatar ? copy.editor.hideAvatar : copy.editor.showAvatar} aria-label={resume.profileVisibility.avatar ? copy.editor.hideAvatar : copy.editor.showAvatar} onClick={() => toggleProfileVisibility("avatar")}>{resume.profileVisibility.avatar ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                  <input ref={avatarInputRef} className="visually-hidden-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleAvatarFile(event.target.files?.[0])} />
                </div>
                <div className="profile-fields">
                  <Field copy={copy} label={copy.fields.name} value={resume.profile.name} onChange={(name) => patchProfile({ name })} />
                  <Field copy={copy} label={copy.fields.headline} value={resume.profile.headline} onChange={(headline) => patchProfile({ headline })} visible={resume.profileVisibility.headline} onToggleVisibility={() => toggleProfileVisibility("headline")} />
                  <Field copy={copy} label={copy.fields.age} value={resume.profile.age} onChange={(age) => patchProfile({ age })} placeholder={copy.fields.agePlaceholder} visible={resume.profileVisibility.age} onToggleVisibility={() => toggleProfileVisibility("age")} />
                  <Field copy={copy} label={copy.fields.gender} value={resume.profile.gender} onChange={(gender) => patchProfile({ gender })} placeholder={copy.fields.genderPlaceholder} visible={resume.profileVisibility.gender} onToggleVisibility={() => toggleProfileVisibility("gender")} />
                  <Field copy={copy} label={copy.fields.phone} value={resume.profile.phone} onChange={(phone) => patchProfile({ phone })} />
                  <Field copy={copy} label={copy.fields.email} value={resume.profile.email} onChange={(email) => patchProfile({ email })} />
                  <Field copy={copy} label={copy.fields.origin} value={resume.profile.origin} onChange={(origin) => patchProfile({ origin })} visible={resume.profileVisibility.origin} onToggleVisibility={() => toggleProfileVisibility("origin")} />
                  <Field copy={copy} label={copy.fields.location} value={resume.profile.location} onChange={(location) => patchProfile({ location })} visible={resume.profileVisibility.location} onToggleVisibility={() => toggleProfileVisibility("location")} />
                </div>
              </div>
              <div className="custom-info-editor">
                <div className="custom-info-editor__header"><div><span className="eyebrow">{copy.editor.extraEyebrow}</span><h3>{copy.editor.extraTitle}</h3></div><button className="secondary-command" type="button" onClick={addCustomInfo}><Plus size={15} />{copy.editor.addInfo}</button></div>
                <div className="custom-info-list">
                  {resume.profile.customInfos.map((info) => <CustomInfoRow key={info.id} info={info} onChange={(patch) => patchCustomInfo(info.id, patch)} onToggleVisibility={() => toggleCustomInfoVisibility(info.id)} onDelete={() => deleteCustomInfo(info.id)} copy={copy} language={language} />)}
                </div>
              </div>
            </>
          ) : selectedSection ? (
            <>
              <div className="editor-title"><div><span className="eyebrow">{copy.editor.eyebrow}</span><h2>{getSectionTitle(selectedSection, copy)}</h2></div><button className="primary-command" type="button" onClick={() => patchSection(selectedSection.id, { items: [...selectedSection.items, createItem()] })}><Plus size={16} />{copy.editor.addEntry}</button></div>
              <div className="section-settings">
                <Field copy={copy} label={copy.editor.moduleTitle} value={selectedSection.title} onChange={(title) => patchSection(selectedSection.id, { title })} />
                <label className="field"><span>{copy.editor.moduleType}</span><select value={selectedSection.type} onChange={(event) => changeSectionType(selectedSection, event.target.value as SectionType)}>{Object.entries(copy.sectionNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
                <label className="toggle-field"><input type="checkbox" checked={selectedSection.enabled} onChange={() => toggleSectionVisibility(selectedSection.id)} /><span>{copy.editor.showModule}</span></label>
              </div>
              <DndContext collisionDetection={closestCenter} onDragEnd={(event) => reorderItems(selectedSection, event)}>
                <SortableContext items={selectedSection.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                  <div className="entry-list">
                    {selectedSection.items.map((item) => <SortableItem key={item.id} item={item} onChange={(patch) => patchSection(selectedSection.id, { items: selectedSection.items.map((current) => current.id === item.id ? { ...current, ...patch } : current) })} onDelete={() => patchSection(selectedSection.id, { items: selectedSection.items.filter((current) => current.id !== item.id) })} copy={copy} />)}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          ) : null}
        </section>
        <ResumePreview resume={previewResume} sourceRef={sourceRef} copy={copy} onImport={importData} onBackup={backup} onExport={exportPdf} />
      </main>
      <div ref={sourceRef} className="print-source"><ResumeDocument resume={previewResume} copy={copy} /></div>
    </div>
  );
};

const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <label className="color-field"><span>{label}</span><input type="color" value={value} onChange={(event) => onChange(event.target.value)} /></label>
);

export default App;
