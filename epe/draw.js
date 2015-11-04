/* Emily Photo Editor For Web (EPE) */
/* Drawing */

//Change the state
function EPE_SetFlag(f)
{
    with (EPE)
    {
        flag = f;

        switch (flag)
        {
            case 0://idle
                if (toolbar != null) toolbar.style.display = "none";
                if (canvas != null) canvas.style.display = "none";
                if (bpen != null) EPE.bpen.style.borderStyle = "none";
                if (beraser != null) EPE.beraser.style.borderStyle = "none";
                break;

            case 10://using pen, when the mouse down, start drawing
            case 11://drawing
                if (canvas != null) canvas.style.display = "";
                if (bpen != null) EPE.bpen.style.borderStyle = "solid";
                if (beraser != null) EPE.beraser.style.borderStyle = "none";
                break;

            case 20://using eraser, when the mouse down, start erasing
            case 21://earsing
                if (canvas != null) canvas.style.display = "";
                if (bpen != null) EPE.bpen.style.borderStyle = "none";
                if (beraser != null) EPE.beraser.style.borderStyle = "solid";
                break;
        }
    }
}


//Event processing
function HWMouseDown(evt)
{
    evt.preventDefault();
    with (EPE)
    {
        EPE_CloseSetting()

        if (flag == 10 || flag == 20)
        {
            flag++;//Start drawing or earsing
            LastPose = HWPose(evt);
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
    }
}
function HWMouseUp(evt)
{
    evt.preventDefault();

    with (EPE)
    {
        //Stop drawing or erasing
        if (flag == 11 || flag == 21) flag--;
    }
}
function HWMouseOut(evt)
{
    with (EPE)
    {
        //Stop drawing or erasing
        if (flag == 11 || flag == 21)
        {
            flag--;
        }
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
function EPE_Clear(bnt)
{
    with (EPE)
    {
        EPE_CloseSetting();

        context.clearRect(0, 0, canvas.width, canvas.height);
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
                EPE_SetFlag(31);
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
        EPE_SetFlag(31);
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
        EPE_SetFlag(32);
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
        if (flag == 31 || flag == 32)
        {
            if (colorTable != null) colorTable.style.display = "none";
            if (sizeTable != null) sizeTable.style.display = "none";

            EPE_SetFlag(10);
            return true;
        }
    }
    return false;
}
