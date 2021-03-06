/**
 * @author Joel Espinosa Longi
 * @licencia LGPL - http://www.gnu.org/licenses/lgpl.html
 */

var descartesJS = (function(descartesJS) {
  if (descartesJS.loadLib) { return descartesJS; }

  var scale;
  var barWidth;
  var barHeight;

  /**
   * Descartes loader
   * @constructor
   * @param {<applet>} applet the applet to interpret
   */
  descartesJS.DescartesLoader = function(descartesApp) {
    var self = this;

    this.children = descartesApp.children;
    this.lessonParser = descartesApp.lessonParser;
    this.images = descartesApp.images;
    this.images.length = descartesApp.images.length;
    this.audios = descartesApp.audios;
    this.audios.length = descartesApp.audios.length;
    this.descartesApp = descartesApp;

    var imageURL = (descartesApp.imgLoader) ? descartesApp.imgLoader : drawDescartesLogo(descartesApp.loader.width, descartesApp.loader.height, descartesApp.ratio);

    this.imageLoader = document.createElement("div");
    this.imageLoader.width = descartesApp.width;
    this.imageLoader.height = descartesApp.height;
    this.imageLoader.setAttribute("class", "DescartesLoaderImage")
    this.imageLoader.setAttribute("style", "background-image:url(" + imageURL + ");background-size:cover;width:" + descartesApp.width + "px;height:" + descartesApp.height + "px;");

    descartesApp.loader.appendChild(this.imageLoader);

    this.loaderBar = document.createElement("canvas");
    this.loaderBar.width = descartesApp.width;
    this.loaderBar.height = descartesApp.height;
    this.loaderBar.setAttribute("class", "DescartesLoaderBar");
    this.loaderBar.setAttribute("style", "width:" + descartesApp.width + "px;height:" + descartesApp.height + "px;");
    this.loaderBar.ctx = this.loaderBar.getContext("2d");

    descartesApp.loader.appendChild(this.loaderBar);

    this.barWidth = 80;
    this.barHeight = Math.floor(descartesApp.loader.height/70);

    this.timer = descartesJS.setInterval(function() { self.drawLoaderBar(self.loaderBar.ctx, descartesApp.width, descartesApp.height); }, 10);

    descartesApp.firstRun = false;

    this.initPreloader();
  }

  /**
   * Init the preload of images and audios
   */
  descartesJS.DescartesLoader.prototype.initPreloader = function() {
    var children = this.children;
    var images = this.images;
    var audios = this.audios;
    var regExpImage = /[\w\.\-//]*(\.png|\.jpg|\.gif|\.svg)/gi;
    var regExpAudio = /[\w\.\-//]*(\.ogg|\.oga|\.mp3|\.wav)/gi;

    // if arquimedes then add the license image
    var licenceFile = "lib/DescartesCCLicense.png";
    images[licenceFile] = descartesJS.getCCLImg();
    images[licenceFile].addEventListener('load', function() { this.ready = 1; });
    images[licenceFile].addEventListener('error', function() { this.errorload = 1; });

    var imageFilename;
    var imageTmp;
    var audioFilename;
    var vec;
    var i, j, l, il, al;
    // check all children in the applet
    for (i=0, l=children.length; i<l; i++) {
      if (children[i].name === "rtf") {
        continue;
      }

      // macro patch
      if (children[i].value.match(/'macro'|'makro'/g)) {
        var filename = "";
        var response;

        var values = this.lessonParser.split(children[i].value);
        for (var v_i=0, v_l=values.length; v_i<v_l; v_i++) {
          if (babel[values[v_i][0]] === "expresion") {
            filename = values[v_i][1];
          }
        }

        if (filename) {
          // the macro is embeded in the webpage
          var macroElement = document.getElementById(filename);

          if ((macroElement) && (macroElement.type == "descartes/macro")) {
            response = macroElement.text;
          }
          // the macro is in an external file
          else {
            response = descartesJS.openExternalFile(filename);

            // verify the content is a Descartes macro
            if ( (response) && (!response.match(/tipo_de_macro/g)) ) {
              response = null;
            }
          }
        }

        if (response) {
          imageFilename = response.match(regExpImage);
          if (imageFilename) {
            for (j=0, il=imageFilename.length; j<il; j++) {
              imageTmp = imageFilename[j];

              // if the filename is not VACIO.GIF or vacio.gif
              if (!(imageTmp.toLowerCase().match(/vacio.gif$/)) && ((imageTmp.substring(0, imageTmp.length-4)) != "") ) {
                images[imageTmp] = new Image();
                images[imageTmp].addEventListener('load', function() { this.ready = 1; });
                images[imageTmp].addEventListener('error', function() { this.errorload = 1; });
                images[imageTmp].src = imageTmp;
              }
            }
          }
        }
      }
      // macro patch

      // check if the children has an image filename
      imageFilename = (children[i].value).match(regExpImage);

      // if imageFilename has a match then add the images
      if (imageFilename) {
        for (j=0, il=imageFilename.length; j<il; j++) {
          imageTmp = imageFilename[j];

          // if the filename is not VACIO.GIF or vacio.gif
          if (!(imageTmp.toLowerCase().match(/vacio.gif$/)) && ((imageTmp.substring(0, imageTmp.length-4)) != "") ) {
            images[imageTmp] = new Image();
            images[imageTmp].addEventListener('load', function() { this.ready = 1; });
            images[imageTmp].addEventListener('error', function() { this.errorload = 1; });
            images[imageTmp].src = imageTmp;
          }
        }
      }

      // check if the children has an audio filename
      audioFilename = (children[i].value).match(regExpAudio);

      // if audioFilename has a match then add the audios
      if (audioFilename) {
        for (j=0, al=audioFilename.length; j<al; j++) {
          this.initAudio(audioFilename[j]);
        }
      }
    }

    // count how many images
    for (var propName in images) {
      if (images.hasOwnProperty(propName)) {
        this.images.length++;
      }
    }

    // count how many audios
    for (var propName in audios) {
      if ((audios).hasOwnProperty(propName)) {
        this.audios.length++;
      }
    }

    var self = this;
    var total = this.images.length + this.audios.length;
    this.sep = (2*(this.barWidth-2))/total;

    /**
     * Function that checks if all the media are loaded
     */
    var checkLoader = function() {
      // contador para determinar cuantas imagenes se han cargado
      self.readys = 0;

      // how many images are loaded
      for (var propName in images) {
        if (images.hasOwnProperty(propName)) {
          if ( (images[propName].ready) || (images[propName].errorload) ) {
            self.readys++;
          }
        }
      }

      // how many audios are loaded
      for (var propName in self.audios) {
        if (audios.hasOwnProperty(propName)) {
          if ( (audios[propName].ready) || (audios[propName].errorload) ) {
            self.readys++;
          }
        }
      }

      // if the number of count elements is different to the total then execute again checkLoader
      if (self.readys != total) {
        descartesJS.setTimeout(checkLoader, 30);
      }
      // if the number of count elements is equal to the total then clear the timer and init the build of the app
      else {
        descartesJS.clearInterval(self.timer);
        self.descartesApp.initBuildApp();
      }
    }

    // first execution of checkLoader
    checkLoader();
  }

  /**
   * Add a new audio to the array of audios
   * @param {String} file the filename of the new audio
   */
  descartesJS.DescartesLoader.prototype.initAudio = function(file) {
    var audios = this.audios;

    audios[file] = new Audio(file);
    audios[file].filename = file;

    var onCanPlayThrough = function() {
      this.ready = 1;
    }

    var onError = function() {
      if (!this.canPlayType("audio/" + this.filename.substring(this.filename.length-3)) && (this.filename.substring(this.filename.length-3) == "mp3")) {
        audios[file] = new Audio(this.filename.replace("mp3", "ogg"));
        audios[file].filename = this.filename.replace("mp3", "ogg");
        audios[file].addEventListener('canplaythrough', onCanPlayThrough);
        audios[file].addEventListener('load', onCanPlayThrough);
        audios[file].addEventListener('error', onError);
        audios[file].load();
      }
      else {
        console.log("El archivo '" + file + "' no puede ser reproducido");
        this.errorload = 1;
      }
    }
    audios[file].addEventListener('canplaythrough', onCanPlayThrough);
    audios[file].addEventListener('load', onCanPlayThrough);
    audios[file].addEventListener('error', onError);

    if (descartesJS.hasTouchSupport) {
      audios[file].load();
      audios[file].play();
      descartesJS.setTimeout( function(){
        // console.log("detenido");
        audios[file].pause();
      }, 20);
      audios[file].ready = 1;
    } else {
      audios[file].load();
    }
  }
  /**
   * Draw the loader bar
   * @param {CanvasContextRendering2D} ctx the context render where to draw
   * @param {Number} w the width of the canvas
   * @param {Number} h the height of the canvas
   */
  descartesJS.DescartesLoader.prototype.drawLoaderBar = function(ctx, w, h) {
    barWidth = this.barWidth;
    barHeight = this.barHeight;

    ctx.translate(w/2, (h-(65*scale))/2 +90*scale);
    ctx.scale(scale, scale);

    ctx.strokeRect(-barWidth, -barHeight, 2*barWidth, barHeight);

    ctx.fillStyle = "#888";
    ctx.fillRect(-barWidth+2, -barHeight+2, 2*(barWidth-2), barHeight-4);

    ctx.fillStyle = "#1f358d";
    ctx.fillRect(-barWidth+2, -barHeight+2, this.readys*this.sep, barHeight-4);

    // reset the transformation
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /**
   * Draw the descartesJS logo
   * @param {Number} w space width
   * @param {Number} h space height
   * @return {Image} return the image corresponding to the logo
   */
  var drawDescartesLogo = function(w, h, ratio) {
    var canvas = document.createElement("canvas");
    var ratio = ((w*this.ratio * h*this.ratio) > 5000000) ? 1 : ratio;

    canvas.width  = w * ratio;
    canvas.height = h * ratio;
    canvas.style.width  = w + "px";
    canvas.style.height = h + "px";

    var ctx = canvas.getContext("2d");

    ctx.save();

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    ctx.strokeStyle = ctx.fillStyle = "#1f358d";
    ctx.lineCap = "round";
    ctx.lineWidth = 2;

    ctx.beginPath();
    // the original image measure 120 x 65 pixels
    // scale = 3;
    if (w < h) {
      scale = (w/(120*3));
    }
    else {
      scale = (h/(65*3));
    }
    scale = (scale > 2.5) ? 2.5 : scale;

    ctx.translate((w-(120*scale))/2, (h-(65*scale))/2);
    ctx.scale(scale, scale);

    ctx.moveTo(3,25);
    ctx.lineTo(3,1);
    ctx.lineTo(21,1);
    ctx.bezierCurveTo(33,1, 41,15, 41,25);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(1,63); ctx.lineTo(1,64);
    ctx.moveTo(5,62); ctx.lineTo(5,64);
    ctx.moveTo(9,61); ctx.lineTo(9,64);
    ctx.moveTo(13,60); ctx.lineTo(13,64);
    ctx.moveTo(17,58); ctx.lineTo(17,64);
    ctx.moveTo(21,56); ctx.lineTo(21,64);
    ctx.moveTo(25,53); ctx.lineTo(25,64);
    ctx.moveTo(29,50); ctx.lineTo(29,64);
    ctx.moveTo(33,46); ctx.lineTo(33,64);
    ctx.moveTo(37,41); ctx.lineTo(37,64);
    ctx.moveTo(41,32); ctx.lineTo(41,64);
    ctx.stroke();

    ctx.font = "20px descartesJS_sansserif, Arial, Helvetica, Sans-serif";
    ctx.fillText("escartes", 45, 33);
    ctx.fillText("JS", 98, 64);
    ctx.restore();

    return canvas.toDataURL();
  }

  return descartesJS;
})(descartesJS || {});
