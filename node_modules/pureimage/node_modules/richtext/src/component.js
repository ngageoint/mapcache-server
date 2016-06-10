var Document = require('./document').Document;
var Cursor = require("./cursor").Cursor;
var Layout = require('./layout');
var keyboard = require('./keyboard');
var Render = require('./render');

var config = null;

function requestAnimationFrame(arg) {
    config.requestAnimationFrame(arg);
}
var Viewport = {
    makeViewport: function(w,h) {
        return {
            type:"viewport",
            w:w,
            h:h,
        }
    }
}

exports.applyBlockStyle = function(doc, stylename) {
    var path = doc.cursor.getCurrentSpot();
    path.block.stylename = stylename;
    doc.relayout();
    requestAnimationFrame(doc.redraw);
}

exports.applySpanStyle = function(doc, stylename) {
    if(doc.frame.hasSelection()) {
        var sel = doc.frame.getSelection();
        if(sel.start.span == sel.end.span) {
            //within one span
            var spans = doc.cursor.splitSpanWithSelection(sel.start.span,sel);
            spans[1].stylename = stylename;
            doc.frame.clearSelection();
            doc.cursor.setCurrentSpot({
                frame: doc.frame,
                block: sel.start.block,
                span: spans[2],
                inset:0,
            });
        } else if(sel.start.block == sel.end.block) {
            //within one block
            var spansA = doc.cursor.splitSpanWithInset(sel.start.span,sel.start.inset);
            var spansB = doc.cursor.splitSpanWithInset(sel.end.span,sel.end.inset);
            spansA[1].stylename = stylename;
            spansB[0].stylename = stylename;
            doc.frame.clearSelection();
            doc.cursor.setCurrentSpot({
                frame: doc.frame,
                block: sel.start.block,
                span: spansB[1],
                inset:0,
            });
        } else {
            //split across blocks
            var spansA = doc.cursor.splitSpanWithInset(sel.start.span,sel.start.inset);
            var spansB = doc.cursor.splitSpanWithInset(sel.end.span,sel.end.inset);
            spansA[1].stylename = stylename;
            spansB[0].stylename = stylename;

            var middle_blocks = doc.frame.blocks.slice(
                sel.start.block.getIndex()+1,
                sel.end.block.getIndex());
            middle_blocks.forEach(function(block){
                block.spans.forEach(function(span) {
                    span.stylename = stylename;
                })
            })

            doc.frame.clearSelection();
            doc.cursor.setCurrentSpot({
                frame: doc.frame,
                block: sel.end.block,
                span: spansB[1],
                inset:0,
            });
        }


        doc.relayout();
        requestAnimationFrame(doc.redraw);
        return;
    }
    var blockpath = doc.cursor.getCurrentSpot();
    var block = blockpath.block;
    var n = blockpath.inset;
    var span1 = blockpath.span;
    var before = span1.substring(0,n);
    var after  = span1.substring(n);

    //set span to the before part
    span1.setString(before);
    var span2 = block.insertSpan("X");
    span2.stylename = stylename;
    var span3 = block.insertSpan(after);
    span3.stylename = span1.stylename;
    doc.relayout();
    requestAnimationFrame(doc.redraw);
}

var key_actions = {
    'cursor-down': function(doc) {
        doc.frame.clearSelection();
        if(doc.popup.visible) {
            doc.popup.selectedIndex += 1;
            if(doc.popup.selectedIndex < 0) {
                doc.popup.selectedIndex = 0;
            }
            if(doc.popup.selectedIndex >= doc.popup.lines.length) {
                doc.popup.selectedIndex = doc.popup.lines.length-1;
            }
            requestAnimationFrame(doc.redraw);
            return;
        }
        doc.cursor.moveV(+1);
        requestAnimationFrame(doc.redraw);
    },
    'cursor-up': function(doc) {
        doc.frame.clearSelection();
        if(doc.popup.visible) {
            doc.popup.selectedIndex -= 1;
            if(doc.popup.selectedIndex < 0) doc.popup.selectedIndex = 0;
            requestAnimationFrame(doc.redraw);
            return;
        }
        doc.cursor.moveV(-1);
        requestAnimationFrame(doc.redraw);
    },

    'cursor-left':function(doc) {
        doc.frame.clearSelection();
        doc.cursor.moveH(-1);
        requestAnimationFrame(doc.redraw);
    },
    'cursor-right':function(doc) {
        doc.frame.clearSelection();
        doc.cursor.moveH(+1);
        requestAnimationFrame(doc.redraw);
    },

    'cursor-line-start':function(doc) {
        doc.frame.clearSelection();
        var p = doc.cursor.getCurrentSpot();
        p.span = p.block.spans.first();
        p.inset = 0;
        doc.cursor.setCurrentSpot(p);
        requestAnimationFrame(doc.redraw);
    },

    'cursor-line-end': function(doc) {
        doc.frame.clearSelection();
        var p = doc.cursor.getCurrentSpot();
        p.span = p.block.spans.last();
        p.inset = p.span.chars.length-1;
        doc.cursor.setCurrentSpot(p);
        requestAnimationFrame(doc.redraw);
    },

    'selection-extend-left':function(doc) {
        if(!doc.frame.hasSelection()) {
            var spot = doc.cursor.getCurrentSpotCopy(doc);
            doc.frame.setSelection(spot,spot);
        }
        doc.cursor.moveH(-1);
        doc.frame.getSelection().start = doc.cursor.getCurrentSpotCopy(doc);
        requestAnimationFrame(doc.redraw);
    },

    'selection-extend-right':function(doc) {
        if(!doc.frame.hasSelection()) {
            var spot = doc.cursor.getCurrentSpotCopy(doc);
            doc.frame.setSelection(spot,spot);
        }
        doc.cursor.moveH(+1);
        doc.frame.getSelection().end = doc.cursor.getCurrentSpotCopy(doc);
        requestAnimationFrame(doc.redraw);
    },

    'selection-extend-up':function(doc) {
        if(!doc.frame.hasSelection()) {
            var spot = doc.cursor.getCurrentSpotCopy(doc);
            doc.frame.setSelection(spot,spot);
        }
        doc.cursor.moveV(-1);
        doc.frame.getSelection().start = doc.cursor.getCurrentSpotCopy(doc);
        requestAnimationFrame(doc.redraw);
    },

    'selection-extend-down':function(doc) {
        if(!doc.frame.hasSelection()) {
            var spot = doc.cursor.getCurrentSpotCopy(doc);
            doc.frame.setSelection(spot,spot);
        }
        doc.cursor.moveV(+1);
        doc.frame.getSelection().end = doc.cursor.getCurrentSpotCopy(doc);
        requestAnimationFrame(doc.redraw);
    },

    'delete-forward': function(doc) {
        if(doc.frame.hasSelection()) {
            doc.cursor.removeSelection(doc.frame.getSelection());
            doc.frame.clearSelection();
        } else {
            doc.cursor.removeChar(doc.cursor.getCurrentSpot(),+1);
        }
    },

    'delete-backward': function(doc) {
        if(doc.frame.hasSelection()) {
            doc.cursor.removeSelection(doc.frame.getSelection());
            doc.frame.clearSelection();
        } else {
            doc.cursor.removeChar(doc.cursor.getCurrentSpotCopy(),-1);
        }
    },

    'split-line':function(doc) {
        if(doc.enterAction) {
            doc.enterAction();
        }
        if(doc.multiline == false) return;
        if(doc.popup.visible) {
            var str = doc.popup.lines[doc.popup.selectedIndex];
            doc.popup.visible = false;
            var blockpath = doc.cursor.getCurrentSpotCopy();
            blockpath.span.insertChar(blockpath.inset, str);
            return;
        }
        if(doc.frame.hasSelection()) {
            doc.cursor.removeSelection(doc.frame.getSelection());
            doc.frame.clearSelection();
        }
        doc.cursor.splitBlock();
    },

    'popup-show': function(doc) {
        var blockpath = doc.cursor.getCurrentSpot();
        var renderpath = doc.cursor.blockPathToRenderPath(blockpath,doc.renderTree);

        //get the previous 20 characters from the cursor.

        var str = blockpath.span.substring(0,blockpath.inset);
        var lines = generateCompletions(str);
        var curxy = doc.cursor.renderPathToXY(renderpath);
        doc.popup.visible = true;
        doc.popup.xy = curxy;
        doc.popup.lines = lines;
        requestAnimationFrame(doc.redraw);
        return;
    },

    'start-italic': function(doc) {
        exports.applySpanStyle(doc,'italic');
    },

    'start-bold': function(doc) {
        exports.applySpanStyle(doc,'bold');
    }
};

var keyevent_to_actions =  {
    'left':'cursor-left',
    'shift-left':'selection-extend-left',
    'down':'cursor-down',
    'shift-down':'selection-extend-down',
    'up':'cursor-up',
    'shift-up':'selection-extend-up',
    'right':'cursor-right',
    'shift-right':'selection-extend-right',
    'enter':'split-line',
    'back_delete':'delete-backward',
    'forward_delete':'delete-forward',

    'control-f':'cursor-right',
    'control-b':'cursor-left',
    'control-n':'cursor-down',
    'control-p':'cursor-up',

    'control-d':'delete-forward',
    'control-a':'cursor-line-start',
    'control-e':'cursor-line-end',
    'control-space':'popup-show',

    'control-i':'start-italic',
    'control-b':'start-bold',
}

exports.makeRichTextView = function(conf) {
    config = conf;
    var frame = config.frame;
    if(!config.width) config.width = 600;
    if(!config.height) config.height = 400;
    var viewport = Viewport.makeViewport(config.width,config.height);
    //printDoc(frame);
    var rend = null;
    var ctx = config.context;
    if(typeof config.multiline === 'undefined') {
        config.multiline = true;
    }

    var cursor = new Cursor(frame,rend);
    if(!config.charWidth) {
        config.charWidth = function(ch,
                font_size,
                font_family,
                font_weight,
                font_style
            ) {
                var fstring =
                    font_style + ' ' +
                    font_weight + ' ' +
                    font_size + 'px ' +
                    font_family;

                //ctx.font = font_size+'px '+font_family;
                ctx.font = fstring;
                return ctx.measureText(ch).width;
        }
    }

    function relayout() {
        rend = Layout.generateRenderTree(config.frame,viewport, config);
        //printRender(rend);
        cursor.rendertree = rend;
    }

    function render(rend) {
        ctx.fillStyle = '#f8f8ff';
        ctx.fillRect(0,0,config.width,config.height);
        var spot = cursor.getCurrentSpot();
        var renderpath = cursor.blockPathToRenderPath(spot,cursor.rendertree);
        ctx.save();
        Render.drawRenderTree(ctx,rend,renderpath.line,cursor.getCurrentFrame());
        ctx.restore();
    }

    var popup = {
        visible: false,
        xy: null,
        selectedIndex: -1,
    }

    function redraw() {
        render(rend);
        var spot = cursor.getCurrentSpot();
        if(spot == null) return;
        var renderpath = cursor.blockPathToRenderPath(spot,rend);
        var curxy = cursor.renderPathToXY(renderpath);
        ctx.fillStyle = "#cc8800";
        ctx.fillRect(curxy.x,curxy.y,2,renderpath.run.h);

        if(popup.visible) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(popup.xy.x,popup.xy.y+20,100,200);
            ctx.strokeStyle = "black";
            ctx.strokeRect(popup.xy.x,popup.xy.y+20,100,200);
            ctx.save();
            ctx.translate(popup.xy.x,popup.xy.y);
            for(var i=0; i<popup.lines.length; i++) {
                var y = i*20+20;
                if(i == popup.selectedIndex) {
                    ctx.fillStyle = '#000000';
                } else {
                    ctx.fillStyle = '#ffffff';
                }
                ctx.fillRect(0,y,100,20);
                if(i == popup.selectedIndex) {
                    ctx.fillStyle = '#ffffff';
                } else {
                    ctx.fillStyle = '#000000';
                }
                ctx.fillText(popup.lines[i],3, y+17);
            }
            ctx.restore()
        }
    }

    function tryAction(str) {
        var actname = keyevent_to_actions[str];
        if(actname) {
            var action = key_actions[actname];
            if(action) {
                action({
                    cursor:cursor,
                    popup:popup,
                    redraw:redraw,
                    relayout:relayout,
                    renderTree:rend,
                    frame: cursor.frame,
                    multiline: config.multiline,
                    enterAction: config.enterAction,
                });
                checkLayout();
                return true;
            }
        }
        return false;
    }
    function makePoint(x,y) {
        return {
            x: x,
            y: y,
            minus: function(pt) {
                return makePoint(this.x-pt.x, this.y - pt.y);
            },
            inside: function(box) {
                if(this.x < box.x) return false;
                if(this.y < box.y) return false;
                if(this.x > box.x+box.w) return false;
                if(this.y > box.y+box.h) return false;
                return true;
            }
        }
    }

    if(typeof can !== 'undefined') {
        var down = false;
        can.addEventListener('mousedown', function(e) {
            cursor.frame.clearSelection();
            down = true;
            var pt = makePoint(e.offsetX,e.offsetY);
            var rp = cursor.findBoxWithXY(pt, rend);
            if(rp == null) return;
            var bp = cursor.renderPathToBlockPath(rp);
            cursor.setCurrentSpot(bp);
            redraw();
        });
        can.addEventListener('mousemove', function(e) {
            if(down == true) {
                e.preventDefault();
                if(!cursor.frame.hasSelection()) {
                    var spot = cursor.getCurrentSpotCopy();
                    cursor.frame.setSelection(spot,spot);
                }

                var pt = makePoint(e.offsetX,e.offsetY);
                var rp = cursor.findBoxWithXY(pt, rend);
                var bp = cursor.renderPathToBlockPath(rp);
                cursor.frame.getSelection().end = bp;
                requestAnimationFrame(redraw);

            }
        });
        can.addEventListener('mouseup', function(e) {
            down = false;
        });
    }

    if(config.document) config.document.addEventListener('keydown', function(e) {
        var evt = keyboard.cookKeyboardEvent(e);
        processKeyEvent(evt,e);
    });

    function checkLayout() {
        if(config.frame.dirty == true) {
            relayout();
            config.frame.clearDirty();
            config.requestAnimationFrame(redraw);
        }
    }
    function processKeyEvent(evt,e) {
        if(!evt.recognized)   return;
        if(evt.meta)          return;
        if(e) e.preventDefault();

        if(evt.key) {
            var str = evt.key.toLowerCase();
            if(evt.shift) {
                str = 'shift-'+str;
            }
            if(tryAction(str)) return;
        }

        popup.visible = false;

        if(evt.control && evt.char) {
            var str = 'control-'+evt.char.toLowerCase();
            if(tryAction(str)) return;
        }

        if(evt.control && evt.char == ' ') {
            if(tryAction('control-space')) return;
        }

        if(evt.printable) {

            var frame = cursor.getCurrentFrame();
            if(frame.activeSelection) {
                cursor.removeSelection(frame.activeSelection);
                frame.activeSelection = null;
                frame.selections[0] = null;
            }
            cursor.insertChar(cursor.getCurrentSpot(), evt.char);
            cursor.moveH(+1);
            checkLayout();
        }
    };

    function getPlainText() {
        var str = "";
        cursor.frame.blocks.forEach(function(block) {
            block.spans.forEach(function(span){
                str += span.chars;
            });
        });
        return str;
    }
    return {
        relayout:relayout,
        redraw:redraw,
        cursor:cursor,
        processKeyEvent:processKeyEvent,
        getPlainText: getPlainText,
    }

}

exports.Document = Document;
