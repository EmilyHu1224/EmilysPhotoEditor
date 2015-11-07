/*
 * Emily Photo Editor For Web (EPE)
 *
 * https://github.com/Emily1997/emily1997.github.io
 *
 * Process the mouse events
 * Drawing, erasing, selecting
 * Set pen's size or color
*/


//Mouse event responsing
function EPE_MouseDown(evt)
{
    evt.preventDefault();
    with (EPE)
    {
        if (flag == 10 || flag == 20 || flag == 30)
        {
            //Start drawing, earsing, selecting
            EPE_SetFlag(flag + 1);

            LastPose = EPE_Pose(evt);

            if (flag == 31)
            {
                EPE_RemoveSelector();
            }
        }
    }
}
function EPE_MouseMove(evt)
{
    evt.preventDefault();

    with (EPE)
    {
        if (flag == 11)//Drawing
        {
            var p = EPE_Pose(evt);

            if (LastPose != null)
            {
                context.beginPath();
                context.moveTo(LastPose.x, LastPose.y);
                context.lineTo(p.x, p.y);
                context.stroke();
            }

            LastPose = p;

            blank = false;
        }
        if (flag == 21)//Erasing
        {
            var p = EPE_Pose(evt);
            context.clearRect(p.x, p.y, 10, 10);
        }

        if (flag == 31)//Selecting
        {
            var p = EPE_Pose(evt);

            if (SelectedArea == null)
            {
                SelectedArea = document.createElement("div");
                SelectedArea.className = "SelectedArea";
                SelectedArea.style.position = "absolute";
                //if the mouse move into the selected area, the canvas can not capture the event, so remove the selected area to re-select.
                SelectedArea.addEventListener('mousedown', EPE_RemoveSelector, false);
                drop.appendChild(SelectedArea);
                EPE_ShowInfo("Press mouse key and drag a rectangle...");
            }
            var x1 = LastPose.x;
            var x2 = p.x;
            var y1 = LastPose.y;
            var y2 = p.y;
            if (x1 > x2) { var t = x2; x2 = x1; x1 = t; }
            if (y1 > y2) { var t = y2; y2 = y1; y1 = t; }
            //make sure your mouse is out of the range of SelectedArea, so the mouseout will not happen.
            x1++; y1++;
            x2--; y2--;

            SelectedArea.style.left = x1 + "px";
            SelectedArea.style.top = y1 + "px";
            SelectedArea.style.width = x2 - x1 - 1 + "px";
            SelectedArea.style.height = y2 - y1 - 1 + "px";
        }
    }
}
function EPE_MouseUp(evt)
{
    evt.preventDefault();

    with (EPE)
    {
        //Stop drawing, erasing, selecting
        if (flag == 11 || flag == 21 || flag == 31) EPE_SetFlag(flag - 1);;
        if (flag == 30) EPE_ExitIO();
    }
}
function EPE_MouseOut(evt)
{
    with (EPE)
    {
        //Stop drawing, erasing, selecting
        if (flag == 11 || flag == 21 || flag == 31) EPE_SetFlag(flag - 1);
        if (flag == 30) EPE_ExitIO();
    }
}

//Calculate the location of mouse or hand
function EPE_Pose(evt)
{
    var x, y;
    if (EPE_IsTouch(evt))
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
function EPE_IsTouch(evt)
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

//Response the buttons in the editor panel
function EPE_Pen(bnt)
{
    with (EPE)
    {
        EPE_SetFlag(10);//Enable pen
    }
}
function EPE_Eraser(bnt)
{
    with (EPE)
    {
        EPE_SetFlag(20);//Enable earser
    }
}

function EPE_Select(bnt)
{
    with (EPE)
    {
        EPE_SetFlag(30);//Enable selector

        EPE_RemoveSelector();

        EPE_ShowInfo("Press mouse key and drag a rectangle...");
    }
}

function EPE_RemoveSelector()
{
    with (EPE)
    {
        if (SelectedArea != null)
        {
            drop.removeChild(SelectedArea);
            SelectedArea = null;
        }
    }
}

function EPE_SelectColor(bnt)
{
    with (EPE)
    {
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
        if (td)
        {
            var color = td.style.backgroundColor;
            pencolor = color;
            context.strokeStyle = color;
            //bcolor.style.backgroundColor = color;
        }

        EPE_SetFlag(10);
    }
}
function EPE_PenSize(bnt)
{
    with (EPE)
    {
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
        if (size)
        {
            pensize = size;
            context.lineWidth = size;
        }
        EPE_SetFlag(10);
    }
}

//set the pen style of the canvas
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