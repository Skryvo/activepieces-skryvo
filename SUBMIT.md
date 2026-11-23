# Publishing the Skryvo piece

Read on 23 Nov 2026 in Activepieces' `CONTRIBUTING.md`: pull requests from people who have not contributed before
are closed automatically for now, and the file suggests publishing a piece as its own npm package meanwhile. So
there are two routes; the first works today.

## Route 1: our own npm package (today)

1. Push this repository to `Skryvo/activepieces-skryvo`.
2. From a clean checkout: `npm ci && npm test`, then `npm publish --access public` signed in as the npm user
   `skryvo` (it owns the `@skryvo` scope; the 2FA prompt follows).
3. Check it installs: on a self-hosted Activepieces (`node tools/setup-dev.js`, then `npm start` in their
   repository, or their Docker image), **Settings › My Pieces › Install Piece**, `@skryvo/piece-skryvo`, version
   `0.1.0`. Connect with the review account's key, run Write a Post for Telegram and Schedule a Post to the
   Telegram test channel, and enable a flow with New Event once production serves the webhook routes.
4. Name the package on https://skryvo.ai/docs/.

## Route 2: a pull request to Activepieces (when it reopens to new contributors)

1. Fork `activepieces/activepieces`, `git clone --depth=1`, `npm ci`.
2. `npm run cli pieces create` with name `skryvo`, package `@activepieces/piece-skryvo`, type community. Replace the
   generated `src/` with this repository's `src/`.
3. In the generated `package.json`, keep its `workspace:*` dependencies and version `0.0.1`. Their lint forbids
   importing `@activepieces/shared` in a piece: take `PieceCategory` from the package their current pieces use.
4. `npx turbo run build --filter=@activepieces/piece-skryvo` and their lint must pass. Set `logoUrl` to
   `https://cdn.activepieces.com/pieces/skryvo.png` and attach `growth/brand/company/app_icon_1024.png` from the main
   repository to the pull request for their CDN.
5. Pull request title in their format, under about 400 lines. Template answers: Description "New piece: Skryvo
   (write, design and schedule posts and articles in a brand's voice; webhook trigger for publish, failure, article
   and results events)"; How was this tested: "Community Edition, self-hosted, with a Skryvo test account"; Breaking
   change: No; Security impact: No.
6. Answer the automated review's comments, then a maintainer's.
