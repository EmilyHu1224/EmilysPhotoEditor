function LayoutResize()
{
    var margin = 10;

    var header = document.getElementById("c_toolbar");
    var left = document.getElementById("album");
    var main = document.getElementById("pad");
    var right = document.getElementById("props");
    var footer = document.getElementById("c_footbar");

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

window.addEventListener('load', LayoutResize, false);
window.addEventListener('resize', LayoutResize, false);

