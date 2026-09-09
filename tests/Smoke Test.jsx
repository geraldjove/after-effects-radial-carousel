/* Run in After Effects. Uses only test assets/temporary comps, then removes them.
   Needs AE's file-writing preference only for the test report and frame exports.
   The carousel itself does not need that preference.
*/
(function () {
    var here = new File($.fileName).parent;
    var report = new File(here.fsName + "/last-run.txt");
    if (!report.open("w")) { alert("Enable script file writing to save the test report."); return; }
    report.writeln("Radial Carousel native AE smoke test | AE " + app.version + " | " + new Date().toString());
    report.close();
    var original = app.project.activeItem;
    var originalSelected = original instanceof CompItem ? original.selectedLayers : [];
    var api;
    var roots = [];
    var messages = [];
    var checks = 0;
    var projectCount = app.project.numItems;

    function assert(ok, message) {
        if (!ok) { throw new Error(message); }
        checks++;
    }
    function close(a, b, message) { assert(Math.abs(a - b) < 0.02, message + ": " + a + " vs " + b); }
    function value(layer, match, time) {
        var p = layer.property("ADBE Transform Group").property(match);
        var v = p.valueAtTime(time, false);
        assert(!p.expressionError, match + " expression error: " + p.expressionError);
        return v;
    }
    function point(layer, expression, time) {
        var effect = layer.property("ADBE Effect Parade").addProperty("ADBE Point Control");
        effect.property(1).expression = expression;
        var v = effect.property(1).valueAtTime(time, false);
        var error = effect.property(1).expressionError;
        effect.remove();
        assert(!error, "World-space probe: " + error);
        return v;
    }
    function select(layer) {
        var comp = layer.containingComp;
        comp.openInViewer();
        for (var i = 1; i <= comp.numLayers; i++) { comp.layer(i).selected = false; }
        layer.selected = true;
    }
    function expectFailure(callback, label) {
        var failed = false;
        try { callback(); } catch (error) { failed = true; }
        assert(failed, label);
    }

    try {
        var source = new File(here.parent.fsName + "/Radial Carousel.jsx");
        assert(source.open("r"), "Open the production script");
        var code = source.read();
        source.close();
        // Expose internals only in this in-memory test copy; no hooks in the shipped panel.
        var marker = "    refreshList();\n    win.onResizing";
        code = code.replace(/\r\n/g, "\n");
        assert(code.indexOf(marker) >= 0, "Find instrumentation seam");
        code = code.replace(marker, '    $.global.__rcSmoke = {win: win, build: build, number: number, control: control, configure: configure, selectedController: selectedController, carouselMenu: carouselMenu, addSources: function(sources) { for (var i = 0; i < sources.length; i++) { files.push(sources[i]); } refreshList(); }, refresh: refreshList, list: list, create: create, load: load, apply: apply, radius: radius, size: size, speed: speed, clockwise: clockwise, upright: upright, radial: radial, startAngle: startAngle, offset: offset, rounded: rounded, cornerRadius: cornerRadius, shuffle: shuffle, seed: seed, newSeed: newSeed, useActive: useActive, width: width, height: height, duration: duration, fps: fps, status: status};\n    refreshList();\n    win.onResizing');
        code = code.replace("    function showError(error) {", "    function showError(error) { throw error;");
        code = code.replace("win: win, build: build", "win: win, mode: mode, build: build");
        eval(code.replace(/^#target.*$/m, ""));
        api = $.global.__rcSmoke;
        assert(api.win.visible, "Floating GUI is visible");
        api.carouselMenu.selection = api.carouselMenu.items[0];
        api.carouselMenu.onChange();
        api.mode.selection = api.mode.items[0]; api.mode.onChange();
        api.shuffle.value = false; api.rounded.value = false;
        assert(!api.create.enabled, "Create disabled with no images");

        var files = [new File(here.fsName + "/portrait.png"), new File(here.fsName + "/landscape.png"), new File(here.fsName + "/portrait.png"), new File(here.fsName + "/landscape.png")];
        api.addSources(files);
        assert(api.list.items.length === 4 && api.create.enabled, "Image list and create state");
        api.useActive.value = false;
        api.width.text = "800";
        api.height.text = "800";
        api.duration.text = "12";
        api.fps.text = "30";
        api.radius.text = "240";
        api.size.text = "160";
        api.speed.text = "30";
        api.startAngle.text = "-90";
        api.offset.text = "0";
        api.upright.value = true;
        api.radial.value = false;
        api.create.onClick();
        var comp = app.project.activeItem;
        assert(comp instanceof CompItem && comp !== original, "GUI creates a new composition");
        roots.push(comp.parentFolder);
        var ctrl = api.selectedController();
        assert(comp.numLayers === 5, "Four still-image layers and one controller");
        close(comp.duration, 12, "Comp duration");
        close(comp.frameRate, 30, "Comp frame rate");
        var layers = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).parent === ctrl) { layers.push(comp.layer(i)); }
        }

        function verify(mode, time, radius, speed, offset) {
            var rotation = value(ctrl, "ADBE Rotate Z", time);
            close(rotation, time * speed, "Controller rotation");
            for (var k = 0; k < layers.length; k++) {
                var layer = layers[k];
                var p = point(layer, "thisLayer.toComp(thisLayer.anchorPoint);", time);
                var dx = p[0] - 400, dy = p[1] - 400;
                close(Math.sqrt(dx * dx + dy * dy), radius, "Image keeps orbit radius");
                var local = value(layer, "ADBE Position", time);
                var r = rotation * Math.PI / 180;
                close(p[0], 400 + local[0] * Math.cos(r) - local[1] * Math.sin(r), "Animated orbit X");
                close(p[1], 400 + local[0] * Math.sin(r) + local[1] * Math.cos(r), "Animated orbit Y");
                var worldRotation = value(layer, "ADBE Rotate Z", time) + rotation;
                if (mode === "upright") { close(worldRotation, offset, "Upright orientation during orbit"); }
                else {
                    var top = point(layer, "thisLayer.toCompVec([0,-1]);", time);
                    var cross = top[0] * dy - top[1] * dx;
                    close(cross, 0, "Radial top aligns with radius");
                    assert(top[0] * dx + top[1] * dy > 0, "Image top points outward");
                }
                var scale = value(layer, "ADBE Scale", time);
                close(scale[0], scale[1], "Aspect ratio preserved");
                close(Math.max(layer.source.width, layer.source.height) * scale[0] / 100, 160, "Uniform longest edge");
                assert(layer.source.mainSource.isStill, "Imported numbered/duplicate images remain stills");
                close(layer.inPoint, 0, "Image starts at comp start");
                close(layer.outPoint, 12, "Image fills comp duration");
            }
        }
        verify("upright", 0, 240, 30, 0);
        verify("upright", 3, 240, 30, 0);
        verify("upright", 7.5, 240, 30, 0);
        comp.saveFrameToPng(1.5, new File(here.fsName + "/upright-preview.png"));
        var start = point(layers[0], "thisLayer.toComp(thisLayer.anchorPoint);", 0);
        var end = point(layers[0], "thisLayer.toComp(thisLayer.anchorPoint);", 12);
        close(start[0], end[0], "Loop closes X at 12 seconds");
        close(start[1], end[1], "Loop closes Y at 12 seconds");
        ctrl.name = "Renamed carousel controller";
        layers[0].moveToBeginning();
        verify("upright", 3, 240, 30, 0);

        select(layers[0]);
        api.load.onClick();
        assert(api.radius.text === "240", "Load settings via a child image");
        api.upright.value = false;
        api.radial.value = true;
        api.apply.onClick();
        verify("radial", 0, 240, 30, 0);
        verify("radial", 3, 240, 30, 0);
        verify("radial", 7.5, 240, 30, 0);
        comp.saveFrameToPng(1.5, new File(here.fsName + "/radial-preview.png"));
        api.clockwise.value = false;
        api.apply.onClick();
        verify("radial", 3, 240, -30, 0);
        api.speed.text = "0";
        api.upright.value = true;
        api.radial.value = false;
        api.offset.text = "25";
        api.radius.text = "0";
        api.apply.onClick();
        verify("upright", 3, 0, 0, 25);

        var s = {radius: 100, size: 80, speed: 0, angle: -90, offset: 0, upright: true, rounded: false, cornerRadius: 24, shuffle: false, seed: 1};
        var second = api.build(s, [files[0]], comp);
        roots.push(second.source.parentFolder);
        assert(comp.numLayers === 7, "Second carousel appends to an existing comp");
        close(api.control(ctrl, "Radius").value, 0, "Second rig does not alter first rig");
        second.name = ctrl.name;
        verify("upright", 3, 0, 0, 25);
        var radiusControl = api.control(second, "Radius");
        radiusControl.setValueAtTime(0, 100);
        radiusControl.setValueAtTime(2, 200);
        comp.time = 1;
        s.radius = 150;
        api.configure(second, s);
        close(radiusControl.valueAtTime(0, false), 100, "Existing first keyframe preserved");
        close(radiusControl.valueAtTime(2, false), 200, "Existing last keyframe preserved");
        assert(radiusControl.numKeys === 3, "Apply inserts a key at the playhead");

        expectFailure(function () { api.number("", "Size", 1, 100, false); }, "Reject blank input");
        expectFailure(function () { api.number("100px", "Size", 1, 100, false); }, "Reject numeric suffixes");
        expectFailure(function () { api.number("Infinity", "Size", 1, 100, false); }, "Reject infinity");
        expectFailure(function () { api.number("-1", "Size", 1, 100, false); }, "Reject negative size");
        expectFailure(function () { api.number("5.5", "Width", 4, 100, true); }, "Reject fractional comp dimensions");
        var before = app.project.numItems;
        expectFailure(function () { api.build(s, [], comp); }, "Reject empty image list");
        expectFailure(function () { api.build(s, [new File(here.fsName + "/missing.png")], comp); }, "Reject missing file");
        expectFailure(function () { api.build(s, [files[0], new File(here.fsName + "/invalid.png")], comp); }, "Reject bad image after a valid import");
        assert(app.project.numItems === before, "Failed creation cleans all newly imported assets");
        assert(comp.numLayers === 7, "Failed creation preserves existing layers");

        select(ctrl);
        api.load.onClick();
        api.radius.text = "240";
        api.size.text = "160";
        api.speed.text = "30";
        api.clockwise.value = true;
        api.offset.text = "0";
        api.rounded.value = true;
        api.cornerRadius.text = "24";
        api.shuffle.value = true;
        api.seed.text = "42";
        api.apply.onClick();
        verify("upright", 3, 240, 30, 0);
        var positions = [];
        for (i = 0; i < layers.length; i++) {
            positions.push(point(layers[i], "thisLayer.toComp(thisLayer.anchorPoint);", 0));
            var maskPath = layers[i].property("ADBE Mask Parade").property("RC Rounded Corners").property("ADBE Mask Shape");
            var maskShape = maskPath.valueAtTime(0, false);
            assert(!maskPath.expressionError, "Rounded-mask expression evaluates");
            assert(maskShape.vertices.length === 8, "Rounded rectangle has eight vertices");
        }
        api.upright.value = false;
        api.radial.value = true;
        api.apply.onClick();
        verify("radial", 3, 240, 30, 0);
        comp.saveFrameToPng(1.5, new File(here.fsName + "/rounded-shuffled-preview.png"));
        api.seed.text = "123";
        api.apply.onClick();
        api.seed.text = "42";
        api.rounded.value = false;
        api.apply.onClick();
        for (i = 0; i < layers.length; i++) {
            var restored = point(layers[i], "thisLayer.toComp(thisLayer.anchorPoint);", 0);
            close(restored[0], positions[i][0], "Same seed restores X");
            close(restored[1], positions[i][1], "Same seed restores Y");
            var square = layers[i].property("ADBE Mask Parade").property("RC Rounded Corners").property("ADBE Mask Shape").valueAtTime(0, false);
            assert(square.vertices.length === 4, "Disabling rounding restores a square mask");
        }
        select(ctrl);
        var beforeReopenItems = app.project.numItems;
        var beforeReopenLayers = comp.numLayers;
        api.win.close();
        eval(code.replace(/^#target.*$/m, ""));
        api = $.global.__rcSmoke;
        assert(api.carouselMenu.selection.controller === ctrl, "Reopened panel detects the existing carousel");
        assert(api.list.items.length === 4, "Reopened panel recovers the image list");
        assert(api.seed.text === "42", "Reopened panel recovers the arrangement seed");
        assert(!api.create.enabled && api.apply.enabled, "Existing carousel opens in update mode");
        for (i = 1; i <= comp.numLayers; i++) { comp.layer(i).selected = false; }
        api.radius.text = "275";
        api.apply.onClick();
        close(api.control(ctrl, "Radius").value, 275, "Update works without a timeline selection");
        assert(app.project.numItems === beforeReopenItems && comp.numLayers === beforeReopenLayers, "Reopen/update creates no project items or layers");
        var existingFootage = layers[0].source;
        var existingFolder = existingFootage.parentFolder;
        before = app.project.numItems;
        var reused = api.build(s, [{item: existingFootage, name: existingFootage.name}], comp);
        roots.push(reused.source.parentFolder);
        assert(app.project.numItems === before + 2, "Reusing project footage adds only an assets folder and null source");
        assert(existingFootage.parentFolder === existingFolder, "Existing footage stays in its folder");

        var artwork = app.project.items.addComp("RC test precomposed image", 300, 200, 1, 2, 24);
        artwork.parentFolder = roots[0];
        artwork.layers.add(existingFootage);
        before = app.project.numItems;
        var compRig = api.build(s, [{item: artwork, name: artwork.name}, {item: existingFootage, name: existingFootage.name}], comp);
        roots.push(compRig.source.parentFolder);
        assert(app.project.numItems === before + 2, "Precomp reuse adds only assets folder and null source");
        var compLayer;
        for (i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).parent === compRig && comp.layer(i).source === artwork) { compLayer = comp.layer(i); }
        }
        assert(!!compLayer, "Carousel uses the original precomp as its layer source");
        assert(artwork.numLayers === 1 && artwork.parentFolder === roots[0], "Source precomp stays intact");
        close(artwork.duration, 2, "Source precomp duration preserved");
        close(compLayer.outPoint, comp.duration, "Precomp layer fills carousel duration");
        assert(compLayer.timeRemapEnabled, "Shorter precomp enables last-frame hold");
        var remap = compLayer.property("ADBE Time Remapping");
        close(remap.valueAtTime(0.5, false), 0.5, "Precomp animation plays at normal speed");
        close(remap.valueAtTime(11, false), 2 - 1 / 24, "Short precomp holds its last frame");
        assert(!remap.expressionError, "Precomp time-remap expression evaluates");
        select(compLayer);
        api.win.close();
        eval(code.replace(/^#target.*$/m, ""));
        api = $.global.__rcSmoke;
        assert(api.carouselMenu.selection.controller === compRig, "Reopen detects carousel through a precomp child");
        assert(api.list.items.length === 2 && api.list.items[0].text.indexOf("[Comp]") >= 0, "Recovery restores precomp and image in original order");
        api.rounded.value = true;
        api.shuffle.value = true;
        api.seed.text = "42";
        api.apply.onClick();
        var precompMask = compLayer.property("ADBE Mask Parade").property("RC Rounded Corners").property("ADBE Mask Shape");
        assert(precompMask.valueAtTime(0, false).vertices.length === 8 && !precompMask.expressionError, "Rounded mask works on a precomp");
        var compPosition = value(compLayer, "ADBE Position", 3);
        close(Math.sqrt(compPosition[0] * compPosition[0] + compPosition[1] * compPosition[1]), s.radius, "Shuffled precomp keeps its orbit radius");
        close(value(compLayer, "ADBE Scale", 3)[0] * artwork.width / 100, s.size, "Precomp sizing uses composition dimensions");
        before = app.project.numItems;
        var beforeCycleLayers = comp.numLayers;
        expectFailure(function () { api.build(s, [{item: comp, name: comp.name}], comp); }, "Reject direct composition nesting cycle");
        assert(app.project.numItems === before && comp.numLayers === beforeCycleLayers, "Cycle rejection creates nothing");
        messages.push("PASS: " + checks + " assertions. GUI creation/load/update/reopen; real image imports; upright/radial world transforms; clockwise/counterclockwise/static; loop closure; image sizing; rename/reorder/duplicate names; multiple carousels; keyframe preservation; invalid input and import rollback; reused project footage/precomps; rounded masks; seeded arrangements; existing-carousel recovery without rebuilding; precomp frame hold and nesting protection.");
    } catch (error) {
        messages.push("FAIL: " + error.toString() + " | line " + error.line + " | step " + (error.rcStage || "native smoke test") + " | " + checks + " assertions passed before failure");
    } finally {
        if (api) { api.win.close(); }
        // Remove the generated comp before its asset folders, never touch the original comp.
        for (var j = 0; j < roots.length; j++) {
            try { roots[j].remove(); } catch (cleanupError) { messages.push("Cleanup: " + cleanupError.toString()); }
        }
        try {
            if (original instanceof CompItem) {
                original.openInViewer();
                for (j = 0; j < originalSelected.length; j++) { originalSelected[j].selected = true; }
            }
        } catch (restoreError) { messages.push("Restore: " + restoreError.toString()); }
        messages.push("Project items before/after: " + projectCount + "/" + app.project.numItems);
        delete $.global.__rcSmoke;
        report.open("a");
        report.writeln(messages.join("\n"));
        report.close();
    }
})();
