# Flutter rules: condition to action

Every row is a **situation the coder can recognise while writing**, paired
with what to do in it. Abstract labels ("apply SOLID", "optimize", "follow
best practice") are deliberately absent: they name no situation, so they
match nothing and change no output.

## The Enforce column

The goal is that a rule is in force **before** anyone reviews the code.
Four carriers, cheapest first:

- `lint` : an analyzer rule decides it from the syntax tree. Runs on every
  save, costs no tokens, cannot be forgotten. Default target for any row
  whose condition is structural.
- `gate` : a hook decides it at write or accept time, from the diff, the
  repo or the build config. Used where the check needs more than one
  syntax tree (file length, duplication, a build flag, a justification).
- `packet` : the condition is known when the work is planned, not when a
  file is parsed. It becomes an acceptance line in the dispatch, so the
  coder reads it before writing the first line.
- `review` : genuinely needs judgement or a profile. This is the residue
  and it stays small. Every `review` row names what decides it.

A carrier is a target, not a description of today. Where the lint rule
does not exist yet, the row travels as a `packet` line until it does.

## Lists and collections

| When | Do | Enforce |
|------|----|---------|
| A list's length comes from server or user data | `ListView.builder` / `GridView.builder`, never `ListView(children:)` | lint |
| A datasource method returns a bare `List<T>` with no page or limit parameter | It is unpaginated. Add paging, page size from config | lint |
| A list sits inside another scrollable | `shrinkWrap: true` is the wrong answer. Use slivers | lint |
| Two lists in one screen scroll together | One `CustomScrollView` with slivers, not two `ListView`s in a `Column`. Nested scrollables pay for duplicate physics and gesture work | lint |
| Every item in a list has the same known height | Set `itemExtent`, or `prototypeItem` when the height is known only at runtime | lint |
| List items are simple stateless rows with no form or scroll state to keep | `addAutomaticKeepAlives: false`. Keep alive holds offscreen widgets in memory | lint |
| A paginated list can request the same page twice | Guard in flight: a second request for a page already loading is dropped | packet |
| Search, filter or sort changes on a paginated list | Reset page state to zero before the new query | packet |
| A list can grow past a few hundred loaded items | Window it, or evict from the far end | packet |
| A builder list's items have a stable id | Key the children so a reorder does not rebuild everything | packet |
| Raising a scroll view's cache extent is being considered | Leave the default unless a profile shows the need, and write the tradeoff in the packet: more offscreen build and raster work | packet |

## Images and media

| When | Do | Enforce |
|------|----|---------|
| An image comes from a URL | `cached_network_image`, never `Image.network` | lint |
| An image renders into a known slot | Set `memCacheWidth` / `cacheWidth` to the slot's pixel width | lint |
| An asset image is large and shown small | `cacheWidth` on the decode, not a `SizedBox` around it | lint |
| A remote image is built | It has a placeholder and an error widget | lint |
| An asset ships one file for all densities | Use folder variants (`2.0x/`, `3.0x/`) instead of one oversized asset | lint |
| A video or heavy asset is off screen | Do not build it, and do not preload it speculatively | packet |

## Rebuilds and const

| When | Do | Enforce |
|------|----|---------|
| A widget's constructor can be const | Make it const. Highest yield single rule in the framework | lint |
| Only one `MediaQueryData` field is needed | `MediaQuery.sizeOf` / `paddingOf` / `viewInsetsOf`. Plain `of(context)` rebuilds on **any** attribute change, so a keyboard opening rebuilds a widget that only wanted the width | lint |
| An `AnimatedBuilder` or `ValueListenableBuilder` has no `child:` | The static subtree is rebuilt every frame. Pass it through `child:` | lint |
| A subtree does not depend on the changing value | Hoist it out of the builder | lint |
| A `setState` covers state that is not local UI state | Move it to the project's state container | packet |
| A whole screen rebuilds for one changing field | Narrow the listen scope, after measuring | review: DevTools Performance view, Track Widget Builds |

## Animation and effects

| When | Do | Enforce |
|------|----|---------|
| Translucency is static | Use the colour's alpha. `Opacity` triggers `saveLayer` | lint |
| Translucency is animated | `FadeTransition` or `AnimatedOpacity`, not `Opacity` inside a builder | lint |
| Corners need rounding on a decorated box | `BoxDecoration.borderRadius` | lint |
| Corners need rounding on an image or video | `ClipRRect`, and only here | lint |
| A duration, curve or delay is written | It comes from the motion token file, never a literal | lint |
| `ShaderMask`, `ColorFilter`, `ImageFilter`, `BackdropFilter` or `Clip.antiAliasWithSaveLayer` appears in a diff | These are the named `saveLayer` triggers. The diff carries a one line reason, or the gate refuses it | gate |
| The design names a CSS cubic bezier | Translate it directly: `cubic-bezier(a,b,c,d)` is `Cubic(a,b,c,d)` | packet |
| Jank appears on the first play of an animation only, never on repeat | Shader compilation. Confirm Impeller is on for the target platform before chasing anything else | review: DevTools Performance view, shader compilation frame markers |

## Lifecycle and memory

| When | Do | Enforce |
|------|----|---------|
| An `AnimationController`, `TextEditingController`, `ScrollController`, `PageController`, `TabController` or `FocusNode` is created | Dispose it in `dispose()` | lint |
| A `StreamSubscription` is created | Cancel it in `dispose()` | lint |
| A `Timer` is created | Cancel it in `dispose()` | lint |
| `addListener` is written | `removeListener` is written in the same class | lint |
| A static or global field is typed as a widget, a `BuildContext` or a controller | Refuse it. Only ids and models live there. This is the most common real leak | lint |
| A Bloc or Cubit is created by hand | Close it. If DI owns it, do not close it, double close throws | packet |
| A callback outlives the widget (global stream, singleton, platform channel) | Capture only the value it needs. Capturing `State` or `BuildContext` keeps the screen alive | review: DevTools Memory view, retained path of the screen's State |

## Async and context

| When | Do | Enforce |
|------|----|---------|
| `context` or `setState` is used after an `await` | Check `mounted` first | lint |
| A future is started in `build()` | It restarts on every rebuild. Move it to `initState` or a provider | lint |
| An error is shown to a user | It comes from the localization source, never a raw exception string | lint |
| Work takes more than a frame (parse, crypto, image work, large sort) | `compute()` or an isolate | packet |

## Network

| When | Do | Enforce |
|------|----|---------|
| A `Dio` instance is configured | `connectTimeout`, `receiveTimeout` and `sendTimeout` on `BaseOptions` once, from config, not per call | lint |
| A screen issues a request that can outlive it | Pass a `CancelToken` and call `cancel()` in `dispose()` | lint |
| A second `Dio()` or `http.Client()` is constructed | Reuse the shared one. A client per request throws away connection reuse. Close it when its owner is disposed | gate |
| A JSON payload is non trivial and decoded on the UI isolate | Decode and map in `compute()` | gate |
| Retry logic is being written by hand | Use `RetryClient` from `package:http/retry.dart`, or the equivalent interceptor | gate |
| A retry policy is being chosen | Retry only idempotent methods and transient failures (timeout, 429, 503). Never a POST with side effects, never a 4xx | review: the endpoint's own semantics |
| A response is a file, an export or otherwise unbounded | Stream it (`ResponseType.stream`, or `Client.send`), never buffer the whole body | packet |
| An endpoint, page size, timeout or feature flag is written | Config, never a literal | lint |
| An `await` on a repository call sits inside a loop over a list | It is an N plus one. Batch it | lint |

## Persistence

| When | Do | Enforce |
|------|----|---------|
| A token, credential or personal data is stored on device | `flutter_secure_storage`. Never `shared_preferences`, never a plain file | gate |
| A list, JSON blob or file is about to go into `shared_preferences` | Use sqflite, drift or isar. `shared_preferences` is for simple values and does not guarantee durability | gate |
| More than one row is written in sequence (sqflite) | `db.batch()` plus one `commit()`, not an `await` per statement | lint |
| Several writes must be atomic | Wrap them in `transaction()` | lint |
| A field is used in a filter, sort or where clause | It carries an index. `@Index()` in isar, `CREATE INDEX` in sqflite, the index annotation in drift | lint |
| A schema changes | A version bump plus a migration step. Never an edit to the table definition alone | gate |

## Layout and painting

| When | Do | Enforce |
|------|----|---------|
| `IntrinsicWidth` or `IntrinsicHeight` is about to be used | Do not. It is O(n squared) layout | lint |
| A colour, spacing, radius or text size is written | It comes from the semantic token layer, not a literal and not the raw palette | lint |
| A new hex value appears that is not in the token file | It is a near duplicate of an existing token. Use that one | lint |
| A `Stack` child needs to fill | `Positioned.fill` | packet |
| Custom painting sits alongside static content | Consider a `RepaintBoundary`, after a profile shows the repaint | review: DevTools Performance view, raster stats |

## Startup

| When | Do | Enforce |
|------|----|---------|
| `WidgetsFlutterBinding.ensureInitialized()` is called but nothing before `runApp()` touches a plugin or a platform channel | Remove it | lint |
| Work is added to `main()` before `runApp()` | It delays the first frame. Move it behind the first frame, or make it lazy | packet |
| An optional heavy feature is bundled unconditionally | `deferred as` plus `loadLibrary()` at the call site | packet |
| A `deferred as` import exists | Verify it in profile or release mode. Debug mode inlines deferred libraries, so debug proves nothing | packet |
| A launch screen is set up on Android | Use the platform splash screen API in `styles.xml` with a pre Android 12 fallback, not a Flutter widget pretending to be a splash | packet |

## Size and release

| When | Do | Enforce |
|------|----|---------|
| A release Android build is cut | App bundle, or `--split-per-abi` when a bare APK is unavoidable | gate |
| A release build is cut | `--obfuscate` together with `--split-debug-info=<dir>`, and the symbol directory is kept with the release | gate |
| A release pipeline runs | `--analyze-size` output is captured as an artifact so a size regression is visible | gate |
| `pubspec.yaml` gains a dependency | The diff carries the decision ladder answer, or the gate refuses it | gate |
| A log line is written | Debug level only. Production keeps no logs, and no log carries personal data | lint |

## Security

| When | Do | Enforce |
|------|----|---------|
| A key, token or secret appears in a Dart file | Compile time injection or the platform keystore. A real secret never enters the repo | gate |
| A screen shows payment, credentials or other sensitive content | `FLAG_SECURE` on Android. On iOS, hide the content when the app resigns active | packet |
| The app declares a deep link, App Link or Universal Link | Validate scheme, host, path and every parameter before routing. Intent extras are untrusted input | gate |
| A `WebView` loads content the app does not own | JavaScript disabled unless required, plus a host allowlist in `onNavigationRequest` | lint |
| A `TextField` collects a password, card number or one time code | Set the matching `autofillHints` | lint |
| Certificate pinning is being considered | Justify it against the threat, then implement it in the platform network config, not per call | review: what the endpoint actually protects |

## Accessibility

| When | Do | Enforce |
|------|----|---------|
| An `InkWell`, `GestureDetector` or icon only button has no text label | `Semantics(label:, button: true)`, or `IconButton(tooltip:)` | lint |
| A tap target is smaller than 48 by 48 dp | Pad the hit area to 48 by 48 | lint |
| An icon and its label form one control | `MergeSemantics`, so a screen reader announces one node instead of fragments | lint |
| `ExcludeSemantics` is added | The excluded content is decorative or duplicated elsewhere. Excluding something interactive is a defect | lint |
| `Text` sits inside a fixed height `Container` or `SizedBox` | Check it at text scale 1.3 and above. Prefer intrinsic sizing, `Flexible` or `Wrap` | lint |
| State changes without navigation (validation error, loading finished) | `SemanticsService.announce()`, or update the `Semantics` node | packet |
| A composed widget has a reading order that differs from paint order | Set `Semantics(sortKey:)` | packet |

## Observability

| When | Do | Enforce |
|------|----|---------|
| Crash reporting is initialised | `FlutterError.onError` wired to the reporter and `runApp` inside `runZonedGuarded`, before any other app code | packet |
| A user identifier is attached to a crash or an event | A non personal internal id. Never an email or a phone number | lint |
| Sentry is configured | `sendDefaultPii` stays false, and `beforeSend` / `beforeBreadcrumb` scrub the rest | gate |
| A critical flow (login, checkout, upload) needs timing | One trace around that flow. Not ambient tracing everywhere | packet |
| A subtree can throw during build or paint | An error boundary, so one screen's failure does not blank the app | packet |

## Shape of the code (the SOLID triggers)

Stated as recognisable situations, since the acronym itself changes nothing.

| When | Do | Enforce |
|------|----|---------|
| A widget takes two or more bool parameters (`isCompact`, `hasBorder`) | It was split on the wrong axis. Make a separate widget for the second role | lint |
| A method passes fifty lines | Split it into private methods or separate widgets | lint |
| A file passes seven hundred lines | Split it before closing the packet | gate |
| A diff adds a function that overlaps an existing one past a threshold | Extract it and call it from both, instead of adding the copy | gate |
| A file under `domain/` imports Flutter | Refuse it. Flutter belongs to presentation | lint |
| A presentation file imports a repository implementation | Depend on the interface | lint |
| A repository is registered with `@Injectable(as: Interface)` | Resolve with `getIt<Interface>()`. `context.read<Interface>()` returns nothing there | lint |
| A model class is written | Immutable fields plus `copyWith` | lint |
| A new visual part is about to be written | Look in the shared layer first. Eighty percent overlap means extend, not copy | packet |
| A widget can be named without naming the feature | It belongs in the shared layer | packet |
| A class gains a second reason to change | Split it. That second reason is the seam | review: what changes together in practice |
| A `switch` or `if` chain on a type grows an arm per feature | Move the behaviour onto the type | review: how many arms exist and how they grow |
| Two things look alike but play different roles | Do not merge them. Shared appearance comes from shared tokens, not shared widgets | review: whether one design change would fork them |

## Diagnostics: which view answers which question

`review` rows above are not open questions. Each has a measurement:

- Too many rebuilds: Performance view, Track Widget Builds.
- Layout cost, deep trees, custom render objects: Track Layouts.
- Raster cost from clip, opacity or shadow layers: the render layer
  toggles, plus `checkerboardOffscreenLayers` to find `saveLayer`.
- Shader compilation jank: dark red frames in the frame chart, on first
  run of an animation only.
- Leaks and retention: Memory view, retained paths.
- Size: `--analyze-size` output in the app size tool.

Two standing rules for all of them:

- Profile mode only. A measurement taken in debug mode is not evidence.
- One number before, one number after, both in the report.

## Verify before turning these into lint rules

Version dependent claims collected during research, worth a check against
the project's own Flutter version first:

- `cacheExtent` and `cacheExtentStyle` are reported as deprecated in
  favour of `scrollCacheExtent` with `ScrollCacheExtent.pixels(...)`.
  Check which form this project's version accepts.
- Impeller default enablement per platform and version.
- The index declaration syntax in the drift version in use.
- Icon tree shaking flag naming and default behaviour in release builds.

## How to use this file

It is a source, not a runtime document. `lint` rows become analyzer rules
in the project's lint package. `gate` rows become hooks. `packet` rows go
into the planner's acceptance template, worded exactly as here, condition
first. `review` rows are the only ones that reach a reviewer by design,
and each carries the measurement that settles it.

A row that has not become a rule, a gate, or an acceptance line is not in
force. Loading this file at write time and hoping achieves nothing.
