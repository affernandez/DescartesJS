/**
 * @author Joel Espinosa Longi
 * @licencia LGPL - http://www.gnu.org/licenses/lgpl.html
 */

var descartesJS = (function(descartesJS) {
  if (descartesJS.loadLib) { return descartesJS; }

  var MathFloor = Math.floor;
  var MathRound = Math.round;
  var PI2 = Math.PI*2;
  var minScale = 0.000001;
  var maxScale = 1000000;

  var axisFont = descartesJS.convertFont("SansSerif,PLAIN,12");
  var mouseTextFont = descartesJS.convertFont("Monospaced,PLAIN,12");

  var elapsedTime = 10;

  var self;

  var evaluator;
  var parent;
  var ctx;

  var changeX;
  var changeY;
  var thisGraphics_i;
  var thisCtrs_i;

  var rsc;
  var dec;
  var wh_temp;

  var w;
  var h;
  var x;
  var y;
  var Ox;
  var Oy;
  var x1;
  var x2;
  var y1;
  var y2;

  var coordTxt_X;
  var coordTxt_Y;
  var coordTxt;
  var coordTxtW;
  var mouseX;
  var mouseY;
  var posX;
  var posY;

  var disp;

  /**
   * Descartes 2D space
   * @constructor
   * @param {DescartesApp} parent the Descartes application
   * @param {String} values the values of the graphic
   */
  descartesJS.Space2D = function(parent, values) {
    // call the parent constructor
    descartesJS.Space.call(this, parent, values);

    self = this;

    // self.ratio = ((self.w*descartesJS.ratio * self.h*descartesJS.ratio) > 5000000) ? 1 : descartesJS.ratio;
    self.ratio = parent.ratio;

    // create the canvas
    self.canvas = document.createElement("canvas");
    self.canvas.setAttribute("id", self.id + "_canvas");
    self.canvas.setAttribute("class", "DescartesSpace2DCanvas");

    self.backCanvas = document.createElement("canvas");
    self.backCanvas.setAttribute("id", self.id + "_background");

    self.canvas.style.zIndex = self.zIndex;
    self.canvas.width  = self.backCanvas.width  = self.w *self.ratio;
    self.canvas.height = self.backCanvas.height = self.h *self.ratio;
    self.canvas.style.width  = self.backCanvas.style.width  = self.w + "px";
    self.canvas.style.height = self.backCanvas.style.height = self.h + "px";

    // get context
    self.ctx = self.canvas.getContext("2d");
    self.backCtx = self.backCanvas.getContext("2d");
    self.ctx.imageSmoothingEnabled = self.backCtx.imageSmoothingEnabled = false;

    // create a graphic control container
    self.graphicControlContainer = document.createElement("div");
    self.graphicControlContainer.setAttribute("id", self.id + "_graphicControls");
    self.graphicControlContainer.setAttribute("style", "position:absolute;left:0;top:0;z-index:" + self.zIndex + ";");

    // create a control container
    self.numericalControlContainer = document.createElement("div");
    self.numericalControlContainer.setAttribute("id", self.id + "_numericalControls");
    self.numericalControlContainer.setAttribute("style", "position:absolute;left:0;top:0;z-index:" + self.zIndex + ";");

    // create the principal container
    self.container = document.createElement("div");
    self.container.setAttribute("id", self.id);
    self.container.setAttribute("class", "DescartesSpace2DContainer");
    self.container.setAttribute("style", "left:" + self.x + "px;top:" + self.y + "px;z-index:" + self.zIndex + ";");

    // ### ARQUIMEDES ###
    // the default arquimedes add a border to the container
    if ((self.parent.arquimedes) && (self.background.getColor() === "#f0f8fa")) {
      self.container.style.border = "1px solid #b8c4c8";
    }
    // ### ARQUIMEDES ###

    // add the elements to the container
    self.container.appendChild(self.backCanvas);
    self.container.appendChild(self.canvas);
    self.container.appendChild(self.graphicControlContainer);
    self.container.appendChild(self.numericalControlContainer);

    parent.container.insertBefore(self.container, parent.loader);

    // variable to expose the image of the space
    self.parent.images[self.id + ".image"] = self.canvas;
    self.parent.images[self.id + ".image"].ready = 1;
    self.parent.images[self.id + ".image"].complete = true;
    self.parent.images[self.id + ".image"].canvas = true;
    self.evaluator.setVariable(self.id + ".image", self.id + ".image");

    // variable to expose the image of the background space
    self.parent.images[self.id + ".back"] = self.backCanvas;
    self.parent.images[self.id + ".back"].ready = 1;
    self.parent.images[self.id + ".back"].complete = true;
    self.parent.images[self.id + ".back"].canvas = true;
    self.evaluator.setVariable(self.id + ".back", self.id + ".back");

    var tmpStr = ((self.id !== "") && (parent.version !== 2)) ? self.id + "." : "";
    self.OxStr    = tmpStr + "Ox";
    self.OyStr    = tmpStr + "Oy";
    self.scaleStr = tmpStr + "escala";
    self.wStr     = tmpStr + "_w";
    self.hStr     = tmpStr + "_h";
    self.mxStr    = tmpStr + "mouse_x";
    self.myStr    = tmpStr + "mouse_y";
    self.mpressedStr = tmpStr + "mouse_pressed";
    self.mclickedStr = tmpStr + "mouse_clicked";
    self.mclickIzqStr = tmpStr + "clic_izquierdo";

    self.click = 0;

    // register the mouse and touch events
    if (self.id !== "descartesJS_stage") {
      self.addEvents();
    }
    else {
      self.canvas.oncontextmenu = function (evt) { return false; };
    }

  }

  ////////////////////////////////////////////////////////////////////////////////////
  // create an inheritance of Space
  ////////////////////////////////////////////////////////////////////////////////////
  descartesJS.extend(descartesJS.Space2D, descartesJS.Space);

  /**
   * Init the space
   */
  descartesJS.Space2D.prototype.init = function() {
    self = this;

    // call the init of the parent
    self.uber.init.call(self);

    // update the size of the canvas if has some regions
    if (self.canvas) {
      self.canvas.width  = self.backCanvas.width  = self.w *self.ratio;
      self.canvas.height = self.backCanvas.height = self.h *self.ratio;
      self.canvas.style.width  = self.backCanvas.style.width  = self.w + "px";
      self.canvas.style.height = self.backCanvas.style.height = self.h + "px";
    }
  }

  /**
   * Update the space
   * @param {Boolean} firstTime condition if is the first time in draw the space
   */
  descartesJS.Space2D.prototype.update = function(firstTime) {
    self = this;
    evaluator = self.evaluator;
    parent = self.parent;

    // prevents the change of the width and height from an external change
    evaluator.setVariable(self.wStr, self.w);
    evaluator.setVariable(self.hStr, self.h);
    // check the draw if condition
    self.drawIfValue = evaluator.eval(self.drawif) > 0;

    // draw the space
    if (self.drawIfValue) {
      changeX = (self.x !== (evaluator.eval(self.xExpr) + self.displaceRegionWest));
      changeY = (self.y !== (evaluator.eval(self.yExpr) + parent.plecaHeight  + self.displaceRegionNorth));

      // check if the space has change
      self.spaceChange = firstTime ||
                         changeX ||
                         changeY ||
                         (self.drawBefore !== self.drawIfValue) ||
                         (self.Ox !== evaluator.getVariable(self.OxStr)) ||
                         (self.Oy !== evaluator.getVariable(self.OyStr)) ||
                         (self.scale !== evaluator.getVariable(self.scaleStr)) ||
                         (self.backColor !== self.background.getColor());

      self.x = (changeX) ? evaluator.eval(self.xExpr) + self.displaceRegionWest : self.x;
      self.y = (changeY) ? evaluator.eval(self.yExpr) + parent.plecaHeight + self.displaceRegionNorth : self.y;
      self.Ox = evaluator.getVariable(self.OxStr);
      self.Oy = evaluator.getVariable(self.OyStr);
      self.scale = evaluator.getVariable(self.scaleStr);
      self.drawBefore = self.drawIfValue;

      // check if the scale is not below the lower limit or not above the upper limit
      self.scale = Math.max(minScale, Math.min(maxScale, self.scale));
      evaluator.setVariable(self.scaleStr, self.scale);

      // if some property change then adjust the container style
      if ((changeX) || (changeY)) {
        self.container.style.left = self.x + "px";
        self.container.style.top  = self.y + "px";
      }

      self.container.style.display = "block";

      // draw the trace
      self.drawTrace = (!self.spaceChange) && (((!self.fixed)&&(!self.click)) || (self.fixed)) ;

      if (self.spaceChange) {
        self.backCtx.setTransform(self.ratio, 0, 0, self.ratio, 0, 0);
        self.drawBackground();
        // self.backCtx.setTransform(1, 0, 0, 1, 0, 0);
      }
      self.ctx.setTransform(self.ratio, 0, 0, self.ratio, 0, 0);
      self.draw();
      // self.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // hide the space
    else {
      self.container.style.display = "none";
    }
  }

  /**
   * Draw the space background
   */
  descartesJS.Space2D.prototype.drawBackground = function() {
    self = this;
    evaluator = self.evaluator;
    ctx = self.backCtx;

    // draw the background color
    ctx.clearRect(0, 0, self.backCanvas.width, self.backCanvas.height);
    self.backColor = self.background.getColor();
    ctx.fillStyle = self.backColor;

    ctx.fillRect(0, 0, self.backCanvas.width, self.backCanvas.height);

    // draw the background image if any
    if ( (self.image) && (self.image.src != "") && (self.image.ready) && (self.image.complete) ) {
      if (self.bg_display === "topleft") {
        ctx.drawImage(self.image, 0, 0);
      }
      else if (self.bg_display === "stretch") {
        ctx.drawImage(self.image, 0, 0, self.w, self.h);
      }
      else if (self.bg_display === "patch") {
        ctx.fillStyle = ctx.createPattern(self.image, "repeat");
        ctx.fillRect(0, 0, self.w, self.h);
      }
      else if (self.bg_display === "imgcenter") {
        ctx.drawImage(self.image, (self.w-self.image.width)/2, (self.h-self.image.height)/2);
      }
    }

    rsc = self.scale;
    dec = 0;
    wh_temp = ((self.w+self.h) < 0) ? 0 : (self.w+self.h);

    while (rsc>(wh_temp)) {
      rsc/=10;
      dec++;
    }
    while (rsc<(wh_temp)/10) {
      rsc*=10;
    }

    ctx.lineWidth = 1;

    // draw the big net
    if (self.net !== "") {
      ctx.strokeStyle = self.net.getColor();
      self.drawMarks(ctx, rsc/10, -1);
    }

    // draw the finnest net
    if ( ((self.parent.version !== 2) && (self.net10 !== "")) ||
         ((self.parent.version === 2) && (self.net !== "") && (self.net10 !== ""))
       ) {
      ctx.strokeStyle = self.net10.getColor();
      self.drawMarks(ctx, rsc, -1);
    }

    // draw the axes
    if (self.axes !== "") {
      ctx.strokeStyle = self.axes.getColor();

      ctx.beginPath();
      // x axis
      if ((self.x_axis !== "") || (self.parent.version !== 2)) {
        ctx.moveTo(0, MathFloor(self.h/2+self.Oy)+.5);
        ctx.lineTo(self.w, MathFloor(self.h/2+self.Oy)+.5);
      }

      // y axis
      if ((self.y_axis !== "") || (self.parent.version !== 2)) {
        ctx.moveTo(MathFloor(self.w/2+self.Ox)+.5, 0);
        ctx.lineTo(MathFloor(self.w/2+self.Ox)+.5, self.h);
      }

      ctx.stroke();

      self.drawMarks(ctx, rsc, 4);
      self.drawMarks(ctx, rsc/2, 2);
      self.drawMarks(ctx, rsc/10, 1);
    }

    // draw the axis names
    if ((self.x_axis !== "") || (self.y_axis !== "")) {
      ctx.fillStyle = (self.axes !== "") ? self.axes.getColor() : "#000";

      ctx.font = axisFont;
      ctx.textAlign = "right";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(self.x_axis, MathFloor(self.w)-2, MathFloor(self.h/2+self.Oy)+12);
      ctx.fillText(self.y_axis, MathFloor(self.w/2+self.Ox)-2, 12);
    }

    // draw the axis numbers
    if ((self.numbers) && (self.axes != "")) {
      ctx.fillStyle = self.axes.getColor();
      ctx.font = axisFont;
      ctx.textAlign = "start";
      ctx.textBaseline = "bottom";

      if (rsc > ((self.w+self.h)/2)) {
        self.drawNumbers(ctx, rsc/5, (rsc<=self.scale)?dec+1:dec);
      }
      else if (rsc > ((self.w+self.h)/4)) {
        self.drawNumbers(ctx, rsc/2, (rsc<=self.scale)?dec+1:dec);
      }
      else {
        self.drawNumbers(ctx, rsc, dec);
      }
    }

    // draw the background graphics
    for (var i=0, l=self.backGraphics.length; i<l; i++) {
      self.backGraphics[i].draw();
    }
  }

  /**
   * Draw the space
   */
  descartesJS.Space2D.prototype.draw = function() {
    self = this;
    ctx = self.ctx;

    ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);

    // draw the no background graphics
    for (var i=0, l=self.graphics.length; i<l; i++) {
      thisGraphics_i = self.graphics[i];

      if ((thisGraphics_i.trace !== "") && (self.drawTrace)) {
        thisGraphics_i.drawTrace();
      }

      thisGraphics_i.draw();
    }

    // draw the graphic controls
    for (var i=0, l=self.graphicsCtr.length; i<l; i++) {
      // checar si no ocurren problemas
      // this.graphicsCtr[i].update();
      self.graphicsCtr[i].draw();
    }

    // draw the text showing the mouse postion
    if ((self.text != "") && (self.click) && (self.whichBtn === "L")) {
      ctx.fillStyle = self.text.getColor();
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 1;
      ctx.font = mouseTextFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";

      coordTxt_X = (self.scale <= 1) ? ((self.mouse_x).toFixed(0)) : (self.mouse_x).toFixed((self.scale).toString().length);
      coordTxt_Y = (self.scale <= 1) ? ((self.mouse_y).toFixed(0)) : (self.mouse_y).toFixed((self.scale).toString().length);
      coordTxt = "(" + coordTxt_X + "," + coordTxt_Y + ")";
      coordTxtW = MathFloor(ctx.measureText(coordTxt).width/2);
      mouseX = self.getAbsoluteX(self.mouse_x);
      mouseY = self.getAbsoluteY(self.mouse_y);
      posX = MathFloor(mouseX);
      posY = MathFloor(mouseY-10);

      // prevents the mouse position text get out of the space
      if ((posX+coordTxtW) > self.w) {
        posX = self.w-coordTxtW;
      }
      else if ((posX-coordTxtW) < 0) {
        posX = coordTxtW;
      }
      if ((posY+1) > self.h) {
        posY = self.h;
      }
      else if ((posY-14) < 0) { // 14 is aproximately the text height
        posY = 15;
      }

      ctx.fillText(coordTxt, posX, posY);

      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 2.5, 0, PI2, true);
      ctx.stroke();
    }
  }

  /**
   * Draw the axis marks in the space
   * @param {CanvasRenderingContext2D} ctx the rendering context to draw
   * @param {Number} rsc
   * @param {Number} sz
   */
  descartesJS.Space2D.prototype.drawMarks = function(ctx, rsc, sz) {
    w = this.w;
    h = this.h;

    x1 = 0;
    x2 = w;
    y1 = 0;
    y2 = h;
    Ox = MathFloor(w/2+this.Ox);
    Oy = MathFloor(h/2+this.Oy);

    if (sz >= 0) {
      x1 = Ox-sz;
      x2 = Ox+sz;
      y1 = Oy-sz;
      y2 = Oy+sz;
    }

    ctx.beginPath();

    for (var i=-MathRound(Ox/rsc); (x = Ox + MathRound(i*rsc)) < w; i++) {
      ctx.moveTo(x+.5, y1+.5);
      ctx.lineTo(x+.5, y2+.5);
    }
    for (var i=-MathRound(Oy/rsc); (y = Oy + MathRound(i*rsc)) < h; i++) {
      ctx.moveTo(x1+.5, y+.5);
      ctx.lineTo(x2+.5, y+.5);
    }

    ctx.stroke();
  }

  /**
   * Draw the axis numbers
   * @param {CanvasRenderingContext2D} ctx the rendering context to draw
   * @param {Number} rsc
   * @param {Number} dec
   */
  descartesJS.Space2D.prototype.drawNumbers = function(ctx, rsc, dec) {
    w = this.w;
    h = this.h;

    Ox = MathFloor(w/2+this.Ox);
    Oy = MathFloor(h/2+this.Oy);

    for (var i=-MathRound(Ox/rsc); (x = Ox + MathRound(i*rsc)) < w; i++) {
      ctx.fillText(parseFloat( (i*rsc/this.scale).toFixed(4) ), x+1, Oy-2);
    }

    for (var i=-MathRound(Oy/rsc); (y = Oy + MathRound(i*rsc)) < h; i++) {
      if (parseFloat( (-i*rsc/this.scale) ) !== 0) {
        ctx.fillText(parseFloat( (-i*rsc/this.scale).toFixed(4) ), Ox+5, y+5);
      }
    }
  }

  /**
   * Register the mouse and touch events
   */
  descartesJS.Space2D.prototype.addEvents = function() {
    var lastTime = 0;
    var lastTime1 = 0;

    var self = this;
    self.posZoom = null;
    self.posZoomNew = null;

    // prevent the context menu display
    self.canvas.oncontextmenu = function (evt) { return false; };

    ///////////////////////////////////////////////////////////////////////////
    // Registro de eventos de touch
    ///////////////////////////////////////////////////////////////////////////
    if (this.sensitive_to_mouse_movements) {
      this.canvas.addEventListener("touchmove",  onSensitiveToMouseMovements);
    }
    this.canvas.addEventListener("touchstart", onTouchStart);

    /**
     * @param {Event} evt
     * @private
     */
    function onTouchStart(evt) {
      // remove the focus of the controls
      window.focus();

      // try to preserve the slide gesture in the tablets
      if ((!self.evaluator.variables[self.id + ".DESCARTESJS_no_fixed"]) && (self.fixed) && (!self.sensitive_to_mouse_movements)) {
        return;
      }

      self.parent.clearClick();

      self.click = 1;
      self.evaluator.setVariable(self.mpressedStr, 1);
      self.evaluator.setVariable(self.mclickedStr, 0);
      self.evaluator.setVariable(self.mclickIzqStr, 0);

      // deactivate the graphic controls
      self.parent.deactivateGraphiControls();

      onSensitiveToMouseMovements(evt);

      window.addEventListener("touchmove", onMouseMove);
      window.addEventListener("touchend", onTouchEnd);

      evt.stopPropagation();
      evt.preventDefault();
    }

    /**
     *
     * @param {Event} evt
     * @private
     */
    function onTouchEnd(evt) {
      // remove the focus of the controls
      window.focus();

      // try to preserve the slide gesture in the tablets
      if ((!self.evaluator.variables[self.id + ".DESCARTESJS_no_fixed"]) && (self.fixed) && (!self.sensitive_to_mouse_movements)) {
        return;
      }

      self.click = 0;
      self.evaluator.setVariable(self.mpressedStr, 0);
      self.evaluator.setVariable(self.mclickedStr, 1);
      self.evaluator.setVariable(self.mclickIzqStr, 1);

      window.removeEventListener("touchmove", onMouseMove);
      window.removeEventListener("touchend", onTouchEnd);

      evt.stopPropagation();
      evt.preventDefault();

      self.parent.update();
    }

    ///////////////////////////////////////////////////////////////////////////
    // Registro de eventos de mouse
    ///////////////////////////////////////////////////////////////////////////
    if (this.sensitive_to_mouse_movements) {
      this.canvas.addEventListener("mousemove", onSensitiveToMouseMovements);
    }
    this.canvas.addEventListener("mousedown", onMouseDown);

    /**
     *
     * @param {Event} evt
     * @private
     */
    function onMouseDown(evt) {
      // remove the focus of the controls
      window.focus();

      evt.stopPropagation();
      evt.preventDefault();

      self.parent.clearClick();

      self.click = 1;

      // deactivate the graphic controls
      self.parent.deactivateGraphiControls();

      self.whichBtn = descartesJS.whichBtn(evt);

      if (self.whichBtn === "R") {
        window.addEventListener("mouseup", onMouseUp);

        self.posZoom = (descartesJS.getCursorPosition(evt, self.container)).y;
        self.posZoomNew = self.posZoom;

        // if not fixed add a zoom manager
        if (!self.fixed) {
          self.tempScale = self.scale;

          window.addEventListener("mousemove", onMouseMoveZoom);
        }
      }
      else if (self.whichBtn === "L") {
        self.evaluator.setVariable(self.mpressedStr, 1);
        self.evaluator.setVariable(self.mclickedStr, 0);
        self.evaluator.setVariable(self.mclickIzqStr, 0);

        onSensitiveToMouseMovements(evt);

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      }
    }

    /**
     *
     * @param {Event} evt
     * @private
     */
    function onMouseUp(evt) {
      // remove the focus of the controls
      window.focus();

      evt.stopPropagation();
      evt.preventDefault();

      self.click = 0;
      self.evaluator.setVariable(self.mpressedStr, 0);
      self.evaluator.setVariable(self.mclickedStr, 1);
      self.evaluator.setVariable(self.mclickIzqStr, 1);

      if (self.whichBtn === "R") {
        window.removeEventListener("mousemove", onMouseMoveZoom);

        // show the external space
        if ((self.posZoom == self.posZoomNew) && (descartesJS.showConfig)) {
          self.parent.externalSpace.show();
          self.posZoom = false;
          self.posZoomNew = true;
        }
      }

      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      // deactivate control
      self.parent.deactivateGraphiControls();

      self.parent.update();
    }

    /**
     *
     * @param {Event} evt
     * @private
     */
    function onSensitiveToMouseMovements(evt) {
      self.posAnte = descartesJS.getCursorPosition(evt, self.container);
      self.mouse_x = self.getRelativeX(self.posAnte.x);
      self.mouse_y = self.getRelativeY(self.posAnte.y);
      self.evaluator.setVariable(self.mxStr, self.mouse_x);
      self.evaluator.setVariable(self.myStr, self.mouse_y);

      self.evaluator.setVariable(self.mclickedStr, 0);
      self.evaluator.setVariable(self.mclickIzqStr, 0);

      self.parent.update();
    }

    /**
     * @param {Event} evt
     * @private
     */
    function onMouseMoveZoom(evt) {
      evt.preventDefault();

      self.posZoomNew = (descartesJS.getCursorPosition(evt, self.container)).y;

      self.evaluator.setVariable(self.scaleStr, self.tempScale + (self.tempScale/45)*((self.posZoom-self.posZoomNew)/10));

      self.parent.update();
    }

    /**
     *
     * @param {Event} evt
     * @private
     */
    function onMouseMove(evt) {
      evt.preventDefault();
      evt.stopPropagation();

      // if the space is not fixed, then change the origin coordinates
      if (!self.fixed) {
        self.posNext = descartesJS.getCursorPosition(evt, self.container);
        disp = { x: (self.posAnte.x - self.posNext.x).toFixed(8),
                 y: (self.posAnte.y - self.posNext.y).toFixed(8) };

        self.evaluator.setVariable(self.OxStr, (self.Ox - disp.x));
        self.evaluator.setVariable(self.OyStr, (self.Oy - disp.y));
      }

      onSensitiveToMouseMovements(evt);
    }

    document.addEventListener("visibilitychange", function(evt) {
      onMouseUp(evt);
    });

  }

  return descartesJS;
})(descartesJS || {});
