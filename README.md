# Resume Studio

一个本地运行的多页 A4 简历编辑器，使用 Electron + React + TypeScript 构建。

## 当前功能

- 多页 A4 实时预览，内容超过一页后自动分页
- 基本信息、教育、技能、工作、项目和自定义模块
- 模块整体排序、模块显示/隐藏、经历条目排序
- Markdown 描述编辑与简历内渲染
- 本地自动保存、JSON 备份、头像选择
- Electron 原生 PDF 导出

## 开发

```bash
npm install
npm run dev
```

## 打包 Windows

```bash
npm run dist:win
```

输出位于 `release/`。数据默认保存在 Electron 的本地应用数据目录，不上传网络。

## 发布到 GitHub Pages

这个项目也可以作为纯静态网站发布，不需要购买域名或服务器。在线版的数据只保存在每位用户自己的浏览器中。

1. 在 GitHub 新建一个仓库，例如 `ResumeStudio`，不要勾选自动创建 README
2. 在项目目录执行以下命令，把代码推送到仓库（将地址替换成你的仓库地址）

```bash
git init
git add .
git commit -m "feat: initial Resume Studio"
git branch -M main
git remote add origin https://github.com/你的用户名/ResumeStudio.git
git push -u origin main
```

3. 打开 GitHub 仓库的 `Settings` → `Pages`，将 `Source` 设置为 `GitHub Actions`
4. 打开 `Actions`，等待 `Deploy to GitHub Pages` 工作流完成
5. 访问 `https://你的用户名.github.io/ResumeStudio/`

在线版的“导出 PDF”会调用浏览器打印功能，请在打印对话框中选择“另存为 PDF”。Electron 桌面版仍然使用原生 PDF 导出。
