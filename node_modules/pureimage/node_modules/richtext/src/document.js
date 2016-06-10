var common = require("./common");
var Document = {
    makeFrame: function() {
        return {
            type:'frame',
            blocks:common.enhanceArray([]),
            selections:[],
            activeSelection: null,
            style: common.DEFAULT_STYLE,
            len: 0,
            dirty:true,
            markDirty: function() {
                this.dirty = true;
            },
            clearDirty: function() {
                this.dirty = false;
            },
            insertBlock: function(text) {
                var block = Document.makeBlock(text);
                block.parent = this;
                this.blocks.push(block);
                this.len += block.len;
                this.markDirty();
                return block;
            },
            insertBlockAt: function(n,block) {
                block.parent = this;
                this.blocks.splice(n,0,block);
                this.len += block.len;
                this.markDirty();
                return block;
            },
            removeBlock: function(block) {
                if(!block) throw new Error("invalid block")
                if(block.spans.length != 0) throw new Error("Block with remaining children!");
                if(block.len != 0) throw new Error("Block with non-zero len!");
                var n = this.blocks.indexOf(block);
                this.blocks.splice(n,1);
                this.markDirty();
                return block;
            },
            getSelection: function() {
                return this.activeSelection;
            },
            setSelection: function(start,end) {
                this.activeSelection = {
                    fill:"#eeff00",
                    start:start,
                    end:end,
                }
                this.selections[0] = this.activeSelection;
            },
            hasSelection: function() {
                return this.activeSelection != null;
            },
            clearSelection: function() {
                this.activeSelection = null;
                this.selections = [];
            }
        }
    },
    makeBlock: function(text) {
        var block = {
            type:"block",
            style:{},
            spans:common.enhanceArray([]),
            len: 0,
            insertSpan: function(text) {
                var span = Document.makeSpan(text);
                span.parent = this;
                this.spans.push(span);
                this.len += span.len;
                if(this.parent) this.parent.len += span.len;
                return span;
            },
            insertSpanAt: function(n, text) {
                var span = Document.makeSpan(text);
                span.parent = this;
                this.spans.splice(n,0,span);
                this.len += span.len;
                if(this.parent) this.parent.len += span.len;
                return span;
            },
            removeSpan: function(span) {
                var n = this.spans.indexOf(span);
                this.spans.splice(n,1);
                this.len -= span.len;
                this.parent.len -= span.len;
                return span;
            },
            appendSpan: function(span) {
                span.parent = this;
                this.spans.push(span);
                this.len += span.len;
                if(this.parent) this.parent.len += span.len;
                return span;
            },
            getIndex: function() {
                return this.parent.blocks.indexOf(this);
            },
            prev: function() {
                return this.parent.blocks[this.getIndex()-1];
            },
            next: function() {
                return this.parent.blocks[this.getIndex()+1];
            },
            clearSpans: function() {
                while(this.spans.length > 0) {
                    this.removeSpan(this.spans[0]);
                }
            }
        }
        if(text) {
            block.insertSpan(text);
        }
        return block;
    },
    makeSpan: function(text) {
        return {
            type:"span",
            chars:text,
            len: text.length,
            style:{},
            insertChar: function(n,ch) {
                this.chars = this.chars.substring(0,n) + ch + this.chars.substring(n);
                this.len = this.chars.length;
                this.parent.len++;
                this.parent.parent.len++;
                this.parent.parent.markDirty();
            },
            setString: function(str) {
                var oldlen = this.chars.length;
                var newlen = str.length;
                var diff = newlen-oldlen;
                this.chars = str;
                this.len+=diff;
                this.parent.len+=diff;
                this.parent.parent.markDirty();
                this.parent.parent.len+=diff;
            },
            getIndex: function() {
                return this.parent.spans.indexOf(this);
            },
            substring: function(a,b) {
                return this.chars.substring(a,b);
            },
            prev: function() {
                return this.parent.spans[this.getIndex()-1];
            },
            next: function() {
                return this.parent.spans[this.getIndex()+1];
            },
        }
    }
}

exports.Document = Document;
