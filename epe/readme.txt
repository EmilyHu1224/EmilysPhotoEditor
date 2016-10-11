Emily Photo Editor (EPE)

How to use it:

1: Open index.html in your browser with JavaScript enabled.

2: Your browser should support HTML5, upgrade your browser if not.

3: It is compatible with IE/Chrome/FireFox/Opera.

Profile of EPE

1: It is a sample of Single Page Application (SAP).
2: The only one page is index.html.
3: It only uses HTML+CSS+JavaScript, no other framework or tools of JavaScript or Stylesheet, such as jQuery, BootStrap, has been used.
4: No server-side code in order to be published at Github.

HTML5 features in the EPE: 

1: Canvas: use canvas to display photo and draw on it with mouse. 

2: File uploader: use <file> element to select one or more files (photoes) from the user's computer, and read the file data (i.e. the image) at the browser:
    
3: FileReader: read image in the <file> element.	
	var reader = new FileReader();
	reader.readAsDataURL(uploader.files[index]);

4: Dynamically add <img> elements and set the image data with DataURL:
   img.src = canvas.toDataURL();

5: Web worker: process photo with background thread, including filtering/brightening/carving/flipping

The content of EPE:

1: index.html: the only page in this web application.
2: epe.js: the main javascript controling the view/menu/event.
3: layout.js: javascript controling the layout and size adjustment of the page.
4: draw.js: javascript controling the drawing on the canvas (i.e. the mouse event handler, drawing menu response).
5: process.js: dispatcher of background thread (web worker) to process the image.
6: work.js: web worker (background thread), including 
   posting message to UI to display the progress of processing, and
   posting message to UI to notify the end of processing.
7: tools.js: miscellaneous functions, such as StringBuilder.
8: epe.css: the style of the page.
9: images: the directory containing the images for buttons.
10: props: the directory containing the images for props.
11: cursor: the directory containing the images for the cursors of paintbrushes (at different states, including draw/erase/select color/resize).
12: album: the directory containing the sample photos.

Skills/technology in EPE:

1: The advantages of SPA

   Single-Page Applications (SPAs) are Web apps that
   - load a single HTML page, and
   - dynamically update that page as the user interacts with the app.

   SPAs avoid reloading/redirecting the page, and thus make the UI smoother.

   in EPE:
   (1) Only one page (index.html) loaded at open.
   (2) Dynamically controled menu(toolbar) and div (such as album)
   (3) A windows application UI/layout: header/title bar + main content + footer/status bar.
   (4) Open a file with file-select-dialog (the <file> element is used in the background)
   (5) Processing the photo (such as filtering) without blocking the UI-reponse (by using webwork thread of HTML5 in the background)

2: It uploads file on the browser in the same way as opening a file with a dialog on a window application.
   refer to EPE_Load();

3: It makes the buttons on toolbar ligthened on mouse-over.
   refer to EPE_BrightButton(), BrightenImage()

4: It supports drag-drop (i.e. dragging a photo from album into canvas, dragging a props into canvas, moving props on canvas)
   refer to EPE_DragStart()

5: It uses webwork to fill the long-time-image-processing in the background by 
   showing progress (communication between UI and the background thread),
   and allowing the user has to cancel the progress (communication between UI and the background thread)
   refer to EPE_Process() and worker.js
