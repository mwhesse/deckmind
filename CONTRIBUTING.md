# Contributing to Deckmind

Thank you for your interest in contributing to Deckmind! We welcome contributions from the community. This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/mwhesse/deckmind.git
   cd deckmind
   ```
3. **Set up development environment**:
   ```bash
   # Install server dependencies
   cd server && npm install

   # Install client dependencies
   cd ../client && npm install

   # Build agent Docker image
   cd .. && docker build -t deckmind/agent:latest ./agent
   ```
4. **Start development servers**:
   ```bash
   # Terminal 1: React development server
   cd client && npm start

   # Terminal 2: Node.js development server
   cd ../server && npm run dev
   ```

## 📋 Development Workflow

### 1. Choose an Issue
- Check the [Issues](https://github.com/mwhesse/deckmind/issues) page
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to indicate you're working on it

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 3. Make Changes
- Follow the existing code style
- Write clear, concise commit messages
- Test your changes thoroughly
- Update documentation if needed

### 4. Test Your Changes
```bash
# Run server tests
cd server && npm test

# Run client tests
cd ../client && npm test

# Manual testing
# 1. Start the development servers
# 2. Test your feature in the browser
# 3. Verify no regressions in existing functionality
```

### 5. Submit a Pull Request
- Push your branch to your fork
- Create a Pull Request with a clear description
- Reference any related issues
- Wait for review and address feedback

## 🛠️ Development Guidelines

### Code Style
- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow the existing ESLint configuration
- **Prettier**: Code will be automatically formatted
- **Conventional Commits**: Use conventional commit format

### File Structure
```
deckmind/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts (if needed)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   └── services/       # API service functions
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript type definitions
├── agent/                  # Docker agent image
│   ├── Dockerfile
│   └── scripts/
└── docs/                   # Documentation
```

### Naming Conventions
- **Files**: Use PascalCase for components, camelCase for utilities
- **Functions**: Use camelCase
- **Constants**: Use UPPER_SNAKE_CASE
- **Types**: Use PascalCase with descriptive names

### Testing
- Write unit tests for new functions
- Write integration tests for API endpoints
- Aim for good test coverage (>80%)
- Use descriptive test names

## 🎯 Types of Contributions

### 🐛 Bug Fixes
- Fix reported bugs
- Improve error handling
- Fix security issues

### ✨ Features
- Add new functionality
- Improve existing features
- Enhance user experience

### 📚 Documentation
- Improve existing documentation
- Add new guides and tutorials
- Translate documentation

### 🧪 Testing
- Add missing tests
- Improve test coverage
- Fix failing tests

### 🎨 UI/UX
- Improve user interface
- Enhance user experience
- Add accessibility features

## 📝 Commit Guidelines

Use conventional commits:

```bash
# Features
git commit -m "feat: add user authentication"

# Bug fixes
git commit -m "fix: resolve memory leak in agent containers"

# Documentation
git commit -m "docs: update API documentation"

# Tests
git commit -m "test: add unit tests for user service"

# Refactoring
git commit -m "refactor: simplify agent launch logic"
```

## 🔍 Code Review Process

1. **Automated Checks**: GitHub Actions will run tests and linting
2. **Peer Review**: At least one maintainer will review your PR
3. **Feedback**: Address any requested changes
4. **Approval**: PR will be merged once approved

## 🤝 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help newcomers learn and contribute
- Follow our community guidelines

## 📞 Getting Help

- **Issues**: Use GitHub Issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Discord**: Join our Discord server for real-time help

## 🎉 Recognition

Contributors will be:
- Listed in the repository's contributors
- Mentioned in release notes
- Eligible for special recognition

Thank you for contributing to Deckmind! 🚀