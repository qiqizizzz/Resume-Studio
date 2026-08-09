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

- Live A4 preview with automatic pagination for long resumes
- Sections for profile, education, skills, work, projects, and custom content
- Drag-and-drop section ordering and entry ordering
- Visibility controls for sections and profile fields
- Markdown editing with GFM rendering, lists, bold text, and blank lines
- Content-aware editor height for experience descriptions
- Font, scale, color, spacing, and page margin controls
- Avatar selection and custom contact links with official icons
- JSON backup and import
- Native PDF export in the Electron app and browser print-to-PDF fallback

## Getting Started

Node.js 20 or newer is recommended.

```bash
npm install
npm run dev
```

The development command starts the Vite server and the Electron window together.

Run the checks separately when needed:

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
