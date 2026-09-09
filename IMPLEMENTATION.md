# Unfolded Orbit, Arc layouts, Gap, and Bend — implementation

## Moving bend anchors — v1.6.5

Last verified: 2026-09-10 — source: Gerald's endpoint-distortion screenshot and
request, JSX and test diffs, and local Node checks. Gerald subsequently authorized
committing and pushing this fix to the existing public repository.

The old ellipse concentrated cards near its endpoints and kept a fixed rotation
pivot. Replace the visible layout with a circular bow through the same endpoints
and midpoint depth. Equal angular intervals on this circle give equal center gaps;
the flat limit is a uniformly spaced row. Tangents are continuous through Bend 0.

Anchor expressions compensate in source coordinates (including scale, rotation,
and pixel aspect) so saved Position expressions remain recoverable. Continuous
travel uses the moving circle center and retains reference-radius linear speed.
Stable sinc identities evaluate the flat limit without an infinite AE anchor.
Unfolded Orbit rotates the bow rigidly and adjusts the focus translation, keeping
all image holds centered and preserving the original animation at Bend 100.
Full circles and one-card layouts retain their behavior. Update replaces generated
v1.6.3/1.6.4 rotation expressions and installs the managed Anchor Point expression;
opening a rig remains read-only. No new controls or dependencies.

Change JSX, README, this record, Node checks, native Arc test, native Bend test,
and its report ignore rule. Verify rendered centers, uniform neighboring gaps,
source dimensions, moving curvature center, zero continuity, existing-rig upgrades,
both orientations, seeded slots, focus/loop behavior, and native expression/render
results. No database, API, authentication, environment, credentials, or network
changes. Rollback: Undo the Update operation or reopen the previously saved AE
project with v1.6.4; Bend 100 restores the original geometry. Preserve custom
anchor expressions before Update. New visuals require reopening the 1.6.5 panel
and clicking Update; no installed/docked script copy is changed automatically.

Validation: `node tests/check.cjs` passes 15,980 numerical assertions, simulated
AE/ScriptUI checks, and five recovery cases. Native harness syntax passes, but
launch attempts in the existing AE session produced no Bend report or previews.
Native execution/visual confirmation is pending; run `tests/Bend Test.jsx` in a
disposable project. No native pass is claimed, and older reports do not establish
this version's behavior.

Anchor-coordinate reference: [Adobe layer properties](https://helpx.adobe.com/lu_en/after-effects/desktop/work-with-layers/layer-properties/layer-properties.html),
retrieved 2026-09-10. Positions alone are insufficient when anchors move; the tests
inspect transformed source centers (native AE `toComp`) as well.

## Earlier implementation

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

## Bend follow-up

Add Layout → Bend (%) for Half circle: 0 is flat, 100 is the existing semicircle,
and 200 doubles the bow depth. Keep the endpoint chord fixed in the Start angle
direction without stretching images. The initial v1.6.3 rotation used the reshaped
position; the follow-up below corrects it to the tangent. Upright images stay upright. Apply the
same shape to Unfolded Orbit positions and its focus offset so every hold stays
centered. Full circles and single images ignore Bend. Gap expands the base layout
before bending, so physical spacing varies along the flattened/deepened curve.

Modify the JSX, Node checks, focused native Arc test, README, and this record.
Save an optional controller Bend slider (default 100); load old rigs read-only,
then add the control and upgrade generated expressions on Update. Validate 0–200,
preserve keyed controls, and leave unrelated/source layers intact. No dependencies,
database, API, authentication, or environment changes. Verify endpoint/depth/rotation
geometry, both modes, 100% compatibility, full-circle isolation, saved GUI settings,
old-rig migration, and focus/loop behavior. Native results stay separately scoped.
Rollback is Undo or Bend 100; published v1.6.2 remains the previous release.

Last verified: 2026-09-10 — `node tests/check.cjs` passes 11,892 numerical assertions,
simulated host/GUI checks, and the five recovery cases on v1.6.3. The updated native
Arc/Gap/Bend harness passes syntax checks; native execution remains pending.

## Rotation follows the bow

Gerald clarified that the image/precomp rotations must adjust with Bend. Correct
the v1.6.3 outward-position angle to the curve's tangent: the image's horizontal
edge follows the path, including a consistent parallel row at Bend 0. At Bend 100,
retain the original circular rotation. Reuse Keep Upright as the orientation choice;
label its alternative Follow arc / bend and enable both choices in Unfolded Orbit.
Follow mode includes Orbit's animated travel; upright mode continues cancelling the
controller rotation. Image rotation offset still applies. Source precomp contents
are unchanged; only each generated layer's rotation expression changes.

Change JSX, Node tests, native Arc/Orbit harnesses, README, and this record. Update
existing v1.6.3 rotation blocks on Apply without duplicating them; older generated
rigs also upgrade. Verify tangent direction using sampled positions, flat/end cards,
stills/precomps, both modes/directions, animated Bend, saved orientation, old-rig
updates, and unchanged geometry/scale. No new controls, dependencies, credentials,
database, API, or environment settings. Undo or Keep Upright reverses the orientation
choice; native evidence remains scoped to the actual tested version.

Last verified: 2026-09-10 — v1.6.4 passes `node tests/check.cjs`: 12,944 numerical
assertions, simulated AE/ScriptUI checks, and five recovery cases. Native harnesses
pass syntax checks; their execution remains pending. Exact ellipse endpoints retain
perpendicular tangents above Bend 0 and switch to parallel at 0; README records this
keyframing limit. The prior v1.6.0 native report does not verify this version.
