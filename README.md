# Ultimate Football Director 24/25

**Football management simulator** built with React and TypeScript. You handle squad management and team tactics, then run matches through a live text-commentary engine.

## Features
- **Match Engine**: Simulates games minute-by-minute. Outputs a text event feed, score updates, and accepts mid-game tactical substitutions.
- **Squad Management**: Set formations, assign player roles, and manage the bench.
- **Team Importer**: Load external team data into the simulator.
- **Local Persistence**: Saves your career state to the browser's local storage.
- **AI Commentary**: Experimental prompt architecture routes match events to an LLM (Gemini or Grok) for dynamic commentary generation.

## Tech Stack
- React 19
- Vite
- Tailwind CSS
- TypeScript

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/markkirby125/Ultra-Football-Manager.git
   cd Ultra-Football-Manager
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## License
MIT License
