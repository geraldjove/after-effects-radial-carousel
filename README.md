# Radial Carousel

**Version 1.5.2** — an After Effects ScriptUI panel for creating and editing animated 2D circular carousels from still images and precomps. Includes upright/radial orientation, rounded corners, seeded image arrangements, and recovery of existing carousels.

[Download Radial Carousel.jsx](https://github.com/geraldjove/after-effects-radial-carousel/raw/refs/heads/main/Radial%20Carousel.jsx), or use **Code > Download ZIP** for the script, documentation, and tests.

Open **Radial Carousel.jsx** in After Effects using **File > Scripts > Run Script File**.
No plug-ins or script file-writing permission are needed for the carousel.

**To edit a carousel you already made:** reopen the panel, choose it under **Existing carousels**, change the settings, and click **Update Carousel**. The panel searches every composition and restores the settings and image list directly from the existing layers. Nothing needs to be rebuilt or imported again.

On opening, the panel automatically loads the carousel belonging to a selected controller/image. Otherwise it loads the only carousel in the active composition, or the only one in the project. When there are several possible targets, choose one from the dropdown. Each entry shows its composition, controller name, and layer number. **Refresh** rescans after another script creates a carousel, a rig is removed, names change, or you open a different project.

**Update Carousel** always updates the dropdown's loaded carousel, even if you change your timeline selection or view another composition. Its image list is shown in original order and is read-only; creation/import controls are disabled while editing. **Load Selected** is an alternative shortcut for loading the carousel belonging to a selected timeline controller or image. Keyframed controls update at the loaded carousel composition's playhead.

Recovery works with earlier versions of this script, including renamed controllers, as long as the controller and its identifying comment are intact. The information already lives in the AE project; no separate settings file is required. Save your `.aep` normally to retain it between After Effects sessions. Opening the GUI only reads the rig; optional controls from newer versions are added when you click Update.

To create another carousel:

1. Choose **Create new carousel** in the dropdown. In AE's **Project panel**, select your imported still images or their compositions, then click **Use Project Selection** under **1. Images / Comps**. Each selected precomp becomes one carousel item and appears with a **[Comp]** label. To import images from disk instead, click **Add Files...**. You can mix images and precomps, add another batch, remove selected entries, or clear the list.
2. Set radius, image size, speed, and orientation. For rounded image edges, enable **Rounded corners** and set **Corner radius (px)**. To vary the arrangement, enable **Shuffle image order** and set an **Arrangement seed**, or click **New Seed**.
3. Choose the active composition or enter settings for a new one.
4. Click **Create Radial Carousel**, then preview the timeline. The new carousel is loaded into update mode automatically.

If the panel is already running, close and reopen the updated script to see the new controls. If you installed a docked copy, replace that copy with this updated file before reopening it.

**Recovery fix in version 1.5.2:** the “Load newly created carousel / Line: 244 / null is not an object” error in 1.5.1 occurred when recovering image order after creation. The script now uses explicit `if/else` checks instead of chained conditional operators in recovery and status labels. The reported failure is consistent with [Adobe's reported ExtendScript conditional-operator bug](https://community.adobe.com/bug-reports-528/bug-in-extendscript-s-conditional-ternary-operator-1216218), retrieved 2026-09-10. After that error, the carousel already exists: close and reopen the updated panel, choose it under **Existing carousels**, and update it. You do not need to create another copy. Automated recovery checks pass; confirmation in a native AE session remains pending.

Error dialogs include the action, creation step, and AE line number (when provided). If another error occurs, copy the complete dialog text. Missing controller effects are identified by name.

**Project selection** reuses existing images and compositions, keeping their Project panel location, footage interpretation, and precomp contents. Selected folders, standalone video/audio, generated solids, and offline images are skipped. Select the image or composition items themselves inside folders. The list follows the Project panel's sort order; selecting the same item again does not add it twice. Distinct footage items from the same PSD remain distinct.

**Precomposed images** stay linked to their original compositions, so edits inside the source comp appear in the carousel. Precomps work with both orientations, rounded corners, arrangement seeds, and existing-carousel recovery. Size and rounded corners use the entire precomp's dimensions: crop the source composition to the artwork if it has large transparent margins. Animation plays from source time zero at normal speed. If the source comp is shorter than the carousel, its carousel layer uses Time Remapping to hold the source's last frame afterward; the original comp's duration and animation are unchanged.

For an existing destination composition, open its timeline before launching the panel. If Project selection changes AE's active item to footage or one of your chosen source precomps, Create uses the composition that was active when the panel opened. To target a different composition, click that composition's timeline immediately before Create. Otherwise, leave the existing-composition option unchecked to create a new one. A source precomp cannot be the destination or contain the destination at any nesting depth; the script reports this before creating anything.

| Orientation | Result |
| --- | --- |
| Keep images upright | Images travel around the circle while staying level. |
| Radial | Each image's top points away from the center and turns with the carousel. |

**Image rotation offset** adjusts the artwork's direction in either mode. In radial mode, `180` makes image tops point inward; `90` turns them sideways.

**Rounded corners** cuts the image's four corners with an editable mask. A radius of `24` means 24 pixels at the selected image size; larger values make the corners rounder, up to half the image's shorter edge. `0`, or unchecking the option, restores square corners. It works with both orientation modes, still images, and precomps. The source and existing transparency stay intact. The mask follows the image or precomp bounds, including any transparent margins, so artwork already inset from those bounds may look unchanged. Scaling the entire controller also scales the finished corners.

To round a carousel you already created, load it from the dropdown, enable **Rounded corners**, choose a radius, then click **Update Carousel**. Older carousels receive the new controls and masks automatically. Repeated updates reuse the same `RC Rounded Corners` mask; other masks remain in place. You can also animate `Rounded Corners` and `Corner Radius` in the controller's Effect Controls.

**Arrangement seed** shuffles which image occupies each evenly spaced slot around the circle. The same seed and the same image list/order reproduce the same arrangement. **New Seed** chooses a different seed and turns on shuffling; click **Create** or **Update Carousel** to use it. Uncheck **Shuffle image order** to return to the original list order. Changing the seed preserves image size, spacing, orbit speed, orientation, and rounded corners. With only a few images, different seeds can produce the same order; a single image has only one arrangement.

For an existing carousel, load it from the dropdown, choose a seed or click **New Seed**, then **Update Carousel**. Earlier script-generated rigs are upgraded when you update. The controller also exposes `Shuffle Images` and `Arrangement Seed` in Effect Controls for direct changes. Changing a seed rearranges images immediately; it does not animate a transition between arrangements. The seed is a whole number from `0` to `999999`.

You can also edit the controller's Effect Controls directly. Move its Position to move the carousel center. Use **Refresh** to reload changes made outside the GUI. Updating a carousel does not change its composition dimensions.

- **Radius** is measured from the center to each image's center. Larger images or many images can overlap; increase radius or reduce image size.
- **Image size** fits each image's longest edge without cropping or stretching. Transparent margins in the source count toward its size.
- **Speed** is a constant number of degrees per second. `30` completes a revolution in `12` seconds. Uncheck Clockwise to reverse it; use `0` for a still arrangement.
- For a seamless loop, set speed to `360 / duration` (or a whole multiple). The default new composition is 12 seconds at 30 fps. The endpoint matches the start; do not append a duplicate endpoint frame.
- For eased or custom rotation, set Speed to `0`, then keyframe the controller's ordinary Rotation property. Both image orientation modes still work. Animating the Speed control itself can cause jumps because it is multiplied by elapsed time.
- **Start angle** places the first slot: `-90` top, `0` right, `90` bottom, `180` left. With shuffling off, images follow the list order clockwise. Duplicate selections within each image-source option are ignored.
- Each Create click makes a separate carousel and asset folder. Renaming or reordering layers will not break the rig. Keep each image parented to its own controller and keep the effect control names unchanged. The number of slots is fixed when created; create again with a changed image list to change the count.
- Files added through **Add Files...** remain linked to their original disk locations. Moving/deleting them later requires relinking in AE. PSD/PSB files added from disk import as flattened footage. Numbered files import individually, never as an image sequence. **Use Project Selection** uses the already-imported item directly, including individually imported PSD layers, without another import.
- Existing composition layers are preserved. New carousel layers span the composition duration. Each Create or Update operation is one Undo step. Updating an already keyframed control inserts a key at the playhead and preserves its other keys.

To dock the panel on Windows, copy **Radial Carousel.jsx** into your AE installation's `Support Files\Scripts\ScriptUI Panels` folder, restart AE, then open it from **Window > Radial Carousel**. For example, the AE 2026 installation path is `C:\Program Files\Adobe\Adobe After Effects 2026`.

Verification: see `tests/check.cjs` for the runnable expression/validation checks (`node tests/check.cjs`). `tests/Smoke Test.jsx` is the native AE test: run it through File > Scripts > Run Script File. It creates temporary test compositions, verifies real expressions and imports, exports three preview PNGs, writes `tests/last-run.txt`, and removes its own project items. Only that test needs script file-writing permission. Native GUI/render validation is pending unless a completed PASS report is present; a blank report is not a pass.

For a quick native check of this recovery bug, run `tests/Recovery Test.jsx`. It runs the shipped recovery function on synthetic layers in AE's actual scripting engine and displays a PASS/FAIL dialog. It covers modern nonzero slots, slot zero, old rigs, unknown expressions, and empty carousels. It reads the production script without creating project items or writing files; it does not verify rendering or the complete GUI.

This is a 2D circular carousel. No network calls, credentials, external libraries, database, or environment changes are involved.

**Public build verification — 2026-09-10:** `node tests/check.cjs` passed on Node.js v26.5.0, including 2,005 numerical assertions, the simulated AE/ScriptUI checks described above, and five recovery cases. The production `.jsx` is unchanged from the local v1.5.2 build. These checks do not establish native AE GUI, import, or render behavior; run the included native tests to verify those paths. Node.js is only needed for the automated checks, not to use the carousel in After Effects.

Last verified: 2026-09-10 — source: script implementation, local AE installation, and the test evidence described above. Installation/menu instructions: [Adobe's scripting documentation](https://helpx.adobe.com/uk/after-effects/desktop/automate-in-after-effects/automate-animation/scripts.html), retrieved 2026-09-10. Expression reference: [Adobe expression language reference](https://helpx.adobe.com/after-effects/desktop/work-with-expressions/expression-language-reference/expression-language-reference.html), retrieved 2026-09-10.

Project selection API and sort order: [After Effects scripting guide](https://ae-scripting.docsforadobe.dev/general/project/#projectselection), retrieved 2026-09-10. Version 1.5 adds composition inputs to project selection and existing-carousel recovery. Automated checks cover image/precomp reuse, filtering, deduplication, source preservation on failure, rounded-mask geometry, deterministic permutations, reopening the GUI, multiple rigs, updating without rebuilding, destination selection, recursive-comp rejection, and short-precomp frame holds. Native AE verification remains pending.

Precomp layer creation and time remapping APIs: [LayerCollection.add](https://ae-scripting.docsforadobe.dev/layer/layercollection/#layercollectionadd), [AVLayer.timeRemapEnabled](https://ae-scripting.docsforadobe.dev/layer/avlayer/#avlayertimeremapenabled), retrieved 2026-09-10.
