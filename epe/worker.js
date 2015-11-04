//web worker (background thread)

//while receive a message from EPE, start to work.
onmessage = function (event)
{
    if (event.data.type == 1)
    {
        flipping(event.data.data, event.data.degree);
    }
};

function flipping(imgdata, degree)
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
            postMessage({ state: 0, data: Math.floor((y / h) * 100) + "%" });

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
            postMessage({ state: 0, data: Math.floor((x / w) * 100) + "%" });
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

    //turn clockwise 90 degree
    if (degree == 3)
    {
        var newImageData = new Uint8ClampedArray(imgdata.data.length);

        for (var y = 0; y < h; y++)
        {
            postMessage({ state: 0, data: Math.floor((y / h) * 100) + "%" });

            for (var x = 0; x < w; x++)
            {

                //original point
                var p1 = y * w + x;
                var p2 = x * h + y;

                //RGBA
                for (var i = 0; i < 4 ; i++)
                {
                    newImageData[p2 * 4 + i] = imgdata.data[p1 * 4 + i];
                }
            }
        }

        //for (var y = h - 1; y >= 0; y--)
        //{
        //    postMessage({ state: 0, data: Math.floor((y / h) * 100) + "%" });

        //    for (var x = 0; x < w; x++)
        //    {

        //        //original point
        //        var p1 = y * w + x;

        //        //RGBA
        //        for (var i = 0; i < 4 ; i++)
        //        {
        //            newImageData[p2] = imgdata.data[p1 * 4 + i];
        //            p2++;
        //        }
        //    }
        //}

        

        for (var i = 0; i < imgdata.data.length; i++)
        {
            imgdata.data[i] = newImageData[i];
        }
        imgdata.width = h;
        imgdata.height = w;
        postMessage({ state: 1, image: imgdata });
    }
}


