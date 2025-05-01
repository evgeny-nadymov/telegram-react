import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TelegramApp from './TelegramApp';

/**
 * Simple wrapper for TelegramApp, which handles routing
 */
const TelegramAppWrapper = () => {
  return (
    <Routes>
      <Route path="/telegram-react" element={<TelegramApp />} />
      <Route path="/" element={<TelegramApp />} />
    </Routes>
  );
};

export default TelegramAppWrapper; 