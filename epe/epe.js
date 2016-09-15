/*
 * Emily Photo Editor For Web (EPE)
 *
 * https://github.com/Emily1997/emily1997.github.io
 *
 * Initialize the canvas
 * Load photos from local device
 * Save the editing image into the left side album
 */

var VTitle = "Emily Photo Editor For Web (EPE 2.0)";
var PenColors = ["#000000", "#999999", "#CCCCCC", "#00FFFF", "#FF00FF", "#800000", "#008000", "#00FF00", "#800000", "#000080", "#808000", "#800080", "#FF0000", "#008080", "#FFFF00", "#0000FF"];
var PenSizes = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25];
var EPE = {};

//the count of props
var props_count = 20;

//the original size of props
var prop_width = 48, prop_height = 48;



var state_string = [];
state_string[0] = "Ready";
state_string[1] = "Loading photos";
state_string[10] = "Drawing";
state_string[11] = "Drawing";
state_string[20] = "Erasing";
state_string[21] = "Erasing";
state_string[30] = "Selecting";
state_string[31] = "Selecting";
state_string[40] = "Processor";
state_string[91] = "Setting pen's color";
state_string[92] = "Setting pen's size";
state_string[93] = "Resizing";
state_string[94] = "Rotating";
state_string[95] = "Picking color";



//Initialize the image
//id: element's id of the canvas.
//pensize: the initial size of the paintbrush
//pencolor: the initial color of the paintbrush
function EPE_Init(id, pensize, pencolor)
{
    EPE.context = null;
    EPE.canvas = null;

    EPE.state = 0;
    EPE.lastState = 0;
    EPE.LastPose = null;
    EPE.pensize = pensize;
    EPE.pencolor = pencolor;
    EPE.toolbar = null;
    EPE.bpen = null;
    EPE.beraser = null;
    EPE.bselect = null;
    EPE.SelectedArea = null;
    EPE.colorTable = null;
    EPE.sizeTable = null;


    EPE.no = 0;//the auto-increasing number for the id of photo
    EPE.index = 0;//the index of selected photos is being added into album.
    EPE.editing = null;//the photo that is being editted.
    EPE.worker = null;//processing worker.
    EPE.working = false;
    EPE.blank = true;//whether the canvas is blank (no image)
    EPE.rotating_img = null;
    EPE.rotating_radian = 0;
    EPE.DragStartEvent = null;


    //toolbar and the 3 panels on it
    EPE.toolbar = document.getElementById("toolbar");
    EPE.editor = document.getElementById("editor");
    EPE.processor = document.getElementById("processor");
    EPE.io = document.getElementById("io");

    //buttons on the editor panel
    EPE.bpen = document.getElementById("bpen");
    EPE.beraser = document.getElementById("beraser");
    EPE.bselect = document.getElementById("bselect");
    EPE.bpickcolor = document.getElementById("bpickcolor");
    EPE.bclear = document.getElementById("bclear");
    EPE.bsave = document.getElementById("bsave");
    EPE.bresize = document.getElementById("bresize");
    EPE.brotate = document.getElementById("brotate");
    EPE.info = document.getElementById("info");


    //elements on main area
    EPE.album = document.getElementById("album");
    EPE.td = document.getElementById("td");
    EPE.pad = document.getElementById("pad");
    EPE.drop = document.getElementById("drop");
    EPE.canvas = document.getElementById(id);
    EPE.props = document.getElementById("props");

    //elements on footer
    EPE.footbar = document.getElementById("footbar");
    EPE.status = document.getElementById("status");

    //the hidden file of <input type=file>
    EPE.uploader = document.getElementById("uploader");


    try
    {
        //Initialize canvas, it will throw an exception if the browser does not support HTML5.
        EPE.context = EPE.canvas.getContext('2d');
    }
    catch (e)
    {
    }

    if (EPE.context != null)
    {
        with (EPE)
        {
            //Resize the Canvas (because it does not support style)
            SizeCanvas();

            //Register the mouse event for the canvas.
            canvas.addEventListener('mousedown', EPE_MouseDown, false);
            canvas.addEventListener('mousemove', EPE_MouseMove, false);
            canvas.addEventListener('mouseup', EPE_MouseUp, false);
            canvas.addEventListener('mouseout', EPE_MouseOut, false);

            //Register the touching event for the canvas.
            canvas.addEventListener('touchstart', EPE_MouseDown, false);
            canvas.addEventListener('touchmove', EPE_MouseMove, false);
            canvas.addEventListener('touchend', EPE_MouseUp, false);

            document.body.addEventListener('mousedown', EPE_MouseDownResize, false);
            document.body.addEventListener('mousemove', EPE_MouseMoveResize, false);
            document.body.addEventListener('mouseup', EPE_MouseUpResize, false);

            document.body.addEventListener('paste', EPE_Paste, false);

            //load all props
            for (var i = 1; i <= props_count; i++)
            {
                var img = new Image();
                img.id = "props" + i;
                img.src = "props/" + i + ".png";

                //Enable the img tag draggable
                img.title = "Drag to the canvas to decorate your photo.";
                img.draggable = true;
                img.addEventListener('dragstart', EPE_DragStart, false);
                props.appendChild(img);
            }

            //add samples photos into album.
            for (var i = 1; i <= 3; i++)
            {
                var img = new Image();
                img.src = "album/" + i + ".jpg";
                EPE_AddToAlbum(img);
                if (i == 1) EPE_EditPhoto(img);
            }

        }

        //Display the pen's color in the button
        EPE_SetColor(pencolor);

        //auto start drawing
        EPE_ChangeState(10);
    }
}

//Change the state (state machine)
//The state is the current state of the APP, 
//the state is changed with this function solely, so we can adjust the UI concentrically.
//the meaning of each state:
//1 :load files from file input
//
//10:using pen, when the mouse down, start drawing
//11:drawing
//
//20:using eraser, when the mouse down, start erasing
//21:earsing
//
//30:using selecter, when the mouse down
//31:selecting
//
//40:processor panel is opened, if it is opened the editor panel is hidden, otherwise the editor is opened.
//
//91:setting pen's color
//92:setting pen's size
//93:resizing
//94:rotating
//95:pick color (as the pen's color)
function EPE_ChangeState(newState)
{
    with (EPE)
    {
        if (!newState) newState = state;

        if (newState != 30 && newState != 31) EPE_RemoveSelector();


        if (state != newState)
        {
            if (state == 93) pad.removeEventListener('mousewheel', EPE_ScaleWithWheel, false);
            if (state == 94) pad.removeEventListener('mousewheel', EPE_RotateWithWheel, false);


            lastState = state;
            state = newState;
            EPE_ShowStatus(state);
        }

        //buttons on editor panel
        //SetClass(bpen, "pressed", state == 10 || state == 11);
        //SetClass(beraser, "pressed", state == 20 || state == 21);
        //SetClass(bselect, "pressed", state == 30 || state == 31);
        //SetClass(bresize, "pressed", state == 93);
        //SetClass(brotate, "pressed", state == 94);
        //SetClass(bpickcolor, "pressed", state == 95);

        EPE_ButtonOn(bpen, state == 10 || state == 11);
        EPE_ButtonOn(beraser, state == 20 || state == 21);
        EPE_ButtonOn(bselect, state == 30 || state == 31);
        EPE_ButtonOn(bresize, state == 93);
        EPE_ButtonOn(brotate, state == 94);
        EPE_ButtonOn(bpickcolor, state == 95);

        bclear.title = (state == 30 || state == 31) ? "Clear the selected area" : "Clear the entire image";
        bsave.title = (state == 30 || state == 31) ? "Save the selected area image to the album" : "Save the entire image to the album";

        //editor panel
        editor.style.display = state != 40 ? "" : "none";

        //processor panel
        processor.style.display = state == 40 ? "" : "none";

        //the popup elements
        if (colorTable != null) colorTable.style.display = state == 91 ? "" : "none";
        if (sizeTable != null) sizeTable.style.display = state == 92 ? "" : "none";

        //change the cursor according to the state.
        switch (state)
        {
            case 10:
            case 11:
                //The color cursor is not applicable to Firefox?
                if (BrowserInfo().browser == "Firefox") canvas.style.cursor = "url('cursor/penff.cur'),pointer";
                else canvas.style.cursor = "url('cursor/pen.cur'),pointer";
                break;

            case 20:
            case 21:
                canvas.style.cursor = "url('cursor/eraser.cur'),pointer";
                break;

            case 95:
                canvas.style.cursor = "url('cursor/pickcolor.cur'),pointer";
                break;

            case 93:
                canvas.style.cursor = "url('cursor/resize.cur'),pointer";
                break;

            default:
                canvas.style.cursor = "pointer";
                break;
        }
    }
    EPE_SetDrawing();
}

//Display prompting or progress
function EPE_ShowInfo(message)
{
    with (EPE)
    {
        processor.style.display = "none";
        editor.style.display = "none";
        io.style.display = "";

        info.innerHTML = message;
    }
}

//Display status at the bottom
function EPE_ShowStatus(code)
{
    with (EPE)
    {
        if (state_string[code])
        {
            status.innerHTML = state_string[code];
        }
        else
        {
            status.innerHTML = code;
        }
    }
}

//Close the prompting or progress, show editor or processor.
function EPE_ExitIO()
{
    with (EPE)
    {
        //cancel the image processing if it is started
        if (working === true)
        {
            worker.terminate();
            working = false;
            worker = null;
        }

        //hidden io and go back last state.
        io.style.display = "none";

        if (state == 1) EPE_ChangeState(lastState);
        else EPE_ChangeState(state);
    }
}

//Check whether the canvas contais any image
function EPE_HasData()
{
    with (EPE)
    {
        return blank == false;

        //the following code needs a lot of time if the size of canvas is big.
        //R(0-255)G(0-255)/B(0-255)/A-alpha(0-255) of each point, 4 items in a group
        var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        if (imageData == null) return false;
        if (imageData.data.length == 0) return false;

        for (var i = 0; i < imageData.data.length; i++)
        {
            if (imageData.data[i] != imageData.data[0])
            {
                return true;
            }
        }
    }

    return false;
}

//Load photos into EPE with hidden <file> element
//Select and open a file with file-selection-dialog, it is a living/true experience of windows application (SPA)
function EPE_Load(bnt)
{
    with (EPE)
    {
        EPE_ChangeState(1);

        EPE_ShowInfo("Select one or more photos from your device.");

        //Skill
        //the uploader control <input type="file"> is always hidden.
        //directly call the click event to start the browsing of file (like the user click the "select")
        uploader.click();

        //for IE, click() will return after the file-selecting-dialog close or canceled, it can exit the uploading state if the user cancel the uploading.
        //for other browser, click() will return at once before the file-selecting-dialog close or canceled. So, you had to click the exit button on the toolbar if you cancel the uploading.
        if (BrowserInfo().browser == "IE" && uploader.files.length == 0) EPE_ExitIO();
    }
}
//Load all the photos from the file input
function EPE_OpenPhotos(input)
{
    with (EPE)
    {
        index = 0;

        if (uploader.files.length == 0)
        {
            EPE_ExitIO();
        }
        else
        {
            EPE_ReadFile();
        }
    }
}
function EPE_ReadFile()
{
    with (EPE)
    {
        //all files had been loaded into album.
        if (index >= uploader.files.length)
        {
            uploader.value = null;
            EPE_ExitIO();
            return;
        }

        EPE_ShowInfo("Opening " + uploader.files[index].name);

        var reader = new FileReader();
        reader.readAsDataURL(uploader.files[index]);

        //the onload event happen after the file has been loaded.
        reader.onload = function ()
        {
            //add file had been read into album.
            var img = new Image();
            img.src = this.result;//it is the data read from the file.
            EPE_AddToAlbum(img);

            if (state == 1)
            {
                //read next file
                index++;
                //use timeout to read next file, it make the user can cancel the loading.
                setTimeout(EPE_ReadFile, 500);
            }
            else
            {
                //cancelled
                uploader.value = null;
                EPE_ExitIO();
            }
        }
    }
}

//add an image into album
function EPE_AddToAlbum(img)
{
    with (EPE)
    {
        img.id = "photo" + no;
        no++;
        img.className = "thumbnail";

        //Enable the img tag draggable
        img.title = "Click or drag to the canvas in the right to edit.\r\nDrag to toolbar or footer to remove.\r\nOpen the context ment to save back into your device.";
        img.draggable = true;
        img.addEventListener('dragstart', EPE_DragStart, false);
        img.onclick = function () { EPE_EditPhoto(this); };
        album.appendChild(img);
    }
}

//Load a photo to the canvas to be edited
function EPE_EditPhoto(img)
{
    with (EPE)
    {
        //cancel exiting selected area if has.
        EPE_RemoveSelector();

        //remove all props.
        for (var i = 0; i >= 0 && i < drop.childNodes.length; i++)
        {
            var p = drop.childNodes[i];
            if (p.tagName)
            {
                if (p.tagName == "IMG")
                {
                    drop.removeChild(p);
                    i--;
                }
            }
        }


        //copy the image from thumbnail and restore the real size.
        var vimg = new Image();
        vimg.src = img.src;
        vimg.style.border = 0;
        editing = img;

        //set the size of canvas size according to the photo's real size
        drop.style.width = vimg.width + "px";
        drop.style.height = vimg.height + "px";

        canvas.width = vimg.width;
        canvas.height = vimg.height;

        //copy the photo into the canvas
        context.drawImage(vimg, 0, 0);
        blank = false;

        //Restore the settings of canvas 
        EPE_SetDrawing();

        EPE_ChangeState(0);
    }
}

//save image in the canvas into album
function EPE_Save(bnt)
{
    with (EPE)
    {
        //save the selecting area into the alumn
        if (state == 30 && SelectedArea != null)
        {
            var img = new Image();
            img.src = canvas.toDataURL();

            var x = parseInt(SelectedArea.style.left);
            var y = parseInt(SelectedArea.style.top);
            var w = parseInt(SelectedArea.style.width);
            var h = parseInt(SelectedArea.style.height);

            var imgData = context.getImageData(x, y, w, h);
            canvas.width = w;
            canvas.height = h;
            context.putImageData(imgData, 0, 0);

            var img2 = new Image();
            img2.src = canvas.toDataURL();
            EPE_AddToAlbum(img2);

            EPE_RemoveSelector();

            ResizeCanvas(img.width, img.height);
            context.drawImage(img, 0, 0);

            return;
        }


        //Draw all props on the canvas and remove all props.
        for (var i = 0; i >= 0 && i < drop.childNodes.length; i++)
        {
            var p = drop.childNodes[i];
            if (p.tagName)
            {
                if (p.tagName == "IMG")
                {
                    var x = parseInt(p.style.left);
                    var y = parseInt(p.style.top);
                    var w = parseInt(p.style.width);
                    var h = parseInt(p.style.height);

                    context.drawImage(p, 0, 0, prop_width, prop_height, x, y, w, h);
                    drop.removeChild(p);
                    i--;
                }
            }
        }

        if (EPE_HasData() == false)
        {
            alert("There is nothing on the canvas.");
            return;
        }

        if (editing != null)
        {
            //You are editing a photo, save to the img tag in the album.
            editing.src = canvas.toDataURL();
        }
        else
        {
            //You are drawing on the canvas directly, add it into album.
            var img = new Image();
            img.src = canvas.toDataURL();
            EPE_AddToAlbum(img);
        }

        //clear the canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        blank = true;

        SizeCanvas();
    }
}

//clear image on the canvas
function EPE_Clear(bnt)
{
    with (EPE)
    {
        if (state == 30)
        {
            //clear the image of selected area
            if (SelectedArea != null)
            {
                if (confirm('Are you sure to clear the selected area?'))
                {
                    context.clearRect(parseInt(SelectedArea.style.left), parseInt(SelectedArea.style.top), parseInt(SelectedArea.style.width), parseInt(SelectedArea.style.height));
                    EPE_RemoveSelector();
                }
            }
        }
        else
        {
            //clear the entire canvas
            if (confirm('Are you sure to clear the photo?'))
            {
                context.clearRect(0, 0, canvas.width, canvas.height);
                blank = true;
                SizeCanvas();
            }
        }
    }
}

//open context menu at one image and click [save image]
//paste on EPE or click paste button (for IE only)
//the image from the internet will be added into your album.
function EPE_Paste(evt)
{
    var clipboardData = window.clipboardData; // IE  
    if (!clipboardData) clipboardData = evt.clipboardData;//Chrome

    if (clipboardData)
    {
        var url = clipboardData.getData('Text');
        if (url)
        {
            var img = new Image();
            img.src = url;
            img.onload = function () { EPE_AddToAlbum(img); };
            img.onerror = function () { EPE_ShowInfo("Copy an image on web pages first."); };
        }
    }
    else
    {
        EPE_ShowInfo("Copy an image on web pages first.");
    }
}

//drag-drop, there are 3 operaions with drag-drop:
//1: drag photo from album into canvas
//2: drag props into canvas
//3: drag props on the canvas to move it
function EPE_DragStart(evt)
{
    EPE.DragStartEvent = evt;
    evt.dataTransfer.setData("Text", evt.target.id);
}
function EPE_Drop(evt)
{
    evt.preventDefault();
    with (EPE)
    {
        var id = evt.dataTransfer.getData("Text");
        if (id.indexOf("props") == 0)
        {
            //Add props into canvas
            var prop = document.getElementById(id);

            var img = new Image();
            img.id = "selected_" + id;//Set up a new id to identify
            img.src = prop.src;
            img.style.position = "absolute";

            img.style.left = evt.layerX - canvas_border + "px";
            img.style.top = evt.layerY - canvas_border + "px";

            img.title = "Drag to adjust the location.\r\nUse the mouse wheel to adjust size.\r\nDrag to toolbar to remove.";
            img.draggable = true;
            img.style.width = prop_width + "px";
            img.style.height = prop_height + "px";

            //Register the drag event to move the props on the canvas.
            img.addEventListener('dragstart', EPE_DragStart, false);
            //Register the mouse's wheel event to scale the size of props.
            img.addEventListener('mousewheel', EPE_MouseWheelProp, false);

            drop.appendChild(img);

            blank = false;
        }
        else
        {
            if (id.indexOf("selected_") == 0)
            {
                //move selected props
                var img = document.getElementById(id);

                var x1 = PageX(DragStartEvent);
                var y1 = PageY(DragStartEvent);
                var x2 = PageX(evt);
                var y2 = PageY(evt);
                img.style.left = parseInt(img.style.left) + x2 - x1 + "px";
                img.style.top = parseInt(img.style.top) + y2 - y1 + "px";

                //if the props' position is set to the same as the mouse location of the event as follows, 
                //there will be some delta if the props are not dragged at the most left-top point.
                //img.style.left = x2 + "px";
                //img.style.top = y2 + "px";
            }
            else
            {
                //Add photo
                EPE_EditPhoto(document.getElementById(id));
            }
        }
    }
}
function EPE_DropOut(evt)
{
    evt.preventDefault();
    var id = evt.dataTransfer.getData("Text");
    var img = document.getElementById(id);
    img.parentElement.removeChild(img);
}
function EPE_AllowDrop(evt)
{
    evt.preventDefault();
}

//Scaling the props on the canvas with mouse wheel.
function EPE_MouseWheelProp(evt)
{
    //prevent the scrollbar receive this event.
    evt.preventDefault();

    var ratio;
    evt.wheelDelta = evt.wheelDelta ? evt.wheelDelta : (evt.deltaY * (-40));
    if (evt.wheelDelta > 0)
    {
        ratio = 1.1;
    }
    else
    {
        ratio = 0.9;
    }

    evt.target.style.width = parseInt(evt.target.style.width) * ratio + "px";
    evt.target.style.height = parseInt(evt.target.style.height) * ratio + "px";
}

//Scaling (processing the image by the canvas directly, not using web worker)
function EPE_Scale(ratio)
{
    with (EPE)
    {
        //get the original image
        var img = new Image();
        img.src = canvas.toDataURL('image/png');
        if ((img.width * ratio) > 10 && img.height * ratio > 10)
        {
            //redraw the rotated image on the restored canvas        
            ResizeCanvas(img.width * ratio, img.height * ratio);

            //drawImage can scale the source image to any size.
            context.drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width * ratio, img.height * ratio);
            EPE_SetDrawing();
        }
    }
}

//start to resize canvas with wheel.
function EPE_StartResize()
{
    with (EPE)
    {
        if (state != 93)
        {
            EPE_ChangeState(93);
            pad.addEventListener('mousewheel', EPE_ScaleWithWheel, false);
        }
        else
        {
            EPE_ChangeState(lastState);
        }
    }
}

//Scaling the image on the canvas with mouse wheel.
function EPE_ScaleWithWheel(evt)
{
    //prevent the scrollbar receive this event.
    evt.preventDefault();

    var ratio;
    evt.wheelDelta = evt.wheelDelta ? evt.wheelDelta : (evt.deltaY * (-40));
    if (evt.wheelDelta > 0)
    {
        ratio = 1.1;
    }
    else
    {
        ratio = 0.9;
    }

    EPE_Scale(ratio);
}

//Prepare to rotate the image on the canvas with mouse wheel.
function EPE_StartRotate()
{
    with (EPE)
    {
        if (state != 94)
        {
            if (EPE_HasData() == false)
            {
                EPE_ShowInfo("There is nothing on the canvas.");
            }
            else
            {
                EPE_ChangeState(94);
                pad.addEventListener('mousewheel', EPE_RotateWithWheel, false);

                //save the image on the canvs into an image to rotate continuously.
                rotating_img = new Image();
                rotating_img.src = canvas.toDataURL();

                //resize the canvas to contain the rotated images.
                var size = Math.sqrt(rotating_img.width * rotating_img.width + rotating_img.height * rotating_img.height);
                ResizeCanvas(size, size);

                //initialize the rotating radian
                rotating_radian = 0;

                //center the image on conter of the canvas for rotating.
                context.drawImage(rotating_img, (size - rotating_img.width) / 2, (size - rotating_img.height) / 2);
            }
        }
        else
        {
            EPE_ChangeState(lastState);
        }
    }
}

//Rotate the image on the canvas while the mouse's wheel turning.
function EPE_RotateWithWheel(evt)
{
    with (EPE)
    {
        //prevent the scrollbar receive this event.
        evt.preventDefault();

        //accumulate the rotating radian for rotate the image continuously (after the canvas coordinate restored)
        evt.wheelDelta = evt.wheelDelta ? evt.wheelDelta : (evt.deltaY * (-40));
        if (evt.wheelDelta > 0)
        {
            rotating_radian += 10;
        }
        else
        {
            rotating_radian -= 10;
        }

        //save the setting of the canvas
        context.save();

        //clear the entire canvas 
        context.clearRect(0, 0, canvas.width, canvas.height);

        //translate the coordinate (x/y) of the convas (start from center, not from left-top point)
        context.translate(canvas.clientWidth / 2, canvas.clientHeight / 2);

        //rotate the canvas to make the image rotated
        context.rotate(rotating_radian * Math.PI / 180);

        //draw the image on conter of the canvas for rotating.
        context.drawImage(rotating_img, -rotating_img.width / 2, -rotating_img.height / 2);

        //restore the setting (including coordinate) to normal state.
        context.restore();
    }
}


function EPE_ButtonOn(bnt, on)
{
    with (EPE)
    {
        bnt.on = on;
        EPE_BrightButton(bnt, on);
    }
}

//lighten a button on toolbar while mouse over it.
//bnt: the dom of button to be lightened.
//on: true/false, true to lighten, false to restore normal state.
//to image for a button, normal image stored at bnt.src, lightened image saved in bnt.offsrc.
//BrightenImage() can change current image's outline black pixels into blue ones.
//save two images (one is un-lightened, one is lightened) at bnt.onsrc or bnt.offsrc (special properties created by EPE).
//the original image saved in bnt.src on page load.
function EPE_BrightButton(bnt, on)
{
    with (EPE)
    {
        //create the lightened image if it had not been created.
        if (!bnt.onsrc)
        {
            bnt.offsrc = bnt.src;//the original image.

            try
            {
                //create a lightened image for the button, and saved into user-defined onsrc property.
                bnt.onsrc = BrightenImage(bnt.src, false);
            }
            catch (e)
            {
                return;
            }
        }

        if (bnt.on === true) bnt.src = bnt.onsrc;//this button is at current state, it is always on.
        else bnt.src = on ? bnt.onsrc : bnt.offsrc;
    }
}

//lighten a button-image with canvas.
//all button-image is black and white color, white pixels are trasparent.
//and the pixels of outline of the button-image is not trasparent (black/visible, RGBA's A!=0),
//so we can change these black pixels into blue to "lighten" the button.
//use a hidden canvas to fulfill this convertion.
function BrightenImage(data)
{
    with (EPE)
    {
        var img = new Image();
        img.src = data;

        //put the image on the hidden canvas
        var cc = document.getElementById("cc");
        var ct = cc.getContext("2d");
        cc.width = img.width;
        cc.height = img.height;
        ct.drawImage(img, 0, 0);

        //change the color (blue)
        var R = 0;
        var G = 0;
        var B = 255;

        //Chrome: if you run this APP on local computer, it will report an error: the canvas has been tainted by cross-origin data.
        var imgdata = ct.getImageData(0, 0, img.width, img.height);
        for (var i = 0; i < imgdata.data.length; i += 4)
        {
            var r = imgdata.data[i];
            var g = imgdata.data[i + 1];
            var b = imgdata.data[i + 2];
            var a = imgdata.data[i + 3];

            //for black-and-white transparent image, just like the pen.png in this APP.
            //if this pixel is visible (not transparent), replace it with specified color.
            if (a != 0)
            {
                imgdata.data[i] = R;
                imgdata.data[i + 1] = G;
                imgdata.data[i + 2] = B;
            }
        }

        //put the processed image back on the canvas, and load it as an image for the button.
        ct.putImageData(imgdata, 0, 0);
        return cc.toDataURL();
    }
}

var resizing = null;
var startevt;

function EPE_MouseMoveResize(evt)
{
    if (resizing == null) EPE_Resizing(evt, 2)
}

function EPE_MouseDownResize(evt)
{
    with (EPE)
    {
        resizing = EPE_Resizing(evt, 1);
        if (resizing != null)
        {
            startevt = evt;
            canvas.style.cursor = resizing;
        }
    }
}

function EPE_MouseUpResize(evt)
{
    with (EPE)
    {
        if (resizing != null)
        {
            var p1 = EventPageXY(startevt);
            var p2 = EventPageXY(evt);

            //the size diff after resizing
            var dx = 0, dy = 0;

            //the starting position of the image after resizing
            var x = 0, y = 0;

            var directions = resizing.substr(0, 2);
            if (directions.indexOf("s") >= 0) dy = p2.y - p1.y;
            if (directions.indexOf("e") >= 0) dx = p2.x - p1.x;
            if (directions.indexOf("n") >= 0) y = dy = -(p2.y - p1.y);
            if (directions.indexOf("w") >= 0) x = dx = -(p2.x - p1.x);

            ResizeCanvasWithData(x, y, canvas.width + dx, canvas.height + dy);

            resizing = null;
            EPE_Resizing(evt, 3);
            EPE_ChangeState();
        }
    }
}

function EPE_Resizing(evt, evttype)
{
    //don't preventDefault here, otherwise, the drag event of props can't work.

    with (EPE)
    {
        var c = PageXY(canvas);
        var x1 = c.x;
        var y1 = c.y
        var x2 = x1 + canvas.width + canvas_border - 1;
        var y2 = y1 + canvas.height + canvas_border - 1;

        var p = EventPageXY(evt);

        var directions = "";

        if (p.y >= (y1 - canvas_border) && p.y <= (y1 + canvas_border)) directions += "n";//north(top-side)
        if (p.y >= (y2 - canvas_border) && p.y <= (y2 + canvas_border)) directions += "s";//sourth(bottom-side)
        if (p.x >= (x1 - canvas_border) && p.x <= (x1 + canvas_border)) directions += "w";//west(left-side)
        if (p.x >= (x2 - canvas_border) && p.x <= (x2 + canvas_border)) directions += "e";//estern(right-size)

        if (directions.length > 0)
        {
            document.body.style.cursor = directions + "-resize";
            return document.body.style.cursor;
        }
        else
        {
            document.body.style.cursor = "auto";
            return null;
        }
    }
}

function ShowAlbum(bnt)
{
    if (album_width == 10)
    {
        bnt.src = "images/arrowleft.gif";
        album.style.overflow = "auto";
        album_width = 120;
        LayoutResize();
    }
    else
    {
        bnt.src = "images/arrowright.gif";
        album.style.overflow = "hidden";
        album_width = 10;
        LayoutResize();
    }
}

function ShowProps(bnt)
{
    with (EPE)
    {
        if (props_width == 10)
        {
            bnt.src = "images/arrowright.gif";
            props.style.overflow = "auto";
            props_width = 120;
            LayoutResize();
        }
        else
        {
            bnt.src = "images/arrowleft.gif";
            props.style.overflow = "hidden";
            props_width = 10;
            LayoutResize();
        }
    }
}


function EPE_FB()
{
    //var _uri = 'http://www.facebook.com/sharer.php?u=' + encodeURIComponent(shareInfo.url) + '&t=' + encodeURIComponent(shareInfo.title);
}





