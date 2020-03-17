console.log('CHOPIN IS ONLINE');
function grabArtboardDimensions() {
    var collection = app.activeDocument.artboards;
    var board = collection[collection.getActiveArtboardIndex()];
    return JSON.stringify(board.artboardRect);
}
function createSimpleRect(data) {
    data = JSON.parse(data);
    var layer = app.activeDocument.activeLayer;
    var rect = layer.pathItems.rectangle(data.rect.top, data.rect.left, data.rect.width, data.rect.height);
    rect.name = data.name;
    rect.filled = true;
    rect.stroked = false;
    rect.fillColor = addColor(data.color);
}
function addColor(args) {
    var color = new RGBColor();
    color.red = args[0];
    color.green = args[1];
    color.blue = args[2];
    return color;
}
function deleteRectByName(name) {
    var layer = app.activeDocument.activeLayer;
    layer.pathItems.getByName(name).remove();
}
function clearAll() {
    var layer = app.activeDocument.activeLayer;
    for (var i = layer.pageItems.length - 1; i >= 0; i--)
        layer.pathItems[i].remove();
}
