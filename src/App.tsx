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
  { label: "微软雅黑", value: '"Microsoft YaHei", "PingFang SC", sans-serif' },
  { label: "苹方 / 思源黑体", value: '"PingFang SC", "Source Han Sans SC", sans-serif' },
  { label: "宋体", value: 'SimSun, "Songti SC", serif' },
  { label: "黑体", value: 'SimHei, "Heiti SC", sans-serif' },
  { label: "楷体", value: 'KaiTi, "Kaiti SC", serif' },
  { label: "Arial", value: 'Arial, "Microsoft YaHei", sans-serif' },
];

const customInfoDisplayOptions: Array<{ label: string; value: CustomInfoDisplayType }> = [
  { label: "自动识别图标", value: "auto" },
  { label: "选择网站图标", value: "icon" },
  { label: "文字标题", value: "text" },
];

const customInfoIconOptions: Array<{ label: string; value: CustomInfoIcon }> = [
  { label: "通用网站", value: "globe" },
  { label: "GitHub", value: "github" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "邮箱", value: "mail" },
  { label: "Gitee", value: "gitee" },
  { label: "GitLab", value: "gitlab" },
  { label: "代码仓库", value: "git" },
  { label: "链接", value: "link" },
];

const IconButton = ({ label, onClick, children, disabled = false }: { label: string; onClick: () => void; children: ReactNode; disabled?: boolean }) => (
  <button className="icon-button" type="button" title={label} aria-label={label} onClick={onClick} disabled={disabled}>
    {children}
  </button>
);

const getMarkdownEditorHeight = (content: string) => {
  const visualLineCount = content.split(/\r?\n/).reduce((count, line) => count + Math.max(1, Math.ceil(Math.max(line.length, 1) / 82)), 0);
  return Math.max(100, 44 + visualLineCount * 19);
};

const SortableSectionRow = ({ section, active, onSelect, onToggle, onDelete }: { section: ResumeSection; active: boolean; onSelect: () => void; onToggle: () => void; onDelete: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={`section-row ${active ? "is-active" : ""} ${isDragging ? "is-dragging" : ""}`}>
      <button className="drag-handle" type="button" aria-label={`拖动 ${section.title}`} title="拖动调整顺序" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>
      <button className="section-select" type="button" onClick={onSelect}>{section.title || sectionNames[section.type]}</button>
      <button className="visibility-toggle" type="button" title={section.enabled ? "隐藏模块" : "显示模块"} onClick={onToggle} aria-label={section.enabled ? "隐藏模块" : "显示模块"}>
        {section.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
      <IconButton label={`删除 ${section.title}`} onClick={onDelete}><Trash2 size={15} /></IconButton>
    </div>
  );
};

const SortableItem = ({ item, onChange, onDelete }: { item: ResumeItem; onChange: (patch: Partial<ResumeItem>) => void; onDelete: () => void }) => {
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
        <button className="drag-handle" type="button" title="拖动调整经历顺序" aria-label="拖动调整经历顺序" {...attributes} {...listeners}><GripVertical size={17} /></button>
        <span>经历条目</span>
        <IconButton label={isCollapsed ? "展开经历条目" : "折叠经历条目"} onClick={() => setIsCollapsed((collapsed) => !collapsed)}>{isCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}</IconButton>
        <IconButton label="删除条目" onClick={onDelete}><Trash2 size={16} /></IconButton>
      </div>
      {!isCollapsed && <>
        <div className="entry-fields">
          <Field label="名称" value={item.title} onChange={(title) => onChange({ title })} placeholder="例如：华东理工大学 / 项目名称" />
          <Field label="副标题" value={item.subtitle} onChange={(subtitle) => onChange({ subtitle })} placeholder="例如：专业 / 担任角色" />
          <Field label="时间" value={item.date} onChange={(date) => onChange({ date })} placeholder="例如：2026.06 - 至今" />
        </div>
        <label className="markdown-label">描述内容（Markdown）</label>
        <div ref={markdownEditorRef} data-color-mode="light" className="markdown-editor">
          <MDEditor value={contentDraft} onChange={handleContentChange} onBlur={flushContent} preview="edit" height={markdownEditorHeight} visibleDragbar={false} highlightEnable={false} />
        </div>
      </>}
    </article>
  );
};

const Field = ({ label, value, onChange, placeholder = "", visible, onToggleVisibility }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; visible?: boolean; onToggleVisibility?: () => void }) => (
  <label className="field">
    <span className="field-label">{label}{onToggleVisibility && <button className="field-visibility" type="button" title={visible ? `隐藏${label}` : `显示${label}`} aria-label={visible ? `隐藏${label}` : `显示${label}`} onClick={onToggleVisibility}>{visible ? <Eye size={15} /> : <EyeOff size={15} />}</button>}</span>
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

const CustomInfoMarker = ({ info }: { info: ResumeCustomInfo }) => {
  if (info.displayType === "text") return <span className="custom-info-marker__text">{info.label || "信息"}</span>;
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

const CustomInfoRow = ({ info, onChange, onToggleVisibility, onDelete }: { info: ResumeCustomInfo; onChange: (patch: Partial<ResumeCustomInfo>) => void; onToggleVisibility: () => void; onDelete: () => void }) => (
  <div className="custom-info-row">
    <div className="custom-info-row__identity">
      {info.displayType === "icon" ? (
        <select value={info.icon} aria-label="选择网站图标" onChange={(event) => onChange({ icon: event.target.value as CustomInfoIcon })}>
          {customInfoIconOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : info.displayType === "text" ? (
        <input value={info.label} aria-label="文字标题" placeholder="文字标题，例如：博客" onChange={(event) => onChange({ label: event.target.value })} />
      ) : (
        <div className="custom-info-auto"><Globe2 size={15} />自动识别图标</div>
      )}
    </div>
    <input className="custom-info-row__value" value={info.value} aria-label="信息内容" placeholder="信息内容，例如：https://github.com/" onChange={(event) => onChange({ value: event.target.value })} />
    <select className="custom-info-row__display" value={info.displayType} aria-label="信息展示方式" onChange={(event) => onChange({ displayType: event.target.value as CustomInfoDisplayType })}>
      {customInfoDisplayOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    <button className="field-visibility custom-info-row__visibility" type="button" title={info.visible ? "隐藏信息" : "显示信息"} aria-label={info.visible ? "隐藏信息" : "显示信息"} onClick={onToggleVisibility}>{info.visible ? <Eye size={15} /> : <EyeOff size={15} />}</button>
    <IconButton label="删除自定义信息" onClick={onDelete}><Trash2 size={15} /></IconButton>
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

const ResumeDocument = memo(({ resume }: { resume: ResumeData }) => {
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
        <h1>{resume.title || "个人简历"}</h1>
        {resume.description.trim() && <p>{resume.description}</p>}
      </header>
      <section className="resume-section resume-profile-section">
        <h2><span>基本信息</span></h2>
        <div className="resume-profile-content">
          <div className="basic-info-grid">
            <div className="basic-info-item"><span>姓名</span><strong>{resume.profile.name}</strong></div>
            {visibility.headline && <div className="basic-info-item"><span>求职方向</span><strong>{resume.profile.headline}</strong></div>}
            {visibility.age && <div className="basic-info-item"><span>年龄</span><strong>{resume.profile.age}</strong></div>}
            {visibility.gender && <div className="basic-info-item"><span>性别</span><strong>{resume.profile.gender}</strong></div>}
            <div className="basic-info-item"><span>电话</span><strong>{resume.profile.phone}</strong></div>
            <div className="basic-info-item"><span>邮箱</span><strong>{resume.profile.email}</strong></div>
            {visibility.origin && <div className="basic-info-item"><span>籍贯</span><strong>{resume.profile.origin}</strong></div>}
            {visibility.location && <div className="basic-info-item"><span>所在地</span><strong>{resume.profile.location}</strong></div>}
            {resume.profile.customInfos.filter((info) => info.visible && info.value.trim()).map((info) => (
              <div className={`custom-info-item ${info.displayType === "text" ? "basic-info-item basic-info-item--wide custom-info-item--text" : "custom-info-item--website"}`} key={info.id}>
                <span className="custom-info-marker"><CustomInfoMarker info={info} /></span>
                <strong>{info.value}</strong>
              </div>
            ))}
          </div>
          {visibility.avatar && resume.profile.avatar && <img className="resume-avatar" src={resume.profile.avatar} alt="简历头像" />}
        </div>
      </section>
      {resume.sections.filter((section) => section.enabled).map((section) => (
        <section className="resume-section" key={section.id}>
          <h2><span>{section.title || sectionNames[section.type]}</span></h2>
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

const ResumePreview = ({ resume, sourceRef }: { resume: ResumeData; sourceRef: RefObject<HTMLDivElement | null> }) => {
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
        if (mountedRef.current) setError("分页预览暂时不可用，请重新编辑内容后重试");
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
  }, [resume, sourceRef]);

  const previewStyle = { "--paper": resume.paperColor } as CSSProperties;

  return (
    <section className="preview-panel" style={previewStyle} aria-label="多页简历预览">
      <div className="preview-panel__header">
        <div><span className="eyebrow">实时预览</span><strong>连续 A4 页面</strong></div>
        <span className="preview-status">{isRendering ? "正在分页" : "已同步"}</span>
      </div>
      {error && <p className="preview-error">{error}</p>}
      <div className="preview-scroll"><div ref={targetRef} className="preview-pages" /></div>
    </section>
  );
};

const App = () => {
  const [resume, setResume] = useState<ResumeData>(() => createSampleResume());
  const [previewResume, setPreviewResume] = useState<ResumeData>(() => createSampleResume());
  const [selection, setSelection] = useState<Selection>("profile");
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [isFontStyleOpen, setIsFontStyleOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveState, setSaveState] = useState("本地草稿");
  const sourceRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

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
    setSaveState("正在保存");
    const timer = window.setTimeout(async () => {
      window.localStorage.setItem("resume-studio-draft", JSON.stringify(resume));
      if (window.resumeStudio) await window.resumeStudio.save(resume);
      setSaveState("已保存到本地");
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
      await window.resumeStudio.exportPdf(resume.profile.name || "我的简历");
    }
    else window.print();
  };

  const backup = async () => {
    if (window.resumeStudio) await window.resumeStudio.backup(resume);
    else {
      const blob = new Blob([JSON.stringify(resume, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "我的简历.resume.json";
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  const applyImportedData = (data: unknown) => {
    if (typeof data !== "object" || data === null) {
      window.alert("导入失败：文件格式错误，请选择有效的 JSON 简历数据");
      return;
    }
    const candidate = data as Partial<ResumeData>;
    if (candidate.version !== 1 || !Array.isArray(candidate.sections)) {
      window.alert("导入失败：JSON 结构错误，请使用备份数据生成的文件");
      return;
    }
    setResume(normalizeResume(candidate));
    setSelection("profile");
    setSaveState("已导入数据");
  };

  const importData = async () => {
    if (window.resumeStudio) {
      const result = await window.resumeStudio.importData();
      if (!result) return;
      if (result.error) {
        window.alert(result.error === "format" ? "导入失败：只支持 JSON 格式文件" : "导入失败：JSON 文件解析失败");
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
      window.alert("导入失败：只支持 JSON 格式文件");
      return;
    }
    try {
      applyImportedData(JSON.parse(await file.text()) as unknown);
    } catch {
      window.alert("导入失败：JSON 文件解析失败");
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          <div className="app-brand"><FilePlus2 size={22} /><span>Resume Studio</span><small>本地简历编辑器</small></div>
          <div className="style-menu">
            <button className="style-command" type="button" aria-expanded={isStyleModalOpen} onClick={() => { setIsStyleModalOpen((open) => !open); setIsFontStyleOpen(false); setIsLayoutOpen(false); }}><Palette size={16} />模版样式</button>
            {isStyleModalOpen && <section className="style-dropdown" role="dialog" aria-label="模版样式设置" onClick={(event) => event.stopPropagation()}>
              <div className="style-dropdown__header"><div><span className="eyebrow">外观设置</span><h2>模版样式</h2></div><IconButton label="关闭模版样式" onClick={() => setIsStyleModalOpen(false)}><X size={18} /></IconButton></div>
              <p className="style-dropdown__hint">调整后会立即同步到预览和 PDF 导出</p>
              <div className="dropdown-color-list">
                <ColorField label="模块主色" value={resume.accentColor} onChange={(accentColor) => setResume((current) => ({ ...current, accentColor }))} />
                <ColorField label="标题栏底色" value={resume.sectionBarColor} onChange={(sectionBarColor) => setResume((current) => ({ ...current, sectionBarColor }))} />
                <ColorField label="简历背景色" value={resume.paperColor} onChange={(paperColor) => setResume((current) => ({ ...current, paperColor }))} />
              </div>
              <div className="style-dropdown__footer"><button className="primary-command" type="button" onClick={() => setIsStyleModalOpen(false)}>完成</button></div>
            </section>}
          </div>
          <div className="style-menu">
            <button className="style-command" type="button" aria-expanded={isFontStyleOpen} onClick={() => { setIsFontStyleOpen((open) => !open); setIsStyleModalOpen(false); setIsLayoutOpen(false); }}><Type size={16} />字体样式</button>
            {isFontStyleOpen && <section className="style-dropdown font-dropdown" role="dialog" aria-label="字体样式设置" onClick={(event) => event.stopPropagation()}>
              <div className="style-dropdown__header"><div><span className="eyebrow">文字设置</span><h2>字体样式</h2></div><IconButton label="关闭字体样式" onClick={() => setIsFontStyleOpen(false)}><X size={18} /></IconButton></div>
              <p className="style-dropdown__hint">字号按默认层级等比例缩放，预览和 PDF 会同步更新</p>
              <div className="font-setting-list">
                <label className="field"><span>字体</span><select value={resume.fontFamily} onChange={(event) => setResume((current) => ({ ...current, fontFamily: event.target.value }))}>
                  {fontOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select></label>
                <ColorField label="模块字体颜色" value={resume.moduleTextColor} onChange={(moduleTextColor) => setResume((current) => ({ ...current, moduleTextColor }))} />
                <ColorField label="副标题颜色" value={resume.subtitleTextColor} onChange={(subtitleTextColor) => setResume((current) => ({ ...current, subtitleTextColor }))} />
                <ColorField label="Markdown 加粗颜色" value={resume.boldTextColor} onChange={(boldTextColor) => setResume((current) => ({ ...current, boldTextColor }))} />
                <label className="font-scale-field"><span>字体大小 <strong>{Math.round(resume.fontScale * 100)}%</strong></span><input type="range" min="0.8" max="1.3" step="0.05" value={resume.fontScale} onChange={(event) => setResume((current) => ({ ...current, fontScale: Number(event.target.value) }))} /><div className="font-scale-range"><small>较小</small><small>默认</small><small>较大</small></div></label>
              </div>
              <div className="style-dropdown__footer"><button className="primary-command" type="button" onClick={() => setIsFontStyleOpen(false)}>完成</button></div>
            </section>}
          </div>
          <div className="style-menu">
            <button className="style-command" type="button" aria-expanded={isLayoutOpen} onClick={() => { setIsLayoutOpen((open) => !open); setIsStyleModalOpen(false); setIsFontStyleOpen(false); }}><SlidersHorizontal size={16} />排版设置</button>
            {isLayoutOpen && <section className="style-dropdown layout-dropdown" role="dialog" aria-label="排版设置" onClick={(event) => event.stopPropagation()}>
              <div className="style-dropdown__header"><div><span className="eyebrow">页面设置</span><h2>排版设置</h2></div><IconButton label="关闭排版设置" onClick={() => setIsLayoutOpen(false)}><X size={18} /></IconButton></div>
              <div className="layout-setting-list">
                <label className="layout-setting"><span>模块上下间距 <strong>{resume.moduleSpacing}</strong></span><input type="range" min="8" max="32" step="1" value={resume.moduleSpacing} onChange={(event) => patchLayout({ moduleSpacing: Number(event.target.value) })} /></label>
                <label className="layout-setting"><span>行间距 <strong>{resume.lineSpacing.toFixed(2)}</strong></span><input type="range" min="0.4" max="1.2" step="0.05" value={resume.lineSpacing} onChange={(event) => patchLayout({ lineSpacing: Number(event.target.value) })} /></label>
                <label className="layout-setting"><span>上下边距 <strong>{resume.pageMargin}</strong></span><input type="range" min="16" max="48" step="1" value={resume.pageMargin} onChange={(event) => patchLayout({ pageMargin: Number(event.target.value) })} /></label>
              </div>
              <div className="style-dropdown__footer"><button className="secondary-command" type="button" onClick={resetLayout}>重置</button><button className="primary-command" type="button" onClick={() => setIsLayoutOpen(false)}>完成</button></div>
            </section>}
          </div>
        </div>
        <div className="header-actions">
          <span className="save-state"><Save size={15} />{saveState}</span>
          <a className="github-star-command" href="https://github.com/qiqizizzz/Resume-Studio" target="_blank" rel="noreferrer" aria-label="打开 GitHub 项目并支持 Star"><SiGithub size={15} /><Star className="github-star-command__star" size={14} fill="currentColor" /><span>Star 项目</span></a>
          <button className="secondary-command" type="button" onClick={importData}><FileUp size={16} />导入数据</button>
          <button className="secondary-command" type="button" onClick={backup}><Save size={16} />备份数据</button>
          <button className="primary-command" type="button" onClick={exportPdf}><Download size={17} />导出 PDF</button>
          <input ref={importInputRef} className="visually-hidden-input" type="file" accept=".json,application/json" onChange={(event) => { void handleImportFile(event.target.files?.[0]); event.target.value = ""; }} />
        </div>
      </header>
      <main className="workbench">
        <aside className="navigation-panel">
          <div className="panel-heading"><div><span className="eyebrow">简历结构</span><h2>模块顺序</h2></div><IconButton label="新增模块" onClick={addSection}><Plus size={18} /></IconButton></div>
          <button className={`profile-row ${selection === "profile" ? "is-active" : ""}`} type="button" onClick={() => setSelection("profile")}><span>基本信息</span><ChevronDown size={16} /></button>
          <DndContext collisionDetection={closestCenter} onDragEnd={reorderSections}>
            <SortableContext items={resume.sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
              <div className="section-list">
                {resume.sections.map((section) => <SortableSectionRow key={section.id} section={section} active={selection === section.id} onSelect={() => setSelection(section.id)} onToggle={() => toggleSectionVisibility(section.id)} onDelete={() => deleteSection(section.id)} />)}
              </div>
            </SortableContext>
          </DndContext>
          <button className="add-section" type="button" onClick={addSection}><Plus size={16} />新增模块</button>
          <p className="panel-note">拖动模块左侧手柄可调整简历中的显示顺序</p>
        </aside>
        <section className="editor-panel">
          {selection === "profile" ? (
            <>
              <div className="editor-title"><div><span className="eyebrow">编辑模块</span><h2>基本信息</h2></div><div className="resume-header-fields"><label className="field title-field title-field--header"><span>简历标题</span><input value={resume.title} onChange={(event) => setResume((current) => ({ ...current, title: event.target.value }))} placeholder="例如：个人简历" /></label><label className="field description-field description-field--header"><span>简历描述</span><input value={resume.description} onChange={(event) => setResume((current) => ({ ...current, description: event.target.value }))} placeholder="例如：前端开发工程师" /></label></div></div>
              <div className="profile-editor">
                <div className="avatar-editor">
                  {resume.profile.avatar && resume.profileVisibility.avatar ? <img src={resume.profile.avatar} alt="头像预览" /> : <div className="avatar-placeholder">头像</div>}
                  <button className="secondary-command" type="button" onClick={chooseAvatar}><ImagePlus size={16} />选择头像</button>
                  <button className="avatar-visibility" type="button" title={resume.profileVisibility.avatar ? "隐藏头像" : "显示头像"} aria-label={resume.profileVisibility.avatar ? "隐藏头像" : "显示头像"} onClick={() => toggleProfileVisibility("avatar")}>{resume.profileVisibility.avatar ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                  <input ref={avatarInputRef} className="visually-hidden-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleAvatarFile(event.target.files?.[0])} />
                </div>
                <div className="profile-fields">
                  <Field label="姓名" value={resume.profile.name} onChange={(name) => patchProfile({ name })} />
                  <Field label="求职标题" value={resume.profile.headline} onChange={(headline) => patchProfile({ headline })} visible={resume.profileVisibility.headline} onToggleVisibility={() => toggleProfileVisibility("headline")} />
                  <Field label="年龄" value={resume.profile.age} onChange={(age) => patchProfile({ age })} placeholder="例如：21岁" visible={resume.profileVisibility.age} onToggleVisibility={() => toggleProfileVisibility("age")} />
                  <Field label="性别" value={resume.profile.gender} onChange={(gender) => patchProfile({ gender })} placeholder="例如：女" visible={resume.profileVisibility.gender} onToggleVisibility={() => toggleProfileVisibility("gender")} />
                  <Field label="手机号码" value={resume.profile.phone} onChange={(phone) => patchProfile({ phone })} />
                  <Field label="邮箱" value={resume.profile.email} onChange={(email) => patchProfile({ email })} />
                  <Field label="籍贯" value={resume.profile.origin} onChange={(origin) => patchProfile({ origin })} visible={resume.profileVisibility.origin} onToggleVisibility={() => toggleProfileVisibility("origin")} />
                  <Field label="所在地" value={resume.profile.location} onChange={(location) => patchProfile({ location })} visible={resume.profileVisibility.location} onToggleVisibility={() => toggleProfileVisibility("location")} />
                </div>
              </div>
              <div className="custom-info-editor">
                <div className="custom-info-editor__header"><div><span className="eyebrow">补充信息</span><h3>自定义信息</h3></div><button className="secondary-command" type="button" onClick={addCustomInfo}><Plus size={15} />添加信息</button></div>
                <div className="custom-info-list">
                  {resume.profile.customInfos.map((info) => <CustomInfoRow key={info.id} info={info} onChange={(patch) => patchCustomInfo(info.id, patch)} onToggleVisibility={() => toggleCustomInfoVisibility(info.id)} onDelete={() => deleteCustomInfo(info.id)} />)}
                </div>
              </div>
            </>
          ) : selectedSection ? (
            <>
              <div className="editor-title"><div><span className="eyebrow">编辑模块</span><h2>{selectedSection.title || sectionNames[selectedSection.type]}</h2></div><button className="primary-command" type="button" onClick={() => patchSection(selectedSection.id, { items: [...selectedSection.items, createItem()] })}><Plus size={16} />新增条目</button></div>
              <div className="section-settings">
                <Field label="模块标题" value={selectedSection.title} onChange={(title) => patchSection(selectedSection.id, { title })} />
                <label className="field"><span>模块类型</span><select value={selectedSection.type} onChange={(event) => changeSectionType(selectedSection, event.target.value as SectionType)}>{Object.entries(sectionNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
                <label className="toggle-field"><input type="checkbox" checked={selectedSection.enabled} onChange={() => toggleSectionVisibility(selectedSection.id)} /><span>在简历中显示此模块</span></label>
              </div>
              <DndContext collisionDetection={closestCenter} onDragEnd={(event) => reorderItems(selectedSection, event)}>
                <SortableContext items={selectedSection.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                  <div className="entry-list">
                    {selectedSection.items.map((item) => <SortableItem key={item.id} item={item} onChange={(patch) => patchSection(selectedSection.id, { items: selectedSection.items.map((current) => current.id === item.id ? { ...current, ...patch } : current) })} onDelete={() => patchSection(selectedSection.id, { items: selectedSection.items.filter((current) => current.id !== item.id) })} />)}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          ) : null}
        </section>
        <ResumePreview resume={previewResume} sourceRef={sourceRef} />
      </main>
      <div ref={sourceRef} className="print-source"><ResumeDocument resume={previewResume} /></div>
    </div>
  );
};

const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <label className="color-field"><span>{label}</span><input type="color" value={value} onChange={(event) => onChange(event.target.value)} /></label>
);

export default App;
