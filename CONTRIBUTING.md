# Contributing to Kagaz 📝

First off, thank you for considering contributing to Kagaz! It's people like you that make Kagaz a great tool for everyone.

Here is a quick guide on how you can help improve Kagaz.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)

---

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

When reporting a bug, please include:
- **Use a clear and descriptive title.**
- **Steps to reproduce the issue.**
- **Expected behavior vs Actual behavior.**
- **Screenshots or error trace logs if applicable.**
- **Your OS version and app version.**

### Suggesting Enhancements

Feature requests are always welcome!
- Explain **why** this feature would be useful to users.
- Describe **how** you envision the feature working.

### Your First Code Contribution

Unsure where to start? Look for open issues with labels:
- `good first issue` - Beginner friendly tasks.
- `help wanted` - Features or bug fixes where extra help is welcomed.

---

## Development Setup

1. **Fork the repository** on GitHub.
2. **Clone your fork locally**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/kagaz.git
   cd kagaz
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a topic branch**:
   ```bash
   git checkout -b feature/amazing-new-feature
   # or
   git checkout -b fix/issue-description
   ```
5. **Run the development app**:
   ```bash
   npm run app
   ```

---

## Pull Request Process

1. Make your code changes and ensure the app builds cleanly:
   ```bash
   npm run build
   ```
2. Commit your changes with clear, concise commit messages:
   ```bash
   git commit -m "feat: add dark mode toggle to sidebar"
   ```
3. Push to your fork:
   ```bash
   git push origin feature/amazing-new-feature
   ```
4. Open a **Pull Request (PR)** against the `main` branch of the original Kagaz repository.
5. Fill out the PR template completely and link any related issues (e.g. `Fixes #12`).

---

## Style Guidelines

- **TypeScript**: Use strict typing where possible. Avoid `any`.
- **React**: Preferred functional components with React Hooks.
- **Styling**: Utilize Tailwind CSS classes consistent with existing design patterns.
- **File Naming**: Use `PascalCase` for React components (`NoteEditor.tsx`) and `camelCase` for utilities/services (`noteService.ts`).

Thank you for contributing to Kagaz! 🚀
