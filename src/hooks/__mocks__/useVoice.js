// Mock for useVoice hook
export const useVoice = jest.fn(() => ({
  isRecording: false,
  transcript: '',
  error: null,
  isListening: false,
  confidence: 0,
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
  clearTranscript: jest.fn(),
  setTranscript: jest.fn(),
}));

export default { useVoice };
