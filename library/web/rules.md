# Web rules: condition to action

Plain HTML, CSS and JavaScript, no framework. Every row is a **situation
the coder can recognise while writing**, paired with what to do in it.
Abstract labels ("optimize", "make it accessible", "follow best practice")
are deliberately absent: they name no situation, so they match nothing and
change no output.

## The Enforce column

- `lint` : an ESLint or Stylelint rule decides it from the syntax tree.
  Runs on every save, costs no tokens, cannot be forgotten.
- `gate` : a hook decides it at write or accept time, from the diff, the
  repo, the build config, or an automated axe or Lighthouse run.
- `packet` : the condition is known when the work is planned. It becomes
  an acceptance line in the dispatch, read before the first line is written.
- `review` : needs a profile or a judgement call. Every such row names the
  measurement that settles it.

`library/web/eslint.config.mjs` is the starting configuration for the
`lint` rows that ESLint can express today.

## Rendering and animation

| When | Do | Enforce |
|------|----|---------|
| Position, scale, rotation or fade is animated | Animate `transform` and `opacity` only. They run on the compositor without layout or paint | lint |
| A transition or animation targets `width`, `height`, `top`, `left`, `margin` or `padding` | Rewrite it as `transform: translate()` or `scale()` | review: Performance panel shows Layout or Recalculate Style during the animated frames, or Lighthouse "Avoid non composited animations" |
| `will-change` is set on a container, on `body`, or on more than a few elements | Remove it. It is a last resort for one hot element, not a switch | lint |
| `will-change` is genuinely needed | Put it on the element that changes, shortly before it changes, and clear it after | review: Layers panel, compositor layer count stays bounded |
| A loop reads `offsetWidth`, `getBoundingClientRect`, `scrollTop` or computed style and then writes a style, per item | Batch every read, then every write | review: Performance panel "Forced reflow" entries |
| A layout property is read right after a style write in the same block | Move the read before the write, or defer it to the next frame | review: Performance trace shows no forced synchronous layout |
| Something visual updates every frame | `requestAnimationFrame`, never `setInterval` or `setTimeout` | lint |
| A `requestAnimationFrame` chain exists | Keep the id and `cancelAnimationFrame` it on reset or teardown | lint |
| Any transition, keyframe animation or `Element.animate()` is added | It is wrapped in a `prefers-reduced-motion: reduce` guard, in CSS or through `matchMedia` | lint |
| A screen ships with animated feedback and no reduced motion guard anywhere | Refuse the diff. This is a defect, not an enhancement | gate |
| A two state visual change is driven by a class toggle or `:hover` | CSS transition | packet |
| A multi step or looping animation needs no JS control | CSS animation with `@keyframes` | packet |
| An animation must start, pause, reverse or sequence from JS | `Element.animate()`, not styles driven by hand in a frame loop | packet |
| A long list of independent sections scrolls offscreen | `content-visibility: auto` on each section | packet |
| `content-visibility: auto` is used | Pair it with `contain-intrinsic-size`, or the scrollbar jumps | lint |
| A widget's layout and paint are independent of its siblings | `contain: layout` or `contain: paint` | review: Performance trace shows the layout scope shrink, and nothing breaks from containment's clipping and positioning effects |
| An `<img>` is added | Explicit `width` and `height`, or `aspect-ratio`, so space is reserved before load | lint |
| An `<img>` is below the fold | `loading="lazy"` | lint |
| An `<img>` is not the largest contentful element | `decoding="async"` | lint |
| An `<img>` is the largest contentful element | `fetchpriority="high"`, and never `loading="lazy"` on it | lint |
| A custom font is declared | `font-display: swap`, or `optional`. Never unbounded `block` | lint |
| A font or image is required above the fold | `<link rel="preload">` for it | review: Lighthouse confirms the LCP actually moved, rather than competing with other critical requests |

## Events and lifecycle

| When | Do | Enforce |
|------|----|---------|
| A scope registers listeners and can be torn down | One `AbortController`, its `signal` passed to every `addEventListener`, one `abort()` on teardown | lint |
| A handler reference is stored only so it can be removed later | Use the `signal` instead. The stored reference is the old idiom | lint |
| A `scroll`, `wheel`, `touchstart` or `touchmove` listener never calls `preventDefault()` | `{ passive: true }`, written explicitly. The browser default only applies at `window`, `document` and `body` | lint |
| Such a listener does call `preventDefault()` | `{ passive: false }`, written explicitly, so the intent is on the page | lint |
| The same event fires from many siblings inside one container | One listener on the container, branching on `event.target.closest(selector)` | lint |
| The same handler function is attached to two targets that sit on one bubbling path | It runs twice for a single event, and the second run sees the state the first one left. Attach it once, or split it into two handlers with separate concerns | lint |
| The children need `focus`, `blur` or drag events, which do not bubble | A listener per element. Delegation is wrong here | packet |
| `setTimeout` or `setInterval` returns an id | Store it and clear it in the teardown path before discarding or reassigning | lint |
| A timer or frame callback can be scheduled again while one is pending | Cancel the previous id first, or two chains run at once | lint |
| An `unload` listener is written | `pagehide`, or `visibilitychange` to hidden. `unload` disables the back forward cache | lint |
| `beforeunload` is registered unconditionally | Register it only while unsaved data exists, and remove it after. Unconditional registration also kills bfcache | gate |
| Work should not run while the tab is hidden | `visibilitychange` plus a check on `document.visibilityState` | packet |
| A handler fires on `input` or `keyup` and should wait for a pause | Debounce | packet |
| A handler fires on `scroll`, `resize` or `pointermove` and should fire at a steady rate | Throttle | packet |
| A synchronous loop can block input past one frame | Chunk it and yield between chunks | review: Performance panel, long tasks over 50ms |
| Heavy work is unrelated to the DOM | Move it to a `Worker` | review: Performance panel attributes a long main thread task to that function |

## Memory

| When | Do | Enforce |
|------|----|---------|
| A long lived listener, timer or cache closes over a DOM node | Key it in a `WeakMap` from element to data, not a `Map`, array or object property. Otherwise the removed node stays alive | lint |
| A global or module level collection holds DOM nodes | Only ids and plain data belong there. This is the most common real leak | lint |
| A reference must not keep an object alive | `WeakRef`, with an explicit `deref()` liveness check. Not a general cache | review: Memory panel, detached node count after teardown |

## Accessibility: controls and grid

| When | Do | Enforce |
|------|----|---------|
| Anything is clickable | A real `<button>`. A `div` with a click handler loses keyboard, focus and role for free | lint |
| A `div` must act as a button anyway | `role="button"`, `tabindex="0"`, and `keydown` handling for both Enter and Space. All three, or it is broken | lint |
| A grid of toggleable cells is built | `role="grid"` on the container, `role="row"` per row, `role="gridcell"` per cell, with a real `<button>` inside the cell | packet |
| Cells must be reachable by keyboard | Arrow keys move focus between cells, Home and End reach the row bounds | packet |
| A grid is in the tab order | Roving `tabindex`: the focused cell is `0`, every other cell is `-1`, updated on each move | gate |
| A cell or control carries an on or off state | `aria-pressed`, never a colour or a class alone | lint |
| A control shows an icon and no text | `aria-label` naming the action and the state | lint |
| A native element already carries the state (`<input type="checkbox">`) | Use it. Native semantics beat ARIA when they disagree | packet |
| `:focus` styling is removed or set to `outline: none` | Replace it with a visible indicator. Never remove it outright | lint |

## Accessibility: dialogs and announcements

| When | Do | Enforce |
|------|----|---------|
| A dialog opens (rules, level select, results) | Focus moves into it, to the first control or to a heading with `tabindex="-1"` | gate |
| A dialog is open | Tab and Shift Tab cycle inside it, and `Escape` closes it | gate |
| A dialog closes | Focus returns to the control that opened it | gate |
| Dialog markup is written | `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` or `aria-label` | lint |
| Score, level complete or an error message updates without a reload | A live region: `aria-live="polite"` for status, `role="alert"` for errors | lint |
| An element carries `aria-live` | It carries no `aria-label`. The label replaces the announced content, so the live region reports the fixed label instead of what changed, and the update is silently lost | lint |
| A grid uses roving `tabindex` | Every focus change updates it, pointer clicks included. Updating it only on arrow keys sends the next Tab back to the first cell | lint |

## Accessibility: layout and colour

| When | Do | Enforce |
|------|----|---------|
| An interactive target is sized in CSS | At least 24 by 24 CSS px, or enough spacing that a 24px circle centred on it touches nothing else. See the note below on this number | gate |
| Text or a non text UI component is styled | 4.5 to 1 contrast for text, 3 to 1 for large text and for non text components including focus rings | gate |
| A layout uses fixed pixel widths for text containers | Relative units, so content reflows at 320 CSS px and at 200 percent zoom without horizontal scrolling | gate |
| State is conveyed by colour | Pair it with an icon, a label or `aria-pressed`. Colour alone is never enough | lint |

## Input and pointer

| When | Do | Enforce |
|------|----|---------|
| A control handles both mouse and touch | Pointer events, not two parallel listener sets | lint |
| A control is tapped repeatedly | `touch-action: manipulation` to drop the double tap zoom delay | lint |
| Rapid tapping can select text | `user-select: none` on the interactive surface | lint |

## State and storage

| When | Do | Enforce |
|------|----|---------|
| Progress is saved locally and is small | `localStorage`, with every `getItem` and `setItem` in a try catch. It throws in private mode and when storage is blocked, and it is fully synchronous, blocking the main thread on every call | lint |
| Saved data grows, needs queries, or is written often enough to be felt | IndexedDB instead | review: how large the payload actually gets, and whether writes appear in the Performance trace |
| Saved state is read at startup | Validate the shape before use. Never trust what comes back | lint |
| `localStorage` is read inside a function that builds or patches DOM | Hoist the read out of the render path. It is synchronous and would run on every render | lint |
| The save format changes | An explicit `version` field, and a migration step for older versions | packet |
| A validation fails on a record of a version this build knows | Fall back to a safe default. Never keep corrupt data silently | packet |
| The stored record's version is NEWER than this build understands | Run on the default in memory, but never write over the stored record. A newer save is not corrupt data, it is a user who opened an older build, and overwriting it destroys real progress silently. Either keep the raw record untouched until a build that understands it runs, or write under a separate key | packet |
| A shared default object is frozen | `Object.freeze` is shallow. Freeze the nested objects too, or one write through the default corrupts it for every later caller in the session | lint |
| Code treats stored data as permanent | It is per origin and evictable. Never the only copy of anything valuable | packet |

## Security

| When | Do | Enforce |
|------|----|---------|
| Data derived text goes into the DOM | `textContent` or `createElement`. Never `innerHTML` | lint |
| HTML genuinely must be rendered from data | Sanitize with a maintained library. Never hand roll one | lint |
| The app has no user entered text | The rule above still holds. URL parameters, `postMessage` payloads and saved data are all sinks | lint |
| The site is deployed | A Content Security Policy, at minimum `default-src 'self'`, with no `unsafe-inline` and no `unsafe-eval` | gate |
| An inline `<script>` or `<style>` exists | Remove it, or give it a nonce or hash matching the policy | gate |
| Response headers are configured | Also `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Permissions-Policy` denying what the app does not use | gate |

## Build and release

| When | Do | Enforce |
|------|----|---------|
| JS is written for production | ES modules, `type="module"`, minified by the build | packet |
| The build emits JS or CSS | Content hashed filenames | packet |
| Hashed assets are served | `Cache-Control: public, max-age=31536000, immutable` | gate |
| The entry HTML is served | `Cache-Control: no-cache`, so new asset hashes are picked up | gate |
| A service worker is being considered | Only if offline play or installability is a real requirement. It brings a cache invalidation and update lifecycle that an always online static game does not need | packet |

## Observability

| When | Do | Enforce |
|------|----|---------|
| Production error visibility is set up | Both `window.onerror` and an `unhandledrejection` listener. Two sinks, not one | packet |
| Anything is logged | No tokens, no saved data verbatim, no personal data. Strip local paths from stack traces before sending | lint |
| A release build is cut | `console.log` and `console.debug` stripped or behind a debug flag | lint |

## Shape of the code

| When | Do | Enforce |
|------|----|---------|
| State is shared between files through `window` or a global | Pass it explicitly, or export it from a module | lint |
| A file covers more than one responsibility | Split it into modules | packet |
| A function passes fifty lines | Split it | lint |
| A file passes seven hundred lines | Split it before closing the packet | gate |
| The same logic would exist in a second place | Extract it and call it from both | packet |
| A new visual part is about to be written | Look for the existing one first. Eighty percent overlap means extend, not copy | packet |

## Tests that only look like tests

A passing suite is evidence only if the assertions could have failed. These
rows exist because a suite can report a branch as covered while never
entering it, which is worse than having no test for it at all.

| When | Do | Enforce |
|------|----|---------|
| A test stubs randomness, the clock or an id source with a constant | That constant collapses the behaviour under test to one path. Use a sequence stub, and pick the values that actually reach the branch being named | packet |
| A test's name claims a retry, a fallback or an error path | The test must enter it by construction, not by chance. Assert on something only that path produces | packet |
| A function has a retry or fallback branch | One test forces it deterministically. An untested fallback is where the bug lives, because it is the path nobody watched | packet |
| A test asserts on a value the implementation also computes | Write the expected value out by hand. A test that recomputes the implementation passes for any implementation, correct or not | packet |

## A note on the 24 by 24 number

The Flutter list in this library says 48 by 48 dp for a tap target and this
one says 24 by 24 CSS px. Both are correct and they are not the same
measurement: 48 dp is the Material guideline for touch first UI, 24 px is
the WCAG 2.2 minimum for a pointer target of any kind, with a spacing
exemption. For a touch first web game, treat 24 as the floor that fails an
audit and 44 to 48 as the size to actually build.

## Diagnostics: which view answers which question

- Non composited animation: Lighthouse audit, or Layout and Recalculate
  Style entries in the Performance panel during the animated frames.
- Layout thrash: "Forced reflow" warnings in the Performance panel.
- Long tasks: Performance panel, anything over 50ms.
- Leaks: Memory panel, detached node count after a teardown.
- Layer explosion: Layers panel.
- Accessibility: an automated axe or Lighthouse pass catches roughly the
  mechanical half. The keyboard and focus rows above are the half it misses,
  which is why they are `gate` and `packet` rather than `lint`.

Two standing rules: measure in a production style build, and report one
number before and one after.

## Verify before turning these into lint rules

- `scheduler.yield()` is not yet available everywhere. Feature detect it,
  or fall back to a zero delay `setTimeout`.
- Exact WCAG success criterion numbers were cited from memory by the
  research pass. Check them against the specification before using them in
  a compliance claim.
- `contain` has real side effects on clipping and on the containing block
  for absolutely positioned descendants. Read them before applying it.

## How to use this file

It is a source, not a runtime document. `lint` rows become ESLint or
Stylelint rules, starting from `eslint.config.mjs` in this folder. `gate`
rows become hooks. `packet` rows go into the planner's acceptance template,
worded exactly as here, condition first. `review` rows are the only ones
that reach a reviewer by design.

A row that has not become a rule, a gate, or an acceptance line is not in
force. Loading this file at write time and hoping achieves nothing.
