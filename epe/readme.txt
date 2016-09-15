Emily Photo Editor (EPE)

How to use it:

1: Open index.html in your browser with JavaScript enabled.

2: Your browser should support HTML5, upgrade your browser if not.

3: It is compatible with IE/Chrome/FireFox/Opera.

4: You can also access it at 

Profile of EPE

1: It is a sample of Single Page Application (SAP).
2: The only one page is index.html.
3: Purely use HTML+CSS+JavaScript, no other framework or tools of JavaScript or Style used, such as jQuery, BootStrap.
4: No server-side code, because I want to publish at githut.

HTML5 features in the EPE: 

1: Canvas: use canvas to display photos and draw with mouse. 

2: File uploader: use <file> element to select one or more files (photoes) from user's computer, and read the file data (image) at the browser:
    var reader = new FileReader();
	reader.readAsDataURL(uploader.files[index]);

3: FileReader: read image in the <file> element.

4: Dynamically add <img> elements and set the image data with DataURL:
   img.src = canvas.toDataURL();

5: Web worker: process photo with background thread, such as filtering/brightening/carving/flipping

The content of EPE:

1: index.html: the only one page in the web application.
2: epe.js: the main javascript, control the view/menu/event.
3: layout.js: control the layout, size adjusting of the page.
4: draw.js: javascript controling the drawing on the canvas: mouse event handler, drawing menu response.
5: process.js: dispatcher of underground thread (web worker) to process image.
6: work.js: web worker (background thread), such as: 
   post message to UI to display the progress of processing,
   post message to UI to notify the end of processing.
7: tools.js: miscellaneous functions, such as StringBuilder.
8: epe.css: the style of the page.
9: images: the directory contains the images for buttons.
10: props: the directory contains the images for props.
11: cursor: the directory contains the images for the cursors of paintbrush (at different state: draw/erase/select color/resize).
12: album: the directory contains the sample photos.

Skills/technology in EPE:

1: the advantage of SPA
   单页面应用诞生于拥有更多动态页面内容的Web 2.0革命。
   旧的超链接页面浏览模型给用户带来了不和谐的体验，而原则允许数据驱动时间在一个页面内创建，并让页面内容在需要的时候更新。
   这意味着应用似乎可以运行得更加流畅，乃至于到达可仿真桌面与本地资源接口的地步。
   in EPE:
   (1) One page (index.html) only loaded at open.
   (2) Dynamically controled menu(toolbar) and div (such as album)
   (3) a windows application UI/layout: header/title bar + main content + footer/status bar.
   (4) Open a file with file-select-dialog (the <file> element is used in the background)
   (5) Processing the photo (such as filtering) without the UI-reponse blocked (use web work thread of HTML5 in the background)
   

2: uploads file at the browser like open a file with a dialog at window application.
   refer to EPE_Load();

3: makes the buttons on toolbar ligthened while mouse over them.
   refer to EPE_BrightButton(), BrightenImage()

4: supports drag-drop (drag a photo from album into canvas, drag a props into canvas, move props on canvas)
   refer to EPE_DragStart()

5: uses web work to fulfill the long-time-image-processing in the background, 
   show progress (communication between UI and the background thread)
   cancel the progress (communication between UI and the background thread)
   refer to EPE_Process() and worker.js
