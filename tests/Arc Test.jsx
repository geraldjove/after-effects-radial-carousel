/* Focused native AE test for Arc, Gap, and both animation modes.
   Uses synthetic comps, writes one preview/report, and removes only its test assets.
*/
(function () {
    var here = new File($.fileName).parent;
    var report = new File(here.fsName + "/arc-last-run.txt");
    var original = app.project.activeItem, roots = [], api = null, checks = 0;
    var initialCount = app.project.numItems;
    function log(message) { if (!report.open("a")) { throw new Error("Cannot write arc test report."); } report.writeln(message); report.close(); }
    function assert(ok, message) { checks++; if (!ok) { throw new Error(message); } }
    function near(a, b) { assert(Math.abs(a-b) < 0.001, a + " != " + b); }
    function read(layer, name, time) {
        var p = layer.property("ADBE Transform Group").property(name);
        var value = p.valueAtTime(time, false);
        assert(!p.expressionError, name + ": " + p.expressionError);
        return value;
    }
    if (!report.open("w")) { alert("Enable script file writing to run the arc test."); return; }
    report.writeln("RUNNING: " + new Date().toString() + " / AE " + app.version); report.close();
    try {
        var file = new File(here.parent.fsName + "/Radial Carousel.jsx");
        assert(file.open("r"), "Open production script");
        var code = file.read().replace(/\r\n/g, "\n"); file.close();
        var seam = "    refreshList();\n    win.onResizing";
        assert(code.indexOf(seam) >= 0, "Find native instrumentation seam");
        code = code.replace(seam, '    $.global.__rcArcTest = {win:win, tabs:tabs, layoutTab:layoutTab, arc:arc, gap:gap, mode:mode, menu:carouselMenu, create:create, apply:apply, load:load, addSources:function(s){files=s;refreshList();}, control:control, useActive:useActive, width:width, height:height, duration:duration, speed:speed, radius:radius, size:size, startAngle:startAngle, upright:upright, radial:radial};\n' + seam);
        code = code.replace("    function showError(error) {", "    function showError(error) { throw error;");
        code = code.replace("gap:gap, mode:mode", "gap:gap, shuffle:shuffle, mode:mode");
        eval(code); api = $.global.__rcArcTest;
        assert(api.win.visible, "Native panel is visible");
        api.menu.selection = api.menu.items[0]; api.menu.onChange();
        api.mode.selection = api.mode.items[0]; api.mode.onChange(); api.gap.text = "0";
        api.shuffle.value = false;
        api.useActive.value = false; api.width.text = "800"; api.height.text = "800";
        api.duration.text = "12"; api.speed.text = "0"; api.radius.text = "240"; api.size.text = "120";
        api.startAngle.text = "-180"; api.upright.value = false; api.radial.value = true;
        api.arc.selection = api.arc.items[1];
        var folder = app.project.items.addFolder("RC Arc synthetic test"); roots.push(folder);
        var inputs = [], colors = [[0.8,0.2,0.2],[0.2,0.7,0.3],[0.2,0.4,0.9]], i;
        for (i = 0; i < 3; i++) {
            var source = app.project.items.addComp("Arc card " + i, 120, 160, 1, 12, 30);
            source.parentFolder = folder;
            var solid = source.layers.addSolid(colors[i], "Card", 120, 160, 1, 12);
            solid.source.parentFolder = folder; inputs.push({item:source, name:source.name});
        }
        api.addSources(inputs); api.create.onClick();
        var comp = app.project.activeItem, ctrl = comp.selectedLayers[0];
        roots.push(ctrl.source.parentFolder);
        assert(comp !== original && comp.numLayers === 4, "GUI creates the carousel");
        near(api.control(ctrl, "Half Circle").value, 1);
        var cards = [];
        for (i = 1; i <= comp.numLayers; i++) { if (comp.layer(i).parent === ctrl) { cards.push(comp.layer(i)); } }
        cards.sort(function (a,b) { return Number(a.property("ADBE Transform Group").property("ADBE Position").expression.match(/var slot = (\d+)/)[1]) - Number(b.property("ADBE Transform Group").property("ADBE Position").expression.match(/var slot = (\d+)/)[1]); });
        for (i = 0; i < cards.length; i++) {
            var angle = -180 + i*90, p = read(cards[i], "ADBE Position", 0);
            near(p[0], 240*Math.cos(angle*Math.PI/180)); near(p[1], 240*Math.sin(angle*Math.PI/180));
            near(read(cards[i], "ADBE Rotate Z", 0), angle+90);
        }
        api.gap.text = "40"; api.apply.onClick();
        var first = read(cards[0], "ADBE Position", 0), second = read(cards[1], "ADBE Position", 0);
        near(Math.sqrt(Math.pow(first[0]-second[0],2)+Math.pow(first[1]-second[1],2)),240*Math.sqrt(2)+40);
        near(api.control(ctrl, "Radius").value, 240);
        near(read(cards[0], "ADBE Scale", 0)[0], 75);
        comp.saveFrameToPng(0, new File(here.fsName + "/arc-preview.png"));
        api.win.close(); eval(code); api = $.global.__rcArcTest;
        assert(api.menu.selection.controller === ctrl && api.arc.selection === api.arc.items[1], "Reopen restores the native Arc dropdown");
        near(Number(api.gap.text), 40);
        api.mode.selection = api.mode.items[1]; api.mode.onChange(); api.apply.onClick();
        for (var direction = 0; direction < 2; direction++) {
            api.control(ctrl, "Orbit Clockwise").setValue(direction);
            for (i = 0; i < 3; i++) {
                var index = i; if (direction) { index = (3-i)%3; }
                p = read(cards[index], "ADBE Position", 2.9+i*1.4);
                near(p[0], 0); near(p[1], 0);
                var blur = cards[index].property("ADBE Effect Parade").property("RC Focus Blur").property(1);
                near(blur.valueAtTime(2.9+i*1.4, false), 0); assert(!blur.expressionError, "Focused image blur expression");
            }
        }
        api.mode.selection = api.mode.items[0]; api.mode.onChange();
        api.arc.selection = api.arc.items[0]; api.apply.onClick();
        for (i = 0; i < cards.length; i++) {
            angle = (-180+i*120)*Math.PI/180; p = read(cards[i], "ADBE Position", 0);
            var expanded = 240+40/Math.sqrt(3);
            near(p[0], expanded*Math.cos(angle)); near(p[1], expanded*Math.sin(angle));
        }
        api.gap.text = "0"; api.apply.onClick();
        first = read(cards[0], "ADBE Position", 0); near(Math.sqrt(first[0]*first[0]+first[1]*first[1]),240);
        assert(comp.numLayers === 4, "Update preserves the existing layers");
        log("PASS: " + checks + " native assertions. Arc/Gap GUI create/reopen/update, added spacing without resizing, 180/360 geometry, radial orientation, both Unfolded Orbit directions, and focus blur.");
    } catch (error) { log("FAIL: " + error.toString() + " / line " + error.line + " / checks " + checks); }
    finally {
        if (api) { api.win.close(); }
        for (var j = roots.length-1; j >= 0; j--) { try { roots[j].remove(); } catch (cleanupError) { log("Cleanup: " + cleanupError); } }
        if (original instanceof CompItem) { original.openInViewer(); }
        delete $.global.__rcArcTest;
        log("Project items before/after: " + initialCount + "/" + app.project.numItems);
    }
})();
