# MeticAI Web

Meticulous Espresso Profile Generator - A web application that helps coffee enthusiasts create personalized espresso extraction profiles.

## Features

- 📸 Upload coffee bag photos for analysis
- ☕ Describe taste preferences (text or preset tags)
- 🤖 AI-powered profile generation
- 📊 Detailed extraction recommendations
- 📱 Responsive design for mobile and desktop

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Testing**: Vitest, React Testing Library, Playwright
- **Linting**: ESLint

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/hessius/MeticAI-web.git
cd MeticAI-web

# Install dependencies
npm install
```

### Development

```bash
# Run development server
npm run dev

# Server will start at http://localhost:5173
```

### Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Testing

This project has comprehensive test coverage including unit, integration, and E2E tests.

### Running Tests

```bash
# Run all unit tests  
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run E2E tests (requires dev server to be running)
npm run e2e

# Run E2E tests in UI mode
npm run e2e:ui
```

See [TESTING.md](./TESTING.md) for detailed testing documentation.

## Project Structure

```
MeticAI-web/
├── src/
│   ├── components/     # React components
│   │   └── ui/         # Radix UI components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── test/           # Test setup files
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── e2e/                # End-to-end tests
├── public/             # Static assets
├── TESTING.md          # Testing documentation
└── README.md           # This file
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run unit tests in watch mode
- `npm run test:run` - Run unit tests once
- `npm run test:coverage` - Generate coverage report
- `npm run test:ui` - Open Vitest UI
- `npm run e2e` - Run E2E tests
- `npm run e2e:ui` - Run E2E tests in UI mode

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm run test:run`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is private and proprietary.

## Contact

For questions or support, please contact the project maintainers.
