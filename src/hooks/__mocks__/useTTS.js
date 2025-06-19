// Mock for useTTS hook
export const useTTS = jest.fn(() => ({
  isSpeaking: false,
  isPaused: false,
  error: null,
  speak: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  stop: jest.fn(),
  setVoice: jest.fn(),
  setRate: jest.fn(),
  setPitch: jest.fn(),
  setVolume: jest.fn(),
}));

export default { useTTS };
