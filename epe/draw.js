/* Emily Photo Editor For Web (EPE) */
/* Drawing */
var selectingDiv;



//Event processing
function HWMouseDown(evt)
{
    evt.preventDefault();
    with (EPE)
    {
        EPE_CloseSetting()

        if (flag == 10 || flag == 20 || flag == 30)
        {
            flag++;//Start drawing, earsing, selecting

            LastPose = HWPose(evt);

            if (flag == 31)
            {
                EPE_RemoveSelector();
            }
        }
    }
}
function HWMouseMove(evt)
{
    evt.preventDefault();

    with (EPE)
    {
        if (flag == 11)//Drawing
        {
            var p = HWPose(evt);

            if (LastPose != null)
            {
                context.beginPath();
                context.moveTo(LastPose.x, LastPose.y);
                context.lineTo(p.x, p.y);
                context.stroke();
            }

            LastPose = p;
        }
        if (flag == 21)//Erasing
        {
            var p = HWPose(evt);
            context.clearRect(p.x, p.y, 10, 10);
        }

        if (flag == 31)//Selecting
        {
            var p = HWPose(evt);

            if (selectingDiv == null)
            {
                selectingDiv = document.createElement("div");
                selectingDiv.className = "selectingDiv";
                selectingDiv.style.position = "absolute";
                selectingDiv.addEventListener('mousedown', EPE_ReSelect, false);
                drop.appendChild(selectingDiv);
                EPE_ShowInfo("Press mouse key and drag a rectangle...");
            }
            var x1 = LastPose.x;
            var x2 = p.x;
            var y1 = LastPose.y;
            var y2 = p.y;
            if (x1 > x2) { var t = x2; x2 = x1; x1 = t; }
            if (y1 > y2) { var t = y2; y2 = y1; y1 = t; }
            //make sure your mouse is out of the range of selectingDiv, so the mouseout will not happen.
            x1++; y1++;
            x2--; y2--;

            selectingDiv.style.left = x1 + "px";
            selectingDiv.style.top = y1 + "px";
            selectingDiv.style.width = x2 - x1 - 1 + "px";
            selectingDiv.style.height = y2 - y1 - 1 + "px";
        }
    }
}

function HWMouseUp(evt)
{
    evt.preventDefault();

    with (EPE)
    {
        //Stop drawing, erasing, selecting
        if (flag == 11 || flag == 21 || flag == 31) flag--;
        if (flag == 30) EPE_ExitIO();
    }
}
function HWMouseOut(evt)
{
    with (EPE)
    {
        //Stop drawing, erasing, selecting
        if (flag == 11 || flag == 21 || flag == 31) flag--;
        if (flag == 30) EPE_ExitIO();
    }
}
//Calculate the location of mouse or hand
function HWPose(evt)
{
    var x, y;
    if (HWIsTouch(evt))
    {
        var c = G2GetPose(EPE.canvas);
        x = evt.touches[0].pageX - c.x;
        y = evt.touches[0].pageY - c.y;
    }
    else
    {
        x = evt.offsetX;
        y = evt.offsetY;
    }

    return { x: x, y: y };
}
function HWIsTouch(evt)
{
    var type = evt.type;
    if (type.indexOf('touch') >= 0)
    {
        return true;
    }
    else
    {
        return false;
    }
}

//Response the buttons in the toolbar
function EPE_Pen(bnt)
{
    with (EPE)
    {
        EPE_CloseSetting();
        EPE_SetFlag(10);//Enable pen
    }
}
function EPE_Eraser(bnt)
{
    with (EPE)
    {
        EPE_CloseSetting();
        EPE_SetFlag(20);//Enable earser
    }
}
function EPE_Select(bnt)
{
    with (EPE)
    {
        EPE_CloseSetting();
        EPE_SetFlag(30);//Enable selector

        EPE_RemoveSelector();

        EPE_ShowInfo("Press mouse key and drag a rectangle...");
    }
}
function EPE_ReSelect(evt)
{
    with (EPE)
    {
        EPE_RemoveSelector();
    }
}
function EPE_RemoveSelector()
{
    with (EPE)
    {
        if (selectingDiv != null)
        {
            drop.removeChild(selectingDiv);
            selectingDiv = null;
        }
    }
}
function EPE_Clear(bnt)
{
    with (EPE)
    {
        EPE_CloseSetting();

        if (flag == 30)
        {
            context.clearRect(parseInt(selectingDiv.style.left), parseInt(selectingDiv.style.top), parseInt(selectingDiv.style.width), parseInt(selectingDiv.style.height));
            EPE_RemoveSelector();
        }
        else
        {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
}
function EPE_SelectColor(bnt)
{
    with (EPE)
    {
        if (EPE_CloseSetting()) return;

        if (colorTable != null)
        {
            if (colorTable.style.display != "none")
            {
                EPE_SetFlag(91);
                colorTable.style.display = "none";
                return;
            }
        }

        var html = new StringBuilder();
        html.append("<table class=\"ColorPicker\">");

        var cols = 1;
        for (var i = 0; i < PenColors.length; i++)
        {
            if (cols == 1)
            {
                html.append("<tr>");
            }

            if (cols == 5)
            {
                html.append("</tr>");
                cols = 1;
            }
            html.append("<td onclick=\"EPE_SetColor(this)\" style=\" background-color: " + PenColors[i] + "\"></td>");
            cols++;
        }

        html.append("</tr></table>");
        EPE_SetFlag(91);
        colorTable = Popup(colorTable, bnt, html.toString());
    }
}
function EPE_SetColor(td)
{
    with (EPE)
    {
        EPE_SetFlag(10);
        colorTable.style.display = "none";

        if (td)
        {
            var color = td.style.backgroundColor;
            context.strokeStyle = color;
            //bcolor.style.backgroundColor = color;
        }
    }
}
function EPE_PenSize(bnt)
{
    with (EPE)
    {
        if (EPE_CloseSetting()) return;

        var html = new StringBuilder();
        html.append("<table class=\"SizePicker\">");

        var cols = 1;
        for (var i = 0; i < PenSizes.length; i++)
        {
            if (cols == 1)
            {
                html.append("<tr>");
            }

            if (cols == 5)
            {
                html.append("</tr>");
                cols = 1;
            }
            html.append("<td onclick=\"EPE_SetPenSize(" + PenSizes[i] + ")\"");
            if (context.lineWidth == PenSizes[i]) html.append("style=\"background-color: #cccccc\"");
            else html.append("style=\"background-color: #eeeeee\"");
            html.append(">" + PenSizes[i] + "</td>");

            cols++;
        }

        html.append("</tr></table>");
        EPE_SetFlag(92);
        sizeTable = Popup(sizeTable, bnt, html.toString());
    }
}
function EPE_SetPenSize(size)
{
    with (EPE)
    {
        EPE_SetFlag(10);
        sizeTable.style.display = "none";

        if (size)
        {
            context.lineWidth = size;
        }
    }
}
function EPE_CloseSetting()
{
    with (EPE)
    {
        if (flag == 91 || flag == 92)
        {
            if (colorTable != null) colorTable.style.display = "none";
            if (sizeTable != null) sizeTable.style.display = "none";

            EPE_SetFlag(10);
            return true;
        }
    }
    return false;
}
function EPE_SetDrawing()
{
    with (EPE)
    {
        //Restore the setting of the canvas
        if (flag <= 11)
        {
            context.lineCap = "round";
            context.lineWidth = pensize;
            context.strokeStyle = pencolor;
        }

        if (flag == 20 || flag == 21)
        {
            context.lineCap = "round";
            context.lineWidth = pensize;
            context.strokeStyle = pencolor;
        }

        if (flag == 30 || flag == 31)
        {
            context.lineCap = "round";
            context.lineWidth = 1;
            context.strokeStyle = "red";
        }
    }
}