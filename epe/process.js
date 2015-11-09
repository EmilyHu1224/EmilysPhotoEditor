/*
 * Emily Photo Editor For Web (EPE)
 *
 * https://github.com/Emily1997/emily1997.github.io
 *
 * Processing image with web worker
 * Refer to worker.js
 * 
 */

//open the processor panel
function EPE_OpenProcessor()
{
    with (EPE)
    {
        if (EPE_HasData() == false)
        {
            EPE_ShowInfo("There is nothing on the canvas.");
        }
        else
        {
            EPE_ChangeState(40);
        }
    }
}

//close the processor panel
function EPE_ExitProcessor()
{
    with (EPE)
    {
        EPE_ChangeState(lastState);      
    }
}

//start to process the image
//causion: flipping will call from editor panel directly.
function EPE_Process(option, value)
{
    with (EPE)
    {
        //Start the web worker or restart it if it had been terminated.
        if (worker == null)
        {
            worker = new Worker("worker.js");
            worker.onmessage = function (event)
            {
                EPE_Process_Event(event.data);
            };
        }

        //get the image data from canvas for processing
        var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        if (imageData == null) return false;
        if (imageData.data.length == 0) return false;

        working = true;
        EPE_ShowStatus("Processing");

        //start the underground working thread.
        switch (option)
        {
            case 1://invert
            case 2://black-and-white
            case 3://sepia
            case 30://grayscaling
            case 31://red cover
            case 32://green cover
            case 33://blue cover
            case 34://silhouette
                worker.postMessage({ type: 1, image: imageData, option: option });
                break;

            case 4://carving indent
            case 5://carving convex
                worker.postMessage({ type: 2, image: imageData, blankImage: context.createImageData(canvas.width, canvas.height), option: option - 3 });
                break;

            case 6://brightening
                worker.postMessage({ type: 3, image: imageData, value: value });
                break;

            case 8://flipping
                worker.postMessage({ type: 5, image: imageData, blankImage: context.createImageData(canvas.height, canvas.width), option: option - 3 });
                break;
        }
    }
}

//on receiving the message posted by the underground web worker.
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
                ResizeCanvas(eventData.image.width, eventData.image.height);
            }

            //save the processed image data to canvas
            context.putImageData(eventData.image, 0, 0);
            EPE_ExitIO();
            EPE_ShowStatus(state);
        }
    }
}


