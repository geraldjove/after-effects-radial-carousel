/* Native AE check. Creates only synthetic test assets and a preview project.
   Requires script file writing for the report/project/frame exports.
   Never closes a project or changes source media. Removes its test folder afterward.
*/
(function () {
    var here = new File($.fileName).parent;
    var report = new File(here.fsName + "/orbit-last-run.txt");
    if (!report.open("w")) { alert("Enable script file writing to run this native test."); return; }
    report.writeln("RUNNING: " + new Date().toString() + " / After Effects " + app.version); report.close();
    function log(s) { report.open("a"); report.writeln(s); report.close(); }
    var assertions = 0, roots = [], api = null, queued = [], queueItem = null;
    var projectCount = app.project.numItems;
    function assert(ok, message) { assertions++; if (!ok) { throw new Error(message); } }
    function near(a, b, message) { assert(Math.abs(a-b) < 0.001, message + ": " + a + " != " + b); }
    function sample(p, t) { var v = p.valueAtTime(t, false); assert(!p.expressionError, p.name + ": " + p.expressionError); return v; }
    function read(layer, name, t) { return sample(layer.property("ADBE Transform Group").property(name),t); }
    function label(comp, content, position, size, color) {
        var text = comp.layers.addText(content);
        var prop = text.property("ADBE Text Properties").property("ADBE Text Document");
        var doc = prop.value; doc.fontSize = size; doc.fillColor = color; doc.applyFill = true; doc.applyStroke = false; prop.setValue(doc);
        text.property("ADBE Transform Group").property("ADBE Position").setValue(position);
    }
    try {
        var original = app.project.activeItem;
        var originalSelected = original instanceof CompItem ? original.selectedLayers : [];
        var source = new File(here.parent.fsName + "/Radial Carousel.jsx");
        assert(source.open("r"), "Open production JSX"); var code = source.read().replace(/\r\n/g,"\n"); source.close();
        var seam = "    refreshList();\n    win.onResizing";
        assert(code.indexOf(seam)>=0,"Find native test seam");
        code = code.replace(seam, '    $.global.__orbitTest = {win:win, tabs:tabs, mode:mode, build:build, configure:configure, control:control, settings:settings, selectedController:selectedController, carouselMenu:carouselMenu, addSources:function(s){files=s;refreshList();}, create:create, apply:apply, refresh:refreshCarousels, orbitInputs:orbitInputs, radius:radius, size:size, startAngle:startAngle, offset:offset, shuffle:shuffle, rounded:rounded, useActive:useActive, width:width, height:height, fps:fps, status:status};\n'+seam);
        code = code.replace("    function showError(error) {", "    function showError(error) { throw error;");
        code = code.replace("mode:mode, build:build", "mode:mode, arc:arc, gap:gap, build:build");
        eval(code);
        api = $.global.__orbitTest;
        assert(api.win.visible,"Native ScriptUI panel is visible");
        assert(api.tabs.children.length===4,"Four native tabs");
        api.carouselMenu.selection = api.carouselMenu.items[0]; api.carouselMenu.onChange();
        api.useActive.value=false;
        api.mode.selection=api.mode.items[1]; api.mode.onChange();
        api.arc.selection=api.arc.items[0]; api.gap.text="0";
        api.width.text="1080"; api.height.text="1440"; api.fps.text="30";
        api.radius.text="270"; api.size.text="250";
        api.startAngle.text="-90"; api.offset.text="0"; api.shuffle.value=false; api.rounded.value=true;
        var folder=app.project.items.addFolder("Unfolded Orbit synthetic test"); roots.push(folder);
        var colors=[[0.13,0.36,0.29],[0.86,0.21,0.13],[0.13,0.31,0.52],[0.67,0.44,0.13],[0.75,0.75,0.68],[0.06,0.35,0.34],[0.68,0.31,0.43],[0.33,0.31,0.57]];
        var names=["FOREST","ENERGY","ALTITUDE","GOLDEN HOUR","STILLNESS","CLASSIC","PORTRAIT","FORM"];
        var inputs=[];
        for(var i=0;i<8;i++) {
            var card=app.project.items.addComp("Orbit Card "+(i+1),800,600,1,17,30); card.parentFolder=folder;
            var solid=card.layers.addSolid(colors[i],"Background",800,600,1,17); solid.source.parentFolder=folder;
            label(card,"0"+(i+1),[52,255],210,[0.94,0.93,0.87]);
            label(card,names[i],[58,435],42,[0.94,0.93,0.87]);
            label(card,"UNFOLDED ORBIT  /  RADIAL CAROUSEL",[58,540],18,[0.94,0.93,0.87]);
            inputs.push({item:card,name:card.name});
        }
        api.addSources(inputs); api.create.onClick();
        var comp=app.project.activeItem, ctrl=api.selectedController(); roots.push(comp.parentFolder);
        comp.name="Unfolded Orbit - Eight Cards";
        near(comp.duration,17,"Default eight-card duration");
        near(sample(api.control(ctrl,"Loop Duration"),0),17,"Live loop-duration control");
        var cards=[];
        for(i=1;i<=comp.numLayers;i++){if(comp.layer(i).parent===ctrl){cards.push(comp.layer(i));}}
        cards.sort(function(a,b){return Number(a.property("ADBE Transform Group").property("ADBE Position").expression.match(/var slot = (\d+)/)[1])-Number(b.property("ADBE Transform Group").property("ADBE Position").expression.match(/var slot = (\d+)/)[1]);});
        assert(cards.length===8,"Eight linked source precomps");
        var times=[0,0.7,1.2,2.1,2.9,4.3,5.7,7.1,8.5,9.9,11.3,12.7,14.1,15.3,16.3,17];
        for(var t=0;t<times.length;t++){
            sample(api.control(ctrl,"Orbit State"),times[t]);
            read(ctrl,"ADBE Scale",times[t]); read(ctrl,"ADBE Rotate Z",times[t]);
            for(i=0;i<cards.length;i++) {
                read(cards[i],"ADBE Position",times[t]); read(cards[i],"ADBE Scale",times[t]);
                read(cards[i],"ADBE Rotate Z",times[t]); read(cards[i],"ADBE Opacity",times[t]);
                sample(cards[i].property("ADBE Effect Parade").property("RC Focus Blur").property(1),times[t]);
                sample(cards[i].property("ADBE Mask Parade").property("RC Rounded Corners").property("ADBE Mask Shape"),times[t]);
            }
        }
        for(i=0;i<8;i++){
            var p=read(cards[i],"ADBE Position",2.9+i*1.4); near(p[0],0,"Card "+i+" focus X"); near(p[1],0,"Card "+i+" focus Y");
            near(sample(cards[i].property("ADBE Effect Parade").property("RC Focus Blur").property(1),2.9+i*1.4),0,"Focused card sharp");
            var a=read(cards[i],"ADBE Position",0), b=read(cards[i],"ADBE Position",17);
            near(a[0],b[0],"Loop X"); near(a[1],b[1],"Loop Y");
            near(read(cards[i],"ADBE Opacity",0),i===0?100:0,"Closed-ring visibility");
            near(read(cards[i],"ADBE Scale",2.9+i*1.4)[0],31.25,"Focused card scale");
        }
        near(read(cards[1],"ADBE Scale",2.9)[0],15.625,"Side-card scale");
        var before=comp.numLayers;
        ctrl.name="Renamed Unfolded Controller";
        api.refresh(ctrl,false); assert(api.mode.selection===api.mode.items[1],"Recovered mode");
        api.orbitInputs[5].text="24"; api.apply.onClick();
        near(api.control(ctrl,"Focus Blur").value,24,"Update blur");
        assert(comp.numLayers===before,"Update preserves card count");
        api.orbitInputs[5].text="18"; api.apply.onClick();
        var shortSource=app.project.items.addComp("Short source test",800,600,1,4,30); shortSource.parentFolder=folder;
        shortSource.layers.add(inputs[0].item);
        var shortSettings=api.settings(); shortSettings.orbit=false; shortSettings.duration=4;
        shortSettings.width=800; shortSettings.height=800; shortSettings.fps=30;
        var shortRig=api.build(shortSettings,[{item:shortSource,name:shortSource.name}],null);
        roots.push(shortRig.containingComp.parentFolder);
        shortRig.containingComp.duration=17; shortRig.inPoint=1;
        shortSettings.orbit=true; api.configure(shortRig,shortSettings);
        var shortCard=shortRig.containingComp.layer(2);
        near(shortRig.outPoint,8.2,"Lengthened rig covers loop after in point");
        near(shortCard.outPoint,8.2,"Lengthened card covers loop");
        assert(shortCard.timeRemapEnabled,"Newly extended short precomp holds its last frame");
        near(sample(shortCard.property("ADBE Time Remapping"),6),4-1/30,"Extended source frame hold");
        near(shortSource.duration,4,"Extended source comp unchanged");
        comp.openInViewer();
        log("PASS: "+assertions+" native assertions; expressions, masks, focus order, loop, ScriptUI create/recover/update.");
        var frames=[0,0.7,1.2,2.1,2.9,4.3,7.1,11.3,14.1,15.3,16.3];
        for(i=0;i<frames.length;i++){
            comp.saveFrameToPng(frames[i],new File(here.fsName+"/orbit-"+i+"-preview.png"));
        }
        log("PASS: "+frames.length+" native PNG frames exported.");
        assert(!app.project.renderQueue.rendering,"No user render in progress");
        // Render only this synthetic comp. Restore existing queued flags in finally.
        for(i=1;i<=app.project.renderQueue.numItems;i++) {
            var prior=app.project.renderQueue.item(i);
            if(prior.status===RQItemStatus.QUEUED){queued.push(prior);prior.render=false;}
        }
        queueItem=app.project.renderQueue.items.add(comp);
        var output=queueItem.outputModule(1), templates=output.templates, h264=null;
        for(i=0;i<templates.length;i++){if(/H\.264.*5 Mbps/.test(templates[i])){h264=templates[i];break;}}
        assert(h264!==null,"Native H.264 output template available");
        output.applyTemplate(h264);
        output=queueItem.outputModule(1);
        output.postRenderAction=PostRenderAction.NONE;
        var movie=new File(here.fsName+"/unfolded-orbit-preview.mp4"), version=1;
        while(movie.exists){movie=new File(here.fsName+"/unfolded-orbit-preview-"+version+".mp4");version++;}
        output.file=movie;
        queueItem.timeSpanStart=0;queueItem.timeSpanDuration=17;queueItem.render=true;
        log("RENDERING: synthetic 17-second H.264 preview.");
        app.project.renderQueue.render();
        assert(queueItem.status===RQItemStatus.DONE,"Native movie render completed");
        log("Movie: "+movie.fsName);
        log("COMPLETE: "+assertions+" native assertions, 11 frame exports, and full H.264 movie passed.");
    } catch(error) {
        log("FAIL: "+error.toString()+" / line "+error.line+(error.rcStage?" / step "+error.rcStage:""));
    } finally {
        if(queueItem){try{queueItem.remove();}catch(queueCleanup){}}
        for(var q=0;q<queued.length;q++){try{queued[q].render=true;}catch(queueRestore){log("Queue restore: "+queueRestore.toString());}}
        if(api){try{api.win.close();}catch(closeError){}}
        for(var r=roots.length-1;r>=0;r--){try{roots[r].remove();}catch(cleanup){log("Cleanup: "+cleanup.toString());}}
        try{if(original && isValid(original) && original instanceof CompItem){original.openInViewer();for(var j=0;j<originalSelected.length;j++){originalSelected[j].selected=true;}}}catch(viewError){}
        log("Project items before/after: "+projectCount+"/"+app.project.numItems);
        delete $.global.__orbitTest;
    }
})();
