/**
 * @author Joel Espinosa Longi
 * @licencia LGPL - http://www.gnu.org/licenses/lgpl.html
 */

var descartesJS = (function(descartesJS) {
  if (descartesJS.loadLib) { return descartesJS; }

  var MathFloor = Math.floor;
  var parent;
  var evaluator;
  var parser;
  var thisID;
  var newH;
  var newW;
  var parentH;
  var parentW;
  var temp;
  var OxExpr;
  var OyExpr;

  var tmpContainer;
  var boundingRect;
  var tmpDisplay;
  var containerClass;
  var pos;

  /**
   * Descartes space
   * @constructor
   * @param {DescartesApp} parent the Descartes application
   * @param {String} values the values of the graphic
   */
  descartesJS.Space = function(parent, values) {
    /**
     * Descartes application
     * type {DescartesApp}
     * @private
     */
    this.parent = parent;

    /**
     * object for parse and evaluate expressions
     * type {Evaluator}
     * @private
     */
    this.evaluator = this.parent.evaluator;

    evaluator = this.evaluator;
    parser = evaluator.parser;

    /**
     * identifier
     * type {String}
     */
    this.id = "";

    /**
     * initial values
     * type {String}
     * @private
     */
    this.values = values;

    /**
     * type
     * type {String}
     * @private
     */
    this.type = "R2";

    /**
     * x position
     * type {Node}
     * @private
     */
    this.xExpr = parser.parse("0");

    /**
     * y position
     * type {Node}
     * @private
     */
    this.yExpr = parser.parse("0");

    /**
     * width
     * type {Number}
     * @private
     */
    this.w = parseInt(parent.container.width);

    /**
     * height
     * type {Number}
     * @private
     */
    this.h = parseInt(parent.container.height);

    /**
     * drawif condition
     * type {Node}
     * @private
     */
    this.drawif = parser.parse("1");

    /**
     * fixed space condition
     * type {Boolean}
     * @private
     */
    this.fixed = (parent.version == 2);

    /**
     * scale
     * type {Number}
     * @private
     */
    this.scale = 48;

    /**
     * displacement x of the origin
     * type {Number}
     * @private
     */
    this.Ox = 0;

    /**
     * displacement y of the origin
     * type {Number}
     * @private
     */
    this.Oy = 0;

    /**
     * background image
     * type {Image}
     * @private
     */
    this.image = new Image();
    this.image.onload = function() {
      this.ready = 1;
    }

    /**
     * background image file name
     * type {String}
     * @private
     */
    this.imageSrc = "";

    /**
     * how the background image is positioned
     * type {String}
     * @private
     */
    this.bg_display = "topleft";

    /**
     * background color
     * type {String}
     * @private
     */
    this.background = new descartesJS.Color( ((/DescartesJS.class/i).test(parent.code) || (parent.arquimedes)) ? "f0f8fa" : "ffffff" );

    /**
     * net condition and color
     * type {String}
     * @private
     */
    this.net = (parent.version != 2) ? new descartesJS.Color("c0c0c0") : "";

    /**
     * net 10 condition and color
     * type {String}
     * @private
     */
    this.net10 = (parent.version != 2) ? new descartesJS.Color("808080") : "";

    /**
     * axes condition and color
     * type {String}
     * @private
     */
    // ## parche para descartes 2 ## //
    this.axes = (parent.version != 2) ? new descartesJS.Color("808080") : "";

    /**
     * coordinate text condition and color
     * type {String}
     * @private
     */
    this.text = new descartesJS.Color("ffafaf");

    /**
     * condition to draw the axis numbers
     * type {Boolean}
     * @private
     */
    this.numbers = false;

    /**
     * x axis text
     * type {String}
     * @private
     */
    this.x_axis = (parent.version != 2) ? "" : " ";

    /**
     * y axis text
     * type {String}
     * @private
     */
    this.y_axis = this.x_axis;

    /**
     * sensitive to mose movements condition
     * type {Boolean}
     * @private
     */
    this.sensitive_to_mouse_movements = false;

    /**
     * component identifier (rtf text positioning)
     * type {String}
     * @private
     */
    this.cID = ""

    /**
     * mouse x position
     * type {Number}
     * @private
     */
    this.mouse_x = 0;

    /**
     * mouse y position
     * type {Number}
     * @private
     */
    this.mouse_y = 0;

    /**
     * the controls
     * type {Array<Controls>}
     * @private
     */
    this.ctrs = [];

    /**
     * the graphic controls
     * type {Array<Controls>}
     * @private
     */
    this.graphicsCtr = [];

    /**
     * the graphics
     * type {Array<Graphics>}
     * @private
     */
    this.graphics = [];

    /**
     * the background graphics
     * type {Array<Graphics>}
     * @private
     */
    this.backGraphics = [];

    /**
     * z index of the elements
     * @type {Number}
     * @private
     */
    this.zIndex = parent.zIndex;

    this.plecaHeight = parent.plecaHeight || 0;
    this.displaceRegionNorth = parent.displaceRegionNorth || 0;
    this.displaceRegionWest = parent.displaceRegionWest || 0;

    // traverse the values to replace the defaults values of the object
    for (var propName in values) {
      // verify the own properties of the object
      if (values.hasOwnProperty(propName)) {
        this[propName] = values[propName];
      }
    }

    this.init();
  }

  /**
   * Init the values of the space
   */
  descartesJS.Space.prototype.init = function() {
    parent = this.parent;
    evaluator = this.evaluator;
    thisID = this.id;

    this.displaceRegionNorth = parent.displaceRegionNorth || 0;
    this.displaceRegionSouth = parent.displaceRegionSouth || 0;
    this.displaceRegionEast = parent.displaceRegionEast || 0;
    this.displaceRegionWest = parent.displaceRegionWest || 0;

    parentW = parseInt(parent.container.width);
    parentH = parseInt(parent.container.height);

    if (this.wExpr != undefined) {
      this.w = parseInt(parentW - this.displaceRegionWest - this.displaceRegionEast)*parseFloat(this.wExpr)/100;
    }
    if (this.hExpr != undefined) {
      this.h = parseInt(parentH - this.displaceRegionNorth - this.displaceRegionSouth)*parseFloat(this.hExpr)/100;
    }

    // get the x and y position
    if (this.xPercentExpr != undefined) {
      this.xExpr = evaluator.parser.parse((parseInt(parentW - this.displaceRegionWest - this.displaceRegionEast)*parseFloat(this.xPercentExpr)/100).toString());
    }
    if (this.yPercentExpr != undefined) {
      this.yExpr = evaluator.parser.parse((parseInt(parentH - this.displaceRegionNorth - this.displaceRegionSouth)*parseFloat(this.yPercentExpr)/100).toString());
    }

    this.x = evaluator.eval(this.xExpr) + this.displaceRegionWest;
    this.y = evaluator.eval(this.yExpr) + this.plecaHeight + this.displaceRegionNorth;

    // if the container exist then modify it's x and y position
    if (this.container) {
      this.container.style.left = this.x + "px";
      this.container.style.top = this.y + "px";
    }

    if (this.y >=0) {
      newH = parentH - this.y;
      if (this.h > newH) {
        this.h = newH;
      }
    } else {
      newH = this.h + this.y;
      if (newH >= parentH) {
        this.h = parentH;
      } else {
        this.h = newH;
      }
    }

    if (this.x >=0) {
      newW = parentW - this.x;
      if (this.w > newW) {
        this.w = newW;
      }
    } else {
      newW = this.w + this.x;
      if (newW >= parentW) {
        this.w = parentW;
      } else {
        this.w = newW;
      }
    }

    // if the space has a background image then get the image from the loader
    if ( (this.imageSrc != "") || !(/vacio.gif$/i).test(this.imageSrc.trim()) ) {
      this.image = parent.getImage(this.imageSrc);
    }

    // Ox
    // if specified with a percentage
    if (this.OxExpr) {
      OxExpr = this.OxExpr;
      if (OxExpr[OxExpr.length-1] === "%") {
        this.Ox = this.w*parseFloat(OxExpr)/100;
      }
      // if not specified with a percentage
      else {
        temp = parseFloat(OxExpr);

        // whether to convert the value to a number the values ​​are different
        if (temp != OxExpr) {
          temp = 0;
        }
        this.Ox = temp;
      }
    }

    // Oy
    // if specified with a percentage
    if (this.OyExpr) {
      OyExpr = this.OyExpr;
      if (OyExpr[OyExpr.length-1] === "%") {
        this.Oy = this.h*parseFloat(OyExpr)/100;
      }
      // if not specified with a percentage
      else {
        temp = parseFloat(OyExpr);

        // whether to convert the value to a number the values ​​are different
        if (temp != OyExpr) {
          temp = 0;
        }
        this.Oy = temp;
      }
    }

    // register the space variables
    // ## Descartes 2 patch ## //
    if ((this.id !== "") && (parent.version !== 2)) {
      evaluator.setVariable(thisID + "._w", this.w);
      evaluator.setVariable(thisID + "._h", this.h);
      evaluator.setVariable(thisID + ".escala", this.scale);
      evaluator.setVariable(thisID + ".Ox", this.Ox);
      evaluator.setVariable(thisID + ".Oy", this.Oy);
      evaluator.setVariable(thisID + ".mouse_x", 0);
      evaluator.setVariable(thisID + ".mouse_y", 0);
      evaluator.setVariable(thisID + ".mouse_pressed", 0);
      evaluator.setVariable(thisID + ".mouse_clicked", 0);
      evaluator.setVariable(thisID + ".clic_izquierdo", 0);
    }
    else {
      temp = evaluator.getVariable("_w");
      if (temp === undefined) { temp = this.w; };
      evaluator.setVariable("_w", temp);

      temp = evaluator.getVariable("_h");
      if (temp === undefined) { temp = this.h; };
      evaluator.setVariable("_h", temp);

      temp = evaluator.getVariable("escala");
      if (temp === undefined) { temp = this.scale; };
      evaluator.setVariable("escala", temp);

      temp = evaluator.getVariable("Ox");
      if (temp === undefined) { temp = this.Ox; };
      evaluator.setVariable("Ox", temp);

      temp = evaluator.getVariable("Oy");
      if (temp === undefined) { temp = this.Oy; };
      evaluator.setVariable("Oy", temp);

      evaluator.setVariable("mouse_x", 0);
      evaluator.setVariable("mouse_y", 0);
      evaluator.setVariable("mouse_pressed", 0);
      evaluator.setVariable("mouse_clicked", 0);
      evaluator.setVariable("clic_izquierdo", 0);

      if ((parent.version == 2) && (this.x_axis === "") && (this.y_axis === "")) {
        this.axes = "";
      }
    }

    this.w_2 = this.w/2;
    this.h_2 = this.h/2;
  }

  /**
   * Add a control to the list of controls of the space
   * @param {Control} ctr is the control to add
   */
  descartesJS.Space.prototype.addCtr = function(ctr) {
    if (ctr.type === "graphic") {
      this.graphicsCtr.push(ctr);
    }
    else {
      this.ctrs.push(ctr);
    }
  }

  /**
   * Add a graphic to the list of graphics of the space
   * @param {Graphic} gra is the graphic to add
   */
  descartesJS.Space.prototype.addGraph = function(gra, is3D) {
    // add only graphs with the type of the space
    if ( ((this.type === "R2") && is3D) || ((this.type === "R3") && !is3D) ) {
      return;
    }

    if ((gra.background) && (this.type !== "R3")) {
      this.backGraphics.push(gra);
    }
    else {
      this.graphics.push(gra);
    }
  }

  /**
   * Change the click to 0
   */
  descartesJS.Space.prototype.clearClick = function() {
    this.evaluator.setVariable(this.mclickedString, 0);
    this.evaluator.setVariable(this.mclicizquierdoString, 0);
  }


  /**
   * Calculate the position relative to the X axis
   * @param {Number} x ths position
   * @return {Number} return the position relative to the X axis
   */
  descartesJS.Space.prototype.getRelativeX = function(x) {
    return (parseInt(x) - this.w_2 - this.Ox)/this.scale;
  }

  /**
   * Calculate the position relative to the Y axis
   * @param {Number} y ths position
   * @return {Number} return the position relative to the Y axis
   */
  descartesJS.Space.prototype.getRelativeY = function(y) {
    return (-parseInt(y) + this.h_2 + this.Oy)/this.scale;
  }

  /**
   * Calculate the position absolute respect to the canvas coordinate system
   * @param {Number} x ths position
   * @return {Number} return the position absolute to the X axis
   */
  descartesJS.Space.prototype.getAbsoluteX = function(x) {
    return (x*this.scale + this.w_2 + this.Ox);
  }

  /**
   * Calculate the position absolute respect to the canvas coordinate system
   * @param {Number} y ths position
   * @return {Number} return the position absolute to the Y axis
   */
  descartesJS.Space.prototype.getAbsoluteY = function(y) {
    return (-y*this.scale + this.h_2 + this.Oy);
  }

  return descartesJS;
})(descartesJS || {});
