/*
 * Emily Photo Editor For Web (EPE)
 *
 * https://github.com/Emily1997/emily1997.github.io
 *
 * web worker (background thread)
 * 
 * Post message to UI to display the progress of processing
 * Post message to UI to notify the end of processing
 * 
 */

//the image data in the canvas:
//each pixel contains 4 data in a group as following
//R(0 - 255)/G(0-255)/B(0-255)/A-alpha(0-255,0 indicates it is transparent completely, 255 the pixel is visible completely) 


//while receive a message from UI, start to work.
onmessage = function (event)
{

    switch (event.data.type)
    {
        case 1: filtering(event.data.image, event.data.option); break;
        case 2: carving(event.data.image, event.data.blankImage, event.data.option); break;
        case 3: brightening(event.data.image, event.data.value); break;
        case 5: flipping(event.data.image, event.data.blankImage, 3); break;

    }

    //the flipping can be done faster in the canvas inner method, 
    //but in this case, it is processed in the UI thread, so the UI is locked for the processing time, and we can not display the progress.
    //turnning clockwise 90 degree can not work now)
    //flipping(event.data.data, event.data.degree);
};

//filtering process the pixels one by one in the original order,
//so we can save the processed pixels in the original array directlt.
function filtering(imgdata, option)
{
    //R(0-255)G(0-255)/B(0-255)/A-alpha(0-255) of each point, 4 items in a group
    for (var i = 0, k = 0; i < imgdata.data.length; i += 4, k++)
    {

        //post a message to UI to display the progress.
        if (k == 1000)
        {
            k = 0;
            postMessage({ state: 0, data: Math.floor((i / imgdata.data.length) * 100) });
        }

        var r = imgdata.data[i];
        var g = imgdata.data[i + 1];
        var b = imgdata.data[i + 2];
        var a = imgdata.data[i + 3];

        //invert color
        if (option == 1)
        {
            imgdata.data[i] = 255 - r;
            imgdata.data[i + 1] = 255 - g;
            imgdata.data[i + 2] = 255 - b;
        }

        //black-and-white 
        if (option == 2)
        {
            //the following filtering parameters comes from internet resources.
            imgdata.data[i] = (r * 0.272) + (g * 0.534) + (b * 0.131);
            imgdata.data[i + 1] = (r * 0.349) + (g * 0.686) + (b * 0.168);
            imgdata.data[i + 2] = (r * 0.393) + (g * 0.769) + (b * 0.189);
        }

        //sepia
        if (option == 3)
        {
            //the following filtering parameters comes from internet resources.
            //var m = [0.393, 0.769, 0.189, 0, 0, 0.349, 0.686, 0.168, 0, 0, 0.272, 0.534, 0.131, 0, 0, 0, 0, 0, 1, 0];
            //imgdata.data[i] = r * m[0] + g * m[1] + b * m[2] + a * m[3] + m[4];
            //imgdata.data[i + 1] = r * m[5] + g * m[6] + b * m[7] + a * m[8] + m[9];
            //imgdata.data[i + 2] = r * m[10] + g * m[11] + b * m[12] + a * m[13] + m[14];
            //imgdata.data[i + 3] = r * m[15] + g * m[16] + b * m[17] + a * m[18] + m[19];
            imgdata.data[i] = (r * 0.393) + (g * 0.769) + (b * 0.189); //red
            imgdata.data[i + 1] = (r * 0.349) + (g * 0.686) + (b * 0.168); //green
            imgdata.data[i + 2] = (r * 0.272) + (g * 0.534) + (b * 0.131); //blue
        }

        //gray scale
        if (option == 30)
        {
            //the average value of RGB.
            var gray = (imgdata.data[i] + imgdata.data[i + 1] + imgdata.data[i + 2]) / 3;

            //and save it to three RGB data as gray scale.
            imgdata.data[i] = gray;
            imgdata.data[i + 1] = gray;
            imgdata.data[i + 2] = gray;
        }

        //red-cover
        if (option == 31)
        {
            imgdata.data[i] = (r + g + b) / 3;
            imgdata.data[i + 1] = 0;
            imgdata.data[i + 2] = 0;
        }
        //green-cover
        if (option == 32)
        {
            imgdata.data[i + 1] = (r + g + b) / 3;
            imgdata.data[i] = 0;
            imgdata.data[i + 2] = 0;
        }

        //blue-cover
        if (option == 33)
        {
            imgdata.data[i + 2] = (r + g + b) / 3;
            imgdata.data[i] = 0;
            imgdata.data[i + 1] = 0;
        }

        //silhouette
        if (option == 34)
        {
            //the average value of RGB.
            var gray = (imgdata.data[i] + imgdata.data[i + 1] + imgdata.data[i + 2]) / 3;
            if (gray < 80) gray = 0;
            else gray = 255;

            //and save it to three RGB data as gray scale.
            imgdata.data[i] = gray;
            imgdata.data[i + 1] = gray;
            imgdata.data[i + 2] = gray;
        }

    }

    //post a message to EPE to notify the end of processing.
    postMessage({ state: 1, image: imgdata });
}

//adjust the brightness
function brightening(imgdata, value)
{
    for (var i = 0, k = 0; i < imgdata.data.length; i += 4, k++)
    {
        //post a message to UI to display the progress.
        if (k == 1000)
        {
            k = 0;
            postMessage({ state: 0, data: Math.floor((i / imgdata.data.length) * 100) });
        }

        imgdata.data[i] += value;
        imgdata.data[i + 1] += value;
        imgdata.data[i + 2] += value;
    }

    //post a message to UI to notify the end of processing.
    postMessage({ state: 1, image: imgdata });
}


//carving process the pixels not in the original order completely, so we had to use a new array.
//because we can not copy the image data (a huge array directly) like array1=array2 with js, 
//we had to copy each rgb one by one, it needs a lot of time with js.
//and, just build an object like canvas' imageData {width:x, height:x,data:newImageData} can not work also!
//the blankImage comes from epe's ui created by the canvas directly (it does not need a lot of time), 
//so we can save the processed image data in this array directly and return to the ui.
function carving(imgdata, blankImage, option)
{
    var w = imgdata.width;
    var h = imgdata.height;

    for (var x = 1; x < w - 1; x++)
    {

        //post a message to the UI to display the progress.
        postMessage({ state: 0, data: Math.floor((x / w) * 100) });

        for (var y = 1; y < h - 1; y++)
        {
            //the new index after carving, 4 data in a group.   
            var idx = (x + y * w) * 4;

            //the ogiginal index of the pixel, 4 data in a group.
            var aidx;
            var bidx;

            if (option == 1)
            {
                //indent: before pixel value - after pixel value + 128
                aidx = ((x - 1) + y * w) * 4;
                bidx = ((x + 1) + y * w) * 4;
            }
            else
            {
                //convex: after pixel value - before pixel value + 128 
                aidx = ((x + 1) + y * w) * 4;
                bidx = ((x - 1) + y * w) * 4;
            }

            //calculate new RGB value 
            var nr = imgdata.data[aidx + 0] - imgdata.data[bidx + 0] + 128;
            var ng = imgdata.data[aidx + 1] - imgdata.data[bidx + 1] + 128;
            var nb = imgdata.data[aidx + 2] - imgdata.data[bidx + 2] + 128;

            nr = (nr < 0) ? 0 : ((nr > 255) ? 255 : nr);
            ng = (ng < 0) ? 0 : ((ng > 255) ? 255 : ng);
            nb = (nb < 0) ? 0 : ((nb > 255) ? 255 : nb);

            //new pixel value, save in the blank image data. 
            blankImage.data[idx + 0] = nr; // Red channel 
            blankImage.data[idx + 1] = ng; // Green channel 
            blankImage.data[idx + 2] = nb; // Blue channel 
            blankImage.data[idx + 3] = 255; // Alpha channel 
        }
    }

    //post a message to EPE to notify the end of processing.
    postMessage({ state: 1, image: blankImage });

    //the following copying needs a lot of time.
    //for (var i = 0; i < imgdata.data.length; i++) imgdata.data[i] = newImageData[i];       
    //postMessage({ state: 1, image: imgdata });
}


function flipping(imgdata, blankImage, degree)
{
    var w = imgdata.width;
    var h = imgdata.height;

    //flip horizontally
    if (degree == 1)
    {

        var half_w = w / 2;
        for (var y = 0; y < h; y++)
        {

            //post a message to EPE to display the progress.
            postMessage({ state: 0, data: Math.floor((y / h) * 100) });

            for (var x = 0; x < half_w; x++)
            {

                //left side point
                var p1 = y * w + x;

                //right side point
                var p2 = y * w + w - x - 1;

                //RGBA
                for (var i = 0; i < 4 ; i++)
                {
                    var d1 = imgdata.data[p1 * 4 + i];
                    var d2 = imgdata.data[p2 * 4 + i];

                    imgdata.data[p1 * 4 + i] = d2;
                    imgdata.data[p2 * 4 + i] = d1;
                }
            }
        }
        //post a message to EPE to notify the end of flipping.
        postMessage({ state: 1, image: imgdata });
    }

    //flip horizontally
    if (degree == 2)
    {
        var half_h = h / 2;
        for (var x = 0; x < w; x++)
        {
            postMessage({ state: 0, data: Math.floor((x / w) * 100) });

            for (var y = 0; y < half_h; y++)
            {

                //top side point
                var p1 = y * w + x;

                //bottom side point
                var p2 = (h - y - 1) * w + x;

                //RGBA
                for (var i = 0; i < 4 ; i++)
                {
                    var d1 = imgdata.data[p1 * 4 + i];
                    var d2 = imgdata.data[p2 * 4 + i];

                    imgdata.data[p1 * 4 + i] = d2;
                    imgdata.data[p2 * 4 + i] = d1;
                }
            }
        }

        postMessage({ state: 1, image: imgdata });
    }

    //turn clockwise 90 degree (it can not work now)
    if (degree == 3)
    {
        var p2 = 0;
        for (var x = 0; x < w; x++)
        {
            postMessage({ state: 0, data: Math.floor((x / h) * 100) });

            for (var y = h - 1; y >= 0; y--)
            {
                //original point
                var p1 = (y * w + x) * 4;

                //RGBA
                for (var i = 0; i < 4 ; i++)
                {
                    blankImage.data[p2] = imgdata.data[p1 + i];
                    p2++;
                }
            }
        }

        postMessage({ state: 1, image: blankImage });
    }
}


