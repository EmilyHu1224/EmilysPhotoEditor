
var worker;
var degree = 0;

function EPE_Flip()
{
    with (EPE)
    {
        //R(0-255)G(0-255)/B(0-255)/A-alpha(0-255) of each point, 4 items in a group
        var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        if (imageData == null) return false;
        if (imageData.data.length == 0) return false;

        var w = canvas.width;
        var h = canvas.height;
        return;

        if (typeof (worker) == "undefined")
        {
            worker = new Worker("worker.js");
            worker.onmessage = function (event)
            {
                EPE_Flip_Event(event.data);
            };
        }

        worker.postMessage({ type: 1, data: imageData, degree: degree });

    }
}
function EPE_Flip_Event(eventData)
{
    with (EPE)
    {
        if (eventData.state == 0)
        {
            EPE_ShowInfo("Flipping: " + eventData.data);
        }

        if (eventData.state == 1)
        {
            //flip horizontally
            if (degree == 1)
            {

            }

            //flip horizontally
            if (degree == 2)
            {

            }

            //turn clockwise 90 degree
            if (degree == 3)
            {
                canvas.width = eventData.image.height;
                canvas.height = eventData.image.width;

                //Restore the setting of the canvas
                context.lineCap = "round";
                context.lineWidth = pensize;
                context.strokeStyle = pencolor;
            }

            context.putImageData(eventData.image, 0, 0);

            EPE_ExitIO();
        }
    }
}

