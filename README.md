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
| Запуск в dev | `npm run dev` |
| Запуск Electron в dev | `npm run dev:e` |
| Запуск в prod (без сборки) | `npm run prod` |
| Запуск Electron в prod (без сборки) | `npm run prod:e` |
| Сборка web + api | `npm run build` |
| Сборка Electron | `npm run build:e` |

После `npm run dev` или `npm run prod`:
- Web: http://localhost:4200
- API: http://127.0.0.1:8000

`npm run prod` и `npm run prod:e` поднимают уже собранные артефакты из `dist/`. Сначала выполните `npm run build`.

`npm run dev:e` сам поднимает API внутри Electron и Vite на порту 4200. Не запускайте одновременно `npm run dev`.

Установщик и portable zip появятся в `dist_electron/`.

## GitHub Releases

Каждый пуш в `main` создаёт обычный релиз со счётчиком сборки: **Build 12**, тег `build-12`, архив `siero-tts-build-12-win.zip`. Номер берётся из GitHub Actions (`run_number`).

Тег вида `v1.0.0` по-прежнему делает отдельный релиз по этому тегу:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Сборку можно запустить вручную: Actions → **Electron portable release** → **Run workflow**. Zip всегда попадает в артефакты workflow.

## Ударения

Для русского, белорусского и украинского ударения расставляются автоматически через `silero-stress`. Можно указать вручную знаком `+`, например: `к+ошка`.

## Лицензии Silero

Модели скачиваются с [models.silero.ai](https://models.silero.ai) при первом запуске. Тексты лицензий — в папке [`licenses/`](licenses/).

| Компонент | Модели | Лицензия | Коммерция |
|-----------|--------|----------|-----------|
| CIS TTS | `v5_cis_base_nostress`, `v5_cis_base`, `v5_cis_ext` | [MIT](licenses/SILERO-LICENSE-CIS.txt) | ✅ разрешена |
| Остальные TTS | `v3_en`, `v5_ru`, `v5_5_ru` и др. | [CC BY-NC-SA 4.0](licenses/SILERO-LICENSE-NC.txt) | ❌ только некоммерческое |
| Ударения | `silero-stress` | [MIT](licenses/SILERO-STRESS-LICENSE.txt) | ✅ разрешена |

### Open source и бесплатный проект

Если вы выкладываете **siero-tts** как бесплатный open source и **не продаёте** его:

- **CIS-модели (MIT)** — пользователи могут генерировать речь и использовать её **в том числе в коммерции** (подкасты, игры, реклама и т.д.).
- **NC-модели (CC BY-NC-SA 4.0)** — пользователи могут **бесплатно** генерировать что угодно для **личных и некоммерческих** целей (учёба, хобби, некоммерческий OSS). **Продавать** результат, использовать в платных продуктах, рекламе или коммерческих сервисах — **нельзя** без отдельного разрешения от Silero.
- Нужно **указывать авторство** Silero Team при распространении.

В приложении включите опцию «только коммерчески разрешённые модели», чтобы показывать только `v5_cis_base_nostress` и другие MIT-модели.

> Это не юридическая консультация. При сомнениях уточните условия у [Silero Team](https://github.com/snakers4/silero-models) или юриста.
