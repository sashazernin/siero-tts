import React from 'react';
import { Button } from '@siero-tts/ui';

export interface ConvertButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function ConvertButton({ onClick, loading = false, disabled = false }: ConvertButtonProps) {
  return (
    <Button variant="contained" onClick={onClick} loading={loading} disabled={disabled}>
      Конвертировать
    </Button>
  );
}
