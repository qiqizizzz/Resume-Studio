# Resume Studio

Resume Studio 是一个本地优先的多页 A4 简历编辑器。它把内容编辑、模块排序、Markdown 描述和 PDF 输出放在同一个工作区中，适合在电脑上反复调整简历版式。

- [在线使用](https://qiqizizzz.github.io/Resume-Studio/)
- [GitHub 仓库](https://github.com/qiqizizzz/Resume-Studio)

## 功能

- A4 纸张实时预览，内容较长时自动分页
- 基本信息、教育、技能、工作、项目和自定义模块
- 拖动调整模块顺序，也可以调整模块内的经历条目顺序
- 控制模块和个人信息的显示与隐藏
- Markdown 编辑与 GFM 渲染，支持列表、加粗和连续空行
- 经历描述按内容自动调整编辑区高度
- 字体、字号比例、模块颜色、副标题颜色、加粗颜色和页面边距设置
- 头像选择、自定义网站信息和官方图标
- JSON 数据备份与导入
- Electron 桌面版原生导出 PDF，浏览器版使用系统打印保存 PDF

## 运行

### 桌面开发版

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

`npm run dev` 会启动 Vite 开发服务和 Electron 窗口。

### 构建检查

```bash
npm run build
npm run lint
```

### 打包 Windows

```bash
npm run dist:win
```

安装包会生成在 `release/` 目录。

## 在线版

项目通过 GitHub Pages 发布，不需要购买域名或服务器。在线版是纯静态前端应用：

- 简历内容只保存在当前浏览器的本地存储中，不会上传到项目服务器
- 不同访问者之间不会共享编辑内容
- 浏览器导出 PDF 时，在打印对话框中选择“另存为 PDF”
- Electron 桌面版拥有原生文件选择和 PDF 导出能力

仓库中的 `.github/workflows/deploy.yml` 会在 `main` 分支更新后自动构建并发布。若要在自己的仓库使用 Pages：

1. 将项目推送到 GitHub 的 `main` 分支
2. 打开仓库 `Settings` → `Pages`
3. 将 `Source` 设置为 `GitHub Actions`
4. 在 `Actions` 中等待 `Deploy to GitHub Pages` 完成

## 技术栈

- React + TypeScript + Vite
- Electron
- Paged.js
- `@uiw/react-md-editor`、`react-markdown`、`remark-gfm`
- `@dnd-kit`、`lucide-react`、Simple Icons

## 目录说明

```text
src/                 编辑器界面、简历渲染和默认数据
electron/            Electron 主进程与预加载脚本
public/              静态图标资源
.github/workflows/   GitHub Pages 自动部署流程
```

## 许可证

本项目使用 [MIT License](./LICENSE)。第三方依赖和图标资源仍遵循各自的许可证。
