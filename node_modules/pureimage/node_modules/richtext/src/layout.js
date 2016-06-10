var Common = require('./common');
var RenderTree = require("./render").RenderTree;
function findStyleByName(node,name) {
    if(node.type == 'frame') {
        if(node.styles) {
            if(!node.styles[name]) {
                console.log("UNKNOWN STYLE NAME", name);
            }
            return node.styles[name];
        } else {
            console.log("UNKNOWN STYLE PART NAME ",name);
            return null;
        }
    }
    return findStyleByName(node.parent,name);
}

function lookupStyle(node, key) {
    if(!node) {
        //console.log("at the end. no style?!");
        return null;
    }
    if(node.stylename) {
        var style = findStyleByName(node,node.stylename);
        if(style[key]) {
            return style[key];
        }
    }
    if(node.style[key]) {
        return node.style[key];
    } else {
        return lookupStyle(node.parent,key);
    }
}


exports.generateRenderTree = function(frame, viewport, fctx) {
    //make a render block box from a doc block
    function layoutBlock(block, maxw) {
        //console.log("layout block: using max width of ", maxw);
        var padding = lookupStyle(block,'block-padding');
        maxw -= padding*2;
        var LH = lookupStyle(block,'font-size');
        var y = padding;
        var x = padding;

        var rblock = RenderTree.makeBlock();
        rblock.len = 0;
        rblock.style['background-color'] = lookupStyle(block,'background-color');
        rblock.style['border-color'] = lookupStyle(block,'border-color');
        rblock.block = block;
        var rline  = RenderTree.makeLine();
        rline.y = y;
        rline.x = x;
        rline.h = LH;
        rline.baseline = LH-2;
        rline.fctx = fctx;
        rblock.add(rline);

        var len = 0;

        function makeRun() {
            var run = RenderTree.makeRun();
            run.x = 0;
            run.y = 0;
            run.baseline = LH-2;
            run.h = LH;
            run.w = -100;
            run.fctx = fctx;
            return run;
        }

        for(var i=0; i<block.spans.length; i++) {
            var span = block.spans[i];
            //every span becomes a new run
            var run = makeRun();
            rline.add(run);
            run.span = span;
            run.spanstart = 0;
            run.spanend = 0;
            run.x = len;
            var sincelastspace = 0;
            for(var j=0; j<span.chars.length; j++) {
                var char = span.chars[j];
                var font_size = lookupStyle(span,'font-size');
                var font_family = lookupStyle(span,'font-family');
                var font_weight = lookupStyle(span,'font-weight');
                var font_style = lookupStyle(span,'font-style');
                len += fctx.charWidth(char, font_size, font_family, font_weight, font_style);
                if(char == ' ') {
                    lastwidth = len;
                    sincelastspace = 0;
                } else {
                    sincelastspace++;
                }

                //break line
                if(len > maxw) {
                    sincelastspace--;
                    run.spanend = j-sincelastspace;
                    run.w = fctx.charWidth(run.getText(),font_size, font_family, font_weight, font_style);
                    rline.len -= sincelastspace;
                    rblock.len -= sincelastspace;
                    rline.w = run.x + run.w;
                    rline = RenderTree.makeLine();
                    y += LH;
                    rline.y = y;
                    rline.x = x;
                    rline.h = LH;
                    rline.baseline = LH-2;
                    rline.fctx = fctx;
                    var extra = len - lastwidth;
                    len = extra;
                    run = makeRun();
                    run.spanstart = j-sincelastspace;
                    run.spanend = j;
                    run.span = span;
                    rblock.len += run.charLength();
                    run.x = 0;
                    rline.add(run);
                    rblock.add(rline);
                    sincelastspace = 0;
                }

                run.style['color'] = lookupStyle(span,'color');
                run.style['font-size'] = lookupStyle(span,'font-size');
                run.style['font-family'] = lookupStyle(span,'font-family');
                run.style['font-weight'] = lookupStyle(span,'font-weight');
                run.style['font-style'] = lookupStyle(span,'font-style');
                run.h = run.style['font-size'];

                run.spanend = j+1;
                rline.len++;
                rblock.len++;
            }
            run.w = len - run.x;
            rline.w = run.x + run.w;
        }
        rblock.w = viewport.w;

        //handle line alignment
        var align = lookupStyle(block,'text-align');
        if(align != null) {
            rblock.lines.forEach(function(rline) {
                if(align == 'right') {
                    rline.x = viewport.w - rline.w;
                }
                if(align == 'center') {
                    rline.x = viewport.w/2 - rline.w/2;
                }
                if(align == 'left') {
                    rline.x = 0;
                }
            })
        }
        rblock.x = 0;
        rblock.h = y+rline.h+padding;
        return rblock;
    }

    //make render tree from doc tree
    var rby = 0;
    var rendertree = {
        type:'rendertree',
        blocks:Common.enhanceArray([]),
    }


    frame.blocks.forEach(function(block) {
        var rb = layoutBlock(block,viewport.w);
        rb.y = rby;
        rby+= rb.h;
        rendertree.blocks.push(rb);
        rb.parent = rendertree;
    });

    return rendertree;
}
