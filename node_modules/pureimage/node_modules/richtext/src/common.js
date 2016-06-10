exports.DEFAULT_STYLE = {
    'color':'#000000',
    'font':'20px sans-serif',
    'font-family':'monospace',
    'font-size':20,
    'font-weight':'normal',
    'font-style':'normal',
    'line-height':20,
    'block-padding':5,
    'background-color':'#ffffff',
    'border-color':'#ff0000',
}

exports.enhanceArray = function(arr) {
    arr.find = function(cond) {
        for(var i=0; i<this.length; i++) {
            var item = this[i];
            var found = cond(item);
            if(found == true) {
                return item;
            }
        }
        return null;
    }
    arr.first = function() {
        return this[0];
    }
    arr.last = function() {
        return this[this.length-1];
    }
    return arr;
}


function printDocInset(tab) {
    return function(node) {
        exports.printDoc(node,tab+'  ');
    }
}

exports.printDoc = function(root,tab) {
    if(!tab) tab = "";
    console.log(tab+root.type + " " + root.len + " :" + root.stylename);
    if(root.type == 'block') root.spans.forEach(printDocInset(tab));
    if(root.type == 'frame') root.blocks.forEach(printDocInset(tab));
    if(root.type == 'span') {
        console.log(tab + "    " + root.chars);
    }
}

function printRenderInset(tab) {
    return function(node) {
        exports.printRender(node,tab+'  ');
    }
}

exports.printRender = function(root,tab) {
    if(!tab) tab = "";
    //console.log(tab+root.type);
    if(root.type == 'block') {
        console.log(tab+'    '+root.type+' '+root.x+','+root.y,root.w+'x'+root.h,' len=',root.len);
        root.lines.forEach(printRenderInset(tab));
    }
    if(root.type == 'run') {
        console.log(tab+'    '+root.type+' '+root.x+','+root.y,root.w+'x'+root.h,' len=',root.len, root.chars.join(""));
    }
    if(root.type == 'rendertree') root.blocks.forEach(printRenderInset(tab));
    if(root.type == 'line') {
        console.log(tab+'    '+root.type+' '+root.x+','+root.y,root.w+'x'+root.h,' len=',root.len);
        root.runs.forEach(printRenderInset(tab));
    }

}
