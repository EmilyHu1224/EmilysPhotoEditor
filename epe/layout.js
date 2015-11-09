/*
 * Emily Photo Editor For Web (EPE)
 *
 * https://github.com/Emily1997/emily1997.github.io
 *
 * control the layout of page, make it like APP or Window Application.
 * auto size the elements
 * size and resize the canvas and it's container.
 */

//the margin of middle parts (don't set any margin in the css!)
var canvas_margin = 10;

//the border size of canvas (canvas holder)
var canvas_border = 3;

var album_width = 120;
var props_width =120;

function LayoutResize()
{
    var header = document.getElementById("toolbar");
    var left = document.getElementById("album");
    var main = document.getElementById("pad");
    var right = document.getElementById("props");
    var footer = document.getElementById("footbar");

    left.style.width = album_width + "px";
    right.style.width = props_width + "px";

    //left.style.margin = canvas_margin + "px";
    main.style.margin = canvas_margin + "px";
    main.style.margin = canvas_margin + "px";
    //right.style.margin = canvas_margin + "px";

    drop = document.getElementById("drop");
    drop.style.borderWidth = canvas_border + "px";


    var hBody = document.documentElement.clientHeight;
    var wBody = document.documentElement.clientWidth;

    var hMain = hBody - GetEleHeight(header) - GetEleHeight(footer) - 2 * (canvas_margin) + "px";
    var wMain = wBody - GetEleWidth(left) - GetEleWidth(right) - 2 * (canvas_margin) + "px";

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
        var w = parseInt(pad.style.width) - canvas_border * 2;
        var h = parseInt(pad.style.height) - canvas_border * 2;

        ResizeCanvas(w, h);


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

function ResizeCanvasWithData(x, y, width, height)
{
    with (EPE)
    {
        var img = new Image();
        img.src = canvas.toDataURL();

        ResizeCanvas(width, height);

        context.drawImage(img, x, y);
    }
}

//Listen the window event to size or resize the page
window.addEventListener('load', LayoutResize, false);
window.addEventListener('resize', LayoutResize, false);

