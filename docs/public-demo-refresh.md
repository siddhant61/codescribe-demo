# Public demo refresh — 4 November 2026

## Intent

Make CodeScribe recognizable as Siddhant Gadamsetti's independent project and give a first-time visitor a coherent route through its Xikolo analysis. Preserve the static site, original report/data artifacts, and established URLs.

## Design

Use an editorial landing page with a restrained paper/ink/teal palette, serif display type and sans-serif body text. A labeled conceptual relationship illustration introduces the purpose without masquerading as a measured graph. Lead visitors to architecture, reports and the interactive graph; make methodology and original JSON directly accessible. Keep the existing theme toggle and mobile navigation.

The focused refresh was chosen for this implementation following the explicit request for aesthetic, visual and narrative polish. Copy-only changes would not solve the presentation hierarchy; a full application rewrite would add unnecessary risk and scope.

## Evidence handling

Remove inconsistent counts from the landing/methodology headline. Clearly label original analysis as historical and unvalidated rather than reclassify old results as benchmarks. Preserve detailed reports, content and JSON unchanged. No claim that DORA performance, onboarding speed or accuracy improved has been added. Shared branding is updated across the eight top-level HTML pages.

## Additional repairs

- Add skip links and retain native keyboard-focus navigation.
- Correct 32 obsolete report filename links in the sitemap.
- Replace missing sitemap graph/workflow/toolset destinations with actual resources or the existing work-in-progress page.
- Correct two mismatched methodology heading tags.
- Replace the work-in-progress page's unsupported promise of active development with an explicit missing-snapshot notice.

## Browser verification and follow-up repairs

Local Chromium browser verification completed on 4 November 2026. The original cloud attempts did not pass; those environment failures were not counted as verification.

The browser pass repaired active primary navigation and methodology Back/Forward state; mobile keyboard menu order and Escape; graph control state across detail changes, Reset View and category jumps; graph background panning; keyboard node activation; accessible details close/focus return and repeated resize handling; graph legend colors/contrast; readable keyboard-scrollable diagrams; 320px overflow; resource callout contrast; consistent navigation labels; and remaining unsupported availability promises.

Six Python checks and twenty Node regression checks pass, as do standalone/inline JavaScript syntax and whitespace checks. The eight public pages have one main, one h1, no duplicate IDs and no duplicate attributes. Original cluster reports, content and JSON remain unchanged.

See [browser-verification.md](browser-verification.md) for the test matrix, observed results and remaining limits. Internal browser screenshots were captured for QA only. No push, pull request, merge or deployment was performed.
