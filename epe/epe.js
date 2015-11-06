/* Emily Photo Editor For Web (EPE) */

var VTitle = "Emily Photo Editor For Web (EPE 0.1)";
var PenColors = ["#000000", "#999999", "#CCCCCC", "#00FFFF", "#FF00FF", "#800000", "#008000", "#00FF00", "#800000", "#000080", "#808000", "#800080", "#FF0000", "#008080", "#FFFF00", "#0000FF"];
var PenSizes = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25];
var EPE = {};

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

    EPE.colorTable = null;
    EPE.sizeTable = null;

    EPE.no = 0;//the auto-increasing number for the id of photo
    EPE.index = 0;//the index of selected photos is being added into album.
    EPE.editing = null;//the photo that is being editted.
    EPE.worker = null;//processing worker.
    EPE.working = false;

    //toolbar
    EPE.toolbar = document.getElementById(id + "_toolbar");
    EPE.bpen = document.getElementById(id + "_pen");
    EPE.beraser = document.getElementById(id + "_eraser");
    EPE.bselect = document.getElementById(id + "_select");
    EPE.bcolor = document.getElementById(id + "_color");
    EPE.info = document.getElementById(id + "_info");
    EPE.buttons = document.getElementById(id + "_buttons");
    EPE.uploader = document.getElementById(id + "_uploader");
    EPE.io = document.getElementById(id + "_io");
    EPE.bclear = document.getElementById(id + "_clear");
    EPE.bsave = document.getElementById(id + "_save");
    EPE.processors = document.getElementById(id + "_processors");

    //elements on main area
    EPE.outalbum = document.getElementById("outalbum");
    EPE.album = document.getElementById("album");

    EPE.outpad = document.getElementById("outpad");
    EPE.pad = document.getElementById("pad");
    EPE.drop = document.getElementById("drop");
    EPE.canvas = document.getElementById(id);

    EPE.props = document.getElementById("props");

    //elements on footer
    EPE.footbar = document.getElementById(id + "_footbar");
    EPE.status = document.getElementById(id + "_status");

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
            EPE_SizeCanvas();

            //Register the mouse event for the canvas.
            canvas.addEventListener('mousedown', HWMouseDown, false);
            canvas.addEventListener('mousemove', HWMouseMove, false);
            canvas.addEventListener('mouseup', HWMouseUp, false);
            canvas.addEventListener('mouseout', HWMouseOut, false);

            pad.addEventListener('mousewheel', EPE_MouseWheel, false);
            pad.addEventListener('wheel', EPE_MouseWheel, false);

            //Register the touching event for the canvas.
            canvas.addEventListener('touchstart', HWMouseDown, false);
            canvas.addEventListener('touchmove', HWMouseMove, false);
            canvas.addEventListener('touchend', HWMouseUp, false);


            for (var i = 1; i <= 30; i++)
            {
                var img = new Image();
                img.id = "props" + i;
                img.src = "props/" + i + ".png";

                //Enable the img tag draggable
                img.title = "Click or drag to the canvas to decorate your photo.\r\nDrag to props to remove.";
                img.draggable = true;
                img.addEventListener('dragstart', EPE_DragStart, false);
                props.appendChild(img);
            }
        }

        //Start to drawing
        EPE_SetFlag(10);
    }
}

//Change the state
function EPE_SetFlag(f)
{
    with (EPE)
    {
        //10:using pen, when the mouse down, start drawing
        //11:drawing
        //20:using eraser, when the mouse down, start erasing
        //21:earsing
        //30:using selecter, when the mouse down, start selecting
        //31:selecting
        //91:setting pen's color
        //92:setting pen's size

        flag = f;

        bpen.style.borderStyle = (flag == 10 || flag == 11) ? "solid" : "none";
        beraser.style.borderStyle = (flag == 20 || flag == 21) ? "solid" : "none";
        bselect.style.borderStyle = (flag == 30 || flag == 31) ? "solid" : "none";

        bclear.title = (flag == 30 || flag == 31) ? "Clear the selected area" : "Clear the entire image";
        bsave.title = (flag == 30 || flag == 31) ? "Save the selected area image to the album" : "Save the entire image to the album";

        if (flag != 30 && false != 31) EPE_RemoveSelector();
    }
    EPE_SetDrawing();
}


function EPE_ShowInfo(message)
{
    with (EPE)
    {
        processors.style.display = "none";
        buttons.style.display = "none";
        io.style.display = "";

        info.innerHTML = message;
    }
}
function EPE_ShowStatus(message)
{
    with (EPE)
    {
        status.innerHTML = message;
    }
}

//Adjust the default size of canvas.
function EPE_SizeCanvas()
{
    with (EPE)
    {
        //save the canvas's data to hidden image, because resizing the canvas will cause the image disappear.
        var img = new Image();
        img.src = canvas.toDataURL('image/png');

        //Resize the Canvas (because it does not support style)
        drop.style.width = pad.style.width;
        drop.style.height = pad.style.height;
        canvas.width = pad.clientWidth - 0;
        canvas.height = pad.clientHeight - 0;

        //Restore the image into the canvas
        context.drawImage(img, 0, 0);

        EPE_SetDrawing();
    }
}
function EPE_ResizeCanvas(width, height)
{
    with (EPE)
    {
        drop.style.width = width + "px";
        drop.style.height = height + "px";

        canvas.width = width;
        canvas.height = height;
    }
}

//Check whether the canvas contais any image
function EPE_HasData()
{
    with (EPE)
    {
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
        var reader = new FileReader();
        index = 0;

        if (uploader.files.length == 0)
        {
            EPE_ExitIO();
        }
        else
        {
            EPE_ShowInfo("Opening " + uploader.files[0].name + "...");
            reader.readAsDataURL(uploader.files[0]);
        }

        //the onload event happen after the file has been loaded.
        reader.onload = function ()
        {
            var img = new Image();
            img.src = this.result;
            EPE_AddToAlbum(img);

            index++;
            if (index >= uploader.files.length)
            {
                uploader.value = null;
                EPE_ExitIO();
            }
            else
            {
                EPE_ShowInfo("Opening " + uploader.files[index].name + "...");
                reader.readAsDataURL(uploader.files[index]);
            }
        }
    }
}
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

        //Restore the settings of canvas 
        EPE_SetDrawing();
    }
}
function EPE_Save(bnt)
{
    with (EPE)
    {
        if (flag == 30 && selectingDiv != null)
        {
            var img = new Image();
            img.src = canvas.toDataURL();

            var x = parseInt(selectingDiv.style.left);
            var y = parseInt(selectingDiv.style.top);
            var w = parseInt(selectingDiv.style.width);
            var h = parseInt(selectingDiv.style.height);

            var imgData = context.getImageData(x, y, w, h);
            canvas.width = w;
            canvas.height = h;
            context.putImageData(imgData, 0, 0);

            var img2 = new Image();
            img2.src = canvas.toDataURL();
            EPE_AddToAlbum(img2);

            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            EPE_SizeCanvas();

            EPE_RemoveSelector();
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
                    context.drawImage(p, parseInt(p.style.left.replace("px", "")), parseInt(p.style.top.replace("px", "")));
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

        EPE_SizeCanvas();
    }
}

//Scaling
function EPE_Scale(ratio)
{
    with (EPE)
    {
        //get the original image
        var img = new Image();
        img.src = canvas.toDataURL('image/png');

        //redraw the rotated image on the restored canvas        
        EPE_ResizeCanvas(img.width * ratio, img.height * ratio);

        context.drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width * ratio, img.height * ratio);
        EPE_SetDrawing();
    }
}

//Scaling the image on the canvas with mouse wheel.
function EPE_MouseWheel(evt)
{
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

    evt.target.style.with = parseInt(evt.target.style.with) * ratio + "px";
    evt.target.style.height = parseInt(evt.target.style.height) * ratio + "px";
}


//Processing with web worker
function EPE_OpenProcessor()
{
    with (EPE)
    {
        EPE_SetFlag(40);
        buttons.style.display = "none";
        processors.style.display = "";
    }
}
function EPE_ExitProcessor()
{
    with (EPE)
    {
        if (flag == 40)
        {
            buttons.style.display = "";
            processors.style.display = "none";
            EPE_SetFlag(10);
        }
        else
        {
            EPE_ExitIO();
        }
    }
}

function EPE_Process(option, value)
{
    with (EPE)
    {

        if (worker == null)
        {
            worker = new Worker("filter.js");
            worker.onmessage = function (event)
            {
                EPE_Process_Event(event.data);
            };
        }

        //get the image data from canvas
        var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        if (imageData == null) return false;
        if (imageData.data.length == 0) return false;
        working = true;

        //start the underground working thread.
        switch (option)
        {
            case 1://invert
            case 2://black-and-white
            case 3://sepia
            case 31://red cover
            case 32://green cover
            case 33://blue cover
                worker.postMessage({ type: 1, image: imageData, option: option });
                break;

            case 4://carving indent
            case 5://carving convex
                worker.postMessage({ type: 2, image: imageData, blankImage: context.createImageData(canvas.width, canvas.height), option: option - 3 });
                break;

            case 6://brightening
                worker.postMessage({ type: 3, image: imageData, value: value });
                break;

            case 7://grayscaling
                worker.postMessage({ type: 4, image: imageData });
                break;

            case 8://flipping
                worker.postMessage({ type: 5, image: imageData, blankImage: context.createImageData(canvas.height, canvas.width), option: option - 3 });
                break;
        }
    }
}
function EPE_Process_Event(eventData)
{
    with (EPE)
    {
        //processing progress from background web worker.
        if (eventData.state == 0)
        {
            var html = "<progress value=\"{0}\" max=\"100\"></progress>".replace("{0}", eventData.data);
            EPE_ShowInfo(html);
        }

        //end of processing from background web worker.
        if (eventData.state == 1)
        {
            working = false;

            //resize the canvas if the processed image has new size.
            if (eventData.image.width != canvas.width)
            {
                EPE_ResizeCanvas(eventData.image.width, eventData.image.height);
            }

            //save the processed image data to canvas
            context.putImageData(eventData.image, 0, 0);
            EPE_ExitIO();
        }
    }
}
function EPE_ExitIO()
{
    with (EPE)
    {
        if (working === true)
        {
            worker.terminate();
            working = false;
            worker = null;
        }

        io.style.display = "none";

        if (flag == 40)
        {
            processors.style.display = "";
        }
        else
        {
            buttons.style.display = "";
        }
    }
}


