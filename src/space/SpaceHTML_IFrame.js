/**
 * @author Joel Espinosa Longi
 * @licencia LGPL - http://www.gnu.org/licenses/lgpl.html
 */

var descartesJS = (function(descartesJS) {
  if (descartesJS.loadLib) { return descartesJS; }

  var evaluator;
  var changeX;
  var changeY;
  var file;
  var self;
  var scrollVar;

  /**
   * Descartes IFrame space
   * @constructor 
   * @param {DescartesApp} parent the Descartes application
   * @param {String} values the values of the graphic
   */
  descartesJS.SpaceHTML_IFrame = function(parent, values) {
    // call the parent constructor
    descartesJS.Space.call(this, parent, values);

    evaluator = this.parent.evaluator;

    //
    if (this._w_ != undefined) {
      var tmpW = evaluator.parser.parse(this._w_);
      if (tmpW.type != "number") {
        this._w_ = tmpW;
      }
      else {
        this._w_ = undefined;
      }
    }
    //
    if (this._h_ != undefined) {
      var tmpH = evaluator.parser.parse(this._h_);
      if (tmpH.type != "number") {
        this._h_ = tmpH;
      }
      else {
        this._h_ = undefined;
      }
    }
    //

    // if the web browser is firefox then a problem ocurrs with a none visible iframe
    this.isFirefox = (/firefox/i).test(window.navigator.userAgent);

    this.file = (this.file) ? this.file.trim() : "";

    // if the file name is an expression
    if (this.file.match(/^\[/) && this.file.match(/\]$/)) {
      this.file = evaluator.parser.parse(this.file.substring(1, this.file.length-1));
    }
    // if the file name is a string
    else if (this.file.match(/^\'/) && this.file.match(/\'$/)) {
      this.file = evaluator.parser.parse(this.file);
    }
    // if is not an expression or a string, then is a string without single quotes
    else {
      this.file = evaluator.parser.parse("'" + this.file + "'");
    }
    
    // register which are the old open file
    this.oldFile = evaluator.eval(this.file);    
    
    this.MyIFrame = document.createElement("iframe");
    if (this.oldFile != 0) {
      this.MyIFrame.setAttribute("src", this.oldFile);
    }
    this.MyIFrame.setAttribute("marginheight", 0);
    this.MyIFrame.setAttribute("marginwidth", 0);
    this.MyIFrame.setAttribute("frameborder", 0);
    this.MyIFrame.setAttribute("scrolling", "auto");
    this.MyIFrame.setAttribute("style", "position:static;left:0px;top:0px;");

    this.container = document.createElement("div");
    this.container.setAttribute("id", this.id);

    var strStyle = (descartesJS.isIOS) ? "overflow:scroll;-webkit-overflow-scrolling:touch;overflow-scrolling:touch;" : "";
    this.container.setAttribute("style", strStyle + "position:absolute; width:" + this.w + "px;height:" + this.h + "px;left:" + this.x + "px;top:" + this.y + "px;z-index:" + this.zIndex + ";background-repeat:no-repeat;background-position:center;");
    this.container.appendChild(this.MyIFrame);

    //
    if (this.imageSrc) {
      this.container.style.backgroundImage = "url(" + this.imageSrc +")";
    }
    //

    // this.parent.container.insertBefore(this.MyIFrame, this.parent.loader);
    this.parent.container.insertBefore(this.container, this.parent.loader);

    // register the comunication functions
    var self = this;

    this.MyIFrame.onload = function(evt) {
      var iframe = this;

      // set a value to a variable
      var iframeSet = function(varName, value) {
        iframe.contentWindow.postMessage({ type: "set", name: varName, value: value }, "*");
        return 0;
      }      
      self.evaluator.setFunction(self.id + ".set", iframeSet);

      // update the scene
      var iframeUpdate = function() {
        iframe.contentWindow.postMessage({ type: "update" }, "*");
        return 0;
      }      
      self.evaluator.setFunction(self.id + ".update", iframeUpdate);
      
      // exec a funcion of the scene
      var iframeExec = function(functionName, functionParameters) {
        iframe.contentWindow.postMessage({ type: "exec", name: functionName, value: functionParameters }, "*");
        return 0;
      }
      self.evaluator.setFunction(self.id + ".exec", iframeExec);

      //
      self.ImReady = !self.isFirefox;
      if (!self.isFirefox) {
        self.container.style.visibility = "visible";
        self.container.style.opacity = "1";
        self.container.style.zIndex = self.zIndex;
        self.container.style.display = (self.drawIfValue) ? "block" : "none";
      }
      self.MyIFrame.style.visibility = "visible";
      self.container.style.backgroundImage = "";
    }

    this.update = this.iframeUpdate;

    // a scroll variable to determine if the scroll is show or not
    this.evaluator.setVariable(this.id + "._scroll", 0);
  }
  
  ////////////////////////////////////////////////////////////////////////////////////
  // create an inheritance of Space
  ////////////////////////////////////////////////////////////////////////////////////
  descartesJS.extend(descartesJS.SpaceHTML_IFrame, descartesJS.Space);
  
  /**
   * Init the space
   */
  descartesJS.SpaceHTML_IFrame.prototype.init = function() {
    self = this;
    
    // call the init of the parent
    self.uber.init.call(self);

    // update the size of the iframe if has some regions
    if (self.MyIFrame) {
      self.MyIFrame.style.width  = self.w + "px";
      self.MyIFrame.style.height = self.h + "px";
      self.MyIFrame.style.left   = self.x + "px";
      self.MyIFrame.style.top    = self.y + "px";
    }
  }

  /**
   * Update the space
   */
  descartesJS.SpaceHTML_IFrame.prototype.iframeUpdate = function(firstTime) {
    evaluator = this.evaluator;

    this.drawIfValue = evaluator.eval(this.drawif) > 0;

    if (this.ImReady) {
      this.container.style.display = (this.drawIfValue) ? "block" : "none";
    }
    else {
      this.container.style.visibility = (this.drawIfValue) ? "visible" : "hidden";
      this.container.style.opacity = (this.drawIfValue) ? "1" : "0";
      this.container.style.zIndex = (this.drawIfValue) ? this.zIndex : -1000;
    }

    if (this.drawIfValue) {
      this.MyIFrame.contentWindow.focus();

      if (firstTime) {
        this.x = Infinity;
        this.y = Infinity;
      }

      changeX = (this.x !== (evaluator.eval(this.xExpr) + this.displaceRegionWest));
      changeY = (this.y !== (evaluator.eval(this.yExpr) + this.parent.plecaHeight  + this.displaceRegionNorth));
      this.x = (changeX) ? evaluator.eval(this.xExpr) + this.displaceRegionWest: this.x;
      this.y = (changeY) ? evaluator.eval(this.yExpr) + this.parent.plecaHeight  + this.displaceRegionNorth : this.y;

      if (this._w_ != undefined) {
        var new_w = evaluator.eval(this._w_);
        if (this.w !== new_w) {
          this.container.style.width = new_w + "px";
          this.MyIFrame.style.width  = new_w + "px";
          this.w = new_w;
        }
      }
      if (this._h_ != undefined) {
        var new_h = evaluator.eval(this._h_);
        if (this.h !== new_h) {
          this.container.style.height = new_h + "px";
          this.MyIFrame.style.height  = new_h + "px";
          this.h = new_h;
        }
      }

      // if the position change
      if ((changeX) || (changeY)) {
        this.container.style.left = this.x + "px";
        this.container.style.top = this.y + "px";
      }

      file = evaluator.eval(this.file);
      if (file !== this.oldFile) {
        //
        this.ImReady = false;
        if (!this.isFirefox) {
          this.container.style.display = "block";
          this.container.style.visibility = (this.drawIfValue) ? "visible" : "hidden";
          this.container.style.opacity = (this.drawIfValue) ? "1" : "0";
          this.container.style.zIndex = (this.drawIfValue) ? this.zIndex : -1000;
        }
        //
        if (this.imageSrc) {
          this.container.style.backgroundImage = "url(" + this.imageSrc +")";
        }
        //
        this.MyIFrame.style.visibility = "hidden";
        this.oldFile = file;
        // prevent add history entries when the source of an iframe change
        this.MyIFrame.contentWindow.location.replace(file);
        // this.MyIFrame.setAttribute("src", file);
      }
     
      scrollVar = evaluator.getVariable(this.id + "._scroll");
      
      if (scrollVar == 1) {
        this.MyIFrame.setAttribute("scrolling", "yes");
        this.MyIFrame.style.overflow = "";
      }
      else if (scrollVar == -1) {
        this.MyIFrame.setAttribute("scrolling", "no");
        this.MyIFrame.style.overflow = "hidden";
      }
      else {
        this.MyIFrame.setAttribute("scrolling", "auto");
        this.MyIFrame.style.overflow = "";
      }
    }
    else {
      this.MyIFrame.contentWindow.blur();
    }

  }
  
  return descartesJS;
})(descartesJS || {});
