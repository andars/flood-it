function toCanvasCoordinates(canvas, e) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}
function getColor(code) {
    switch (code) {
        case 0: return "red";
        case 1: return "yellow";
        case 2: return "cyan";
        case 3: return "green";
        case 4: return "blue";
        case 5: return "orange";
        case 6: return "purple";
        default: return "black";
    }
}
