var Common = require('./common');

var RENDER_DEBUG = false;
var LINE_HIGHLIGHT_COLOR = '#eeffcc';


exports.RenderTree = {
    makeBlock: function() {
        return {
            type:'block',
            w:-1,
            h:-1,
            x:0,
            y:0,
            lines:Common.enhanceArray([]),
            style:{},
            add: function(line) {
                line.parent = this;
                this.lines.push(line);
            },
            getIndex: function() {
                return this.parent.blocks.indexOf(this);
            }
        }
    },
    makeLine: function() {
        return {
            type:'line',
            w:-1,
            h:-1,
            x:0,
            y:0,
            runs:Common.enhanceArray([]),
            len:0,
            add: function(run) {
                run.parent = this;
                this.runs.push(run);
                this.len+= run.charLength();
            },
            getIndex: function() {
                return this.parent.lines.indexOf(this);
            }
        }
    },
    makeRun: function() {
        return {
            type: 'run',
            w:-1,
            h:-1,
            x:0,
            y:0,
            style:{},
            span:null,
            spanstart:-1,
            spanend:-1,
            charLength: function() {
                return this.spanend-this.spanstart;
            },
            getIndex: function() {
                return this.parent.runs.indexOf(this);
            },
            getText: function() {
                return this.span.chars.slice(this.spanstart,this.spanend);
            }
        }
    }

}



exports.drawRenderTree = function(c,tree,currentLine,frame) {
    tree.blocks.forEach(function(block) {
        c.save();
        c.fillStyle = block.style['background-color'];
        c.fillRect(block.x,block.y,block.w,block.h);
        c.strokeStyle = block.style['border-color'];
        if(RENDER_DEBUG) {
            c.strokeStyle = 'red';
            c.strokeRect(block.x,block.y,block.w,block.h);
        }
        //c.strokeRect(block.x,block.y,block.w,block.h);
        c.translate(block.x,block.y);
        drawBlock(c,block,currentLine,frame);
        c.restore();
    })
}

function drawBlock(c,block, currentLine, frame) {
    block.lines.forEach(function(line) {
        c.save();
        drawLine(c,line, currentLine, frame);
        c.restore();
    })
}

function drawLine(c,line, currentLine, frame) {
    if(RENDER_DEBUG) {
        c.strokeStyle = "green";
        c.strokeRect(line.x+0.5,line.y+0.5,line.w,line.h);
    }
    c.translate(line.x,line.y);
    if(line == currentLine) {
        c.fillStyle = LINE_HIGHLIGHT_COLOR;
        c.fillRect(0,0,line.w,line.h);
    }
    line.runs.forEach(function(run) {
        c.save();
        //c.fillStyle = 'black';
        var font_family = 'sans-serif';
        var font_size = 20;
        var font_weight = 'normal';
        var font_style = 'normal';
        //c.font = '20px sans-serif';
        if(run.style['font-size']) {
            font_size = run.style['font-size'];
        }
        if(run.style['font-family']) {
            font_family = run.style['font-family'];
        }
        if(run.style['font-weight']) {
            font_weight = run.style['font-weight'];
        }
        if(run.style['font-style']) {
            font_style = run.style['font-style'];
        }
        var fstring = font_style + ' ' + font_weight + ' ' + font_size + 'px ' + font_family;
        c.font = fstring;
        if(c.setFont) c.setFont(font_family,font_size);



        if(frame.selections.length >0) {
            var sel = frame.selections[0];
            if(sel != null) {
                drawSelectionRun(c,sel,run);
            }
        }


        c.fillStyle = run.style.color;
        c.fillText(run.getText(),run.x,run.baseline);
        if(RENDER_DEBUG) {
            c.strokeStyle = 'blue';
            c.strokeRect(run.x+0.5+2,run.y+0.5+2,20-4,run.h-4);
        }


        c.restore();
    });
}

function fillEntireRun(c,run) {
    var sx = run.x;
    var sy = run.y;
    var text = run.span.substring(run.spanstart,run.spanend);
    var sw  = c.measureText(text).width;
    var sh = run.h;
    c.fillRect(sx,sy,sw,sh);
}
function drawSelectionRun(c,sel,run) {
    if(run.span == null) return;
    //skip anything that doesn't intersect
    c.fillStyle = sel.fill;


    var rbi = run.span.parent.getIndex();
    var sbi = sel.start.block.getIndex();
    var ebi = sel.end.block.getIndex();

    //if before the start block
    if(rbi < sbi) return;
    //if after the end block
    if(rbi > ebi) return;

    if(run.span != sel.start.span && run.span != sel.end.span) {
        var rsi = run.span.getIndex();
        var ssi = sel.start.span.getIndex();
        var esi = sel.end.span.getIndex();

        //if same block as starting
        if(rbi == sbi) {
            //before starting span
            if(rsi < ssi) return;
            //after ending span
            if(rsi > esi) return;
            //must be between the start and end spans
            fillEntireRun(c,run);
            return;
        }
        if(rbi == ebi) {
            //before starting span
            if(rsi < ssi) return;
            //if after the ending span
            if(rsi > esi) return;
            fillEntireRun(c,run);
            return;
        }

        //if between the start and end blocks
        fillEntireRun(c,run);
        return;
    }

    //if starts in this run and ends in this run
    if(run.span == sel.start.span
        && run.span == sel.end.span
        && run.spanstart <= sel.start.inset) {
        var before = run.span.substring(run.spanstart,sel.start.inset);
        var x = c.measureText(before).width;
        var middle = run.span.substring(sel.start.inset,sel.end.inset);
        var w = c.measureText(middle).width;
        c.fillRect(run.x+x, run.y, w, run.h);
        return;
    }

    //if starts in this run but ends later
    if(run.span == sel.start.span
        && run.span != sel.end.span
        && run.spanstart <= sel.start.inset) {
        //if run is before the selection really starts
        if(run.spanstart + run.charLength() < sel.start.inset) return;
        var before = run.span.substring(run.spanstart,sel.start.inset);
        var x = c.measureText(before).width;
        var runtext = run.span.substring(run.spanstart,run.spanend);
        var runw = c.measureText(runtext).width;
        var w = runw-x;
        c.fillRect(run.x+x, run.y, w, run.h);
        return;
    }
    //ends in this run but doesn't start
    if(run.span == sel.end.span
        && run.span != sel.start.span
        && run.spanstart <= sel.end.inset
        && run.spanend >= sel.end.inset) {
        var x = 0;
        var text = run.span.substring(run.spanstart, sel.end.inset);
        var w = c.measureText(text).width;
        c.fillRect(run.x+x, run.y, w, run.h);
        return;
    }


    //this run is the right span, but actually ends afterwards.
    if(run.span == sel.end.span
        && run.span != sel.start.span
        && run.spanstart+run.charLength() <= sel.end.inset) {
        var x = 0;
        var text = run.span.substring(run.spanstart,run.spanend);
        var w = c.measureText(text).width;
        c.fillRect(run.x+x, run.y, w, run.h);
        return;
    }
}
