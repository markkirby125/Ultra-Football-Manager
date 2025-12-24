
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { GameProvider } from './context/GameContext';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <GameProvider>
      <App />
    </GameProvider>
  );
}
