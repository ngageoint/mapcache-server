var common = require('./common');
var Document = require('./document').Document;

// make a new block path at the first character of the document
function makeBlockPath(frame) {
}


function Cursor(frame,rendertree) {
    this.frame = frame;
    this.rendertree = rendertree;
    this.bias = "left";

    this.currentSpot = {
        frame: this.frame,
        block: this.frame.blocks[0],
        span:  this.frame.blocks[0].spans[0],
        inset: 0,
    }

    this.getCurrentFrame = function() {
        return this.frame;
    }

    this.getCurrentSpot = function() {
        return this.currentSpot;
    }
    this.getCurrentSpotCopy = function() {
        return {
            frame: this.currentSpot.frame,
            block: this.currentSpot.block,
            span: this.currentSpot.span,
            inset: this.currentSpot.inset,
        }
    }

    this.setCurrentSpot = function(spot) {
        this.currentSpot = spot;
    }

    this.setCurrentSpotAbsolute = function(blockindex,spanindex,inset) {
        this.setCurrentSpot({
            frame: this.frame,
            block: this.frame.blocks[blockindex],
            span:  this.frame.blocks[blockindex].spans[spanindex],
            inset: inset,
        });
    }

    this.setBias = function(bias) {
        this.bias = bias;
    }

    this.findBoxWithXY = function(pt, renderTree) {
        for(var i=0; i<renderTree.blocks.length; i++) {
            var block = renderTree.blocks[i];
            var pt2 = pt.minus(block);
            for(var j=0; j<block.lines.length; j++) {
                var line = block.lines[j];
                var pt3 = pt2.minus(line);
                for(var k=0; k<line.runs.length; k++) {
                    var run = line.runs[k];
                    if(pt3.inside(run)) {
                        var len = 0;
                        var str = run.getText();
                        for(var c = 0; c<str.length; c++) {
                            var ch = str[c];
                            var w =  run.fctx.charWidth(ch,
                                run.style['font-size'],
                                run.style['font-family'],
                                run.style['font-weight'],
                                run.style['font-style']
                            )
                            if(len+w+run.x >= pt3.x) {
                                return {
                                    rendertree: renderTree,
                                    box: block,
                                    boxindex:i,
                                    line:line,
                                    lineindex:j,
                                    run:run,
                                    runindex:k,
                                    inset:c,
                                }
                            }
                            len+=w;
                        }

                    }
                }
            }
        }
        return null;
    }

    this.renderPathToBlockPath = function(rp) {
        if(rp.run.span == null) throw new Error("null span passed to renderPathToBlockPath");
        return {
            frame: this.frame,
            block: rp.box.block,
            span:  rp.run.span,
            inset: rp.inset+rp.run.spanstart,
        }
    }


    this.moveH = function(off) {
        var p = this.getCurrentSpot();
        p.inset+=off;
        //if past start of span
        if(p.inset < 0) {
            //if first span in the block
            if(p.span == p.block.spans.first()) {
                //if still right bias, just switch left and return
                if(this.bias == 'right') {
                    this.setBias('left');
                    p.inset = 0;
                    return;
                }
                //if first block in the frame
                if(p.block == p.frame.blocks.first()) {
                    p.inset = 0;
                    return;
                } else {
                    this.setBias('right');
                    p.block = p.block.prev();
                    p.span = p.block.spans.last();
                }
            } else {
                p.span = p.span.prev();
            }
            p.inset = p.span.chars.length-1;
            return;
        }
        if(p.inset >= p.span.chars.length) {
            //if past last span of block
            if(p.span == p.block.spans.last()) {

                //if need to go to next block but still left bias.
                if(p.inset == p.span.chars.length && this.bias == 'left') {
                    this.setBias('right');
                    return;
                }

                //go to next block
                if(p.block == p.frame.blocks.last()) {
                    //end of the frame
                    p.inset = p.span.chars.length-1;
                } else {
                    this.setBias('left');
                    p.block = p.block.next();
                    p.span = p.block.spans.first();
                    p.inset = 0;
                }
            } else {
                p.span = p.span.next();
                p.inset = 0;
            }
        }
    }

    this.moveV = function(off) {
        var rp = this.blockPathToRenderPath(this.getCurrentSpot(),this.rendertree);

        var charinset = 0;
        for(var i=0; i<rp.runindex; i++) {
            charinset += rp.line.runs[i].charLength();
        }
        charinset += rp.inset;

        rp.lineindex += off;

        //going to previous block
        if(rp.lineindex < 0) {
            rp.boxindex--;
            if(rp.boxindex <0) {
                rp.boxindex = 0;
                rp.lineindex = 0;
                rp.box = rp.rendertree.blocks[rp.boxindex];
            } else {
                rp.box = rp.rendertree.blocks[rp.boxindex];
                rp.lineindex = rp.box.lines.length-1;
            }
        }

        //going to next block
        if(rp.lineindex >= rp.box.lines.length) {
            rp.boxindex++;
            if(rp.boxindex >= rp.rendertree.blocks.length) {
                rp.boxindex = rp.rendertree.blocks.length-1;
            }
            rp.box = rp.rendertree.blocks[rp.boxindex];
            rp.lineindex = 0;
        }
        rp.line = rp.box.lines[rp.lineindex];

        //chop if too far right for the new line
        if(charinset >= rp.line.len) {
            charinset = rp.line.len;
        }

        for(var i=0; i<rp.line.runs.length; i++) {
            var run = rp.line.runs[i];
            rp.runindex = i;
            rp.run = run;
            if(charinset < run.charLength()) break;
            charinset -= run.charLength();
        }
        rp.inset = charinset;
        this.setCurrentSpot(this.renderPathToBlockPath(rp));
    }

    this.blockPathToRenderPath = function(path, tree) {
        if(!tree) throw new Error("tree is null!");
        var box = tree.blocks.find(function(box) { return box.block == path.block});

        var count = 0;
        for(var i=0; i<path.block.spans.length; i++) {
            if(path.block.spans[i] == path.span) {
                count += path.inset;
                break;
            }
            count += path.block.spans[i].len;
        }
        var line;
        for(var i=0; i<box.lines.length; i++) {
            line = box.lines[i];
            if(line.len >= count) {
                break;
            }
            count -= line.len;
        }


        var run;
        //for each run, subtract the length of the run from the inset
        //until it won't fit anymore
        for(var i=0; i<line.runs.length; i++) {
            run = line.runs[i];
            if(run.charLength() >= count) {
                break;
            }
            count -= run.charLength();
        }

        return {
            rendertree: tree,
            box:box,
            boxindex:  box.getIndex(),
            line:line,
            lineindex: line.getIndex(),
            run: run,
            runindex:  run.getIndex(),
            inset:count,
        }
    }


    this.renderPathToXY = function(path) {
        var str = path.run.span.chars.slice(path.run.spanstart,path.run.spanstart+path.inset);
        function measure(str) {
            return path.run.fctx.charWidth(str,
                path.run.style['font-size'],
                path.run.style['font-family'],
                path.run.style['font-weight'],
                path.run.style['font-style']
            );
        }
        var strw = measure(str);
        var chn = path.run.spanstart+path.inset;
        var chc = path.run.span.chars.slice(chn,chn+1);
        var chw = measure(chc);
        if(this.bias == 'right') {
            strw += chw;
        }
        return {
            x: path.box.x + path.line.x + path.run.x + strw,
            y: path.box.y + path.line.y + path.run.y ,
        }
    }


    function removeCharFromSpan(span,inset) {
        span.setString(span.substring(0,inset)
            +span.substring(inset+1));
    }

    function deleteForward(bp,cursor) {
        //if last char in the span
        if(bp.inset == bp.span.len) {
            //if last span in the block
            if(bp.span == bp.block.spans.last()) {
                //merge the two blocks.
                var block1 = bp.block;
                var block2 = bp.block.next();
                var tomove = block2.spans.slice();
                tomove.forEach(function(span){
                    block2.removeSpan(span);
                    block1.appendSpan(span);
                });
                bp.frame.removeBlock(block2);
            } else {
                //just go to the next span
                bp.span = bp.span.next();
                bp.inset = 0;
            }
        }
        if(cursor.bias == 'left') {
            removeCharFromSpan(bp.span,bp.inset);
        } else {
            removeCharFromSpan(bp.span,bp.inset+1);
        }
    }

    function deleteBackward(bp,cursor) {
        //if first char in the span
        if(bp.inset == 0 && cursor.bias == 'left') {
            //if first span in the block
            if(bp.span == bp.block.spans.first()) {
                //if first block, do nothing
                if(bp.block == bp.frame.blocks.first()) return;

                //merge the two blocks
                var block1 = bp.block;
                var block2 = block1.prev();
                var lastspan = block2.spans.last();
                var tomove = block1.spans.slice();
                tomove.forEach(function(span){
                    block1.removeSpan(span);
                    block2.appendSpan(span);
                });
                bp.frame.removeBlock(block1);
                bp.block = block2;
                bp.span = lastspan;
                bp.inset = lastspan.len;
                return;
            } else {
                bp.span = bp.span.prev();
                bp.inset = bp.span.len-1;
                removeCharFromSpan(bp.span,bp.inset);
                return;
            }
        }
        if(cursor.bias == 'left') {
            removeCharFromSpan(bp.span,bp.inset-1);
        } else {
            removeCharFromSpan(bp.span,bp.inset);
        }
        cursor.moveH(-1);
    }

    this.removeChar = function(ti,dir) {
        var bp = this.getCurrentSpot();
        if(dir == +1)  deleteForward(bp,this);
        if(dir == -1) deleteBackward(bp,this);
    }

    this.removeSelection = function(sel) {
        //selection within a single span
        if(sel.start.span == sel.end.span) {
            var span = sel.start.span;
            span.setString(
                span.substring(0,sel.start.inset) +
                span.substring(sel.end.inset)
                );
            this.setCurrentSpot(sel.start);
            return;
        }
        //selection within a single block, but multiple spans
        if(sel.start.block == sel.end.block) {
            //trim to the part before the selection
            sel.start.span.setString(sel.start.span.substring(0,sel.start.inset));
            //trim to the part after the selection
            sel.end.span.setString(sel.end.span.substring(sel.end.inset));
            //remove blocks inbetween
            var toremove = sel.start.block.spans.slice(
                    sel.start.span.getIndex()+1,
                    sel.end.span.getIndex());
            toremove.forEach(function(span) {
                span.parent.removeSpan(span);
            })
            this.setCurrentSpot(sel.start);
            return;
        }

        //selection across multiple blocks
        //trim start block
        sel.start.span.setString(sel.start.span.substring(0,sel.start.inset));
        //remove the rest of the spans after

        //remove any blocks in the middle
        var todelete = this.frame.blocks.slice(
            sel.start.block.getIndex()+1,
            sel.end.block.getIndex());
        todelete.forEach(function(block) {
            block.clearSpans();
            block.parent.removeBlock(block);
        });

        //trim end block
        sel.end.span.setString(sel.end.span.substring(sel.end.inset));

        //merge blocks
        var tomove = sel.end.block.spans.slice();
        tomove.forEach(function(span) {
            sel.end.block.removeSpan(span);
            sel.start.block.appendSpan(span);
        })
        this.frame.removeBlock(sel.end.block);
        this.setCurrentSpot(sel.start);
        this.clearSelection();
    }

    this.clearSelection = function() {
        this.frame.clearSelection();
    }

    this.splitSpanWithInset = function(span,inset) {
        var n = span.getIndex();
        var before = span.substring(0,inset);
        var after = span.substring(inset);
        var block = span.parent;
        block.removeSpan(span);
        var spans = [];
        spans[0] = block.insertSpanAt(n+0,before);
        spans[1] = block.insertSpanAt(n+1,after);
        spans[0].stylename = span.stylename;
        spans[1].stylename = span.stylename;
        return spans;
    }

    this.splitSpanWithSelection = function(span,sel) {
        var before = span.substring(0,sel.start.inset);
        var middle = span.substring(sel.start.inset, sel.end.inset);
        var after = span.substring(sel.end.inset);
        //remove the original span
        var n = sel.start.span.getIndex();
        sel.start.block.removeSpan(sel.start.span);
        //insert the new spans

        var spans = [];
        spans[0] = sel.start.block.insertSpanAt(n+0,before);
        spans[1] = sel.start.block.insertSpanAt(n+1,middle);
        spans[2] = sel.start.block.insertSpanAt(n+2,after);
        spans[0].stylename = span.stylename;
        spans[1].stylename = span.stylename;
        return spans;
    }

    //split the block at the current spot
    this.splitBlock = function() {
        var bp = this.getCurrentSpotCopy();
        var n = bp.span.getIndex();
        var splitpoint = bp.inset;
        if(this.bias == 'right') {
            splitpoint = bp.inset+1;
        }
        //split the target span
        var spans = this.splitSpanWithInset(bp.span,splitpoint);
        //leave span 0 in place
        //move span 1 to the next block

        // make a new block with the second part of the span
        var block2 = Document.makeBlock();
        block2.stylename = bp.block.stylename;

        //insert the new block in the frame
        bp.frame.insertBlockAt(bp.block.getIndex()+1,block2);

        //move the rest of the spans to the new block
        var tomove = bp.block.spans.slice(n+1);
        tomove.forEach(function(span) {
            bp.block.removeSpan(span);
            block2.appendSpan(span);
        });

        this.setCurrentSpotAbsolute(block2.getIndex(),0,0);
        this.setBias('left');
    }
    this.insertChar = function(blockpath,char) {
        if(this.bias == 'left') {
            blockpath.span.insertChar(blockpath.inset, char);
        } else {
            blockpath.span.insertChar(blockpath.inset+1,char);
        }
    }


}

exports.Cursor = Cursor;
