# Portal submission

English title: **Table Gulp**. Chinese title stays **黑洞一口吞** when the browser language is Chinese.

Upload one zip from `dist-portals/`. `npm run build` still writes `dist/` for GitHub Pages and does not call a portal SDK.

## CrazyGames

Upload `dist-portals/crazygames.zip` for both Basic Launch and Full Launch. The zip already includes the CrazyGames SDK v3 script.

- **Basic Launch:** the SDK is initialized, and the game sends `loadingStart` / `loadingStop` and `gameplayStart` / `gameplayStop`. CrazyGames disables ads during Basic Launch. If an ad request returns an error, the game continues and no reward is given.
- **Full Launch:** the same build. A midgame ad is requested when a level is cleared (not on a fail, so it is never chained with the revive video). Rewarded ads are the in-level **+Time**, **Magnet**, and **Watch ad to revive** actions. The reward is granted only when the ad finishes. The game pauses and mutes while an ad is actually showing.

New players enter level 1 immediately. There is no title gate and no external link. Fullscreen is left to the portal.

### Metadata

| Field | Value |
| --- | --- |
| Title | Table Gulp |
| Short description | Drag a black hole across a 3D table and swallow every snack smaller than the hole. |
| Description | Table Gulp is a portrait hypercasual game. Hold the table and drag the hole. Snacks smaller than the hole tumble in, and the hole grows. Clear the shopping list before time runs out. Bombs, chili, and cacti end the level. A fast clear with no boosters earns three stars. |
| Instructions / controls | Drag on the table to move the hole. On a keyboard, use WASD or the arrow keys. Pause from the Pause button. Esc also pauses and is not captured, so the portal can still leave fullscreen. +Time and Magnet spend a free charge, or play an optional rewarded ad when the charges are gone. |
| Tags | hypercasual, casual, puzzle, 3d, food, skill, black hole |
| Category | Hypercasual |
| Orientation | Portrait. The game letterboxes inside the standard 16:9 iframe. |
| Devices | Desktop and mobile. Touch and mouse. |
| Audience | Cartoon food and bombs, no realistic violence. Suitable for a general audience. |

## GameDistribution

Rebuild with your game id, then upload `dist-portals/gamedistribution.zip`:

```bash
VITE_GD_GAME_ID=your-game-id npm run build:portals
```

Enable rewarded ads for that game in the GameDistribution dashboard. The zip sets `advertisementSettings.autoplay` to false so the first session is not blocked by a preroll. Midgame ads run after a cleared level. Rewarded ads use `gdsdk.showAd('rewarded')` and grant a reward only on `SDK_REWARDED_WATCH_COMPLETE`.

Use the same title, description, controls, and tags as CrazyGames. Add the game id above before upload. A zip built without `VITE_GD_GAME_ID` still plays; ads will not fill until the id is set.

## Playgama, Y8, GameMonetize

Add a class that implements `Portal` in `src/portal/` and list its id in `scripts/build-portals.mjs` and `src/portal/index.ts`. Gameplay only calls that interface: loading, gameplay start/stop, midgame, and rewarded. Pause and mute already happen around those calls.

The `none` zip is the same SDK-free package GitHub Pages publishes.

## Language

The game reads `navigator.languages` and uses Chinese for `zh`, otherwise English. `?lang=en` or `?lang=zh` overrides that, for QA.
