# CodeScribe public demo — browser verification

Historical record for the 4 November revision. For the subsequent remaining-page refinement, see [the 5 November verification record](refinement-verification-2026-11-05.md); the results below do not validate that refinement.

Date: 4 November 2026. Repository: `siddhant61/ai-workflow-portal`.
Base: `2503dc761b600d96ed6fdcbe254857e4ec5109d4`.
Branch: `verify/public-demo-refresh`.

## Scope and provenance

The supplied patch (SHA256 `161d9367a60f89f81956a46df5583b1145fbe808fe1814e3105ad0d23a63059f`) and complete preview (SHA256 `9ed72d9ce9625c7abef22d0272adbe943138d80d424df15b09ecf871f7c69560`) were recovered through Library, byte-verified, and the patch applied cleanly to an isolated checkout at its base. No product-repository work was included.

Browser: local Playwright Chromium 154, Linux; HTTP preview bound to localhost. Mobile results are viewport emulation, not a physical device test.

## Browser results

| Check | Observed result |
| --- | --- |
| Eight top-level pages | Load correctly in light and dark themes at 1440×1000 and 390×844; internal screenshots captured. |
| Narrow screens | All eight pages have document width equal to 320px viewport after fixing methodology cards and report category heading wrapping. |
| Resize | Home checked at 320, 390, 768, 769, 1024 and 1440px; one menu button only at mobile widths; repeated breakpoint crossings work. |
| Skip link | First Tab exposes the link; Enter focuses `main-content`. |
| Mobile navigation | Repeated opening/closing works; Tab enters links after toggle; Escape closes and restores toggle focus; link selection navigates and closes menu. |
| Current page | Correct primary link receives active styling and `aria-current=page`; navigation labels and order match across pages. Nested hosting paths also covered by Node tests. |
| Back/Forward | Page navigation and methodology fragment selection restore correctly. |
| Themes | Five repeated toggles alternate reliably; selected theme persists through navigation. |
| Graph loading | Default 200 nodes render; detail controls also render 50 and 868 nodes from the unchanged artifact. These are UI counts, not validated coverage claims. |
| Graph control state | Overview remains label-free with CORE filtering after detail change; search highlights persist (76 matches in tested 200-node view); selected workflow persists (10 highlighted nodes at full detail). |
| Pointer interactions | Node click opens details, node drag pins it, and background drag pans the canvas (observed translation 60px/40px). Removed a nested SVG wrapper that intercepted empty-background drags. |
| Reset and navigation | Zoom controls work; Reset View clears selection/filter inputs and restores zoom k=1; category jumps reveal their target when a conflicting filter was selected. |
| Graph keyboard | Focusable, named nodes activate with Enter/Space; panel opens with focus on close; Escape returns focus to source node/control. |
| Graph details | Close button, Escape and mobile outside dismissal work; chained in-panel links keep details open and recover focus; six mobile/desktop resize cycles retain one working close control. |
| Fullscreen | Entry succeeds in dark theme; exit returns to normal page view. |
| Diagrams | Both methodology and all three architecture Mermaid diagrams render. Light panels maintain contrast in both themes; keyboard ArrowRight scrolls mobile diagrams without page overflow. |
| Local destinations | 54 distinct linked local pages/assets return HTTP 200. Existing source/link tests also pass. |
| Browser errors | No uncaught page errors during the desktop/mobile matrix. |

## Automated checks

- Six Python tests pass (`python3 -m unittest discover -s tests -v`).
- Twenty Node checks pass: eight navigation, six graph controls, six graph details. The three test files were also executed directly so their individual TAP outcomes were visible.
- All five standalone JavaScript files and two inline scripts pass `node --check`.
- Eight top-level HTML pages parse with one main, one h1, no duplicate IDs and no duplicate attributes.
- `git diff --check` passes.
- No changes under `cluster-reports/`, `content/`, or `idp/`.

## Limits and publication status

No browser-verification blocker remains for this local Chromium pass. Safari/Firefox, physical touch gestures, screen-reader output and independent validation of the historical analysis were not tested. D3/Mermaid still rely on existing external CDNs. The resource-unavailable page now states the snapshot boundary without promising a future delivery date.

The work remains unpublished: no push, PR, merge or deployment. Screenshots are internal verification evidence and are excluded from the patch and preview archive.
