/* Run in AE to check recovery in its actual ExtendScript engine.
   Reads the production script; creates no project items and writes no files. */
(function () {
    var checks = 0;
    try {
        var here = new File($.fileName).parent;
        var script = new File(here.fsName + "/../Radial Carousel.jsx");
        if (!script.open("r")) { throw new Error("Cannot read Radial Carousel.jsx"); }
        var code = script.read();
        script.close();
        var seam = code.indexOf("    var win =");
        if (seam < 0) { throw new Error("Cannot locate the recovery test seam"); }
        var testAPI = {};
        // Use the shipped recovery function with fake layers, avoiding project mutations.
        eval(code.slice(0, seam) + "isCarouselSource = function(item) { return !!item; }; this.recover = carouselSources; }).call(testAPI, testAPI);");
        function verify(expressions, expected) {
            var controller = {}, layers = [];
            for (var i = 0; i < expressions.length; i++) {
                layers.push({parent: controller, source: {name: String(i)}, expression: expressions[i],
                    property: function () {
                        var expression = this.expression;
                        return {property: function () { return {expression: expression}; }};
                    }});
            }
            controller.containingComp = {numLayers: layers.length, layer: function (i) { return layers[i - 1]; }};
            var recovered = testAPI.recover(controller), names = [];
            for (i = 0; i < recovered.length; i++) { names.push(recovered[i].name); }
            if (names.join(",") !== expected) { throw new Error("Wrong source order: " + names.join(",") + "; expected " + expected); }
            checks++;
        }
        // Nonzero modern slots have no legacy match: this triggered v1.5.1 line 244.
        verify(["var slot = 2, n = 3;", "var slot = 0, n = 3;", "var slot = 1, n = 3;"], "1,2,0");
        verify(["var slot = 0, n = 1;"], "0");
        verify(['var a = parent.effect("Start Angle")(1) + 240;', 'var a = parent.effect("Start Angle")(1) + 0;', 'var a = parent.effect("Start Angle")(1) + 120;'], "1,2,0");
        verify(["", "custom position expression"], "0,1");
        verify([], "");
        alert("PASS: " + checks + " recovery checks. Modern slots, slot zero, legacy order, fallback, and empty carousel.", "Radial Carousel Recovery Test");
    } catch (error) {
        alert("FAIL after " + checks + " checks: " + error.toString() + " | line " + error.line, "Radial Carousel Recovery Test");
    }
})();
