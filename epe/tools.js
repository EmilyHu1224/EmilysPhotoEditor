﻿
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


//Get browser's type
function GetExploreType()
{
    var userAgent = navigator.userAgent;
    var rMsie = /(msie\s|trident.*rv:)([\w.]+)/;
    var rFirefox = /(firefox)\/([\w.]+)/;
    var rOpera = /(opera).+version\/([\w.]+)/;
    var rChrome = /(chrome)\/([\w.]+)/;
    var rSafari = /version\/([\w.]+).*(safari)/;
    var ua = userAgent.toLowerCase();

    var match = rMsie.exec(ua);
    if (match != null)
    {
        return { browser: "IE", version: match[2] || "0" };
    }

    match = rFirefox.exec(ua);
    if (match != null)
    {
        return { browser: "Firefox", version: match[2] || "0" };
    }

    match = rOpera.exec(ua);
    if (match != null)
    {
        return { browser: "Opera", version: match[2] || "0" };
    }

    match = rChrome.exec(ua);
    if (match != null)
    {
        return { browser: "Chrome", version: match[2] || "0" };
    }

    match = rSafari.exec(ua);
    if (match != null)
    {
        return { browser: "Safari", version: match[1] || "0" };
    }

    return null;
}


function EnumProp(obj)
{
    var str = "";
    for (var p in obj)
    {
        try
        {
            if (typeof (obj[p]) == "function")
            {
                //str += (p + ":" + typeof (obj[p]) + "\r\n");
            }
            else
            {
                var c = p + ":" + typeof (obj[p]) + "=" + obj[p];

                try
                {
                    if (c.length > 100) c = c.substr(0, 100);
                }
                catch (e)
                {
                }

                str += (c + "\r\n");
            }
        }
        catch (e)
        {
        }

    }
    //return str;
    alert(str);
}