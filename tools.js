
//Utility functions
function IsEmptyOrNull(obj)
{
    return typeof (obj) === "undefined" || obj === null || obj === "";
}
function ValidObj(obj)
{
    if (obj == null) return false;
    if (typeof (obj) === "undefined") return false;
    return true;
}

//var html=new StringBuilder(); html.append("...");
function StringBuilder()
{
    this.stringArray = new Array();
}
StringBuilder.prototype.len = function ()
{
    return this.stringArray.length;
};

StringBuilder.prototype.append = function ()
{
    var str = null;
    if (arguments.length <= 0) str = "";
    if (arguments.length == 1) str = arguments[0];
    if (arguments.length > 1)
    {
        for (var i = 1; i < arguments.length; i++)
        {
            str = str.replace("{" + (i - 1) + "}", arguments[i]);
        }
    }
    this.stringArray.push(str);
};

StringBuilder.prototype.toString = function ()
{
    return this.stringArray.join("");
};

StringBuilder.prototype.join = function (sep)
{
    return this.stringArray.join(sep);
};

function G2FormatStringArg(args)
{

    return str;
}

//get absolute position
function getCoordinates(c)
{
    var coordinates = { x: 0, y: 0 };
    while (c)
    {
        try
        {
            coordinates.x += c.offsetLeft;
            coordinates.y += c.offsetTop;
            c = c.offsetParent;
        }
        catch (e)
        {
            break;
        }
    }
    return coordinates;
}
//get scroll position
function getScrollPose(c)
{
    var pose = { x: 0, y: 0 };
    while (c)
    {
        if (c.tagName.toUpperCase() == "BODY") break;
        pose.x += c.scrollLeft;
        pose.y += c.scrollTop;
        c = c.parentElement;   
    }
    return pose;
}


function ShowDiv(div, cfire, html, css, w, h, hh)
{
   
    var x = 0;
    var y = 0;

    if (cfire != null)
    {
        var c = getCoordinates(cfire);
        var s = getScrollPose(cfire);
        x = c.x - s.x;
        y = c.y - s.y;

       
        if (typeof (hh) != "undefined") y = y + hh;

       
        if (typeof (w) != "undefined")
        {
            if ((x + w) > document.body.clientWidth) x = x - w;
        }

      
        if (cfire.style != null && cfire.style.display == "none")
        {
            x = 0;
            y = 0;
        }
    }

    return ShowPopup(div, html, css, x, y, w, h);
}



var zIndexShowPopup = 999;
function ShowPopup(div, html, css, x, y, w, h)
{

    if (html)
    {
        if (ValidObj(div) == false)
        {            
            div = document.createElement("div");            
            document.body.appendChild(div);
            div.style.position = "absolute";
            div.style.zIndex = zIndexShowPopup;
            zIndexShowPopup = zIndexShowPopup + 1;
        }

        div.innerHTML = html;
    }

    if (w == 0)
    {
        if ((x + div.clientWidth) > document.body.clientWidth) x = x - div.clientWidth;
    }

    if (IsEmptyOrNull(css) == false) div.className = css;
    if (typeof (x) != "undefined" && x >= 0) div.style.left = x + "px";
    if (typeof (y) != "undefined" && y >= 0) div.style.top = y + "px";
    if (typeof (w) != "undefined" && w != 0) div.style.width = w + "px";
    if (typeof (h) != "undefined" && h != 0) div.style.height = h + "px";


    div.style.display = "";

    return div;
}
