# Log Change

## Последние изменения

- Введён внутренний `SolidModel` слой с hollow/solid cylinder primitives, trim intent и boolean intent.
- Preview-сцена переведена на `SolidModel` как source of truth для placement, bounds, света и камеры.
- Branch preview и seam больше не используют legacy geometry path, а считаются через `receiver-profile` evaluator.
- Branch export (`DXF` / `PDF`) переведён на solid evaluator и теперь совпадает с preview по одному расчётному пути.
- Main hole export тоже переведён на solid graph через opening-tool evaluator.
- Runtime validation переведена на solid evaluators; UI больше не зависит от `geometry-engine`.
- Legacy `geometry-engine` удалён из runtime и оставлен только как test-only reference fixture.

## Что сделать дальше

- Довести `STEP export` поверх текущего `SolidModel`, не через фальшивую сериализацию, а через отдельный solid/export layer.
- Решить, нужен ли CAD/boolean backend для настоящего B-Rep, или сначала ввести промежуточный assembly evaluator.
- Почистить test-only legacy fixture и удалить её совсем, когда solid regression coverage станет достаточной.
- Отдельно заняться оптимизацией production bundle: сейчас Vite всё ещё предупреждает о крупном chunk.
