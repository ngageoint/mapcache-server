function cookKeyboardEvent(e) {
    //console.log(e);


    var KEYS = {
        BACK_DELETE:"BACK_DELETE",
        RIGHT:"RIGHT",
        LEFT:"LEFT",
        DOWN:'DOWN',
        UP:'UP',
        ENTER:'ENTER',
        BACK_DELETE:'BACK_DELETE',
        FORWARD_DELETE:'FORWARD_DELETE',
    }

    var codes_to_keys = {
        39:'RIGHT',
        37:'LEFT',
        40:'DOWN',
        38:'UP',
        8:'BACK_DELETE',
        46:'FORWARD_DELETE',
        13:'ENTER',
    }


    if(codes_to_keys[e.keyCode]) {
        return {
            recognized:true,
            KEYS:KEYS,
            key: codes_to_keys[e.keyCode],
            printable:false,
            control:e.ctrlKey,
            shift:e.shiftKey,
            meta: e.metaKey,
        }
    }


    //American keyboard
    var shift_map = { };
    function insertMap(map, start, len, str) {
        for(var i=0; i<len; i++) {
            map[start+i] = str[i];
        }
    }
    insertMap(shift_map, 48,10, ')!@#$%^&*(');

    var codes_to_chars = {  32:' ', }
    function addKeysWithShift(start, str) {
        if(str.length % 2 != 0) throw new Error("not an even number of chars");
        for(var i=0; i<str.length/2; i++) {
            codes_to_chars[start+i] = str[i*2+0];
            shift_map[start+i] = str[i*2+1];
        }
    }
    addKeysWithShift(186,';:=+,<-_.>/?`~');
    addKeysWithShift(219,'[{\\|]}\'"');
    addKeysWithShift(48,'0)1!2@3#4$5%6^7&8*9(');
    // /console.log("keycode = ", e.keyCode);

    if(codes_to_chars[e.keyCode]) {
        var char = codes_to_chars[e.keyCode];
        if(e.shiftKey && shift_map[e.keyCode]) {
            char = shift_map[e.keyCode];
        }
        return {
            recognized:true,
            KEYS:KEYS,
            printable:true,
            char: char,
            control:e.ctrlKey,
            shift:e.shiftKey,
            meta: e.metaKey,
        }
    }

    //alphabet
    if(e.keyCode >= 65 && e.keyCode <= 90) {
        var char = String.fromCharCode(e.keyCode);
        if(e.shiftKey) {
            char = char.toUpperCase();
        } else {
            char = char.toLowerCase();
        }
        return {
            recognized:true,
            KEYS:KEYS,
            printable:true,
            char: char,
            control:e.ctrlKey,
            shift:e.shiftKey,
            meta: e.metaKey,
        }
    }
    return {
        recognized:false,
    }
}


exports.cookKeyboardEvent = cookKeyboardEvent;
