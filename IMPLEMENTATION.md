# Unfolded Orbit and Arc layouts — v1.6.1 implementation

Last verified: 2026-09-10 — source: Gerald's request, existing JSX/tests, and the
public reference preview at https://108.supply/motion/unfolded-orbit. Gerald also
requested the 180° layout and authorized committing and publishing the combined build.

Add an optional Unfolded Orbit mode to the existing dependency-free ScriptUI panel.
Keep still/precomp import, rounded masks, source order, seeded arrangements, saved
rig recovery, and one-step undo. Ordinary radial carousels retain their behavior.

Sequence: centered hero, spread into a ring, zoom to the focus position while
spinning, hold/advance through every card, zoom back, collapse, repeat. Default
eight-card loop: 17 seconds. Controls: unfold/zoom time, hold/transition time,
zoom amount, focus blur, direction, plus the existing layout controls. Use native
2D transforms, expressions, and Gaussian Blur; keep the generated layers editable.

Layout → Arc chooses a full circle or a half circle in both animation modes. Half
circles include both endpoints and keep one image at Start angle. Unfolded Orbit
visits every slot in either direction, crossing the empty half in one transition.
Existing rigs gain the optional control and updated spacing when updated.

Files: `Radial Carousel.jsx`, `README.md`, `.gitignore`, `tests/check.cjs`, and a
native `tests/Unfolded Orbit Test.jsx` with a synthetic eight-card preview, plus
`tests/Arc Test.jsx` for focused native arc checks. The
existing `tests/Smoke Test.jsx` also receives explicit mode defaults and a Date
string conversion so its report header can run in native AE.

No database, API, authentication, environment variable, dependency, or migration.
Validate settings before creating assets. Never mutate imported source comps or
remove unrelated layers. Only test-generated projects/renders are written locally.

Verify the complete loop and phase boundaries, focus order, negative direction,
variable counts, rounded corners, reopening/updating, old-mode compatibility,
failure cleanup, and actual AE expressions/rendered frames. Native checks must
report their result separately from Node simulations. No reference media is shipped.

Rollback: Undo the AE operation; keep the prior published v1.5.2 script available.
Implementation and verification results are recorded in `README.md`. The combined
v1.6.1 Node suite passes 8,392 numerical assertions and simulated host/recovery checks.
The native Unfolded Orbit check completed against the earlier v1.6.0 snapshot;
v1.6.1 native verification remains pending. The broader continuous-orbit native
check was interrupted by AE exiting and must not be recorded as passed.
