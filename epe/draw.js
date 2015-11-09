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
        if (state == 10 || state == 20 || state == 30)
        {
            //Start drawing, earsing, selecting
            EPE_ChangeState(state + 1);

            LastPose = EPE_Pose(evt);

            if (state == 31)
            {
                EPE_RemoveSelector();
            }
        }

        //picking color (we can pick up color from canvas only, because we can not get the image data from other place.)
        if (state == 95)
        {
            p = EPE_Pose(evt);
            var imageData = context.getImageData(p.x, p.y, 1, 1);
            if (imageData.data[3] > 0)//if this pixel is visible.
            {
                EPE_SetColor(rgbToHex(imageData.data[0], imageData.data[1], imageData.data[2]));
            }
        }
    }
}
function EPE_MouseMove(evt)
{
    evt.preventDefault();
    var p = EPE_Pose(evt);

    with (EPE)
    {
        switch (state)
        {
            case 11://Drawing
                if (LastPose != null)
                {
                    context.beginPath();
                    context.moveTo(LastPose.x, LastPose.y);
                    context.lineTo(p.x, p.y);
                    context.stroke();
                }

                LastPose = p;

                blank = false;
                break;

            case 21://Erasing
                context.clearRect(p.x, p.y, 10, 10);
                break;

            case 31://Selecting
                if (SelectedArea == null)
                {
                    //use a div's red border to indicate the selected area.
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
                break;
        }
    }
}
function EPE_MouseUp(evt)
{
    evt.preventDefault();

    with (EPE)
    {
        //Stop drawing, erasing, selecting
        if (state == 11 || state == 21 || state == 31) EPE_ChangeState(state - 1);;
        if (state == 30) EPE_ExitIO();
    }
}
function EPE_MouseOut(evt)
{
    with (EPE)
    {
        //Stop drawing, erasing, selecting
        if (state == 11 || state == 21 || state == 31) EPE_ChangeState(state - 1);
        if (state == 30) EPE_ExitIO();
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
        EPE_ChangeState(10);//Enable pen
    }
}
function EPE_Eraser(bnt)
{
    with (EPE)
    {
        EPE_ChangeState(20);//Enable earser
    }
}

function EPE_Select(bnt)
{
    with (EPE)
    {
        if (EPE_HasData() == false)
        {
            EPE_ShowInfo("There is nothing on the canvas.");
        }
        else
        {
            EPE_ChangeState(30);//Enable selector

            EPE_RemoveSelector();

            EPE_ShowInfo("Press mouse key and drag a rectangle...");
        }
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
                EPE_ChangeState(91);
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
            html.append("<td onclick=\"EPE_SetColor('{0}',true)\" style=\" background-color: {1}\"></td>".replace("{0}", PenColors[i]).replace("{1}", PenColors[i]));
            cols++;
        }

        html.append("</tr></table>");
        EPE_ChangeState(91);
        colorTable = Popup(colorTable, bnt, html.toString());
    }
}
function EPE_SetColor(color, fromPalette)
{
    with (EPE)
    {
        if (color)
        {
            pencolor = color;
            context.strokeStyle = color;

            //set the color to the pen button on the toolbar
            //use a hidden canvas to process image            
            var img = new Image();
            img.src = "./images/pen.png";//the original image for pen button.

            //put the image on the hidden canvas
            var cc = document.getElementById("cc");
            var ct = cc.getContext("2d");
            cc.width = img.width;
            cc.height = img.height;
            ct.drawImage(img, 0, 0);

            //change the color
            var R = parseInt(pencolor.substr(1, 2), 16);
            var G = parseInt(pencolor.substr(3, 2), 16);
            var B = parseInt(pencolor.substr(5, 2), 16);

            var offimgdata;//the button image while mouseout or not pressed.
            var onimgdata;//the button image while mouseon or pressed.

            //Chrome: if you run this APP on local computer, it will report an error: the canvas has been tainted by cross-origin data.
            try
            {
                offimgdata = ct.getImageData(0, 0, cc.width, cc.height);
                onimgdata = ct.createImageData(cc.width, cc.height)


                for (var i = 0; i < offimgdata.data.length; i += 4)
                {
                    var r = offimgdata.data[i];
                    var g = offimgdata.data[i + 1];
                    var b = offimgdata.data[i + 2];
                    var a = offimgdata.data[i + 3];

                    //for black-and-white transparent image, just like the pen.png in this APP.
                    //if this pixel is visible (not transparent), replace it with specified color.
                    //if (a != 0)
                    //{
                    //    imgdata.data[i] = R;
                    //    imgdata.data[i + 1] = G;
                    //    imgdata.data[i + 2] = B;
                    //}  

                    //for this special pen.png, replace original pixel with RED color with specified pen color.
                    if (r > 0 && g == 0 && b == 0)
                    {
                        offimgdata.data[i] = R;
                        offimgdata.data[i + 1] = G;
                        offimgdata.data[i + 2] = B;

                        onimgdata.data[i] = R;
                        onimgdata.data[i + 1] = G;
                        onimgdata.data[i + 2] = B;
                        onimgdata.data[i + 3] = a;
                    }
                    else
                    {
                        //for original visible pixels, replace them with brighter color.
                        if (a > 0)
                        {
                            onimgdata.data[i] = 0;
                            onimgdata.data[i + 1] = 0;
                            onimgdata.data[i + 2] = 255;
                            onimgdata.data[i + 3] = a;
                        }
                        else
                        {
                            onimgdata.data[i] = r;
                            onimgdata.data[i + 1] = g;
                            onimgdata.data[i + 2] = b;
                            onimgdata.data[i + 3] = a;
                        }
                    }
                }


                //put the processed image back on the canvas, and load it as an image for the button.
                ct.putImageData(offimgdata, 0, 0);
                bpen.offsrc = cc.toDataURL();

                ct.putImageData(onimgdata, 0, 0);
                bpen.onsrc = cc.toDataURL();
            }
            catch (e)
            {
            }
        }

        if (fromPalette === true) EPE_ChangeState(lastState);
        else EPE_ChangeState(state);
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
        EPE_ChangeState(92);
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
        EPE_ChangeState(lastState);
    }
}

function EPE_PickColor(bnt)
{
    with (EPE)
    {
        EPE_ChangeState(95);
    }
}

//set the pen style of the canvas
function EPE_SetDrawing()
{
    with (EPE)
    {
        //Restore the setting of the canvas
        if (state <= 11)
        {
            context.lineCap = "round";
            context.lineWidth = pensize;
            context.strokeStyle = pencolor;
        }

        if (state == 20 || state == 21)
        {
            context.lineCap = "round";
            context.lineWidth = pensize;
            context.strokeStyle = pencolor;
        }

        if (state == 30 || state == 31)
        {
            context.lineCap = "round";
            context.lineWidth = 1;
            context.strokeStyle = "red";
        }
    }
}