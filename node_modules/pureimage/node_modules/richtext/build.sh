rm -rf build/canvas/bundle.js

browserify \
    -d \
    --verbose \
    -r ./src/document.js:rt-document \
    -r ./src/component.js:rt-component \
    -r ./src/cursor.js:rt-cursor \
    -r ./src/common.js:rt-common \
    -r ./src/layout.js:rt-layout \
    -r ./src/render.js:rt-render \
    -r ./src/keyboard.js:rt-keyboard \
    -o bundle.js
echo "built!"
