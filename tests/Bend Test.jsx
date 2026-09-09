/* Native AE regression for moving bend anchors. Only synthetic assets are changed.
   Run from File > Scripts > Run Script File; inspect bend-last-run.txt and PNGs.
*/
(function () {
    var here = new File($.fileName).parent, report = new File(here.fsName + "/bend-last-run.txt");
    var original = app.project.activeItem, initialCount = app.project.numItems, roots = [], api, checks = 0;
    function log(s) { if (!report.open("a")) { throw new Error("Cannot write Bend report"); } report.writeln(s); report.close(); }
    function assert(ok, s) { checks++; if (!ok) { throw new Error(s); } }
    function near(a,b) { assert(Math.abs(a-b)<0.01, a+" != "+b); }
    function read(card,name,t) {
        var p=card.property("ADBE Transform Group").property(name), v=p.valueAtTime(t,false);
        assert(!p.expressionError,name+": "+p.expressionError); return v;
    }
    function point(card,t) {
        read(card,"ADBE Anchor Point",t); read(card,"ADBE Rotate Z",t);
        var p=card.property("ADBE Effect Parade").property("Test center").property(1), v=p.valueAtTime(t,false);
        assert(!p.expressionError,p.expressionError); return v;
    }
    function distance(a,b) { return Math.sqrt(Math.pow(a[0]-b[0],2)+Math.pow(a[1]-b[1],2)); }
    if (!report.open("w")) { alert("Enable script file writing to run the Bend test."); return; }
    report.writeln("RUNNING: "+new Date().toString()+" / AE "+app.version); report.close();
    try {
        var file=new File(here.parent.fsName+"/Radial Carousel.jsx"); assert(file.open("r"),"Read script");
        var code=file.read(); file.close();
        eval(code.slice(0,code.indexOf("    var win ="))+"$.global.__rcBendTest={build:build,configure:configure,control:control};})(this);");
        api=$.global.__rcBendTest;
        var folder=app.project.items.addFolder("RC Bend synthetic test"); roots.push(folder);
        var inputs=[],i,j;
        for(i=0;i<12;i++) {
            var src=app.project.items.addComp("Bend card "+(i+1),160,220,1,24,30); src.parentFolder=folder;
            var solid=src.layers.addSolid([0.15+(i%3)*0.25,0.3+(i%4)*0.15,0.7-i*0.025],"Card",160,220,1,24);
            solid.source.parentFolder=folder;
            var label=src.layers.addText(String(i+1)), doc=label.property("ADBE Text Properties").property("ADBE Text Document").value;
            doc.fontSize=64; doc.fillColor=[1,1,1]; label.property("ADBE Text Properties").property("ADBE Text Document").setValue(doc);
            label.property("ADBE Transform Group").property("ADBE Position").setValue([35,130]);
            inputs.push({item:src,name:src.name});
        }
        var settings={radius:620,size:130,speed:1,angle:-180,offset:0,upright:false,rounded:false,cornerRadius:12,
            shuffle:false,seed:1,width:1500,height:1000,duration:24,fps:30,halfCircle:true,gap:0,bend:50,
            orbit:false,orbitClockwise:false,unfold:0.8,zoomTime:1.15,hold:0.8,transition:0.6,zoom:280,blur:18,sideScale:50};
        var ctrl=api.build(settings,inputs,null), comp=ctrl.containingComp; roots.push(ctrl.source.parentFolder);
        ctrl.property("ADBE Transform Group").property("ADBE Position").setValue([750,750]);
        var cards=[];
        for(i=1;i<=comp.numLayers;i++) if(comp.layer(i).parent===ctrl) {
            var card=comp.layer(i), center=card.property("ADBE Effect Parade").addProperty("ADBE Point Control");
            center.name="Test center"; center.property(1).expression="toComp([thisLayer.source.width/2,thisLayer.source.height/2]);"; cards.push(card);
        }
        cards.sort(function(a,b){return Number(a.name.match(/^RC (\d+)/)[1])-Number(b.name.match(/^RC (\d+)/)[1]);});
        var bends=[0,0.000001,25,50,100,200], times=[0,2,7], suffix=String(new Date().getTime());
        for(var bi=0;bi<bends.length;bi++) {
            api.control(ctrl,"Bend").setValue(bends[bi]);
            for(var ti=0;ti<times.length;ti++) {
                var points=[];
                for(i=0;i<cards.length;i++) { points.push(point(cards[i],times[ti])); var sc=read(cards[i],"ADBE Scale",times[ti]); near(sc[0],sc[1]); }
                var d=distance(points[0],points[1]);
                for(i=2;i<points.length;i++) near(distance(points[i-1],points[i]),d);
                if(times[ti]===0) { near(points[0][0],130);near(points[0][1],750);near(points[11][0],1370);near(points[11][1],750); }
                if(bends[bi]>0.1) {
                    var b=bends[bi]/100,cy=750+620*(1-b*b)/(2*b),r=620*(1+b*b)/(2*b);
                    for(i=0;i<points.length;i++) near(distance(points[i],[750,cy]),r);
                }
            }
            if(bends[bi]===0 || bends[bi]===50 || bends[bi]===100) comp.saveFrameToPng(0,new File(here.fsName+"/bend-"+bends[bi]+"-"+suffix+"-preview.png"));
        }
        // Anchor and orientation remain continuous when keyframing through zero.
        var bend=api.control(ctrl,"Bend"); bend.setValueAtTime(0,0);bend.setValueAtTime(1,50);
        for(i=0;i<cards.length;i++) {
            assert(distance(point(cards[i],0),point(cards[i],0.000001))<0.01,"No anchor jump at zero Bend");
            assert(Math.abs(read(cards[i],"ADBE Rotate Z",0)-read(cards[i],"ADBE Rotate Z",0.000001))<0.001,"No end-card rotation snap");
        }
        while(bend.numKeys) bend.removeKey(bend.numKeys);
        settings.orbit=true; settings.bend=50; settings.speed=0; api.configure(ctrl,settings);
        for(var direction=0;direction<2;direction++) {
            api.control(ctrl,"Orbit Clockwise").setValue(direction);
            for(i=0;i<cards.length;i++) {
                var index=i; if(direction) index=(cards.length-i)%cards.length;
                var p=point(cards[index],2.9+i*1.4); near(p[0],750);near(p[1],750);
            }
            var positions=[];
            for(i=0;i<cards.length;i++) positions.push(point(cards[i],3.5));
            for(i=2;i<positions.length;i++) near(distance(positions[i-1],positions[i]),distance(positions[0],positions[1]));
        }
        log("PASS: "+checks+" native assertions; Bend 0/tiny/25/50/100/200, uniform visible spacing, moving circle center during travel, fixed endpoints, scale, keyed zero continuity, both Orbit directions and centered holds. Source version 1.6.5.");
    } catch(e) { log("FAIL: "+e.toString()+" / line "+e.line+" / checks "+checks); }
    finally {
        for(j=roots.length-1;j>=0;j--) try { roots[j].remove(); } catch(e) { log("Cleanup: "+e); }
        if(original instanceof CompItem) original.openInViewer();
        delete $.global.__rcBendTest;
        log("Project items before/after: "+initialCount+"/"+app.project.numItems);
    }
})();
