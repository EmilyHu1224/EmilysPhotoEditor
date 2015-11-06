var startevt;

function EPE_DragStart(evt)
{
    startevt = evt;
    evt.dataTransfer.setData("Text", evt.target.id);
}
function EPE_Drop(evt)
{
    evt.preventDefault();
    var id = evt.dataTransfer.getData("Text");
    if (id.indexOf("props") == 0)
    {
        //Add props
        var prop = document.getElementById(id);

        var img = new Image();
        img.id = "selected_" + id;//Set up a new id to identify
        img.src = prop.src;
        img.style.position = "absolute";

        img.style.left = evt.layerX + "px";
        img.style.top = evt.layerY + "px";

        img.title = "Click or drag to the canvas to decorate your photo.\r\nDrag to props to remove.";
        img.draggable = true;
        img.addEventListener('dragstart', EPE_DragStart, false);
        img.addEventListener('mousewheel', EPE_MouseWheelProp, false);
        img.addEventListener('wheel', EPE_MouseWheelProp, false);

        drop.appendChild(img);
    }
    else
    {
        if (id.indexOf("selected_") == 0)
        {
            //move selected props
            var img = document.getElementById(id);

            var x1 = startevt.layerX;
            var x2 = evt.layerX;
            var y1 = startevt.layerY;
            var y2 = evt.layerY;
            img.style.left = parseInt(img.style.left) + x2 - x1 + "px";
            img.style.top = parseInt(img.style.top) + y2 - y1 + "px";

            //img.style.left = evt.layerX + "px";
            //img.style.top = evt.layerY + "px";
        }
        else
        {
            //Add photo
            EPE_EditPhoto(document.getElementById(id));
        }
    }
}
function EPE_DropOut(evt)
{
    evt.preventDefault();
    var id = evt.dataTransfer.getData("Text");
    var img = document.getElementById(id);
    img.parentElement.removeChild(img);
}
function EPE_AllowDrop(evt)
{
    evt.preventDefault();
}