# Unfolded Orbit, Arc layouts, and Gap — implementation

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

## Gap follow-up

Add Layout → Gap (px), default 0, to increase neighboring image-center spacing by
expanding the radius while retaining image size and the chosen 180°/360° span.
For more than one card, a gap g increases radius by g/(2 sin(step/2)); one card
stays in place. This adds spacing to the existing layout, rather than calculating
exact clearance between differently shaped or rotated artwork edges.

Change the JSX, README, this record, Node checks, and the focused native Arc test.
Existing rigs open read-only with Gap 0 and gain the saved/keyframeable control on
Update. Upgrade only generated radius expressions. Verify measured spacing changes,
unchanged image sizes, both modes/arcs/directions, old rigs, repeated updates,
reopening, keyed controls, and invalid input. No new dependencies, database, API,
authentication, or environment settings. Undo or Gap 0 restores the prior layout;
published v1.6.1 remains available as the previous script.

Last verified: 2026-09-10 — `node tests/check.cjs` passes 9,775 numerical assertions
plus simulated AE/ScriptUI/recovery checks on v1.6.2. Native harness syntax passes;
native execution of the Arc/Gap checks remains pending.
