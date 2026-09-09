/* Radial Carousel 1.5.2 | 2026-09-10
   Run with File > Scripts > Run Script File, or install in ScriptUI Panels.
   No plug-ins, network access, or file-writing permission required.
*/
(function (thisObj) {
    var TITLE = "Radial Carousel";
    var VERSION = "1.5.2";
    var TAG = "RadialCarousel:1";
    var files = [];
    var boundController = null;
    var refreshingCarousels = false;
    var operation = "Open panel";

    function activeComp() {
        return app.project && app.project.activeItem instanceof CompItem ? app.project.activeItem : null;
    }

    function isCarouselSource(item) {
        return isValid(item) && (item instanceof FootageItem || item instanceof CompItem);
    }

    function isProjectSource(item) {
        return isCarouselSource(item) && item.width > 0 && item.height > 0 &&
            (item instanceof CompItem || (item.file && item.mainSource.isStill && !item.footageMissing));
    }

    function containsComp(source, target) {
        var pending = [source], seen = {};
        while (pending.length) {
            var comp = pending.pop();
            if (comp === target) { return true; }
            if (seen[comp.id]) { continue; }
            seen[comp.id] = true;
            for (var i = 1; i <= comp.numLayers; i++) {
                var child = comp.layer(i).source;
                if (child instanceof CompItem) { pending.push(child); }
            }
        }
        return false;
    }

    function destinationComp(sources, current, opened) {
        // Selecting a source precomp in the Project panel can replace activeItem.
        for (var i = 0; current && i < sources.length; i++) {
            if (sources[i].item === current) {
                return opened && isValid(opened) ? opened : current;
            }
        }
        return current || (opened && isValid(opened) ? opened : null);
    }

    function appendProjectSelection(selection) {
        var result = {added: 0, skipped: 0, duplicates: 0};
        for (var i = 0; i < selection.length; i++) {
            var item = selection[i];
            if (!isProjectSource(item)) { result.skipped++; continue; }
            var duplicate = false;
            for (var j = 0; j < files.length; j++) {
                if (files[j].item && isValid(files[j].item) && files[j].item.id === item.id) {
                    duplicate = true;
                    break;
                }
            }
            if (duplicate) { result.duplicates++; continue; }
            // Keep the original source, including precomp contents or footage interpretation.
            files.push({item: item, name: item.name});
            result.added++;
        }
        return result;
    }

    function number(text, name, min, max, integer) {
        var n = Number(text);
        if (!/\S/.test(text) || !isFinite(n) || n < min || n > max || (integer && n !== Math.floor(n))) {
            throw new Error(name + " must be " + (integer ? "a whole number" : "a number") + " from " + min + " to " + max + ".");
        }
        return n;
    }

    function addControl(layer, matchName, name, value) {
        var effect = layer.property("ADBE Effect Parade").addProperty(matchName);
        effect.name = name;
        effect.property(1).setValue(value);
    }

    function control(layer, name) {
        var effects = layer.property("ADBE Effect Parade");
        var effect = effects ? effects.property(name) : null;
        var value = effect ? effect.property(1) : null;
        if (!value) {
            throw new Error("Carousel '" + layer.name + "' is missing its '" + name + "' control. Undo the control deletion or restore its original name, then click Refresh.");
        }
        return value;
    }

    function setControl(layer, name, value) {
        var p = control(layer, name);
        if (p.numKeys) {
            p.setValueAtTime(layer.containingComp.time, value);
        } else {
            p.setValue(value);
        }
    }

    function cornerControls(layer, settings) {
        if (!layer.property("ADBE Effect Parade").property("Rounded Corners")) {
            addControl(layer, "ADBE Checkbox Control", "Rounded Corners", settings.rounded ? 1 : 0);
        }
        if (!layer.property("ADBE Effect Parade").property("Corner Radius")) {
            addControl(layer, "ADBE Slider Control", "Corner Radius", settings.cornerRadius);
        }
    }

    function arrangementControls(layer, settings) {
        if (!layer.property("ADBE Effect Parade").property("Shuffle Images")) {
            addControl(layer, "ADBE Checkbox Control", "Shuffle Images", settings.shuffle ? 1 : 0);
        }
        if (!layer.property("ADBE Effect Parade").property("Arrangement Seed")) {
            addControl(layer, "ADBE Slider Control", "Arrangement Seed", settings.seed);
        }
    }

    function angleExpression(slot, count) {
        // ponytail: O(N) shuffle per image; precompute slots if hundreds of images make previews slow.
        // Custom PRNG keeps the permutation identical across layers, unlike per-layer AE random seeds.
        return '// RC arrangement\nvar slot = ' + slot + ', n = ' + count + ';\n' +
            'if (parent.effect("Shuffle Images")(1) > 0.5) {\n' +
            '  var seed = Math.floor(Math.abs(parent.effect("Arrangement Seed")(1))) % 2147483646 + 1;\n' +
            '  var order = [], i, j, temp;\n' +
            '  for (i = 0; i < n; i++) { order[i] = i; }\n' +
            '  for (i = n - 1; i > 0; i--) {\n' +
            '    seed = (seed * 16807) % 2147483647; j = seed % (i + 1);\n' +
            '    temp = order[i]; order[i] = order[j]; order[j] = temp;\n' +
            '  }\n  slot = order[slot];\n}\n' +
            'var a = parent.effect("Start Angle")(1) + 360 * slot / n;\n';
    }

    function upgradeArrangement(controller) {
        var legacy = /^var a = parent\.effect\("Start Angle"\)\(1\) \+ ([0-9.eE+-]+);\r?\n/;
        var images = [];
        var comp = controller.containingComp;
        var i;
        for (i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (layer.parent !== controller || !isCarouselSource(layer.source)) { continue; }
            var match = layer.property("ADBE Transform Group").property("ADBE Position").expression.match(legacy);
            if (match) { images.push({layer: layer, angle: Number(match[1])}); }
        }
        images.sort(function (a, b) { return a.angle - b.angle; });
        for (i = 0; i < images.length; i++) {
            var tr = images[i].layer.property("ADBE Transform Group");
            var header = angleExpression(i, images.length);
            var position = tr.property("ADBE Position"), rotation = tr.property("ADBE Rotate Z");
            position.expression = position.expression.replace(legacy, header);
            rotation.expression = rotation.expression.replace(legacy, header);
        }
    }

    function roundImage(layer) {
        var masks = layer.property("ADBE Mask Parade");
        var mask = masks.property("RC Rounded Corners");
        if (!mask) {
            mask = masks.addProperty("ADBE Mask Atom");
            mask.name = "RC Rounded Corners";
            mask.maskMode = MaskMode.INTERSECT;
        }
        // Convert displayed pixels back to source coordinates; preserve existing alpha/masks.
        mask.property("ADBE Mask Shape").expression =
            'var w = thisLayer.source.width, h = thisLayer.source.height;\n' +
            'var pa = thisLayer.source.pixelAspect / thisComp.pixelAspect;\n' +
            'var s = Math.max(1, parent.effect("Image Size")(1)) / Math.max(w * pa, h);\n' +
            'var r = parent.effect("Rounded Corners")(1) > 0.5 ? Math.max(0, parent.effect("Corner Radius")(1)) : 0;\n' +
            'r = Math.min(r, w * pa * s / 2, h * s / 2);\n' +
            'var x = r / (s * pa), y = r / s, k = 0.5522847498307936;\n' +
            'var p = [[0,0],[w,0],[w,h],[0,h]], ins = [], outs = [];\n' +
            'if (r > 0) {\n' +
            '  p = [[x,0],[w-x,0],[w,y],[w,h-y],[w-x,h],[x,h],[0,h-y],[0,y]];\n' +
            '  ins = [[-x*k,0],[0,0],[0,-y*k],[0,0],[x*k,0],[0,0],[0,y*k],[0,0]];\n' +
            '  outs = [[0,0],[x*k,0],[0,0],[0,y*k],[0,0],[-x*k,0],[0,0],[0,-y*k]];\n' +
            '}\ncreatePath(p, ins, outs, true);';
    }

    function configure(layer, settings) {
        var names = ["Radius", "Image Size", "Speed (deg/sec)", "Start Angle", "Keep Upright", "Image Rotation Offset"];
        for (var i = 0; i < names.length; i++) {
            if (!layer.property("ADBE Effect Parade").property(names[i])) {
                throw new Error("The carousel is missing its '" + names[i] + "' control. Undo the control deletion or create a new carousel.");
            }
        }
        cornerControls(layer, settings);
        arrangementControls(layer, settings);
        upgradeArrangement(layer);
        setControl(layer, "Radius", settings.radius);
        setControl(layer, "Image Size", settings.size);
        setControl(layer, "Speed (deg/sec)", settings.speed);
        setControl(layer, "Start Angle", settings.angle);
        setControl(layer, "Keep Upright", settings.upright ? 1 : 0);
        setControl(layer, "Image Rotation Offset", settings.offset);
        setControl(layer, "Rounded Corners", settings.rounded ? 1 : 0);
        setControl(layer, "Corner Radius", settings.cornerRadius);
        setControl(layer, "Shuffle Images", settings.shuffle ? 1 : 0);
        setControl(layer, "Arrangement Seed", settings.seed);
        var comp = layer.containingComp;
        for (i = 1; i <= comp.numLayers; i++) {
            var child = comp.layer(i);
            if (child.parent === layer && isCarouselSource(child.source)) { roundImage(child); }
        }
    }

    function selectedController() {
        var comp = activeComp();
        if (!comp || comp.selectedLayers.length !== 1) {
            throw new Error("Select one carousel controller or one of its images in the timeline.");
        }
        var layer = comp.selectedLayers[0];
        if (layer.comment !== TAG && layer.parent) { layer = layer.parent; }
        if (layer.comment !== TAG) { throw new Error("The selected layer does not belong to a Radial Carousel."); }
        return layer;
    }

    function findCarousels() {
        var found = [];
        if (!app.project) { return found; }
        for (var i = 1; i <= app.project.numItems; i++) {
            var comp = app.project.item(i);
            if (!(comp instanceof CompItem)) { continue; }
            for (var j = 1; j <= comp.numLayers; j++) {
                var layer = comp.layer(j);
                if (layer.comment === TAG) { found.push(layer); }
            }
        }
        return found;
    }

    function carouselSources(controller) {
        var children = [];
        var comp = controller.containingComp;
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (layer.parent !== controller || !isCarouselSource(layer.source)) { continue; }
            var expression = layer.property("ADBE Transform Group").property("ADBE Position").expression;
            var order = i;
            var slot = expression.match(/var slot = (\d+), n =/);
            // ExtendScript misgroups chained ternaries; a new rig has no legacy match.
            if (slot) {
                order = Number(slot[1]);
            } else {
                var legacy = expression.match(/^var a = parent\.effect\("Start Angle"\)\(1\) \+ ([0-9.eE+-]+);/);
                if (legacy) { order = Number(legacy[1]); }
            }
            children.push({item: layer.source, order: order});
        }
        children.sort(function (a, b) { return a.order - b.order; });
        var sources = [];
        for (i = 0; i < children.length; i++) {
            sources.push({item: children[i].item, name: children[i].item.name});
        }
        return sources;
    }

    function build(settings, sources, comp) {
        var folder = null;
        var madeComp = null;
        var madeLayers = [];
        var controller;
        var footage = [];
        var stage = "Create assets folder";
        var i;
        if (!sources.length) { throw new Error("Add at least one image or composition first."); }
        for (i = 0; i < sources.length; i++) {
            if (sources[i].item) {
                if (!isProjectSource(sources[i].item)) {
                    throw new Error("Project item '" + sources[i].name + "' is unavailable or is no longer a still image or composition. Relink it in AE, or remove it from this list and select it again.");
                }
                if (comp && sources[i].item instanceof CompItem && containsComp(sources[i].item, comp)) {
                    throw new Error("Composition '" + sources[i].name + "' is the destination or contains it. Choose a different destination timeline, or uncheck 'Add to the active composition' to avoid nesting a composition inside itself.");
                }
            } else if (!sources[i].exists) { throw new Error("Image is missing:\n" + sources[i].fsName); }
        }
        if (!app.project) { app.newProject(); }
        app.beginUndoGroup("Create Radial Carousel");
        try {
            folder = app.project.items.addFolder(TITLE + " Assets");
            // Import as individual, flattened stills, even when filenames are numbered.
            for (i = 0; i < sources.length; i++) {
                stage = "Read source " + (i + 1) + ": " + sources[i].name;
                if (sources[i].item) {
                    // Existing project sources never enter the new folder or rollback cleanup.
                    footage.push(sources[i].item);
                    continue;
                }
                var options = new ImportOptions(sources[i]);
                options.sequence = false;
                if (!options.canImportAs(ImportAsType.FOOTAGE)) {
                    throw new Error("Cannot import this image as footage:\n" + sources[i].fsName);
                }
                options.importAs = ImportAsType.FOOTAGE;
                var item = app.project.importFile(options);
                item.parentFolder = folder;
                if (!(item instanceof FootageItem) || !item.mainSource.isStill || !item.width || !item.height) {
                    throw new Error("Choose still images only:\n" + sources[i].fsName);
                }
                footage.push(item);
            }
            if (!comp) {
                stage = "Create destination composition";
                comp = app.project.items.addComp(TITLE, settings.width, settings.height, 1, settings.duration, settings.fps);
                madeComp = comp;
                comp.parentFolder = folder;
            }
            stage = "Create carousel controller";
            controller = comp.layers.addNull(comp.duration);
            madeLayers.push(controller);
            controller.source.parentFolder = folder;
            controller.name = TITLE + " CTRL";
            controller.comment = TAG;
            controller.label = 9;
            controller.startTime = 0;
            controller.inPoint = 0;
            controller.outPoint = comp.duration;
            var tr = controller.property("ADBE Transform Group");
            tr.property("ADBE Anchor Point").setValue([0, 0]);
            tr.property("ADBE Position").setValue([comp.width / 2, comp.height / 2]);
            stage = "Add controller effects";
            addControl(controller, "ADBE Slider Control", "Radius", settings.radius);
            addControl(controller, "ADBE Slider Control", "Image Size", settings.size);
            addControl(controller, "ADBE Slider Control", "Speed (deg/sec)", settings.speed);
            addControl(controller, "ADBE Angle Control", "Start Angle", settings.angle);
            addControl(controller, "ADBE Checkbox Control", "Keep Upright", settings.upright ? 1 : 0);
            addControl(controller, "ADBE Angle Control", "Image Rotation Offset", settings.offset);
            cornerControls(controller, settings);
            arrangementControls(controller, settings);
            stage = "Set controller rotation";
            controller.property("ADBE Transform Group").property("ADBE Rotate Z").expression = 'value + (time - inPoint) * effect("Speed (deg/sec)")(1);';

            for (i = 0; i < footage.length; i++) {
                stage = "Add carousel layer " + (i + 1) + ": " + footage[i].name;
                var layer = comp.layers.add(footage[i]);
                madeLayers.push(layer);
                layer.name = "RC " + (i + 1) + " - " + footage[i].name;
                layer.label = 9;
                layer.startTime = 0;
                layer.inPoint = 0;
                if (footage[i] instanceof CompItem && footage[i].duration < comp.duration) {
                    stage = "Hold last frame: " + footage[i].name;
                    // Let shorter precomps play normally, then hold their last frame.
                    layer.timeRemapEnabled = true;
                    layer.property("ADBE Time Remapping").expression =
                        'Math.min(Math.max(time - startTime, 0), Math.max(0, thisLayer.source.duration - thisLayer.source.frameDuration));';
                }
                layer.outPoint = comp.duration;
                layer.parent = controller;
                stage = "Set carousel transforms: " + footage[i].name;
                tr = layer.property("ADBE Transform Group");
                tr.property("ADBE Anchor Point").setValue([footage[i].width / 2, footage[i].height / 2]);
                // Slot is independent of timeline index, layer names, and other carousels.
                var angle = angleExpression(i, footage.length);
                tr.property("ADBE Position").expression = angle +
                    'var r = Math.max(0, parent.effect("Radius")(1));\n' +
                    'var rad = a * Math.PI / 180;\n[r * Math.cos(rad), r * Math.sin(rad)];';
                tr.property("ADBE Scale").expression =
                    'var s = Math.max(1, parent.effect("Image Size")(1)) / Math.max(thisLayer.source.width * thisLayer.source.pixelAspect / thisComp.pixelAspect, thisLayer.source.height) * 100;\n[s, s];';
                tr.property("ADBE Rotate Z").expression = angle +
                    'var offset = parent.effect("Image Rotation Offset")(1);\n' +
                    'parent.effect("Keep Upright")(1) > 0.5 ? -parent.transform.rotation + offset : a + 90 + offset;';
                stage = "Set rounded-corner mask: " + footage[i].name;
                roundImage(layer);
            }
            stage = "Select controller and open composition";
            controller.moveToBeginning();
            for (i = 1; i <= comp.numLayers; i++) { comp.layer(i).selected = false; }
            controller.selected = true;
            comp.openInViewer();
            return controller;
        } catch (error) {
            error.rcStage = stage;
            // Remove only objects made by this attempt; existing project assets stay intact.
            for (i = madeLayers.length - 1; i >= 0; i--) {
                try { madeLayers[i].remove(); } catch (cleanupLayerError) {}
            }
            try { if (madeComp) { madeComp.remove(); } } catch (cleanupCompError) {}
            try { if (folder) { folder.remove(); } } catch (cleanupFolderError) {}
            throw error;
        } finally {
            app.endUndoGroup();
        }
    }

    function field(parent, label, value) {
        var row = parent.add("group");
        row.alignChildren = ["left", "center"];
        var caption = row.add("statictext", undefined, label);
        caption.preferredSize.width = 150;
        var input = row.add("edittext", undefined, String(value));
        input.characters = 10;
        input.alignment = ["fill", "center"];
        return input;
    }

    function panel(parent, label) {
        var p = parent.add("panel", undefined, label);
        p.orientation = "column";
        p.alignChildren = ["fill", "top"];
        p.margins = 12;
        p.spacing = 5;
        return p;
    }

    var win = thisObj instanceof Panel ? thisObj : new Window("palette", TITLE + " " + VERSION, undefined, {resizeable: true});
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 8;
    win.margins = 12;

    var existingPanel = panel(win, "Existing carousels");
    var existingRow = existingPanel.add("group");
    existingRow.alignChildren = ["fill", "center"];
    var carouselMenu = existingRow.add("dropdownlist", undefined, []);
    carouselMenu.alignment = ["fill", "center"];
    carouselMenu.preferredSize.width = 310;
    var rescan = existingRow.add("button", undefined, "Refresh");
    rescan.alignment = ["right", "center"];
    carouselMenu.helpTip = "Finds carousels made by this script in every composition. Choose one to load its settings.";

    var images = panel(win, "1. Images / Comps - original order");
    var list = images.add("listbox", undefined, [], {multiselect: true});
    list.preferredSize = [350, 110];
    var buttons = images.add("group");
    var projectAdd = buttons.add("button", undefined, "Use Project Selection");
    projectAdd.helpTip = "Select still images or compositions in AE's Project panel, then click here. Each source is reused directly.";
    var add = buttons.add("button", undefined, "Add Files...");
    var listButtons = images.add("group");
    var remove = listButtons.add("button", undefined, "Remove");
    var clear = listButtons.add("button", undefined, "Clear");
    var count = images.add("statictext", undefined, "No images or comps added.");

    var layout = panel(win, "2. Carousel");
    var compAtOpen = activeComp();
    var base = compAtOpen ? Math.min(compAtOpen.width, compAtOpen.height) : 1080;
    var radius = field(layout, "Radius (px)", Math.round(base * 0.32));
    var size = field(layout, "Image longest edge (px)", Math.round(base * 0.2));
    var speed = field(layout, "Speed (degrees/sec)", 30);
    speed.helpTip = "Constant speed. 30 degrees/sec completes one revolution in 12 seconds. 0 is static.";
    var clockwise = layout.add("checkbox", undefined, "Clockwise rotation");
    clockwise.value = true;
    var startAngle = field(layout, "Start angle (degrees)", -90);
    startAngle.helpTip = "First slot: -90 = top, 0 = right, 90 = bottom, 180 = left. Shuffle changes which image occupies it.";
    var upright = layout.add("radiobutton", undefined, "Keep images upright while orbiting");
    var radial = layout.add("radiobutton", undefined, "Radial - image tops point away from center");
    upright.value = true;
    var offset = field(layout, "Image rotation offset", 0);
    offset.helpTip = "0 = normal. With Radial mode, 180 points image tops inward; 90 turns them sideways.";
    var rounded = layout.add("checkbox", undefined, "Rounded corners");
    var cornerRadius = field(layout, "Corner radius (px)", 24);
    cornerRadius.enabled = false;
    cornerRadius.helpTip = "Corner radius at the chosen image size. Larger values are limited to half the shorter edge.";
    rounded.onClick = function () { cornerRadius.enabled = rounded.value; };
    var shuffle = layout.add("checkbox", undefined, "Shuffle image order");
    var seedRow = layout.add("group");
    var seed = field(seedRow, "Arrangement seed", 1);
    seed.enabled = false;
    seed.helpTip = "The same seed and image list reproduce the same arrangement. Images remain evenly spaced.";
    var newSeed = seedRow.add("button", undefined, "New Seed");
    shuffle.onClick = function () { seed.enabled = shuffle.value; };
    newSeed.onClick = function () {
        var previous = Number(seed.text);
        if (!isFinite(previous)) { previous = 0; }
        seed.text = String((Math.floor(Math.abs(previous)) + 1 + Math.floor(Math.random() * 999999)) % 1000000);
        shuffle.value = true;
        shuffle.onClick();
        status.text = "New seed ready. Click Create, or Update Carousel to change the loaded carousel.";
    };

    var destination = panel(win, "3. Composition");
    var useActive = destination.add("checkbox", undefined, "Add to the active composition");
    useActive.value = !!compAtOpen;
    var newCompFields = destination.add("group");
    newCompFields.orientation = "column";
    newCompFields.alignChildren = ["fill", "top"];
    newCompFields.spacing = 4;
    var width = field(newCompFields, "New comp width", 1920);
    var height = field(newCompFields, "New comp height", 1080);
    var duration = field(newCompFields, "Duration (seconds)", 12);
    var fps = field(newCompFields, "Frame rate", 30);
    newCompFields.enabled = !useActive.value;
    useActive.onClick = function () { newCompFields.enabled = !useActive.value; };

    var create = win.add("button", undefined, "Create Radial Carousel");
    create.preferredSize.height = 34;
    var edits = win.add("group");
    edits.alignment = ["fill", "top"];
    var load = edits.add("button", undefined, "Load Selected");
    var apply = edits.add("button", undefined, "Update Carousel");
    load.helpTip = "Find and load the carousel belonging to the selected timeline controller or image.";
    apply.helpTip = "Update the carousel chosen above, even if timeline selection changes. Keyframed controls get a key at that composition's playhead.";
    var status = win.add("statictext", undefined, "Add images or comps, choose an orientation, then create.", {multiline: true});
    status.preferredSize = [350, 36];

    function refreshList() {
        list.removeAll();
        for (var i = 0; i < files.length; i++) {
            var projectSource = !!files[i].item;
            var prefix = projectSource && isValid(files[i].item) && files[i].item instanceof CompItem ? "[Comp] " : "[Project] ";
            var row = list.add("item", (i + 1) + ". " + (projectSource ? prefix + files[i].name : File.decode(files[i].name)));
            row.helpTip = projectSource ? "Uses the existing Project panel image or composition." : files[i].fsName;
        }
        if (boundController) { count.text = files.length + " item(s) in the loaded carousel."; }
        else if (files.length) { count.text = files.length + " item(s) ready."; }
        else { count.text = "No images or comps added."; }
        create.enabled = !boundController && files.length > 0;
        projectAdd.enabled = add.enabled = remove.enabled = clear.enabled = !boundController;
        destination.enabled = !boundController;
        apply.enabled = !!boundController;
    }

    function loadCarousel(layer) {
        boundController = null;
        apply.enabled = false;
        create.enabled = false;
        if (!layer || !isValid(layer) || layer.comment !== TAG) {
            throw new Error("This carousel no longer exists. Click Refresh and choose another carousel.");
        }
        radius.text = String(control(layer, "Radius").value);
        size.text = String(control(layer, "Image Size").value);
        var signedSpeed = control(layer, "Speed (deg/sec)").value;
        speed.text = String(Math.abs(signedSpeed));
        clockwise.value = signedSpeed >= 0;
        startAngle.text = String(control(layer, "Start Angle").value);
        offset.text = String(control(layer, "Image Rotation Offset").value);
        var effects = layer.property("ADBE Effect Parade");
        rounded.value = effects.property("Rounded Corners") ? control(layer, "Rounded Corners").value > 0.5 : false;
        cornerRadius.text = effects.property("Corner Radius") ? String(control(layer, "Corner Radius").value) : "24";
        cornerRadius.enabled = rounded.value;
        shuffle.value = effects.property("Shuffle Images") ? control(layer, "Shuffle Images").value > 0.5 : false;
        seed.text = effects.property("Arrangement Seed") ? String(control(layer, "Arrangement Seed").value) : "1";
        seed.enabled = shuffle.value;
        upright.value = control(layer, "Keep Upright").value > 0.5;
        radial.value = !upright.value;
        files = carouselSources(layer);
        boundController = layer;
        refreshList();
        status.text = "Loaded " + layer.containingComp.name + " / " + layer.name + ". Change settings, then Update Carousel.";
    }

    function refreshCarousels(preferred, autoDetect) {
        var found = findCarousels();
        var previous = boundController;
        var target = preferred || boundController;
        var i;
        if (target && (!isValid(target) || target.comment !== TAG)) { target = null; }
        if (!target && autoDetect && !previous) {
            try { target = selectedController(); } catch (noSelection) {}
            if (!target) {
                var current = activeComp();
                var local = [];
                for (i = 0; i < found.length; i++) {
                    if (found[i].containingComp === current) { local.push(found[i]); }
                }
                if (local.length === 1) { target = local[0]; }
                else if (found.length === 1) { target = found[0]; }
            }
        }
        refreshingCarousels = true;
        var choice = null;
        try {
            carouselMenu.removeAll();
            carouselMenu.add("item", "Create new carousel");
            for (i = 0; i < found.length; i++) {
                var layer = found[i];
                var item = carouselMenu.add("item", (i + 1) + ". " + layer.containingComp.name + " / " + layer.name + " (layer " + layer.index + ")");
                item.controller = layer;
                if (layer === target) { choice = item; }
            }
            carouselMenu.selection = choice || carouselMenu.items[0];
        } finally { refreshingCarousels = false; }
        if (choice) { loadCarousel(choice.controller); }
        else {
            boundController = null;
            if (previous) { files = []; }
            refreshList();
            if (previous) { status.text = "The previous carousel is unavailable. Choose another above, or create a new one."; }
            else if (found.length) { status.text = "Found " + found.length + " carousel(s). Choose one above to update, or add images/comps to create a new one."; }
            else { status.text = "No carousels found. Add images or comps to create one."; }
        }
    }

    carouselMenu.onChange = function () {
        if (refreshingCarousels || !carouselMenu.selection) { return; }
        operation = "Load carousel";
        try {
            var layer = carouselMenu.selection.controller;
            if (layer) { loadCarousel(layer); }
            else {
                boundController = null;
                files = [];
                refreshList();
                status.text = "New carousel. Add images or comps and choose a destination composition.";
            }
        } catch (error) { showError(error); }
    };
    rescan.onClick = function () {
        operation = "Refresh carousels";
        try { refreshCarousels(null, true); } catch (error) { showError(error); }
    };

    projectAdd.onClick = function () {
        operation = "Use Project Selection";
        try {
            var selection = app.project ? app.project.selection : [];
            if (!selection.length) { throw new Error("Select still images or compositions in AE's Project panel, then click Use Project Selection."); }
            var result = appendProjectSelection(selection);
            refreshList();
            status.text = "Added " + result.added + " image(s)/comp(s). Skipped " + result.skipped + " unsupported/offline item(s) and " + result.duplicates + " duplicate(s).";
        } catch (error) { showError(error); }
    };

    add.onClick = function () {
        var filter = "Images:*.png;*.jpg;*.jpeg;*.tif;*.tiff;*.psd;*.psb;*.bmp;*.tga;*.exr;*.hdr";
        if (File.fs !== "Windows") {
            filter = function (file) { return file instanceof Folder || /\.(png|jpe?g|tiff?|ps[db]|bmp|tga|exr|hdr)$/i.test(file.name); };
        }
        var picked = File.openDialog("Select carousel images", filter, true);
        if (!picked) { return; }
        if (!(picked instanceof Array)) { picked = [picked]; }
        for (var i = 0; i < picked.length; i++) {
            var duplicate = false;
            for (var j = 0; j < files.length; j++) {
                if (files[j].item) { continue; }
                var a = files[j].fsName;
                var b = picked[i].fsName;
                if (File.fs === "Windows") { a = a.toLowerCase(); b = b.toLowerCase(); }
                if (a === b) { duplicate = true; break; }
            }
            if (!duplicate) { files.push(picked[i]); }
        }
        refreshList();
    };
    remove.onClick = function () {
        var selected = list.selection;
        if (!selected) { return; }
        if (!(selected instanceof Array)) { selected = [selected]; }
        for (var i = selected.length - 1; i >= 0; i--) { files.splice(selected[i].index, 1); }
        refreshList();
    };
    clear.onClick = function () { files = []; refreshList(); };

    function settings() {
        return {
            radius: number(radius.text, "Radius", 0, 100000, false),
            size: number(size.text, "Image size", 1, 30000, false),
            speed: number(speed.text, "Speed", 0, 36000, false) * (clockwise.value ? 1 : -1),
            angle: number(startAngle.text, "Start angle", -36000, 36000, false),
            offset: number(offset.text, "Image rotation offset", -36000, 36000, false),
            upright: upright.value,
            rounded: rounded.value,
            cornerRadius: number(cornerRadius.text, "Corner radius", 0, 15000, false),
            shuffle: shuffle.value,
            seed: number(seed.text, "Arrangement seed", 0, 999999, true)
        };
    }

    function showError(error) {
        status.text = "Operation failed. See the error message; Ctrl+Z undoes an update.";
        var message = TITLE + " " + VERSION + "\nAction: " + operation;
        if (error.rcStage) { message += "\nStep: " + error.rcStage; }
        if (error.line || error.lineNumber) { message += "\nLine: " + (error.line || error.lineNumber); }
        message += "\n\n" + error.toString();
        alert(message, TITLE);
    }

    create.onClick = function () {
        operation = "Create Radial Carousel";
        create.enabled = false;
        try {
            if (boundController) { throw new Error("Click Update Carousel to edit the loaded carousel, or choose Create new carousel above."); }
            var s = settings();
            var comp = useActive.value ? destinationComp(files, activeComp(), compAtOpen) : null;
            if (useActive.value && !comp) { throw new Error("Click the destination composition's timeline, then Create again, or uncheck 'Add to the active composition'."); }
            if (!useActive.value) {
                s.width = number(width.text, "Width", 4, 30000, true);
                s.height = number(height.text, "Height", 4, 30000, true);
                s.duration = number(duration.text, "Duration", 0.1, 10800, false);
                s.fps = number(fps.text, "Frame rate", 1, 99, false);
                if (s.duration * s.fps < 1) { throw new Error("Duration must include at least one frame."); }
            }
            var created = build(s, files, comp);
            operation = "Load newly created carousel";
            refreshCarousels(created, false);
            status.text = "Created and loaded " + files.length + " items. Update Carousel edits this rig. Ctrl+Z undoes creation.";
        } catch (error) { showError(error); }
        finally { create.enabled = !boundController && files.length > 0; }
    };
    load.onClick = function () {
        operation = "Load Selected";
        try {
            refreshCarousels(selectedController(), false);
        } catch (error) { showError(error); }
    };
    apply.onClick = function () {
        operation = "Update Carousel";
        try {
            var s = settings();
            var layer = boundController;
            if (!layer || !isValid(layer) || layer.comment !== TAG) {
                throw new Error("Choose an existing carousel above, or click Refresh if it was removed or the project changed.");
            }
            app.beginUndoGroup("Update Radial Carousel");
            try { configure(layer, s); } finally { app.endUndoGroup(); }
            status.text = "Updated " + layer.containingComp.name + " / " + layer.name + ". Ctrl+Z undoes these settings.";
        } catch (error) { showError(error); }
    };

    try { refreshCarousels(null, true); } catch (error) { showError(error); }
    refreshList();
    win.onResizing = win.onResize = function () { this.layout.resize(); };
    win.layout.layout(true);
    win.minimumSize = win.size;
    if (win instanceof Window) { win.center(); win.show(); }
})(this);
