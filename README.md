[![CI](https://github.com/philipperackette/galois-treillis-sous-groupes/actions/workflows/ci.yml/badge.svg)](https://github.com/philipperackette/galois-treillis-sous-groupes/actions/workflows/ci.yml)

# Atelier des treillis de sous-groupes

Sous-groupes, sous-groupes distingués, quotients et inclusions pour dix groupes finis.

**En ligne :** https://philipperackette.github.io/galois-treillis-sous-groupes/

## Vérifications automatiques

À chaque push et pull request, GitHub Actions lance ESLint et HTMLHint, puis des tests Playwright dans Chromium, sur écran d'ordinateur et de téléphone. Ils vérifient que chaque page s'ouvre sans erreur JavaScript ni défilement horizontal. Tests propres à ce site : chaque treillis affiché, comparé à l'énumération exhaustive des sous-groupes du groupe (ordres, sous-groupes distingués, arêtes du diagramme de Hasse).

Le site lui-même n'a aucune dépendance : `package.json` ne sert qu'à ces vérifications.

```bash
npm ci
npm run lint
npx playwright install chromium
npm test
```
