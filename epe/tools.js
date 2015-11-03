
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

var zIndexShowPopup = 999;
function Popup(div, cfire, html)
{
    var x = 0;
    var y = 0;

    if (cfire != null)
    {
        var c = getCoordinates(cfire);
        var s = getScrollPose(cfire);
        x = c.x - s.x;
        y = c.y - s.y + cfire.clientHeight;
    }

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

    if ((x + div.clientWidth) > document.body.clientWidth) x = x - div.clientWidth;

    div.style.left = x + "px";
    div.style.top = y + "px";

    div.style.display = "";

    return div;
}
