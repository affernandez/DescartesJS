/**
 * @author Joel Espinosa Longi
 * @licencia LGPL - http://www.gnu.org/licenses/lgpl.html
 */

var descartesJS = (function(descartesJS) {
  if (descartesJS.loadLib) { return descartesJS; }

  var MathFloor = Math.floor;
  var MathAbs = Math.abs;

  var evaluator;
  var canvas;
  var ctx;
  var expr;
  var font_size;
  var name;
  var imageSrc;
  var image;
  var despX;
  var despY;
  var txtW;
  var hasTouchSupport;
  var delay = 1000;

  var _image_pos_x;
  var _image_pos_y;
  var _text_pos_x;
  var _text_pos_y;

  var _i_h;
  var _font_h;
  var newButtonCondition;

  var gifPattern = /[\w\.\-//]*(\.gif)/gi;

  var container;

  var checkOver;
  var checkClick;
  var checkActive;
  var checkDrawIf;
  var checkName;
  var checkImageSrc;

  var prefix;
  var sufix;
  var imageOverSrc;
  var imageDownSrc;
  var imageOver;
  var imageDown;

  /**
   * Descartes button control
   * @constructor
   * @param {DescartesApp} parent the Descartes application
   * @param {String} values the values of the button control
   */
  descartesJS.Button = function(parent, values) {
    /**
     * image file name
     * type {String}
     * @private
     */
    this.imageSrc = "";

    /**
     * image
     * type {Image}
     * @private
     */
    this.image = new Image();

    /**
     * over image
     * type {Image}
     * @private
     */
    this.imageOver = new Image();

    /**
     * down image
     * type {Image}
     * @private
     */
    this.imageDown = new Image();

    // call the parent constructor
    descartesJS.Control.call(this, parent, values);

    this.ratio = parent.ratio;

    if (this.font_size === -1) {
      this.fontSizeNotSet = true;
    }

    // modification to change the name of the button with an expression
    if ((this.name.charAt(0) === "[") && (this.name.charAt(this.name.length-1) === "]")) {
      this.name = this.parser.parse(this.name.substring(1, this.name.length-1));
    }
    else {
      this.name = this.parser.parse("'" + this.name + "'");
    }

    var tmpParam;
    this.classContainer = "";
    if (this.imageSrc.trim().match("^_STYLE_")) {
      this.customStyle = true;
      this.canvasStyle = [];
      this.conStyle = [];
      this.conStyle.textBorder = 3;

      tmpParam = this.imageSrc.trim().substring(8).split("|");
      var tempo;
      var isRGB;
      for (var i=0, l=tmpParam.length; i<l; i++) {
        tempo = tmpParam[i];
        isRGB = tempo.match(/rgb/g);
        if (tempo.match("class=")) {
          this.classContainer = " " + tempo.substring(6);
        }
        else if (tempo.match("border=")) {
          this.canvasStyle.push( { type: "border-style", value: "solid" } );
          this.canvasStyle.push( { type: "border-width", value: tempo.substring(7).trim() + "px" } );
        }
        else if (tempo.match("borderRadius=")) {
          this.canvasStyle.push( { type: "border-radius", value: tempo.substring(13).trim() + "px" } );
          this.conStyle.push( { type: "border-radius", value: tempo.substring(13).trim() + "px" } );
        }
        else if (tempo.match("borderColor=")) {
          this.canvasStyle.push( { type: "border-color", value: ((isRGB)?"":"#") + tempo.substring(12).trim() } );
        }
        else if (tempo.match("overColor=")) {
          this.conStyle.overColor = ((isRGB)?"":"#") + tempo.substring(10).trim();
        }
        else if (tempo.match("downColor=")) {
          this.conStyle.downColor = ((isRGB)?"":"#") + tempo.substring(10).trim();
        }
        else if (tempo.match("font=")) {
          this.conStyle.font = tempo.substring(5).trim().toLowerCase();
        }
        else if (tempo.match("inactiveColor=")) {
          this.conStyle.inactiveColor = ((isRGB)?"":"#") + tempo.substring(14).trim();
        }
        else if (tempo.match("inactiveColorBorder=")) {
          this.conStyle.inactiveColorBorder = ((isRGB)?"":"#") + tempo.substring(20).trim();
        }
        else if (tempo.match("shadowTextBlur=")) {
          this.conStyle.shadowTextBlur = parseFloat(tempo.substring(15).trim());
        }
        else if (tempo.match("shadowTextOffsetX=")) {
          this.conStyle.shadowTextOffsetX = parseFloat(tempo.substring(18).trim());
        }
        else if (tempo.match("shadowTextOffsetY=")) {
          this.conStyle.shadowTextOffsetY = parseFloat(tempo.substring(18).trim());
        }
        else if (tempo.match("shadowTextColor=")) {
          this.conStyle.shadowTextColor = ((isRGB)?"":"#") + tempo.substring(16).trim();
        }
        else if (tempo.match("shadowBoxBlur=")) {
          this.conStyle.shadowBoxBlur = parseFloat(tempo.substring(14).trim());
        }
        else if (tempo.match("shadowBoxOffsetX=")) {
          this.conStyle.shadowBoxOffsetX = parseFloat(tempo.substring(17).trim());
        }
        else if (tempo.match("shadowBoxOffsetY=")) {
          this.conStyle.shadowBoxOffsetY = parseFloat(tempo.substring(17).trim());
        }
        else if (tempo.match("shadowBoxColor=")) {
          this.conStyle.shadowBoxColor = ((isRGB)?"":"#") + tempo.substring(15).trim();
        }
        else if (tempo.match("shadowInsetBoxBlur=")) {
          this.conStyle.shadowInsetBoxBlur = parseFloat(tempo.substring(19).trim());
        }
        else if (tempo.match("shadowInsetBoxOffsetX=")) {
          this.conStyle.shadowInsetBoxOffsetX = parseFloat(tempo.substring(22).trim());
        }
        else if (tempo.match("shadowInsetBoxOffsetY=")) {
          this.conStyle.shadowInsetBoxOffsetY = parseFloat(tempo.substring(22).trim());
        }
        else if (tempo.match("shadowInsetBoxColor=")) {
          this.conStyle.shadowInsetBoxColor = ((isRGB)?"":"#") + tempo.substring(20).trim();
        }
        else if (tempo.match("textBorder=")) {
          this.conStyle.textBorder = parseFloat(tempo.substring(11).trim());
        }
      }
      this.imageSrc = "vacio.gif";
    }

    // color expression of the form _COLORES_ffffff_000000_P_22 specified in the image field
    // the first color is the background color
    // the second color is the text color
    // the last number is the font size
    if (this.imageSrc.match("_COLORES_")) {
      tmpParam       = this.imageSrc.split("_");
      this.colorInt  = new descartesJS.Color(tmpParam[2]);
      this.color     = new descartesJS.Color(tmpParam[3]);
      this.font_size = this.parser.parse(tmpParam[5]);
      this.imageSrc  = "";
    }

    if (this.imageSrc.charAt(0) == '[') {
      this.imageSrc = this.parser.parse(this.imageSrc.substring(1, this.imageSrc.length-1));
    }
    else {
      this.imageSrc = this.parser.parse("'" + this.imageSrc + "'");
    }

    // if the button has an image then load it and try to load the over and down images
    var imageSrc = this.evaluator.eval(this.imageSrc).toString().trim();

    if (imageSrc != "") {
      var prefix = imageSrc.substr(0, imageSrc.lastIndexOf("."));
      var sufix  = imageSrc.substr(imageSrc.lastIndexOf("."));

      // empty image, i.e. reference to vacio.gif
      if (imageSrc.toLowerCase().match(/vacio.gif$/)) {
        this.imageSrc = this.parser.parse("'vacio.gif'");
        this.image.ready = 1;

        // ## Descartes 3 patch ##
        // if the image is empty then the name of the button is not displayed
        if (this.parent.version === 3) {
          this.name = this.parser.parse('');
        }
        // ## Descartes 3 ##

        this.emptyImage = { ready: true };
        imageSrc = this.parser.parse("'vacio.gif'");
      }
      // the image is not empty
      else {
        this.image = this.parent.getImage(imageSrc);

        // if the name is empty, do not try to get over and down images
        if (prefix) {
          this.imageOver = this.parent.getImage(prefix + "_over" + sufix);
          this.imageDown = this.parent.getImage(prefix + "_down" + sufix);
        }
      }
    }

    this.container = document.createElement("div");
    this.container.setAttribute("class", "DescartesButtonContainer" + this.classContainer);
    this.container.setAttribute("id", this.id);
    this.container.setAttribute("style", "width:" + this.w + "px; height:" + this.h + "px; left:" + this.x + "px; top:" + this.y + "px; z-index:" + this.zIndex + ";");

    // create the canvas and the rendering context
    this.canvas = document.createElement("canvas");
    this.canvas.width  = this.w *this.ratio;
    this.canvas.height = this.h *this.ratio;
    // this.canvas.setAttribute("width", this.w+"px");
    // this.canvas.setAttribute("height", this.h+"px");
    this.canvas.setAttribute("style", "position:absolute; left:0px; top:0px; width:" + this.w +"px; height:" + this.h + "px; -webkit-box-sizing:border-box; -moz-box-sizing:border-box; box-sizing:border-box;");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.container.appendChild(this.canvas);

    this.addControlContainer(this.container);

    // register the mouse and touch events
    this.addEvents();

    // init the button parameters
    this.init();
  }

  ////////////////////////////////////////////////////////////////////////////////////
  // create an inheritance of Control
  ////////////////////////////////////////////////////////////////////////////////////
  descartesJS.extend(descartesJS.Button, descartesJS.Control);

  /**
   * Init the button
   */
  descartesJS.Button.prototype.init = function(force) {
    evaluator = this.evaluator;
    container = this.container;
    canvas = this.canvas;
    ctx = this.ctx;
    expr = evaluator.eval(this.expresion);
    this.x = expr[0][0];
    this.y = expr[0][1];
    if (expr[0].length == 4) {
      this.w = parseInt(expr[0][2]);
      this.h = parseInt(expr[0][3]);
    }

    //
    canvas.width  = this.w *this.ratio;
    canvas.height = this.h *this.ratio;
    canvas.setAttribute("style", "position:absolute; left:0px; top:0px; width:" + this.w +"px; height:" + this.h + "px; -webkit-box-sizing:border-box; -moz-box-sizing:border-box; box-sizing:border-box;");
    container.setAttribute("style", "width:" + this.w + "px; height:" + this.h + "px; left:" + this.x + "px; top:" + this.y + "px; z-index:" + this.zIndex + "; display:block;");
    //

    //
    if (this.canvasStyle) {
      for (var i=0, l=this.canvasStyle.length; i<l; i++) {
        canvas.style[this.canvasStyle[i].type] = this.canvasStyle[i].value;
      }
    }
    if (this.conStyle) {
      for (var i=0, l=this.conStyle.length; i<l; i++) {
        container.style[this.conStyle[i].type] = this.conStyle[i].value;
      }

      if (this.conStyle.shadowBoxColor) {
        var hShadow = this.conStyle.shadowBoxOffsetX || 0;
        var wShadow = this.conStyle.shadowBoxOffsetY || 2;
        var blur = this.conStyle.shadowBoxBlur || 2;
        var spread = 1;
        container.style.boxShadow = hShadow + "px " + wShadow + "px " + blur + "px " + spread + "px " + this.conStyle.shadowBoxColor;
      }
      if (this.conStyle.shadowInsetBoxColor) {
        var hShadow = this.conStyle.shadowInsetBoxOffsetX || 0;
        var wShadow = this.conStyle.shadowInsetBoxOffsetY || -2;
        var blur = this.conStyle.shadowInsetBoxBlur || 1;
        var spread = 1;
        canvas.style.boxShadow = hShadow + "px " + wShadow + "px " + blur + "px " + spread + "px " + this.conStyle.shadowInsetBoxColor + " inset";
      }
      if (this.conStyle.shadowTextColor) {
        ctx.shadowBlur = this.conStyle.shadowTextBlur || 1;
        ctx.shadowOffsetX = this.conStyle.shadowTextOffsetX || 0;
        ctx.shadowOffsetY = this.conStyle.shadowTextOffsetY || 2;
        ctx.shadowColor = this.conStyle.shadowTextColor;
      }
    }
    //

    if (this.fontSizeNotSet) {
      this.font_size = evaluator.parser.parse(descartesJS.getFieldFontSize(this.h) +"");
    }
    this.fs_evaluated = evaluator.eval(this.font_size);

    // create the background gradient
    this.createGradient(this.w, this.h);

    container.style.display = (evaluator.eval(this.drawif) > 0) ? "block" : "none";

    ////
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.font = this.italics + " " + this.bold + " " + this.fs_evaluated + "px " + descartesJS.sansserif_font;

    if (this.customStyle) {
      if (this.conStyle.font == "serif") {
        ctx.font = this.italics + " " + this.bold + " " + this.fs_evaluated + "px " + descartesJS.serif_font;
      }
      else if (this.conStyle.font == "monospace") {
        ctx.font = this.italics + " " + this.bold + " " + this.fs_evaluated + "px " + descartesJS.monospace_font;
      }
    }
    // container.setAttribute("data-color", this.colorInt.getColor());

    this.draw(force);
  }

  /**
   * Update the button
   */
  descartesJS.Button.prototype.update = function() {
    evaluator = this.evaluator;
    container = this.container;
    canvas = this.canvas;

    // check if the control is active and visible
    this.activeIfValue = (evaluator.eval(this.activeif) > 0);
    this.drawIfValue = (evaluator.eval(this.drawif) > 0);

    // hide or show the button control
    if (this.drawIfValue) {
      container.style.display = "block";
      this.draw();
    } else {
      container.style.display = "none";
      this.buttonClick = false;
    }

    container.style.cursor = (this.activeIfValue) ? "pointer" : "not-allowed";
    canvas.style.cursor = (this.activeIfValue) ? "pointer" : "not-allowed";
    container.setAttribute("data-active", ((this.activeIfValue) ? "true" : "false"));

    // update the position and size
    this.updatePositionAndSize();
  }

  /**
   * Draw the button
   */
  descartesJS.Button.prototype.draw = function(force) {
    container = this.container;
    evaluator = this.evaluator;
    canvas = this.canvas;
    ctx = this.ctx;

    name = evaluator.eval(this.name);
    imageSrc = this.evaluator.eval(this.imageSrc).toString().trim();

    // if ((!force) && (this.customStyle)) {
    if (!force) {
      checkOver = (this.over === this.oldOver);
      checkClick = (this.buttonClick === this.oldButtonClick);
      checkActive = (this.activeIfValue === this.oldActiveIfValue);
      checkDrawIf = (this.drawIfValue === this.oldDrawIfValue);
      checkName = (name === this.oldName);
      checkImageSrc = (imageSrc === this.oldImageSrc);

      this.oldOver = this.over;
      this.oldButtonClick = this.buttonClick;
      this.oldActiveIfValue = this.activeIfValue;
      this.oldDrawIfValue = this.drawIfValue;
      this.oldName = name;
      this.oldImageSrc = imageSrc;

      if (checkOver && checkClick && checkActive && checkDrawIf && checkName && checkImageSrc) {
        return;
      };
    }

    ctx.save();
 	  ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);

    font_size = this.fs_evaluated;
    container.setAttribute("data-name", name);

    if (imageSrc) {
      image = (imageSrc === "vacio.gif") ? this.emptyImage : this.parent.getImage(imageSrc);

      prefix = imageSrc.substr(0, imageSrc.lastIndexOf("."));
      sufix  = imageSrc.substr(imageSrc.lastIndexOf("."));

      imageOverSrc = prefix + "_over" + sufix;
      imageDownSrc = prefix + "_down" + sufix;
      imageOver = (imageSrc === "vacio.gif") ? this.emptyImage : this.parent.getImage(imageOverSrc);
      imageDown = (imageSrc === "vacio.gif") ? this.emptyImage : this.parent.getImage(imageDownSrc);
    }
    else {
      image = this.emptyImage;
      imageOver = this.emptyImage;
      imageDown = this.emptyImage;
    }

    ctx.clearRect(0, 0, this.w, this.h);

    // text displace when the button is pressed
    despX = 0;
    despY = 0;
    if (this.buttonClick) {
      despX = 1;
      despY = 1;
    }

    _text_pos_x = MathFloor(this.w/2 + despX)-.5;
    _text_pos_y = MathFloor(this.h/2 + despY)-.5;

    //////////////////////////////////////////////////////////
    // text at the bottom
    if (image) {
      _i_h = image.height || 100000000;
      _font_h = descartesJS.getFontMetrics(this.italics + " " + this.bold + " " + font_size + "px descartesJS_sansserif, Arial, Helvetica, Sans-serif").h;
      newButtonCondition = (name != "") ? (((this.h-_i_h-_font_h-2) >=0 ) ? true : false) : false;

      _image_pos_x = parseInt((this.w-image.width)/2)+despX;
      _image_pos_y = (newButtonCondition) ? (parseInt((this.h -_font_h -image.height +2)/2)) : (parseInt((this.h-image.height)/2)+despY);

      if (newButtonCondition) {
        _text_pos_y = parseInt(this.h - _font_h/2 -2);

        container.style.backgroundColor = this.colorInt.getColor();

        ctx.strokeStyle = this.color.getColor();
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0.5,0.5);
        ctx.lineTo(this.w-0.5,0.5);
        ctx.lineTo(this.w-0.5,this.h-0.5);
        ctx.lineTo(0.5,this.h-0.5);
        ctx.closePath();
        ctx.stroke();
      }
    }

    ////////////////////////////////////////////////////////////////////////////////////////
    // the image is ready
    if ((image) && (image.ready)) {
      if ( (image !== this.emptyImage) && (image.complete) ) {
        // container.style.backgroundImage = "url('" + imageSrc + "')";
        // container.style.backgroundPosition = (_image_pos_x) + "px " + (_image_pos_y) + "px";
        // check if is a gif image
        if ( imageSrc.match(gifPattern) ) {
          this.canvas.style.backgroundRepeat = "no-repeat";
          this.canvas.style.backgroundImage = "url('" + imageSrc + "')";
          this.canvas.style.backgroundPosition = (_image_pos_x) + "px " + (_image_pos_y) + "px";
        }
        else {
          ctx.drawImage(image, _image_pos_x, _image_pos_y);
        }
      }
      else if ((this.emptyImage) && (this.customStyle)) {
        container.style.backgroundColor = this.colorInt.getColor();
      }
    }
    // the image is not ready or the button do not have a image
    else {
      container.style.backgroundColor = this.colorInt.getColor();

      if (!this.buttonClick) {
        // descartesJS.drawLine(ctx, this.w-1, 0, this.w-1, this.h, "rgba(0,0,0,"+(0x80/255)+")");
        // descartesJS.drawLine(ctx, 0, 0, 0, this.h, "rgba(0,0,0,"+(0x18/255)+")");
        // descartesJS.drawLine(ctx, 1, 0, 1, this.h, "rgba(0,0,0,"+(0x08/255)+")");
        descartesJS.drawLine(ctx, this.w-1, 0, this.w-1, this.h, "rgba(0,0,0,0.5)");
        descartesJS.drawLine(ctx, 0, 0, 0, this.h, "rgba(0,0,0,0.09)");
        descartesJS.drawLine(ctx, 1, 0, 1, this.h, "rgba(0,0,0,0.03)");
      }

      ctx.fillStyle = this.linearGradient;
      ctx.fillRect(0, 0, this.w, this.h);
    }

    ////////////////////////////////////////////////////////////////////////////////////////
    // over image
    if (this.activeIfValue) {
      if ( (imageOver !== this.emptyImage) && (this.over) && (imageOver.ready) && (imageOver.complete) ) {
        // container.style.backgroundImage = "url('" + imageOverSrc + "')";
        // container.style.backgroundPosition = (_image_pos_x) + "px " + (_image_pos_y) + "px";
        if ( imageOverSrc.match(gifPattern) ) {
          this.canvas.style.backgroundImage = "url('" + imageOverSrc + "')";
          this.canvas.style.backgroundPosition = (_image_pos_x) + "px " + (_image_pos_y) + "px";
        }
        else {
          ctx.drawImage(imageOver, _image_pos_x, _image_pos_y);
        }
      }
      else if ((this.customStyle) && (this.conStyle.overColor) && (this.over)) {
        container.style.backgroundColor = this.conStyle.overColor;
      }
    }

    ////////////////////////////////////////////////////////////////////////////////////////
    // down image
    if (this.activeIfValue) {
      if ( (imageDown !== this.emptyImage) && (this.buttonClick) && (imageDown.ready) && (imageDown.complete) ) {
        // container.style.backgroundImage = "url('" + imageDownSrc + "')";
        // container.style.backgroundPosition = (_image_pos_x) + "px " + (_image_pos_y) + "px";
        if ( imageDownSrc.match(gifPattern) ) {
          this.canvas.style.backgroundImage = "url('" + imageDownSrc + "')";
          this.canvas.style.backgroundPosition = (_image_pos_x) + "px " + (_image_pos_y) + "px";
        }
        else {
          ctx.drawImage(imageDown, _image_pos_x, _image_pos_y);
        }
      }
      else if ((this.customStyle) && (this.conStyle.downColor) && (this.buttonClick)) {
        container.style.backgroundColor = this.conStyle.downColor;
      }
    }
    else if ((this.buttonClick) && (!image)) {
      ctx.fillStyle = "rgba(0,0,0,0.09)";
      ctx.fillRect(0, 0, this.w, this.h);
    }

    ////////////////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////////////////
    ctx.fillStyle = this.color.getColor();

    if (this.customStyle) {
      if ((this.conStyle.shadowTextColor) && (this.conStyle.textBorder > 0)) {
        ctx.lineWidth = this.conStyle.textBorder;
        ctx.strokeStyle = this.conStyle.shadowTextColor;
        ctx.strokeText(name, _text_pos_x, _text_pos_y);
      }
    }

    // text border
    if ( (!newButtonCondition) && (!this.conStyle) && (this.drawTextBorder()) ) {
      ctx.lineWidth = parseInt(font_size/6);
      ctx.strokeStyle = this.colorInt.getColor();
      ctx.strokeText(name, _text_pos_x, _text_pos_y);
    }

    ////////////////////////////////////////////////////////////////////////////////////////
    // write the button name
    ctx.fillText(name, _text_pos_x, _text_pos_y);

    ////////////////////////////////////////////////////////////////////////////////////////
    // draw the under line
    if (this.underlined) {
      txtW = ctx.measureText(name).width;
      ctx.strokeStyle = this.color.getColor();
      ctx.lineWidth = MathFloor(font_size/10) || 2;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo( parseInt((this.w-txtW)/2) + despX, _text_pos_y + MathFloor(font_size/2) + MathFloor(font_size/5) - 1.5 );
      ctx.lineTo( parseInt((this.w+txtW)/2) + despX, _text_pos_y + MathFloor(font_size/2) + MathFloor(font_size/5) - 1.5 );
      ctx.stroke();
    }

    ////////////////////////////////////////////////////////////////////////////////////////
    if (!this.activeIfValue) {
      if ((this.customStyle) && (this.conStyle.inactiveColor)) {
        container.style.backgroundColor = this.conStyle.inactiveColor;
      }
      else {
        // ctx.fillStyle = "rgba(" + 0xf0 + "," + 0xf0 + "," + 0xf0 + "," + (0xa0/255) + ")";
        ctx.fillStyle = "rgba(240,240,240,0.6)";
        ctx.fillRect(0, 0, this.w, this.h);
      }
    }

    ctx.restore();

    // for the screenshot
    this._image_pos_x = _image_pos_x;
    this._image_pos_y = _image_pos_y;
  }

  /**
   *
   */
  descartesJS.Button.prototype.drawTextBorder = function() {
    // compute the correct components
    this.colorInt.getColor();
    this.color.getColor();

    return !((( MathAbs(this.colorInt.r - this.color.r) + MathAbs(this.colorInt.g - this.color.g) + MathAbs(this.colorInt.b - this.color.b) )/255) <.5);
  }

  /**
   * Function executed when the button is pressed
   */
  descartesJS.Button.prototype.buttonPressed = function() {
    this.updateAndExecAction();
  }

  /**
   * Register the mouse and touch events
   */
  descartesJS.Button.prototype.addEvents = function() {
    hasTouchSupport = descartesJS.hasTouchSupport;
    var self = this;
    var timer;

    // prevent the context menu display
    self.canvas.oncontextmenu = function () { return false; };

    /**
     * Repeat a function during a period of time, when the user click and hold the click in the button
     * @param {Number} delayTime the delay of time between the function repetition
     * @param {Function} fun the function to execute
     * @param {Boolean} firstime a flag to indicated if is the first time clicked
     * @private
     */
    function repeat(delayTime, fun, firstTime) {
      descartesJS.clearTimeout(timer);

      if ((self.buttonClick) && (self.drawIfValue) && (self.activeIfValue)) {
        fun.call(self);
        delayTime = (firstTime) ? delayTime : 100;
        timer = descartesJS.setTimeout(function() { repeat(delayTime, fun, false); }, delayTime);
      }
    }

    this.buttonClick = false;
    this.over = false;

    // if (hasTouchSupport) {
      this.canvas.addEventListener("touchstart", onMouseDown);
    // } else {
      this.canvas.addEventListener("mousedown", onMouseDown);
      this.canvas.addEventListener("mouseover", onMouseOver);
      this.canvas.addEventListener("mouseout", onMouseOut);
    // }

    /**
     *
     * @param {Event} evt
     * @private
     */
    function onMouseDown(evt) {
      // remove the focus of the controls
      // document.body.focus();
      this.focus();

      evt.preventDefault();
      evt.stopPropagation();

      // blur other elements when clicked
      if (document.activeElement != document.body) {
        document.activeElement.blur();
      }

      self.whichBtn = descartesJS.whichBtn(evt);

      if (self.whichBtn == "L") {
        if (self.activeIfValue) {
          self.buttonClick = true;

          self.draw();

          if (self.action == "calculate") {
            // se registra el valor de la variable
            self.evaluator.setVariable(self.id, self.evaluator.eval(self.valueExpr));
            repeat(delay, self.buttonPressed, true);
          }

          // if (hasTouchSupport) {
            self.canvas.removeEventListener("touchend", onMouseUp);
            self.canvas.addEventListener("touchend", onMouseUp);
          // }
          // else {
            self.canvas.removeEventListener("mouseup", onMouseUp);
            self.canvas.addEventListener("mouseup", onMouseUp);
          // }
        }
      }
    }

    /**
     *
     * @param {Event} evt
     * @private
     */
    function onMouseUp(evt) {
      // remove the focus of the controls
      // document.body.focus();
      this.focus();

      evt.preventDefault();
      evt.stopPropagation();

      if ((self.activeIfValue) || (self.buttonClick)) {
        self.buttonClick = false;
        self.draw();

        if (self.action != "calculate") {
          // se registra el valor de la variable
          self.evaluator.setVariable(self.id, self.evaluator.eval(self.valueExpr));
          self.buttonPressed();
        }

        // if (hasTouchSupport) {
          self.canvas.removeEventListener("touchend", onMouseUp);
        // }
        // else {
          self.canvas.removeEventListener("mouseup", onMouseUp);
        // }
      }
      // espero que no haya errores
      self.parent.update();
    }

    /**
     *
     * @param {Event} evt
     * @private
     */
    function onMouseOver(evt) {
      evt.preventDefault();
      evt.stopPropagation();

      self.over = true;
      self.draw();
    }

    /**
     *
     * @param {Event} evt
     * @private
     */
    function onMouseOut(evt) {
      evt.preventDefault();
      evt.stopPropagation();

      self.over = false;
      self.buttonClick = false;
      self.draw();
    }

    /**
     *
     */
    document.addEventListener("visibilitychange", function(evt) {
      self.buttonClick = false;
    });

  }

  return descartesJS;
})(descartesJS || {});
