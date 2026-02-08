# LeetCode Likes & Dislikes Overlay

A lightweight Chrome extension that displays **likes and dislikes** on LeetCode problem pages by extracting **hydrated client state**, without making additional network requests.

## Preview

![LeetCode Likes & Dislikes overlay](screenshot.png)

## Why this exists

LeetCode hides dislike counts, but those signals are often useful for:
- spotting ambiguous or poorly worded problems
- identifying questions with tricky edge cases
- deciding where to invest study time

This extension restores that signal.

## How it works

LeetCode is a modern single-page application (SPA) that hydrates initial page data into a `<script>` tag (`__NEXT_DATA__`) at load time.

Instead of replaying GraphQL requests (which are brittle and subject to change), this extension:

1. Reads the embedded `__NEXT_DATA__` JSON
2. Extracts likes and dislikes from  
   `props.pageProps.dehydratedState.queries[*].state.data.question`
3. Injects a small UI badge next to the problem title
4. Re-runs automatically on client-side navigation (Dynamic Layout / SPA routing)

### Key design decisions

- **No network calls**  
  Uses existing client state for speed, simplicity, and resilience.
- **SPA-safe**  
  Handles LeetCode’s Dynamic Layout and client-side routing.
- **Defensive extraction**  
  Selects the correct query using `questionDetail` and matching `titleSlug`.
- **Minimal UI**  
  One inline badge that respects light and dark mode.

## Features

- Displays 👍 likes and 👎 dislikes on LeetCode problem pages
- Shows like ratio for quick signal scanning
- Works with LeetCode’s Dynamic Layout
- Zero configuration
- Runs entirely as a content script

## Installation (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the project folder
6. Visit any LeetCode problem page (refresh once)

## File structure

leetcode-likes-dislikes/
├── manifest.json
├── content.js
├── screenshot.png
└── README.md


## Limitations

- Relies on LeetCode’s current page hydration structure  
  (If LeetCode changes how `__NEXT_DATA__` is shaped, extraction may need updating.)
- Not published to the Chrome Web Store
- No settings UI (by design)

## Example use case

> “Before spending 45 minutes on a problem, I want to know whether the community found it clean or frustrating.”

This extension surfaces that signal immediately.

## Future improvements (intentionally not implemented)

- Settings toggle
- Sorting problem lists by dislike ratio
- Chrome Web Store packaging

These were deliberately left out to keep the extension focused and minimal.

## License

MIT
