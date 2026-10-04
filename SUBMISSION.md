# Portal submission

English title: **Table Gulp**. Chinese title stays **黑洞一口吞** when the selected language is Chinese.

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
| Instructions / controls | Drag on the table to move the hole. On a keyboard, use WASD or the arrow keys. Arrow keys and Space are captured so they do not scroll the page. Pause from the Pause button. Esc also pauses and is not captured, so the portal can still leave fullscreen. +Time and Magnet spend a free charge, or play an optional rewarded ad when the charges are gone. |
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

## GameMonetize

Create the game in the dashboard first (**Game Management > My games > Add game**) and copy its GameId. The title to register is **Table Gulp**. Rebuild with that id, then upload `dist-portals/gamemonetize.zip`:

```bash
VITE_GM_GAME_ID=your-game-id npm run build:portals
```

The zip root contains `index.html` plus the game files. On the game page, drop that zip to upload. Click **Verify Game**. When verification passes, click **REQUEST ACTIVATION**.

Payouts are PayPal (USDT ERC20 is also offered) with a **$30** minimum. Below that, the balance carries to the next period. Payment is Net 30: GameMonetize sends it within 25 days of the previous month.

The HTML5 SDK is `https://api.gamemonetize.com/sdk.js` with `window.SDK_OPTIONS = { gameId, onEvent }`. It has one ad call, `sdk.showBanner()`. Midgame (after a cleared level) and rewarded (**+Time**, **Magnet**, **Watch ad to revive**) both use that call. `SDK_GAME_PAUSE` pauses and mutes, including a preroll the SDK starts on its own. `SDK_GAME_START` resumes and unmutes. A reward is granted only when pause is followed by start. A resume without a pause — cooldown, no fill, or ads disabled — grants nothing. `SDK_READY` only means the SDK finished initializing.

Use the same title, description, controls, and tags as CrazyGames. A zip built without `VITE_GM_GAME_ID` still plays; ads and **Verify Game** fail until the id is set.

## Playgama, Y8

Add a class that implements `Portal` in `src/portal/` and list its id in `scripts/build-portals.mjs` and `src/portal/index.ts`. Gameplay only calls that interface: loading, gameplay start/stop, midgame, and rewarded. Pause and mute already happen around those calls.

The `none` zip is the same SDK-free package GitHub Pages publishes.

## Language

CrazyGames builds read `CrazyGames.SDK.user.systemInfo.locale` after the SDK initializes. Chinese is used when that tag starts with `zh`. A missing locale, or any other language, falls back to English. That build does not read `navigator.languages`.

GameDistribution and GameMonetize have no locale API. Those builds stay on English unless the QA query overrides them.

GitHub Pages and the `none` zip still follow `navigator.languages`, with the same Chinese-or-English rule.

`?lang=en` or `?lang=zh` overrides the detected language on every build, for QA.
