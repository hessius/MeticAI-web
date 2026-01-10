# MeticAI - Espresso Profile Generator

MeticAI is a web application that helps you generate customized espresso profiles based on coffee bag images and your taste preferences. Upload a photo of your coffee bag, describe your taste preferences, and get AI-powered espresso extraction recommendations.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Building for Production](#building-for-production)
- [Development Guidelines](#development-guidelines)
- [Project Structure](#project-structure)
- [Available Commands](#available-commands)
- [Contributing](#contributing)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js**: Version 20.x or higher (tested with v20.19.6)
- **npm**: Version 10.x or higher (tested with v10.8.2)
  - Alternatively, you can use **yarn** or **pnpm**

You can verify your installations by running:

```bash
node --version
npm --version
```

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/hessius/MeticAI-web.git
   cd MeticAI-web
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

   This will install all required dependencies listed in `package.json`, including:
   - React 19
   - TypeScript
   - Vite (build tool)
   - Tailwind CSS
   - Radix UI components
   - And other project dependencies

## Running the Application

### Development Server

To start the development server with hot module replacement (HMR):

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Building for Production

To create an optimized production build:

```bash
npm run build
```

This command will:
1. Run TypeScript compiler checks
2. Bundle and optimize the application using Vite
3. Output the production-ready files to the `dist` directory

## Development Guidelines

### Code Style and Linting

The project includes ESLint in its dependencies for code quality and consistency. To lint your code:

```bash
npm run lint
```

**Note:** If you encounter an error about missing ESLint configuration, you may need to create an `eslint.config.js` file. Follow the [ESLint v9 migration guide](https://eslint.org/docs/latest/use/configure/migration-guide) for setup instructions. In the meantime, ensure your code follows TypeScript and React best practices.

### TypeScript

This project uses TypeScript for type safety. Key configurations:
- Target: ES2020
- JSX: React JSX transform
- Strict null checks enabled
- Path aliases: `@/*` maps to `src/*`

### Component Library

The project uses:
- **shadcn/ui** components (New York style)
- **Radix UI** primitives for accessible components
- **Tailwind CSS** for styling with CSS variables
- **Framer Motion** for animations
- **Phosphor Icons React** (`@phosphor-icons/react`) for iconography

### Code Organization

- Keep components focused and single-purpose
- Use TypeScript interfaces for props and data structures
- Follow the existing file structure and naming conventions
- Place reusable UI components in `src/components/ui/`
- Use path aliases (`@/`) for imports instead of relative paths

### Styling Guidelines

- Use Tailwind CSS utility classes for styling
- Leverage the design system defined in `theme.json`
- Use CSS variables for theming (defined in `main.css`)
- Follow the existing color palette and spacing scale

## Project Structure

```
MeticAI-web/
├── src/
│   ├── components/        # Reusable React components
│   │   └── ui/           # shadcn/ui components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and libraries
│   ├── styles/           # Additional styles
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   ├── main.css          # Global styles and Tailwind imports
│   └── vite-env.d.ts     # Vite type definitions
├── index.html            # HTML template
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── components.json       # shadcn/ui configuration
└── theme.json            # Design system theme
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |
| `npm run optimize` | Run Vite optimizer |
| `npm run kill` | Kill process running on port 5000 (Unix-like systems) |

## Contributing

We welcome contributions to MeticAI! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes following the development guidelines above
4. Test your changes thoroughly
5. Run linting to ensure code quality:
   ```bash
   npm run lint
   ```
6. Commit your changes with clear, descriptive commit messages
7. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
8. Open a Pull Request with a clear description of your changes

### Pull Request Guidelines

- Provide a clear description of the problem you're solving
- Include any relevant issue numbers
- Ensure all tests pass and linting is clean
- Keep changes focused and atomic
- Update documentation if needed
- Follow the existing code style and conventions

### Reporting Issues

If you find a bug or have a feature request:
1. Check if the issue already exists
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment details (OS, Node.js version, etc.)

### Code Review Process

- All submissions require review before merging
- Reviewers may request changes or improvements
- Be responsive to feedback and willing to iterate
- Maintain a respectful and collaborative tone

## License

Please refer to the LICENSE file in the repository for licensing information.

## Support

For questions or support, please open an issue in the GitHub repository.

---

Happy coding! ☕✨
