# siero-tts

Nx-монорепозиторий для синтеза речи на базе **Silero v5_cis_base_nostress**.

## Структура

```
apps/
  web/       — React (Vite) frontend
  api/       — Node.js (Fastify) API
  desktop/   — Electron desktop app
libs/
  ui/        — переиспользуемый UI-kit
  shared/    — типы и каталог голосов
```

## Возможности

- Выбор голоса с поиском и фильтром по полу
- Генерация WAV через Silero
- История генераций в React state
- Сборка desktop-приложения через Electron

## Требования

- Node.js 20+
- Python 3.10+ с пакетами из `apps/api/python/requirements.txt`

> API написан на Node.js (Fastify). Синтез Silero выполняется Python worker-процессом, так как официального Node SDK для `v5_cis_base_nostress` нет.

## Установка

```bash
npm install
pip install -r apps/api/python/requirements.txt
```

Если `npm install` падает из-за заблокированного `node_modules/electron` (Windows), закройте Electron-процессы и удалите папку `node_modules`, затем повторите установку.

## Команды

| Действие | Команда |
|----------|---------|
| Запуск (web + api) | `npm start` |
| Сборка проекта | `npm run build` |
| Сборка Electron | `npm run dist` |

После `npm start`:
- Web: http://localhost:4200
- API: http://127.0.0.1:8000

Установщик Electron появится в `dist/apps/desktop/`.

## Ударения

Для русского, белорусского и украинского используйте знак `+` для ударения, например: `к+ошка`.
