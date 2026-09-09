# Radial Carousel

**Version 1.6.5.** An After Effects ScriptUI panel for
creating and editing 2D carousels from still images and precomps. Includes the new
**Unfolded Orbit** sequence, continuous upright/radial orbits, rounded corners,
seeded arrangements, recovery of existing carousels, a **180° half-circle** layout,
adjustable **Gap** between images, and **Bend** for a flatter or deeper half-circle bow.

This version combines Unfolded Orbit with **Layout → Arc**, **Gap (px)**, and **Bend (%)**. Close and
reopen the updated script to load the new controls; replace any installed copy too.

Version 1.6.5 corrects crowded end cards with moving anchors and a circular bow.
For a fixed version, use the
[v1.6.5 script](https://github.com/geraldjove/after-effects-radial-carousel/raw/refs/tags/v1.6.5/Radial%20Carousel.jsx).

[Download Radial Carousel.jsx](https://github.com/geraldjove/after-effects-radial-carousel/raw/refs/heads/main/Radial%20Carousel.jsx), or use **Code > Download ZIP** for the script, documentation, and tests.

Open **Radial Carousel.jsx** in After Effects using **File > Scripts > Run Script File**.
No plug-ins or script file-writing permission are needed for the carousel.

**To edit a carousel you already made:** reopen the panel, choose it under **Existing carousels**, change the settings, and click **Update Carousel**. The panel searches every composition and restores the settings and image list directly from the existing layers. Nothing needs to be rebuilt or imported again.

On opening, the panel automatically loads the carousel belonging to a selected controller/image. Otherwise it loads the only carousel in the active composition, or the only one in the project. When there are several possible targets, choose one from the dropdown. Each entry shows its composition, controller name, and layer number. **Refresh** rescans after another script creates a carousel, a rig is removed, names change, or you open a different project.

**Update Carousel** always updates the dropdown's loaded carousel, even if you change your timeline selection or view another composition. Its image list is shown in original order and is read-only; creation/import controls are disabled while editing. **Load Selected** is an alternative shortcut for loading the carousel belonging to a selected timeline controller or image. Keyframed controls update at the loaded carousel composition's playhead.

Recovery works with earlier versions of this script, including renamed controllers, as long as the controller and its identifying comment are intact. The information already lives in the AE project; no separate settings file is required. Save your `.aep` normally to retain it between After Effects sessions. Opening the GUI only reads the rig; optional controls from newer versions are added when you click Update.

To create another carousel:

1. Choose **Create new carousel** in the dropdown. In AE's **Project panel**, select your imported still images or their compositions, then click **Use Project Selection** in the **Images** tab. Each selected precomp becomes one carousel item and appears with a **[Comp]** label. To import images from disk instead, click **Add Files...**. You can mix images and precomps, add another batch, remove selected entries, or clear the list.
2. Choose **Continuous orbit** or **Unfolded Orbit** in the **Animation** dropdown.
3. In **Layout**, choose **Arc → Full circle (360 degrees)** or **Half circle (180 degrees)**, then set radius, gap, image size, direction, rounded corners, and optional shuffle. For Half circle, **Bend (%)** adjusts the bow. Choose **Follow arc / bend** to rotate the images with the curve, or **Keep images upright** to keep them level. Both orientations work in both animation modes; Continuous orbit also exposes speed.
4. For Unfolded Orbit, use **Timing / Focus** to set timing, zoom, blur, and side-image size. Eight images with the default timing give a 17-second loop.
5. In **Composition**, choose the active composition or enter settings for a new one. New Unfolded Orbit compositions automatically fit the loop duration. The first selection of this mode suggests a 1080 × 1440 canvas when creating a new composition.
6. Click **Create Radial Carousel**, then preview the timeline. The new carousel is loaded into update mode automatically.

## Arc: full circle or half circle

**Layout → Arc** is available in both animation modes. Half circle distributes image
centers from Start angle through Start angle + 180°, including both endpoints. One
image stays at Start angle. Use `-180` for the top half, `-90` for the right half,
`0` for the bottom half, or `90` for the left half. In Continuous orbit, Speed `0`
keeps that half stationary; a nonzero speed rotates the entire semicircle.

For an existing carousel, select it, choose Arc, and click **Update Carousel**.
Earlier rigs open as full circles and receive the new **Half Circle** controller
checkbox and spacing expressions on Update. Reopening restores the arc choice.
Shuffle, radial/upright orientation, rounding, and keyframed controls are retained.

Unfolded Orbit visits every image with either arc choice. With a half circle, the
transition between the two endpoints crosses the empty half of the circle. Hold
and transition durations remain the same, so that larger gap moves faster than
the smaller gaps. Focus blur and side-image scaling follow the chosen spacing.

## Bend the half circle

Choose **Half circle (180 degrees)**, then adjust **Layout → Bend (%)**:

| Bend | Shape |
| --- | --- |
| 0% | Flat line between the two endpoints. |
| 25–75% | A shallower bow. |
| 100% | The original semicircle. |
| 150–200% | A deeper bow. |

Bend changes a circular bow's depth while keeping the two endpoint centers fixed
at zero travel. **Start angle** turns that line and bow together. Cards are equally
spaced along the circular arc, including at both ends; Bend 0 is an evenly spaced
flat row. Images retain their size and proportions. **Follow arc / bend** rotates
each image or precomp along that bow, with continuous end-card rotation through 0.
**Keep images upright** stays level; Image rotation offset applies to either choice.

Each generated image's **Anchor Point** now compensates automatically for Bend,
rotation, and scale. Its visible center can differ from its Position property.
In Continuous orbit, the effective pivot follows the bow's changing circle center,
so cards keep equal spacing during travel. Speed uses the original radius as its
distance reference: shallow bows turn more slowly around their larger circle, and
Bend 0 becomes straight-line travel. Unfolded Orbit moves the bowed arrangement
together and retains centered image holds. Source precomp contents are unchanged.

It works in both animation modes and can be keyframed with the controller's **Bend**
slider. Full circles and single images ignore Bend. For existing carousels, set Bend
and click **Update Carousel**; reopening restores it. Older rigs default to 100% and
gain the control on Update. Set 100% to restore the original shape. Updating also
installs the anchor compensation and replaces earlier Bend rotation expressions.
Anchor Point is now script-managed; preserve custom anchor expressions before Update.

Gap expands the base layout before bending. Spacing is uniform at a given Bend,
but its amount changes with bow length; fixed endpoints cannot preserve the same
spacing at every Bend. Large cards can still overlap uniformly: increase Gap or
reduce Image size. Deep bows can extend beyond the endpoint line's width.

## Gap between images

Increase **Layout → Gap (px)** to spread images farther apart without resizing them.
It expands the carousel from the base **Radius** and keeps the chosen 180°/360° span.
`0` preserves the original layout; a single image stays in place. For an existing
carousel, set Gap and click **Update Carousel**. Reopening restores the value.

Gap adds the chosen number of pixels to the distance between neighboring image
centers at normal controller scale and Bend 100%. For example, `40` adds 40 pixels of spacing to
each neighboring pair. Existing image overlap may require a larger value. Different
image shapes and rotations can have different visible edge clearances; this control
does not calculate an exact edge-to-edge margin. Scaling the controller scales the
gap too. Larger gaps may require a larger composition to keep every image in view.

Gap works with both animation modes, shuffle, and either orientation. In Unfolded
Orbit it changes the spread/focus layout; the opening and closing collapse still
brings the cards together. The controller's **Gap** slider can be keyframed. Older
rigs open with `0` and gain the control and spacing expression when updated.

## Unfolded Orbit

The centered first card spreads into a ring. The view zooms in while the ring makes
one turn, then holds each card in focus before advancing. Side cards shrink and
blur. A second zoom/turn returns to the ring, which collapses to the first card.
The motion repeats automatically. It uses native transforms, masks, and Gaussian
Blur; no camera or additional plugin is required.

| Control | Default | Behavior |
| --- | --- | --- |
| Unfold time | 0.8 s | Time to spread; also used to collapse. |
| Zoom time | 1.15 s | Time to zoom/spin in; also used to return. |
| Hold per image | 0.8 s | Pause on each card and on the first card after a full turn. |
| Transition time | 0.6 s | Eased advance to the next card. |
| Focus zoom | 280% | Magnification of the centered hero and focus carousel. |
| Focus blur | 18 px | Blur on the surrounding cards at their rendered size. |
| Side image scale | 50% | Size of surrounding cards relative to the focused card. |

Unchecked **Clockwise rotation** presents cards in their original list order.
Checking it reverses the direction. Shuffle changes the slot order; the image in
slot zero becomes the opening/closing hero. **Start angle** sets the focus position
around the ring; `-90` is the top, as in the reference. Controller Position still
moves the whole composition and controller Scale still resizes it.

For a 1080 × 1440 composition and eight 4:3 images, the rendered example uses
**Radius 270**, **Image size 250**, **Corner radius 12**, and the timing/focus
defaults above. Adjust radius or side-image scale if your images overlap.

The loop length is `1.1 + 2×unfold + 2×zoom + (count+1)×hold + count×transition`.
The extra 1.1 seconds consists of short opening/closing and ring pauses. A new
composition rounds its duration up to a whole frame. Existing compositions must
have room for the entire loop after the controller's in point. The script explains
the required duration before making changes. When you lengthen an existing
composition and update an older rig, its generated layers extend to fit the loop;
short precomps hold their last frame without changing their source compositions.

**Timing values should stay constant for a seamless loop.** Animating those values
changes the time mapping. Layout, zoom, side size, and blur can be animated, but
their endpoints must also match if you want a loop. Animation inside source
precomps must loop independently; the rig does not rewrite source content. Still
images give the demonstrated seamless visual loop.

Reopen the panel and select the existing carousel to recover its mode and settings.
Switching between modes updates the generated rig without duplicating images.
Mode changes replace the script-managed transform/opacity expressions; preserve
any custom replacements before changing modes. Keep the generated controller
effect names, **Orbit State**, and **Loop Duration** intact.

The reference was inspected from the public preview; this is an independently
implemented AE version, with adjustable timing rather than a claim of an exact
match. No reference media or template source is included.
[Unfolded Orbit reference](https://108.supply/motion/unfolded-orbit), retrieved
2026-09-10.

If the panel is already running, close and reopen the updated script to see the new controls. If you installed a docked copy, replace that copy with this updated file before reopening it.

**Recovery fix in version 1.5.2:** the “Load newly created carousel / Line: 244 / null is not an object” error in 1.5.1 occurred when recovering image order after creation. The script now uses explicit `if/else` checks instead of chained conditional operators in recovery and status labels. The reported failure is consistent with [Adobe's reported ExtendScript conditional-operator bug](https://community.adobe.com/bug-reports-528/bug-in-extendscript-s-conditional-ternary-operator-1216218), retrieved 2026-09-10. After that error, the carousel already exists: close and reopen the updated panel, choose it under **Existing carousels**, and update it. You do not need to create another copy. Automated recovery checks pass; confirmation in a native AE session remains pending.

Error dialogs include the action, creation step, and AE line number (when provided). If another error occurs, copy the complete dialog text. Missing controller effects are identified by name.

**Project selection** reuses existing images and compositions, keeping their Project panel location, footage interpretation, and precomp contents. Selected folders, standalone video/audio, generated solids, and offline images are skipped. Select the image or composition items themselves inside folders. The list follows the Project panel's sort order; selecting the same item again does not add it twice. Distinct footage items from the same PSD remain distinct.

**Precomposed images** stay linked to their original compositions, so edits inside the source comp appear in the carousel. Precomps work with both orientations, rounded corners, arrangement seeds, and existing-carousel recovery. Size and rounded corners use the entire precomp's dimensions: crop the source composition to the artwork if it has large transparent margins. Animation plays from source time zero at normal speed. If the source comp is shorter than the carousel, its carousel layer uses Time Remapping to hold the source's last frame afterward; the original comp's duration and animation are unchanged.

For an existing destination composition, open its timeline before launching the panel. If Project selection changes AE's active item to footage or one of your chosen source precomps, Create uses the composition that was active when the panel opened. To target a different composition, click that composition's timeline immediately before Create. Otherwise, leave the existing-composition option unchecked to create a new one. A source precomp cannot be the destination or contain the destination at any nesting depth; the script reports this before creating anything.

| Orientation | Result |
| --- | --- |
| Keep images upright | Images travel around the circle while staying level. |
| Follow arc / bend | Each image's horizontal edge follows the curve and turns with the carousel, including animated Unfolded Orbit travel. Bend 0 gives a parallel row. |

**Image rotation offset** adjusts the artwork's direction in either mode. With Follow arc / bend, `180` reverses the image; `90` turns it sideways.

**Rounded corners** cuts the image's four corners with an editable mask. A radius of `24` means 24 pixels at the selected image size; larger values make the corners rounder, up to half the image's shorter edge. `0`, or unchecking the option, restores square corners. It works with both orientation modes, still images, and precomps. The source and existing transparency stay intact. The mask follows the image or precomp bounds, including any transparent margins, so artwork already inset from those bounds may look unchanged. Scaling the entire controller also scales the finished corners.

To round a carousel you already created, load it from the dropdown, enable **Rounded corners**, choose a radius, then click **Update Carousel**. Older carousels receive the new controls and masks automatically. Repeated updates reuse the same `RC Rounded Corners` mask; other masks remain in place. You can also animate `Rounded Corners` and `Corner Radius` in the controller's Effect Controls.

**Arrangement seed** shuffles which image occupies each evenly spaced slot around the circle. The same seed and the same image list/order reproduce the same arrangement. **New Seed** chooses a different seed and turns on shuffling; click **Create** or **Update Carousel** to use it. Uncheck **Shuffle image order** to return to the original list order. Changing the seed preserves image size, spacing, orbit speed, orientation, and rounded corners. With only a few images, different seeds can produce the same order; a single image has only one arrangement.

For an existing carousel, load it from the dropdown, choose a seed or click **New Seed**, then **Update Carousel**. Earlier script-generated rigs are upgraded when you update. The controller also exposes `Shuffle Images` and `Arrangement Seed` in Effect Controls for direct changes. Changing a seed rearranges images immediately; it does not animate a transition between arrangements. The seed is a whole number from `0` to `999999`.

You can also edit the controller's Effect Controls directly. Move its Position to move the carousel center. Use **Refresh** to reload changes made outside the GUI. Updating a carousel does not change its composition dimensions.

- **Radius** is measured from the center to each image's center. Larger images or many images can overlap; increase radius or reduce image size.
- **Image size** fits each image's longest edge without cropping or stretching. Transparent margins in the source count toward its size.
- **Speed** is degrees per second for full circles and Bend 100; `30` completes a revolution in `12` seconds. Bent half-circles preserve that reference-radius travel speed around their new curvature center. Uncheck Clockwise to reverse it; use `0` for a still arrangement.
- For a seamless Continuous orbit loop at Bend 100 or with a full circle, set speed to `360 / duration` (or a whole multiple). For a bent half-circle, divide that speed by `sin(2*atan(Bend/100))` as well; a flat row translates and does not make a closed orbit. The default new composition is 12 seconds at 30 fps. Do not append a duplicate endpoint frame.
- For eased or custom rotation, set Speed to `0`, then keyframe the controller's ordinary Rotation property. Both image orientation modes still work. Animating the Speed control itself can cause jumps because it is multiplied by elapsed time.
- **Start angle** places the first slot: `-90` top, `0` right, `90` bottom, `180` left. With shuffling off, images follow the list order clockwise. Duplicate selections within each image-source option are ignored.
- Each Create click makes a separate carousel and asset folder. Renaming or reordering layers will not break the rig. Keep each image parented to its own controller and keep the effect control names unchanged. The number of slots is fixed when created; create again with a changed image list to change the count.
- Files added through **Add Files...** remain linked to their original disk locations. Moving/deleting them later requires relinking in AE. PSD/PSB files added from disk import as flattened footage. Numbered files import individually, never as an image sequence. **Use Project Selection** uses the already-imported item directly, including individually imported PSD layers, without another import.
- Existing composition layers are preserved. New carousel layers span the composition duration. Each Create or Update operation is one Undo step. Updating an already keyframed control inserts a key at the playhead and preserves its other keys.

To dock the panel on Windows, copy **Radial Carousel.jsx** into your AE installation's `Support Files\Scripts\ScriptUI Panels` folder, restart AE, then open it from **Window > Radial Carousel**. For example, the AE 2026 installation path is `C:\Program Files\Adobe\Adobe After Effects 2026`.

Verification: run `node tests/check.cjs` for expression/validation and simulated
panel checks. `tests/Smoke Test.jsx` checks continuous orbit in native AE, including
real imports and three PNG exports. `tests/Unfolded Orbit Test.jsx` exercises the
new mode in native AE with eight synthetic source precomps, eleven PNG exports,
and a full 17-second H.264 movie. Both native tests run through **File > Scripts >
Run Script File** and need script file-writing permission for reports/exports.
The panel itself does not need that preference.

`tests/Arc Test.jsx` is the focused native check for Arc, Gap, and Bend:
GUI creation/reopening/updating, added spacing, unchanged image size, radial geometry,
bow depth/fixed endpoints, tangent/flat/upright rotation, and both Unfolded Orbit directions.
It writes `tests/arc-last-run.txt` and `tests/arc-preview.png`, then removes its
synthetic project items. Only a completed PASS with successful cleanup counts.

`tests/Bend Test.jsx` checks the rendered source centers and changing anchors on
twelve synthetic cards, matching the crowded-end regression. It tests flat/tiny/
shallow/normal/deep bends, uniform spacing during travel, keyed Bend through zero,
and both Unfolded Orbit directions. It writes `tests/bend-last-run.txt` and ignored
PNG previews, then removes its synthetic items without saving the open project.

**v1.6.5 local validation — 2026-09-10:** `node tests/check.cjs` passes 15,980
numerical assertions plus simulated host/GUI and five recovery checks. Tests inspect
the rendered source centers after anchor/scale/rotation, including a rotating
12-card bow at Bend 50, even neighbor spacing, the moving circle center, tiny/zero
Bend continuity, source pixel aspect, both animation modes, centered focus/loops,
and v1.6.4 upgrades. Native harness syntax passes. **Native execution and visual
confirmation remain pending:** launch attempts produced no Bend report or preview.
Run `tests/Bend Test.jsx` manually in a disposable project and inspect its report
and previews. Existing native reports apply only to their earlier source versions.

**Historical Bend/rotation verification — 2026-09-10:** the v1.6.4 Node checks passed with 12,944
numerical assertions plus the simulated GUI/recovery checks. Coverage includes both
arcs, creation and updates, saved setting recovery, single-image layouts, old rigs,
and Unfolded Orbit focus/blur/scale/loop behavior in both directions with 1/2/3/8/12
images, measured gap changes, Gap 0 restoration, old gap-expression upgrades, saved
and keyed controls, flat/shallow/deep bow geometry, rotated layouts, tangent rotation
checked against sampled positions, animated still/precomp travel, saved orientation,
v1.6.3 rotation upgrades, full-circle isolation, and invalid input. The focused native Arc test has no
completed report yet; the earlier native
v1.6.0 Orbit result does not verify these newer edits.

Native reports are `tests/last-run.txt` and `tests/orbit-last-run.txt`. Check for a
completed PASS/COMPLETE result; an empty, RUNNING, or FAIL report is not a pass.
The orbit test temporarily disables other queued renders, renders only its
synthetic comp, restores their queue flags, and removes its test project items.
It never saves the open project. Repeated movie tests choose a fresh numbered
filename, avoiding overwrite prompts. The tests record project item counts before
and after cleanup. Generated reports, images, movies, and projects are gitignored.

For a quick native check of this recovery bug, run `tests/Recovery Test.jsx`. It runs the shipped recovery function on synthetic layers in AE's actual scripting engine and displays a PASS/FAIL dialog. It covers modern nonzero slots, slot zero, old rigs, unknown expressions, and empty carousels. It reads the production script without creating project items or writing files; it does not verify rendering or the complete GUI.

This is a 2D circular carousel. No network calls, credentials, external libraries, database, or environment changes are involved.

**Historical public v1.5.2 verification — 2026-09-10:** the then-current
`node tests/check.cjs` passed on Node.js v26.5.0 with 2,005 numerical assertions,
simulated AE/ScriptUI checks, and five recovery cases. That publication did not
include native verification. The v1.6.0 results below describe an earlier development
snapshot. Node.js is needed only for automated checks, not for
using the carousel in After Effects.

**Security and environment:** no dependencies, database, authentication, API,
network requests, credentials, or environment variables were added. Settings are
validated before creation or update. Imports remain linked to their sources;
source compositions and unrelated layers are preserved. Create/update operations
remain undoable. Large image counts or high-resolution blurred precomps can still
increase AE preview/render time; no performance guarantee is made.

Native Gaussian Blur match name: [Adobe-linked scripting reference](https://ae-scripting.docsforadobe.dev/matchnames/effects/firstparty/), retrieved 2026-09-10.

**Historical v1.6.0 verification — 2026-09-10, Windows / AE 26.3x87:**
`node tests/check.cjs` passed with 2,821 numerical assertions plus the existing
recovery and simulated host checks. The final native Unfolded Orbit test passed
942 assertions, exported eleven PNG frames, and rendered the full 17-second,
1080 × 1440 H.264 movie at `tests/unfolded-orbit-preview-1.mp4`. Project item counts
were 131 before and 131 after cleanup. Rendered frames were visually inspected.
The first preview also exists at `tests/unfolded-orbit-preview.mp4`; a later retry
stopped at an overwrite prompt, which led to the fresh-filename test fix.

These checks cover this Windows build and synthetic source precomps. They do not
establish compatibility with older AE versions, macOS, every imported file format,
or an exact visual match to the reference. They do not verify the v1.6.1 Arc
integration, v1.6.2 Gap addition, v1.6.3 Bend addition, or v1.6.4 rotation correction.

The extended continuous-orbit native smoke check is **incomplete**: after fixing
its report header to convert `Date` explicitly to a string, it exported the three
legacy preview frames, but AE exited before its final report/cleanup record. The
exit cause was not established; no matching Windows Application Error event was
found in the inspected interval. Do not treat that header-only report as a pass.
Continuous-orbit automated regressions passed; the completed 942-assertion native
result above applies to Unfolded Orbit and its tested create/recover/update paths.

Last verified: 2026-09-10 — source: script implementation, local AE installation, and the test evidence described above. Installation/menu instructions: [Adobe's scripting documentation](https://helpx.adobe.com/uk/after-effects/desktop/automate-in-after-effects/automate-animation/scripts.html), retrieved 2026-09-10. Expression reference: [Adobe expression language reference](https://helpx.adobe.com/after-effects/desktop/work-with-expressions/expression-language-reference/expression-language-reference.html), retrieved 2026-09-10.

Project selection API and sort order: [After Effects scripting guide](https://ae-scripting.docsforadobe.dev/general/project/#projectselection), retrieved 2026-09-10. Version 1.5 adds composition inputs to project selection and existing-carousel recovery. Automated checks cover image/precomp reuse, filtering, deduplication, source preservation on failure, rounded-mask geometry, deterministic permutations, reopening the GUI, multiple rigs, updating without rebuilding, destination selection, recursive-comp rejection, and short-precomp frame holds. Native AE verification remains pending.

Precomp layer creation and time remapping APIs: [LayerCollection.add](https://ae-scripting.docsforadobe.dev/layer/layercollection/#layercollectionadd), [AVLayer.timeRemapEnabled](https://ae-scripting.docsforadobe.dev/layer/avlayer/#avlayertimeremapenabled), retrieved 2026-09-10.
