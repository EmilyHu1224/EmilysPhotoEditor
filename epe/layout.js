/*
 * Emily Photo Editor For Web (EPE)
 *
 * https://github.com/Emily1997/emily1997.github.io
 *
 * control the layout of page, make it like APP or Window Application.
 * auto size the elements
 * size and resize the canvas and it's container.
 */

function LayoutResize()
{
    //the margin of middle parts
    var margin = 10;

    var header = document.getElementById("toolbar");
    var left = document.getElementById("album");
    var main = document.getElementById("pad");
    var right = document.getElementById("props");
    var footer = document.getElementById("footbar");

    left.style.marginTop = margin + "px";
    left.style.marginBottom = margin + "px";
    left.style.marginLeft = margin + "px";
    left.style.marginRight= margin + "px";

    main.style.marginTop = margin + "px";
    main.style.marginBottom = margin + "px";

    right.style.marginTop = margin + "px";
    right.style.marginBottom = margin + "px";
    right.style.marginLeft = margin + "px";
    right.style.marginRight = margin + "px";

    var hBody = document.documentElement.clientHeight;
    var wBody = document.documentElement.clientWidth;

    var hMain = hBody - GetEleHeight(header) - GetEleHeight(footer) - 2 * (margin ) + "px";
    var wMain = wBody - GetEleWidth(left) - GetEleWidth(right) - 4 * (margin ) + "px";

    left.style.height = hMain;
    right.style.height = hMain;
    main.style.height = hMain;
    main.style.width = wMain;
}
function GetEleHeight(e)
{
    var h = e.offsetHeight;
    //if (e.style.marginTop) h += parseInt(e.style.marginTop.replace("px", ""));
    //if (e.style.marginBottom) h += parseInt(e.style.marginBottom.replace("px", ""));

    return h;
}
function GetEleWidth(e)
{
    var w = e.offsetWidth;
    //if (e.style.marginLeft) w += parseInt(e.style.marginLeft.replace("px", ""));
    //if (e.style.marginRight) w += parseInt(e.style.marginRight.replace("px", ""));

    return w;
}

//Adjust the default size of canvas (make it has the same size of middle part)
function SizeCanvas()
{
    with (EPE)
    {
       //Resize the Canvas (because it does not support style)
        drop.style.width = pad.style.width;
        drop.style.height = pad.style.height;
        canvas.width = pad.clientWidth - 0;
        canvas.height = pad.clientHeight - 0;

        EPE_SetDrawing();
    }
}

//set the size of canvas as specified size (the size of dropped image)
//the pad's size will not be changed
function ResizeCanvas(width, height)
{
    with (EPE)
    {
        drop.style.width = width + "px";
        drop.style.height = height + "px";

        canvas.width = width;
        canvas.height = height;
    }
}

//Listen the window event to size or resize the page
window.addEventListener('load', LayoutResize, false);
window.addEventListener('resize', LayoutResize, false);

