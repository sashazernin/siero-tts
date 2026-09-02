import React from 'react';
import styles from './App.module.css';
import { AppHeader } from './components/AppHeader';
import { BackgroundLayout } from './components/BackgroundLayout';
import { GenerationHistory } from './components/GenerationHistory';
import { LicenseWarningBanner } from './components/LicenseWarningBanner';
import { TtsInput } from './components/TtsInput';
import { VoiceControls } from './components/VoiceControls';
import { useTtsApp } from './hooks/useTtsApp';
import { Snackbar } from '@siero-tts/ui';

function App() {
  const {
    filteredVoices,
    languages,
    selectedVoice,
    setSelectedVoice,
    languageFilter,
    setLanguageFilter,
    genderFilter,
    setGenderFilter,
    commercialUseAllowed,
    setCommercialUseAllowed,
    showLicenseWarning,
    text,
    setText,
    history,
    isLoading,
    isVoicesLoading,
    error,
    clearError,
    generate,
  } = useTtsApp();

  const canConvert = text.trim().length > 0 && Boolean(selectedVoice);

  return (
    <BackgroundLayout>
      <div className={styles.page}>
        <AppHeader />
        <main className={styles.main}>
          {showLicenseWarning ? <LicenseWarningBanner /> : null}
          <VoiceControls
            voices={filteredVoices}
            languages={languages}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            languageFilter={languageFilter}
            onLanguageFilterChange={setLanguageFilter}
            genderFilter={genderFilter}
            onGenderFilterChange={setGenderFilter}
            commercialUseAllowed={commercialUseAllowed}
            onCommercialUseAllowedChange={setCommercialUseAllowed}
            onConvert={generate}
            isLoading={isLoading}
            isVoicesLoading={isVoicesLoading}
            canConvert={canConvert}
          />
          <TtsInput value={text} onChange={setText} selectedVoice={selectedVoice} />
          <GenerationHistory items={history} />
        </main>
      </div>
      <Snackbar open={Boolean(error)} message={error ?? ''} severity="error" onClose={clearError} />
    </BackgroundLayout>
  );
}

export default App;
