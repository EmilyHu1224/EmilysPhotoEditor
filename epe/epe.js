/* Emily Photo Editor For Web (EPE) */

var VTitle = "Emily Photo Editor For Web (EPE 0.1)";
var PenColors = ["#000000", "#999999", "#CCCCCC", "#00FFFF", "#FF00FF", "#800000", "#008000", "#00FF00", "#800000", "#000080", "#808000", "#800080", "#FF0000", "#008080", "#FFFF00", "#0000FF"];
var PenSizes = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25];
var EPE = {};

function EPE_Init(id, pensize, pencolor)
{
    EPE.context = null;
    EPE.canvas = null;

    //State:0-invalid, 10-pen enabled, 11 - drawing, 20 - eraser enabled, 21 - erasing, 31 - setting color, 32 - setting pen size
    EPE.flag = 0;
    EPE.LastPose = null;
    EPE.pensize = pensize;
    EPE.pencolor = pencolor;
    EPE.toolbar = null;
    EPE.bpen = null;
    EPE.beraser = null;
    EPE.bcolor = null;

    EPE.colorTable = null;
    EPE.sizeTable = null;

    EPE.no = 0;//the auto-increasing number for the id of photo
    EPE.index = 0;//the index of selected photos is being added into album.
    EPE.editing = null;//the photo that is being editted.

    //toolbar
    EPE.toolbar = document.getElementById(id + "_toolbar");
    EPE.bpen = document.getElementById(id + "_pen");
    EPE.beraser = document.getElementById(id + "_eraser");
    EPE.bcolor = document.getElementById(id + "_color");
    EPE.info = document.getElementById(id + "_info");
    EPE.buttons = document.getElementById(id + "_buttons");
    EPE.uploader = document.getElementById(id + "_uploader");
    EPE.io = document.getElementById(id + "_io");

    //elements on main
    EPE.main = document.getElementById("main");

    EPE.outalbum = document.getElementById("outalbum");
    EPE.album = document.getElementById("album");

    EPE.outpad = document.getElementById("outpad");
    EPE.pad = document.getElementById("pad");
    EPE.canvas = document.getElementById(id);

    EPE.outprops = document.getElementById("outprops");
    EPE.props = document.getElementById("props");

    //footer
    EPE.footbar = document.getElementById(id + "_footbar");

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
            EPE_Size();

            //Register the mouse event for the canvas.
            canvas.addEventListener('mousedown', HWMouseDown, false);
            canvas.addEventListener('mousemove', HWMouseMove, false);
            canvas.addEventListener('mouseup', HWMouseUp, false);
            canvas.addEventListener('mouseout', HWMouseOut, false);

            //Register the touching event for the canvas.
            canvas.addEventListener('touchstart', HWMouseDown, false);
            canvas.addEventListener('touchmove', HWMouseMove, false);
            canvas.addEventListener('touchend', HWMouseUp, false);


            for (var i = 1; i <= 10; i++)
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

//Adjust the size of all controls
function EPE_Size()
{
    with (EPE)
    {

        //save the canvas's data to hidden image, because resizing the canvas will cause the image disappear.
        var img = new Image();
        img.src = canvas.toDataURL('image/png');

        var margin = 21;

        main.style.height = document.documentElement.clientHeight - toolbar.clientHeight - footbar.clientHeight - 4 + "px";
        main.style.width = document.documentElement.clientWidth - 1 + "px";

        album.style.height = main.clientHeight - margin + "px";
        props.style.height = main.clientHeight - margin + "px";
        pad.style.height = main.clientHeight - margin + "px";

        pad.style.width = main.clientWidth - props.clientWidth - album.clientWidth - 6 + "px";

        //Resize the Canvas (because it does not support style)
        canvas.width = pad.clientWidth - 2;
        canvas.height = pad.clientHeight - 2;



        //Restore the image into the canvas
        context.drawImage(img, 0, 0);

        //Restore the setting of the canvas
        EPE_SetCanvas();
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
        //copy the image from thumbnail and restore the real size.
        var vimg = new Image();
        vimg.src = img.src;

        editing = img;

        //set the size of canvas size according to the photo's real size
        canvas.width = vimg.width;
        canvas.height = vimg.height;

        //copy the photo into the canvas
        context.drawImage(vimg, 0, 0);

        //Restore the settings of canvas 
        EPE_SetCanvas();
    }
}
function EPE_Save(bnt)
{
    with (EPE)
    {
        buttons.style.display
        //Draw all props on the canvas and remove all props.
        for (var i = 0; i < pad.childNodes.length; i++)
        {
            var img = pad.childNodes[i];
            if (img.tagName != "IMG") continue;
            context.drawImage(img, parseInt(img.style.left.replace("px", "")), parseInt(img.style.top.replace("px", "")));
            pad.removeChild(img);
            i--;
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

        //Resize the Canvas (because it does not support style)
        canvas.width = pad.clientWidth - 2;
        canvas.height = pad.clientHeight - 2;

        //Restore the setting of the canvas
        EPE_SetCanvas();
    }
}
function EPE_DragStart(evt)
{
    evt.dataTransfer.setData("Text", evt.target.id);
}
function EPE_Drop(evt)
{
    evt.preventDefault();
    var id = evt.dataTransfer.getData("Text");
    if (id.indexOf("props") == 0)
    {
        //Add props
        var prop = document.getElementById(id);

        var img = new Image();
        img.id = "selected_" + id;//Set up a new id to identify
        img.src = prop.src;
        img.style.position = "absolute";

        var p = HWPose(evt);
        img.style.left = p.x + "px";
        img.style.top = p.y + "px";

        img.title = "Click or drag to the canvas to decorate your photo.\r\nDrag to props to remove.";
        img.draggable = true;
        img.addEventListener('dragstart', EPE_DragStart, false);
        pad.appendChild(img);
    }
    else
    {
        if (id.indexOf("selected_") == 0)
        {
            //move selected props
            var img = document.getElementById(id);

            var p = HWPose(evt);
            img.style.left = p.x + "px";
            img.style.top = p.y + "px";
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

function EPE_Flip()
{
    with (EPE)
    {
        //get the original image
        var img = new Image();
        img.src = canvas.toDataURL('image/png');

        //rotate the cavas and save the rotated image
        canvas.width = img.height;
        canvas.height = img.width;
        context.rotate(90 * Math.PI / 180);
        context.drawImage(img, 0, 0 - img.height);
        img.src = canvas.toDataURL('image/png');

        //restore canvas, use small size to enhance the perfomace
        canvas.width = 10;
        canvas.height = 10;
        context.rotate(0 - 90 * Math.PI / 180);

        //redraw the rotated image on the restored canvas
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        EPE_SetCanvas();
    }
}
function EPE_Scale(ratio)
{
    with (EPE)
    {
        //get the original image
        var img = new Image();
        img.src = canvas.toDataURL('image/png');

        //scale the canvas and re-draw the image
        canvas.width = canvas.width * ratio;
        canvas.height = canvas.height * ratio;
        context.scale(ratio, ratio);
        context.drawImage(img, 0, 0);

        //save the scaled image
        img.src = canvas.toDataURL('image/png');

        //restore canvas, use small size to enhance the perfomace
        canvas.width = 10;
        canvas.height = 10;
        context.scale(ratio == 2 ? 0.5 : 2, ratio == 2 ? 0.5 : 2);

        //redraw the rotated image on the restored canvas
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        EPE_SetCanvas();
    }
}
function EPE_Command(select)
{
    with (EPE)
    {
        if (select.options[select.selectedIndex].value === "rotate")
        {
            var m = [
  0.393, 0.769, 0.189, 0, 0,
  0.349, 0.686, 0.168, 0, 0,
  0.272, 0.534, 0.131, 0, 0,
      0, 0, 0, 1, 0,
            ];

            //R(0-255)G(0-255)/B(0-255)/A-alpha(0-255) of each point, 4 items in a group
            var d = context.getImageData(0, 0, canvas.width, canvas.height);
            if (d == null) return false;
            if (d.data.length == 0) return false;
            d = d.data;

            for (var i = 0; i < d.length; i += 4)
            {
                var r = d[i];
                var g = d[i + 1];
                var b = d[i + 2];
                var a = d[i + 3];

                d[i] = r * m[0] + g * m[1] + b * m[2] + a * m[3] + m[4];
                d[i + 1] = r * m[5] + g * m[6] + b * m[7] + a * m[8] + m[9];
                d[i + 2] = r * m[10] + g * m[11] + b * m[12] + a * m[13] + m[14];
                d[i + 3] = r * m[15] + g * m[16] + b * m[17] + a * m[18] + m[19];
            }

            context.putImageData(d, 0, 0);

        }

        select.selectedIndex = 0;
    }
}

window.onresize = function ()
{
    EPE_Size();
}

function EPE_ShowInfo(message)
{
    with (EPE)
    {
        buttons.style.display = "none";
        io.style.display = "table-cell";
        info.innerHTML = message;
    }
}
function EPE_ExitIO()
{
    with (EPE)
    {
        buttons.style.display = "table-cell";
        io.style.display = "none";
    }
}

function EPE_SetCanvas()
{
    with (EPE)
    {
        //Restore the setting of the canvas
        context.lineCap = "round";
        context.lineWidth = pensize;
        context.strokeStyle = pencolor;
    }
}