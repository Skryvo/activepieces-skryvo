# Skryvo piece for Activepieces

An [Activepieces](https://www.activepieces.com) piece for [Skryvo](https://skryvo.ai): draft posts, emails and
listings in a brand's voice, design a post's picture, plan and write articles, schedule approved posts, publish
articles to a blog, and start flows when a post publishes or fails, an article is ready or a post's results come in.

Skryvo is a hosted AI content platform, a paid service with a 7-day free trial on Hobby and Pro
(https://skryvo.ai/pricing/). Docs: https://skryvo.ai/docs/

Published on npm as [`@skryvo/piece-skryvo`](https://www.npmjs.com/package/@skryvo/piece-skryvo). It is not in Activepieces' own piece list yet.

## Install

On a self-hosted Activepieces or a project that allows custom pieces: **Settings › My Pieces › Install Piece**,
package name `@skryvo/piece-skryvo`.

## Connect

Create an API key in Skryvo under [Settings › API & agents](https://app.skryvo.ai/settings/agents)
(`sk_skryvo_…`, shown once) and paste it into a new Skryvo connection. Activepieces checks it against Skryvo
before saving. The key acts in the workspace it was made in, with its holder's role.

## A flow in 60 seconds

1. **Write a Post**: Topic `Our new studio opens Saturday`, Platforms LinkedIn. Output:
   `{ "status": "written", "generation_id": "gen_5d1c9a", "posts": [{ "platform": "linkedin", "text": "Our new studio opens this Saturday in Leeds. #coffee" }] }`
2. An approval step of your choice.
3. **Schedule a Post**: Text = the post's text, Channels = your LinkedIn page, Publish At = when. Output: the
   scheduled posts, such as `[{ "id": "c1a2b3c4d5", "platform": "linkedin", "date": "2026-11-24", "time": "09:00", "status": "scheduled" }]`.
4. A second flow starting with **New Event** (Post published) gets each post once it is live.

Write a Post never publishes. Schedule a Post publishes exactly the text it is given, so map only approved text.

## Actions and trigger

| Name | What it does |
|---|---|
| Write a Post | Drafts a post per platform (up to four) in the brand's voice; one generation, pictures optional |
| Design a Picture | One picture in the brand's kept look, sized per platform; image credits |
| Schedule a Post | Schedules approved text, with an optional picture and link, to connected channels |
| Plan an Article | A free plan: headline, outline, search phrase and questions only the person can answer |
| Write an Article | Starts writing a plan (two generations); about four minutes |
| Get an Article | Writing with its stage, done with its text and checked claims, or failed |
| Publish an Article | Sends a finished article to a connected blog as a draft, or schedules it |
| Write an Email | Subject lines, preheader, body and call to action; nothing is sent |
| Write a Product Listing | Title, description and bullets for a marketplace |
| Custom API Call | Any route of the agent API at `https://api.skryvo.ai/api/v1/agent` with the connection's key |
| New Event (trigger) | Post published, post failed, article ready, article failed, results ready |

New Event subscribes its own endpoint in Skryvo when the flow is enabled and removes it when disabled. Each
delivery is checked against its `Skryvo-Signature` header with the endpoint's secret (an HMAC-SHA256 at most five
minutes old); one that does not match runs nothing. Testing the flow in the builder uses the sample event.

## Errors

A refusal fails the step with Skryvo's own sentence, for example "That time has passed. Pick a time in the
future." A revoked key fails with Skryvo's message about the key.

## Develop

```bash
npm install
npm test   # builds, then runs every action and the trigger offline against test/openapi.json
```

`test/openapi.json` is Skryvo's published API description (`https://api.skryvo.ai/openapi.json`); a test fails
when an action calls a route it lacks, sends a field its request does not have, or leaves out a required one.

Issues: https://github.com/Skryvo/activepieces-skryvo/issues · support@skryvo.ai

## License

MIT © Flutter Studio LLC
