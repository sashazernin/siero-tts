import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./hooks/useVoicePreview', () => ({
  useVoicePreview: () => ({
    playPreview: jest.fn(),
    playingKey: null,
    loadingKey: null,
    isPlaying: () => false,
    isPreviewLoading: () => false,
  }),
}));

jest.mock('./hooks/useTtsApp', () => ({
  useTtsApp: () => ({
    filteredVoices: [],
    languages: [],
    selectedVoice: null,
    setSelectedVoice: jest.fn(),
    languageFilter: 'any',
    setLanguageFilter: jest.fn(),
    genderFilter: 'any',
    setGenderFilter: jest.fn(),
    commercialUseAllowed: true,
    setCommercialUseAllowed: jest.fn(),
    showLicenseWarning: false,
    text: '',
    setText: jest.fn(),
    history: [],
    isLoading: false,
    isVoicesLoading: false,
    error: null,
    clearError: jest.fn(),
    generate: jest.fn(),
  }),
}));

test('renders app title', () => {
  render(<App />);
  expect(screen.getByText('siero-tts')).toBeInTheDocument();
});
