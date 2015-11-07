/*
 * Emily Photo Editor For Web (EPE)
 *
 * https://github.com/Emily1997/emily1997.github.io
 *
 * Initialize the canvas
 * Load photos from local device
 * Save the editing image into the left side album
 */

var VTitle = "Emily Photo Editor For Web (EPE 0.1)";
var PenColors = ["#000000", "#999999", "#CCCCCC", "#00FFFF", "#FF00FF", "#800000", "#008000", "#00FF00", "#800000", "#000080", "#808000", "#800080", "#FF0000", "#008080", "#FFFF00", "#0000FF"];
var PenSizes = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25];
var EPE = {};
var props_width = 48, props_height = 48;

//Initialize the image
function EPE_Init(id, pensize, pencolor)
{
    EPE.context = null;
    EPE.canvas = null;

    EPE.flag = 0;
    EPE.LastPose = null;
    EPE.pensize = pensize;
    EPE.pencolor = pencolor;
    EPE.toolbar = null;
    EPE.bpen = null;
    EPE.beraser = null;
    EPE.bcolor = null;
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

    //toolbar and the 3 panels on it
    EPE.toolbar = document.getElementById("toolbar");
    EPE.editor = document.getElementById("editor");
    EPE.processor = document.getElementById("processor");
    EPE.io = document.getElementById("io");

    //buttons on the editor panel
    EPE.bpen = document.getElementById("bpen");
    EPE.beraser = document.getElementById("beraser");
    EPE.bselect = document.getElementById("bselect");
    EPE.bcolor = document.getElementById("bcolor");
    EPE.info = document.getElementById("info");
    EPE.bclear = document.getElementById("bclear");
    EPE.bsave = document.getElementById("bsave");
    EPE.bresize = document.getElementById("bresize");
    EPE.brotate = document.getElementById("brotate");


    //elements on main area
    EPE.album = document.getElementById("album");
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
            //Display the pen's color in the button
            //if (bcolor != null) bcolor.style.backgroundColor = pencolor;

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


            document.body.addEventListener('paste', EPE_Paste, false);

            for (var i = 1; i <= 30; i++)
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
        }

        //auto start drawing
        EPE_SetFlag(10);
    }
}

//Change the state
//The flag is the current state of the APP, 
//the flag is changed with this function solely, so we can adjust the UI concentrically.
function EPE_SetFlag(new_state)
{
    with (EPE)
    {
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

        if (new_state != 30 && new_state != 31) EPE_RemoveSelector();

        flag = new_state;
        EPE_ShowStatus(flag);

        //buttons on editor panel
        bpen.style.borderStyle = (flag == 10 || flag == 11) ? "solid" : "none";
        beraser.style.borderStyle = (flag == 20 || flag == 21) ? "solid" : "none";
        bselect.style.borderStyle = (flag == 30 || flag == 31) ? "solid" : "none";
        bresize.style.borderStyle = (flag == 93) ? "solid" : "none";
        brotate.style.borderStyle = (flag == 94) ? "solid" : "none";

        bclear.title = (flag == 30 || flag == 31) ? "Clear the selected area" : "Clear the entire image";
        bsave.title = (flag == 30 || flag == 31) ? "Save the selected area image to the album" : "Save the entire image to the album";

        //editor panel
        editor.style.display = flag != 40 ? "" : "none";

        //processor panel
        processor.style.display = flag == 40 ? "" : "none";

        //the popup elements
        if (colorTable != null) colorTable.style.display = flag == 91 ? "" : "none";
        if (sizeTable != null) sizeTable.style.display = flag == 92 ? "" : "none";
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
function EPE_ShowStatus(message)
{
    with (EPE)
    {
        status.innerHTML = message;
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

        io.style.display = "none";

        switch (flag)
        {
            case 1://exit loading files
                EPE_SetFlag(0);
                break;

            case 40://complete or cancel image processing and open the processor panel again
                processor.style.display = "";
                break;

            default://cancel other progress, open the editor panel again
                editor.style.display = "";
        }
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

//Load photos
function EPE_Load(bnt)
{
    with (EPE)
    {
        EPE_ShowInfo("Select one or more photos from your device.");

        //Skill
        //the uploader control <input type="file"> is always hidden.
        //directly call the click event to start the browsing of file (like the user click the "select")
        uploader.click();

        //for IE, click() will return after the file-selecting-dialog close or canceled, it can exit the uploading state if the user cancel the uploading.
        //for other browser, click() will return at once before the file-selecting-dialog close or canceled. So, you had to click the exit button on the toolbar if you cancel the uploading.
        if (GetExploreType().browser == "IE" && uploader.files.length == 0) EPE_ExitIO();
    }
}

//Load all the photos from the file control
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
            EPE_SetFlag(1);
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

            if (flag == 1)
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

//Edit the photos
function EPE_EditPhoto(img)
{
    with (EPE)
    {
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
    }
}

//save image in the canvas into album
function EPE_Save(bnt)
{
    with (EPE)
    {
        //save the selecting area into the alumn
        if (flag == 30 && SelectedArea != null)
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

                    context.drawImage(p, 0, 0, props_width, props_height, x, y, w, h);
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
        if (flag == 30)
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

var startevt;
function EPE_DragStart(evt)
{
    startevt = evt;
    evt.dataTransfer.setData("Text", evt.target.id);
}
function EPE_Drop(evt)
{
    evt.preventDefault();
    var id = evt.dataTransfer.getData("Text");
    if (id.indexOf("props") == 0)
    {
        //Add props into canvas
        var prop = document.getElementById(id);

        var img = new Image();
        img.id = "selected_" + id;//Set up a new id to identify
        img.src = prop.src;
        img.style.position = "absolute";

        img.style.left = evt.layerX + "px";
        img.style.top = evt.layerY + "px";

        img.title = "Drag to adjust the location.\r\nUse the mouse wheel to adjust size.\r\nDrag to toolbar to remove.";
        img.draggable = true;
        img.style.width = "50px";
        img.style.height = "50px";
        img.addEventListener('dragstart', EPE_DragStart, false);
        img.onmousewheel = function (event) { EPE_MouseWheelProp(event); }

        drop.appendChild(img);

        blank = false;
    }
    else
    {
        if (id.indexOf("selected_") == 0)
        {
            //move selected props
            var img = document.getElementById(id);

            var x1 = startevt.layerX;
            var x2 = evt.layerX;
            var y1 = startevt.layerY;
            var y2 = evt.layerY;
            img.style.left = parseInt(img.style.left) + x2 - x1 + "px";
            img.style.top = parseInt(img.style.top) + y2 - y1 + "px";
        }
        else
        {
            //Add photo
            EPE_EditPhoto(document.getElementById(id));
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

function EPE_StartResize()
{
    with (EPE)
    {
        if (flag != 93)
        {
            EPE_SetFlag(93);
            pad.addEventListener('mousewheel', EPE_MouseWheel, false);
        }
        else
        {
            pad.removeEventListener('mousewheel', EPE_MouseWheel, false);
            EPE_SetFlag(0);
        }
    }
}

var rotatingimg;
var rotatingratio;
function EPE_StartRotate()
{
    with (EPE)
    {
        if (flag != 94)
        {
            EPE_SetFlag(94);
            pad.addEventListener('mousewheel', EPE_Rotate, false);

            rotatingimg = new Image();
            rotatingimg.src = canvas.toDataURL();

            var size = Math.sqrt(rotatingimg.width * rotatingimg.width + rotatingimg.height * rotatingimg.height);
            ResizeCanvas(size, size);

            rotatingratio = 0;
            context.drawImage(rotatingimg, 0, 0);
        }
        else
        {
            EPE_SetFlag(0);
            pad.removeEventListener('mousewheel', EPE_Rotate, false);
        }
    }
}
//Rotating the image on the canvas with mouse wheel.
function EPE_Rotate(evt)
{
    with (EPE)
    {
        evt.wheelDelta = evt.wheelDelta ? evt.wheelDelta : (evt.deltaY * (-40));
        if (evt.wheelDelta > 0)
        {
            rotatingratio += 10;
        }
        else
        {
            rotatingratio -= 10;
        }


        //ResizeCanvas(img.width*2, img.height*2);
        context.save();
        context.clearRect(0, 0, canvas.width, canvas.height);//清空内容
        context.translate(canvas.clientWidth / 2, canvas.clientHeight / 2);//中心坐标
        context.rotate(rotatingratio * Math.PI / 180);//旋转
        context.drawImage(rotatingimg, -rotatingimg.width / 2, -rotatingimg.height / 2);//居中画图
        context.restore();
    }
}
