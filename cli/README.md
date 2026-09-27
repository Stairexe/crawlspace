# crawlspace

Survey a web page for AI citability from the command line or CI — the same engine as
[crawlspace-geo.vercel.app](https://crawlspace-geo.vercel.app), running locally. No API
key, no account.

```bash
npx crawlspace https://example.com/pricing
npx crawlspace https://example.com --format json
npx crawlspace https://example.com --min-score 60      # exit 1 below 60
npx crawlspace https://example.com --format sarif > crawlspace.sarif
```

Per-engine scores for ChatGPT, Claude, Perplexity, Copilot and Google AI Overviews; a
gate caps an engine at 25 when its search crawler is blocked; a fix-first plan with the
projected score after each fix. Scores model how citable a page is — they do not measure
whether it is cited. Methodology: https://crawlspace-geo.vercel.app/methodology

## GitHub Action

```yaml
- uses: Stairexe/crawlspace@main
  with:
    url: https://example.com/pricing
    min-score: 60
```

The survey is written to the job summary; the step fails below `min-score`.
