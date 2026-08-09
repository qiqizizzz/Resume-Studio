# Resume Studio

[English](README.md) | [简体中文](README.zh-CN.md)

[![GitHub Stars](https://img.shields.io/github/stars/qiqizizzz/Resume-Studio?style=flat-square)](https://github.com/qiqizizzz/Resume-Studio/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/qiqizizzz/Resume-Studio?style=flat-square)](https://github.com/qiqizizzz/Resume-Studio/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/qiqizizzz/Resume-Studio?style=flat-square)](https://github.com/qiqizizzz/Resume-Studio/issues)
[![License](https://img.shields.io/github/license/qiqizizzz/Resume-Studio?style=flat-square)](LICENSE)
[![Deploy to GitHub Pages](https://github.com/qiqizizzz/Resume-Studio/actions/workflows/deploy.yml/badge.svg)](https://github.com/qiqizizzz/Resume-Studio/actions/workflows/deploy.yml)

Resume Studio is a local-first resume editor for creating polished, multi-page A4 resumes. It combines structured sections, Markdown content, live pagination, visual controls, and PDF export in one workspace.

**[Open the live demo](https://qiqizizzz.github.io/Resume-Studio/)** · **[View the source code](https://github.com/qiqizizzz/Resume-Studio)**

## Features

Resume Studio focuses on the following core capabilities:

| Feature | Description |
| --- | --- |
| 1. Live A4 Preview | The resume is rendered on A4 pages as you edit, with automatic pagination when content becomes longer. |
| 2. Structured Resume Sections | Profile, education, skills, work, projects, and custom sections can be edited in one workspace. |
| 3. Flexible Layout Control | Drag sections and entries into a different order, and hide optional fields when they are not needed. |
| 4. Markdown Content | Write experience descriptions with Markdown and GFM features such as lists, bold text, and blank lines. |
| 5. Visual Customization | Adjust fonts, font scale, colors, spacing, page margins, section styles, and avatar presentation. |
| 6. Local-first Privacy | Resume data stays in the desktop app's local storage or the browser's `localStorage`; no resume backend is required. |
| 7. Backup and Import | Export resume data as JSON and restore it later on the same or another device. |
| 8. PDF Export | Use native PDF export in Electron or print the browser preview to a PDF file. |

## Getting Started

### Option 1: Use the online app

Open the [live demo](https://qiqizizzz.github.io/Resume-Studio/) in a browser. No installation is required. Resume data stays in that browser's local storage.

### Option 2: Run it locally

Node.js 20 or newer is recommended.

```bash
npm install
npm run dev
```

The development command starts the Vite server and the Electron window together.

Run the build and lint checks separately when needed:

```bash
npm run build
npm run lint
```

Create a Windows installer with:

```bash
npm run dist:win
```

The installer is written to `release/`.

## Data and Export

Resume content is stored locally. The desktop app uses Electron's local application data directory, while the browser build uses `localStorage`. No resume content is uploaded to a project server.

For the browser build, choose **Save to PDF** in the browser print dialog. The Electron build uses its native PDF export flow.

## License

Resume Studio is released under the [MIT License](LICENSE). Third-party packages and icon sets retain their own licenses.
