/**
 * @author Joel Espinosa Longi
 * @licencia LGPL - http://www.gnu.org/licenses/lgpl.html
 */

var descartesJS = (function(descartesJS) {
  if (descartesJS.loadLib) { return descartesJS; }

  var MathFloor = Math.floor;
  var MathMax = Math.max;
  var externalDecimals = 2;
  var externalFixed = false;
  var metrics;

  var decimals;
  var fixed;
  var textTemp;
  var tmpAscent;
  var tmpStyle;
  var tmpRadican;
  var tmpMetric;
  var prevAscent;
  var prevDescent;
  var prevHeigth;
  var num;
  var den;
  var index;
  var radicand;
  var from;
  var to;
  var what;
  var symbolStyle;
  var symbolWidth;
  var childH;
  var childW;
  var maxAscenderHeight;
  var maxDescenderHeight;
  var maxHeigth;
  var maxWidth;

  var children_i;
      
  /**
   * A node of rtf text
   * @constructor 
   */
  descartesJS.RTFNode = function(evaluator, value, nodeType, style) {
    this.evaluator = evaluator;

    this.type = "rtfNode";
   
    this.value = value;
    this.nodeType = nodeType;
    this.style = style;
    this.styleStr = style.toString()
    this.color = style.textColor;
    this.underline = style.textUnderline;
    this.overline = style.textOverline;
    
    this.parent = null;
    this.children = [];
    
    switch(this.nodeType) {
      // the principal text block
      case ("textBlock"):
        this.draw = this.drawTextBlock;
        break;

      // a text line
      case ("textLineBlock"):
        this.draw = this.drawTextLineBlock;
        break;

      // a formula
      case ("formula"):
        this.draw = this.drawFormula;
        break;
      
      // a super index
      case ("superIndex"):
        this.draw = this.drawSuperIndex;
        break;

      // a sub index
      case ("subIndex"):
        this.draw = this.drawSubIndex;
        break;

      // a dynamic text
      case ("dynamicText"):
        this.draw = this.drawDynamicText;
        this.decimal_symbol = this.evaluator.parent.decimal_symbol;
        break;

      // a fraction
      case ("fraction"):
        this.draw = this.drawFraction;
        break;
      
      // a numerator or denominator
      case ("numerator"):
      case ("denominator"):
        this.draw = this.drawNumDen;
        break;
      
      // a radical
      case ("radical"):
        this.draw = this.drawRadical;
        break;
          
      // a limit
      case ("limit"):
        this.draw = this.drawLimit;
        break;
      
      // an integral
      case ("integral"):
        this.draw = this.drawIntegral;
        break;
      
      // a sum
      case ("sum"):
        this.draw = this.drawSum;
        break;
      
      // a matrix
      case ("matrix"):
        this.draw = this.drawMatrix;
        break;
      
      // a defparts element
      case ("defparts"):
        this.draw = this.drawDefparts;
        break;
      
      // a text or new line
      case ("text"):
      case ("newLine"):
        this.draw = this.drawText;
        break;
      
      // a text or new line
      case ("hyperlink"):
        this.draw = this.drawHyperlink;
        break;

      // a math symbol
      case ("mathSymbol"):
        this.draw = this.drawMathSymbol;
        break;
      
      // an index of a root or contents of a root or from value of a root
      // an index of a sum or contents of a sum or from value of a sum
      // an element 
      case ("index"):
      case ("radicand"):
      case ("from"):
      case ("to"):
      case ("what"):
      case ("element"):
        this.draw = this.drawGenericBlock;
        break;
      
      // a component of a control
      case ("componentNumCtrl"):
        this.draw = this.drawComponentNumCtrl;
        break;

      // a component of a space
      case ("componentSpace"):
        this.draw = this.drawComponentSpace;
        break;
    }
  }

  /**
   * Get the root of the tree of nodes
   * return {RTFNode} return the root of the tree of nodes
   */
  descartesJS.RTFNode.prototype.getRoot = function() {
    if (this.parent == null) {
      return this;
    }
    return this.parent.getRoot();
  }

  /**
   * Add a child to the tree of nodes
   * @param {descartesJS.RTFNode} child the child to add
   */
  descartesJS.RTFNode.prototype.addChild = function(child) {
    child.parent = this;
    this.children.push(child);
  }
  
  // metric values, needed to calculate the super and sub indices
  var previousMetric = { ascent: 0, descent: 0, h: 0 };
  /**
   * Set the previous metric
   * @param {Number} ascent the ascent value
   * @param {Number} descent the descent value
   * @param {Number} h the h value
   */
  function updatePreviousMetric(ascent, descent, h) {
    previousMetric.ascent = ascent;
    previousMetric.descent = descent;
    previousMetric.h = h; 
  }
  
  /**
   * Get the text metrics of the rtf text
   */
  descartesJS.RTFNode.prototype.getTextMetrics = function() {
    // width of a space
    this.spaceW = descartesJS.getTextWidth(" ", this.styleStr);

    switch(this.nodeType) {
      ////////////////////////////////////////////////////////////////////////////////////////////////////
      case ("textBlock"):
        for (var i=0, l=this.children.length; i<l; i++) {
          this.children[i].getTextMetrics();
        }

        break;

      ////////////////////////////////////////////////////////////////////////////////////////////////////
      case ("textLineBlock"):
      case ("formula"):
        this.getBlockMetric();

        break;

      ////////////////////////////////////////////////////////////////////////////////////////////////////
      case ("newLine"):
        metrics = descartesJS.getFontMetrics(this.styleStr);

        this.baseline = metrics.baseline;
        this.descent = metrics.descent;
        this.ascent = metrics.ascent;
        this.w = metrics.w;
        this.h = metrics.h;

        break;

      ////////////////////////////////////////////////////////////////////////////////////////////////////
      case ("text"):
      case ("dynamicText"):
        metrics = descartesJS.getFontMetrics(this.styleStr);

        this.baseline = metrics.baseline;
        this.descent = metrics.descent;
        this.ascent = metrics.ascent;
        
        textTemp = this.value;

        // if the text is a dynamic text
        if (typeof(this.value) != "string") {
          decimals = (this.decimals == undefined) ? externalDecimals : this.evaluator.evalExpression(this.decimals);
          fixed = (this.fixed == undefined) ? externalFixed : this.fixed;
          textTemp = this.evaluator.evalExpression(this.value, decimals, fixed);

          // is a number
          if (parseFloat(textTemp) == textTemp) {
            textTemp = parseFloat(textTemp).toFixed(decimals);
            textTemp = (fixed) ? textTemp : parseFloat(textTemp);
            textTemp = textTemp.toString().replace(".", this.decimal_symbol);
          }
          
          textTemp += " ";
        }
              
        this.w = descartesJS.getTextWidth(textTemp, this.styleStr);
        this.h = metrics.h;

        break;

      ////////////////////////////////////////////////////////////////////////////////////////////////////
      case ("hyperlink"):
        metrics = descartesJS.getFontMetrics(this.styleStr);

        this.baseline = metrics.baseline;
        this.descent = metrics.descent;
        this.ascent = metrics.ascent;
        
        this.w = descartesJS.getTextWidth(this.value, this.styleStr);
        this.h = metrics.h;

        this.clickCacher = document.createElement("div");
        this.clickCacher.setAttribute("style", "position: absolute; width: " + this.w + "px; height: " + this.h + "px;")

        break;

      ////////////////////////////////////////////////////////////////////////////////////////////////////
      case ("superIndex"):
        prevAscent = previousMetric.ascent;
        prevDescent = previousMetric.descent;
        prevHeigth = previousMetric.h;

        metric = descartesJS.getFontMetrics(this.styleStr);

        this.getBlockMetric();

        if (this.h < 0) {
          this.ascent = metric.ascent;
          this.descent = metric.descent;
          this.h = this.ascent + this.descent;
          this.w = this.spaceW*1.5;
        }
        
        tmpAscent = prevHeigth/2 - prevDescent + this.h;
        this.superIndexPos = tmpAscent - this.ascent;
        
        this.ascent = tmpAscent;
        this.descent = prevDescent;
        this.baseline = this.ascent;
        this.h = this.ascent + this.descent;

        break;

      ////////////////////////////////////////////////////////////////////////////////////////////////////
      case ("subIndex"):
        prevAscent = previousMetric.ascent;
        prevDescent = previousMetric.descent;
        prevHeigth = previousMetric.h;
        
        metric = descartesJS.getFontMetrics(this.styleStr);

        this.getBlockMetric();

        if (this.h < 0) {
          this.ascent = metric.ascent;
          this.descent = metric.descent;
          this.h = this.ascent + this.descent;
          this.w = this.spaceW*1.5;
        }

        this.subIndexPos = prevDescent +1;
        
        this.ascent = prevAscent;
        this.descent = this.subIndexPos + this.descent;
        this.baseline = this.ascent;
        this.h = this.ascent + this.descent;

        break;

      ////////////////////////////////////////////////////////////////////////////////////////////////////
      case ("fraction"):
        prevAscent = previousMetric.ascent;
        prevDescent = previousMetric.descent;
        prevHeigth = previousMetric.h;
        
        num = this.children[0];
        den = this.children[1];

        metric = descartesJS.getFontMetrics(num.styleStr);

        num.getBlockMetric();
        den.getBlockMetric();
        
        if (num.h < 0) {
          num.h = metric.h;
          num.w = this.spaceW;
        }
        if (den.h < 0) {
          den.h = metric.h;
          den.w = this.spaceW;
        }
        
        this.h = num.h + den.h -1;

        this.ascent = num.h + prevHeigth/2-prevDescent;
        this.descent = this.h - this.ascent;
        this.baseline = this.ascent;

        this.w = MathMax(num.w, den.w) +this.spaceW +8;

        break;
      
      ////////////////////////////////////////////////////////////////////////////////////////////////////
      case ("radical"):
        tmpStyle = this.children[0].style.clone();

        // correction in the roots when has only one child (problem in some lessons of Arquimedes)
        if (this.children.length === 1) {
          // radican
          this.children[1] = new descartesJS.RTFNode(this.evaluator, "", "radicand", tmpStyle);
          this.children[1].addChild(this.children[0]);
          // index
          this.children[0] = new descartesJS.RTFNode(this.evaluator, "", "index", tmpStyle);
        }
        // if has mora tan one child
        else {
          // if the first two children not are an index and radicand, then is a problem in Arquimedes
          // and is necesary to add all the children un the radicand value
          if ( (this.children[0].nodeType !== "index") || (this.children[1].nodeType !== "radicand") ) {
            // radican
            tmpRadican = new descartesJS.RTFNode(this.evaluator, "", "radicand", tmpStyle);
            for (var i=0, l=this.children.length; i<l; i++) {
              tmpRadican.addChild(this.children[i]);
            }
            this.children = [];

            this.children[0] = new descartesJS.RTFNode(this.evaluator, "", "index", tmpStyle);
            this.children[1] = tmpRadican;
          }
        }

        index    = this.children[0];
        radicand = this.children[1];

        index.getBlockMetric();
        radicand.getBlockMetric();

        if (radicand.h/2 < index.h) {
          this.ascent = radicand.h/2 + index.h+2 - radicand.descent;
        } 
        else {
          this.ascent = radicand.ascent +4;
        }
        
        this.descent = radicand.descent;
        this.baseline = this.ascent;
        this.h = this.ascent + this.descent;

        this.w = index.w + radicand.w +4*this.spaceW;

        break;
      
      ////////////////////////////////////////////////////////////////////////////////////////////////////
      case ("sum"):
        prevAscent = previousMetric.ascent;
        prevDescent = previousMetric.descent;
        prevHeigth = previousMetric.h;
        
        from = this.children[0];
        to   = this.children[1];
        what = this.children[2]
        
        from.getBlockMetric();
        to.getBlockMetric();
        what.getBlockMetric();

        // if "from" is empty then the ascent is -1, but is necesary to calculate the space which would occupy
        if (from.ascent == -1) {
          tmpMetric = descartesJS.getFontMetrics(from.styleStr);
          from.ascent = tmpMetric.ascent;
          from.descent = tmpMetric.descent;
          from.h = tmpMetric.h;
        }
        // if "to" is empty then the ascent is -1, but is necesary to calculate the space which would occupy
        if (to.ascent == -1) {
          tmpMetric = descartesJS.getFontMetrics(to.styleStr);
          to.ascent = tmpMetric.ascent;
          to.descent = tmpMetric.descent;
          to.h = tmpMetric.h;
        }
        
        metric = descartesJS.getFontMetrics(this.styleStr);

        // the ascent
        if (metric.h+to.h > what.ascent) {
          this.ascent = metric.h-metric.descent +to.h;
        } else {
          this.ascent = what.ascent;
        }
        
        // the descent
        if (from.h > what.descent) {
          this.descent = from.h + metric.descent;
        } else {
          this.descent = what.descent;
        }

        this.baseline = this.ascent;
        this.h = this.ascent + this.descent;

        symbolStyle = this.style.clone();
        symbolStyle.fontType = "Times New Roman";
        symbolStyle.Bold = "bold";
        symbolStyle = symbolStyle.toString();

        symbolWidth = descartesJS.getTextWidth(String.fromCharCode(parseInt(8721)), symbolStyle);
        
        this.w = MathMax(from.w, to.w, symbolWidth) + MathMax(what.w, this.spaceW) +this.spaceW;

        break;
      
      ////////////////////////////////////////////////////////////////////////////////////////////////////
      case ("integral"):
        prevAscent = previousMetric.ascent;
        prevDescent = previousMetric.descent;
        prevHeigth = previousMetric.h;
        
        from = this.children[0];
        to   = this.children[1];
        what = this.children[2]
        
        from.getBlockMetric();
        to.getBlockMetric();
        what.getBlockMetric();
        
        // if "from" is empty then the ascent is -1, but is necesary to calculate the space which would occupy
        if (from.ascent == -1) {
          tmpMetric = descartesJS.getFontMetrics(from.styleStr);
          from.ascent = tmpMetric.ascent;
          from.descent = tmpMetric.descent;
          from.h = tmpMetric.h;
        }
        // if "to" is empty then the ascent is -1, but is necesary to calculate the space which would occupy
        if (to.ascent == -1) {
          tmpMetric = descartesJS.getFontMetrics(to.styleStr);
          to.ascent = tmpMetric.ascent;
          to.descent = tmpMetric.descent;
          to.h = tmpMetric.h;
        }

        metric = descartesJS.getFontMetrics(this.styleStr);

        // the ascent
        if (metric.h+to.h > what.ascent) {
          this.ascent = metric.h-metric.descent +to.h;
        } else {
          this.ascent = what.ascent;
        }
        
        // the descent
        if (from.h > what.descent) {
          this.descent = from.h + metric.descent;
        } else {
          this.descent = what.descent;
        }

        this.baseline = this.ascent;
        this.h = this.ascent + this.descent;

        symbolStyle = this.style.clone();
        symbolStyle.fontSize = 1.5*symbolStyle.fontSize;
        symbolStyle.fontType = "Times New Roman";
        symbolStyle.Bold = "bold";
        symbolStyle = symbolStyle.toString();

        symbolWidth = descartesJS.getTextWidth(String.fromCharCode(parseInt(8747)), symbolStyle);
          
        this.w = MathMax(from.w, to.w, symbolWidth) + MathMax(what.w, this.spaceW) +2*this.spaceW;

        break;
      
      ////////////////////////////////////////////////////////////////////////////////////////////////////
      case ("limit"):
        prevAscent = previousMetric.ascent;
        prevDescent = previousMetric.descent;
        prevHeigth = previousMetric.h;
        
        from = this.children[0];
        to   = this.children[1];
        what = this.children[2]

        metric = descartesJS.getFontMetrics(this.styleStr);

        from.getBlockMetric();
        to.getBlockMetric();
        what.getBlockMetric();
        
        // if "from" is empty then the ascent is -1, but is necesary to calculate the space which would occupy
        if (from.ascent == -1) {
          tmpMetric = descartesJS.getFontMetrics(from.styleStr);
          from.ascent = tmpMetric.ascent;
          from.descent = tmpMetric.descent;
          from.h = tmpMetric.h;
        }
        // if "to" is empty then the ascent is -1, but is necesary to calculate the space which would occupy
        if (to.ascent == -1) {
          tmpMetric = descartesJS.getFontMetrics(to.styleStr);
          to.ascent = tmpMetric.ascent;
          to.descent = tmpMetric.descent;
          to.h = tmpMetric.h;
        }
        // if "what" is empty then the ascent is -1, but is necesary to calculate the space which would occupy
        if (what.ascent == -1) {
          tmpMetric = descartesJS.getFontMetrics(what.styleStr);
          what.ascent = tmpMetric.ascent;
          what.descent = tmpMetric.descent;
          what.h = tmpMetric.h;
        }
              
        this.ascent = what.ascent;
        this.descent = MathMax(metric.h, what.descent);
        this.baseline = this.ascent;
        this.h = this.ascent + this.descent;

        if (from.w == 0) {
          from.w = this.spaceW;
        }
        if (to.w == 0) {
          to.w = this.spaceW;
        }
        if (what.w == 0) {
          what.w = this.spaceW;
        }

        this.w = to.w + from.w + what.w + this.spaceW + descartesJS.getTextWidth(" " + String.fromCharCode(parseInt(8594)), this.styleStr);

        break;
      
      ////////////////////////////////////////////////////////////////////////////////////////////////////
      case ("matrix"):
        metric = descartesJS.getFontMetrics(this.styleStr);
        
        prevAscent = previousMetric.ascent;
        prevDescent = previousMetric.descent;
        prevHeigth = previousMetric.h;
        
        maxAscenderHeight = metric.ascent;
        maxDescenderHeight = metric.descent;
        maxHeigth = metric.h;
        maxWidth = this.spaceW;
        
        for (var i=0, l=this.children.length; i<l; i++) {
          this.children[i].getBlockMetric();
          
          childH = this.children[i].h;
          childW = this.children[i].w;
          
          if (maxHeigth < childH) {
            maxHeigth = childH;
            maxAscenderHeight = this.children[i].ascent;
            maxDescenderHeight = this.children[i].descent;
          }
          
          if (maxWidth < childW) {
            maxWidth = childW;
          }
        }
        
        this.childW = maxWidth + 2*this.spaceW;
        this.childH = maxHeigth;
        this.childAscent = maxAscenderHeight;
        this.childDescent = maxDescenderHeight;
        
        this.h = this.rows * maxHeigth;
        this.ascent = this.h/2 + prevDescent;
        this.descent = this.h - this.ascent;
        this.w = this.columns * this.childW +this.spaceW;

        break;
      
      ////////////////////////////////////////////////////////////////////////////////////////////////////
      case ("defparts"):
        metric = descartesJS.getFontMetrics(this.styleStr);
        
        prevAscent = previousMetric.ascent;
        prevDescent = previousMetric.descent;
        prevHeigth = previousMetric.h;
        
        maxAscenderHeight = metric.ascent;
        maxDescenderHeight = metric.descent;
        maxHeigth = metric.h;
        maxWidth = this.spaceW;

        for (var i=0, l=this.children.length; i<l; i++) {
          this.children[i].getBlockMetric();
          
          childH = this.children[i].h;
          childW = this.children[i].w;
          
          if (maxHeigth < childH) {
            maxHeigth = childH;
            maxAscenderHeight = this.children[i].ascent;
            maxDescenderHeight = this.children[i].descent;
          }
          
          if (maxWidth < childW) {
            maxWidth = childW;
          }
        }
        
        this.childW = maxWidth + 2*this.spaceW;
        this.childH = maxHeigth;
        this.childAscent = maxAscenderHeight;
        this.childDescent = maxDescenderHeight;
        
        this.h = this.parts * maxHeigth;
        this.ascent = this.h/2 + prevDescent;
        this.descent = this.h - this.ascent;
        this.w = maxWidth +this.spaceW/2;

        break;
      
      ////////////////////////////////////////////////////////////////////////////////////////////////////
      case ("mathSymbol"):
        metrics = descartesJS.getFontMetrics(this.styleStr);

        this.baseline = metrics.baseline;
        this.descent = metrics.descent;
        this.ascent = metrics.ascent;
                    
        this.w = descartesJS.getTextWidth(this.value, this.styleStr) + descartesJS.getTextWidth(" ", this.styleStr);
        this.h = metrics.h;

        break;
      
      ////////////////////////////////////////////////////////////////////////////////////////////////////
      case ("componentNumCtrl"):
        this.componentNumCtrl = this.evaluator.parent.getControlByCId(this.value);
        
        this.baseline = 0;
        this.descent = 0;
        this.ascent = 0;
        
        this.h = 0;
        this.w = this.componentNumCtrl.w;

        break;
      
      ////////////////////////////////////////////////////////////////////////////////////////////////////
      case ("componentSpace"):
        this.componentSpace = this.evaluator.parent.getSpaceByCId(this.value);
        
        this.baseline = 0;
        this.descent = 0;
        this.ascent = 0;
        
        this.h = 0;
        this.w = this.componentSpace.w;
        break;
      
      ////////////////////////////////////////////////////////////////////////////////////////////////////
      default:
        console.log("Element i=unknown", this.nodeType);
        break;
    }    
  }
  
  /**
   * Get the metric of a block
   */
  descartesJS.RTFNode.prototype.getBlockMetric = function() {
    this.w = 0;
    maxDescenderHeight = -1;
    maxAscenderHeight = -1;
    
    // loops throught all the children of a text line to determine which is the w and the h
    for (var i=0, l=this.children.length; i<l; i++) {
      children_i = this.children[i];
      children_i.getTextMetrics();

      childAscent = children_i.ascent;
      childDescent = children_i.descent;

      this.w += children_i.w;
     
      // update the previous metric
      updatePreviousMetric(childAscent, childDescent, children_i.h);
      
      if (maxAscenderHeight < childAscent) {
        maxAscenderHeight = childAscent;
      }

      if (maxDescenderHeight < childDescent) {
        maxDescenderHeight = childDescent;
      }
      
    }

    this.ascent = maxAscenderHeight;
    this.descent = maxDescenderHeight;
    this.baseline = this.ascent;
    this.h = this.ascent + this.descent;
  }
  
  /**
   * Draw a text block
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   * @param {Number} decimals the number of decimals of the text
   * @param {Boolean} fixed the number of significant digits of the number in the text
   * @param {String} align the alignment of the text
   * @param {Boolean} displaceY a flag to indicate if the text needs a displace in the y position
   */
  descartesJS.RTFNode.prototype.drawTextBlock = function(ctx, x, y, decimals, fixed, align, displaceY) {
    // if the text has a dynamic text, then is necesary to calculate the width of the elements
    if(!this.stablew) {
      this.getTextMetrics();
      externalDecimals = decimals;
      externalFixed = fixed;
    }
    // the displace if the text is from a graphic diferent to text
    displaceY = (displaceY) ? -this.children[0].ascent : 0;
    
    var desp = 0;
    var previousChildPos = 0;

    for (var i=0, l=this.children.length; i<l; i++) {
      if (i>0) {
        previousChildPos += this.children[i-1].h;
      }
      
      // // if the text align is center
      // if (align == "center") {
      //   desp = -this.children[i].w/2;
      // }
      // // if the text align is right
      // else if (align == "right") {
      //   desp =-this.children[i].w;
      // }
      
      this.children[i].draw(ctx, x +desp, y +displaceY +previousChildPos);
    }
  }

  /**
   * Draw a text line block
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawTextLineBlock = function(ctx, x, y) {
    var antChildX = 0;

    for (var i=0, l=this.children.length; i<l; i++) {

      if (i>0) {
        antChildX += this.children[i-1].w;

        if ((this.children[i-1].nodeType == "formula")) {
          antChildX += 2*descartesJS.getTextWidth(" ", this.children[i].styleStr);
        }
      }

      this.children[i].draw(ctx, x+antChildX, y+this.baseline);
    }
  }  
  
  /**
   * Draw a formula
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawFormula = function(ctx, x, y) {
    var antChildX = 0;

    for (var i=0, l=this.children.length; i<l; i++) {
      if (i>0) {
        antChildX += this.children[i-1].w;
      }
      
      this.children[i].draw(ctx, x + this.spaceW + antChildX, y);
    }    
  }
      
  /**
   * Draw a text
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawText = function(ctx, x, y) {
    if (this.color !== null) {
      ctx.fillStyle = this.color;
    }
    ctx.font = this.styleStr;
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";

    ctx.fillText(this.value, x-1, y);
    
    if (this.underline) {
      var isBold = this.style.textBold == "bold";
      var sep = isBold ? 1 : .5;

      ctx.linew = isBold ? 2 : 1;
      if (this.color != null) {
        ctx.strokeStyle = this.color;
      }
      ctx.beginPath();
      ctx.moveTo(x-1, parseInt(y+this.descent/2) +sep);
      ctx.lineTo(x-1+this.w, parseInt(y+this.descent/2) +sep);
      ctx.stroke();
    }
    
    if (this.overline) {
      var isBold = this.style.textBold == "bold";
      var sep = isBold ? 2 : 1.5;

      ctx.linew = isBold ? 2 : 1;
      if (this.color != null) {
        ctx.strokeStyle = this.color;
      }
      ctx.beginPath();
      ctx.moveTo(x-1, parseInt(y-this.ascent) +sep);
      ctx.lineTo(x-1+this.w, parseInt(y-this.ascent) +sep);
      ctx.stroke();
    }
  }
      
  /**
   * Draw a dynamic text
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawDynamicText = function(ctx, x, y) {
    var spaceW = MathFloor(this.spaceW*.5);

    decimals = (this.decimals == undefined) ? externalDecimals : this.evaluator.evalExpression(this.decimals);
    fixed = (this.fixed == undefined) ? externalFixed : this.fixed;

    textTemp = this.evaluator.evalExpression(this.value); //, decimals, fixed);
    
    // the text is a number
    if (parseFloat(textTemp) == textTemp) {
      textTemp = (fixed) ? parseFloat(textTemp).toFixed(decimals) : parseFloat(parseFloat(textTemp).toFixed(decimals));
      textTemp = (""+textTemp).replace(".", this.decimal_symbol);
    }

    if (this.color != null) {
      ctx.fillStyle = this.color;
    }
    ctx.font = this.styleStr;
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";

    this.w = descartesJS.getTextWidth(textTemp, this.styleStr);
    ctx.fillText(textTemp, spaceW + x, y);

    if (this.underline) {
      var isBold = this.style.textBold == "bold";
      var sep = isBold ? 1 : .5;

      ctx.linew = isBold ? 2 : 1;
      if (this.color != null) {
        ctx.strokeStyle = this.color;
      }
      ctx.beginPath();
      ctx.moveTo(spaceW + x-1, parseInt(y+this.descent/2) +sep);
      ctx.lineTo(spaceW + x-1+this.w, parseInt(y+this.descent/2) +sep);
      ctx.stroke();
    }
    
    if (this.overline) {
      var isBold = this.style.textBold == "bold";
      var sep = isBold ? 2 : 1.5;

      ctx.linew = isBold ? 2 : 1;
      if (this.color != null) {
        ctx.strokeStyle = this.color;
      }
      ctx.beginPath();
      ctx.moveTo(spaceW + x-1, parseInt(y-this.ascent) +sep);
      ctx.lineTo(spaceW + x-1+this.w, parseInt(y-this.ascent) +sep);
      ctx.stroke();
    }
    
    this.w += 2*spaceW;
  }

  /**
   * Draw a hyperlink
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawHyperlink = function(ctx, x, y) {
    ctx.save();

    if (this.click) {
      ctx.fillStyle = "red";
      ctx.strokeStyle = "red";      
    }
    else {
      ctx.fillStyle = "blue";
      ctx.strokeStyle = "blue";
    }

    ctx.font = this.styleStr;
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";

    ctx.fillText(this.value, x-1, y);
    
    var isBold = this.style.textBold == "bold";
    var sep = isBold ? 1 : .5;
    ctx.linew = isBold ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x-1, parseInt(y+this.descent/2) +sep);
    ctx.lineTo(x-1+this.w, parseInt(y+this.descent/2) +sep);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draw a radical
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawRadical = function(ctx, x, y) {
    var spaceW = MathFloor(this.spaceW);
    
    this.children[0].draw(ctx, x, MathFloor(y +this.children[1].descent -this.children[1].h/2 -this.children[0].descent));
    this.children[1].draw(ctx, x+1.5*spaceW+(this.children[0].w), y);
    
    ctx.linew = 1;
    if (this.color != null) {
      ctx.strokeStyle = this.color;
    }
    ctx.beginPath()

    ctx.moveTo(x, MathFloor(y +this.children[1].descent -this.children[1].h/2));
    ctx.lineTo(x+this.children[0].w, MathFloor(y +this.children[1].descent -this.children[1].h/2));
    ctx.lineTo(x+this.children[0].w +.5*spaceW, y+this.children[1].descent);
    ctx.lineTo(x+this.children[0].w +1*spaceW, y-this.children[1].ascent);
    ctx.lineTo(x+this.children[0].w +2*spaceW+this.children[1].w, y-this.children[1].ascent);

    ctx.stroke();
  }
  
  /**
   * Draw a fraction
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawFraction = function(ctx, x, y) {
    this.children[0].draw(ctx, x+(this.w-this.children[0].w)/2, y -this.ascent);
    this.children[1].draw(ctx, x+(this.w-this.children[1].w)/2, y -this.ascent + this.children[0].h -1);

    var spaceW = MathFloor(this.spaceW*.5);
    
    ctx.linew = 1;
    if (this.color != null) {
      ctx.strokeStyle = this.color;
    }
    ctx.beginPath()
    ctx.moveTo(x+spaceW, parseInt(y -this.ascent + this.children[0].h)+.5);
    ctx.lineTo(x-spaceW+this.w-1, parseInt(y -this.ascent + this.children[0].h)+.5);
    ctx.stroke();
  }

  /**
   * Draw a numerator or denominator
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawNumDen = function(ctx, x, y) {
    var antChildX = 0;
    for (var i=0, l=this.children.length; i<l; i++) {
      if (i>0) {
        antChildX += this.children[i-1].w;
      }
      this.children[i].draw(ctx, x+antChildX, y+this.baseline);
    }  
  }
  
  /**
   * Draw a sub index
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawSubIndex = function(ctx, x, y) {
    var antChildX = 0;
    for (var i=0, l=this.children.length; i<l; i++) {
      if (i>0) {
        antChildX += this.children[i-1].w;
      }
      this.children[i].draw(ctx, x+antChildX, y +this.subIndexPos);
    }
  }
  
  /**
   * Draw a super index
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawSuperIndex = function(ctx, x, y) {
    var antChildX = 0;
    for (var i=0, l=this.children.length; i<l; i++) {
      if (i>0) {
        antChildX += this.children[i-1].w;
      }
      this.children[i].draw(ctx, x+antChildX, y -this.superIndexPos);
    }  
  }

  /**
   * Draw a limit
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawLimit = function(ctx, x, y) {
    var metric = descartesJS.getFontMetrics(this.styleStr);

    var symbolString = " " + String.fromCharCode(parseInt(8594));
    symbolWidth = descartesJS.getTextWidth(symbolString, this.styleStr);
    
    // from
    this.children[0].draw(ctx, x, y +metric.descent +this.children[0].ascent);
    
    // to
    this.children[1].draw(ctx, x +this.children[0].w +symbolWidth, y +metric.descent +this.children[1].ascent);
    
    //what
    this.children[2].draw(ctx, x +symbolWidth +this.children[0].w +this.children[1].w, y);

    if (this.color != null) {
      ctx.fillStyle = this.color;
    }
    ctx.font = this.styleStr
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("lím", x +this.children[0].w, y);
    
    ctx.fillText(symbolString, x+this.children[0].w, y +metric.descent +this.children[0].ascent);
  }
  
  /**
   * Draw an integral
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawIntegral = function(ctx, x, y) {
    symbolStyle = this.style.clone();
    symbolStyle.fontSize = 1.5*symbolStyle.fontSize;
    symbolStyle.fontType = "Times New Roman";
    symbolStyle.Bold = "bold";
    symbolStyle = symbolStyle.toString();    
    
    symbolWidth = descartesJS.getTextWidth(String.fromCharCode(parseInt(8747)), symbolStyle);
    var symbolMetric = descartesJS.getFontMetrics(symbolStyle);

    maxWidth = MathMax(this.children[0].w, this.children[1].w, MathFloor(1.5*symbolWidth));
    
    // from
    this.children[0].draw(ctx, x +symbolWidth, y +symbolMetric.descent +this.children[0].ascent);
    
    // to
    this.children[1].draw(ctx, x +symbolWidth +this.spaceW/2, y -this.ascent +this.children[1].ascent);
    
    // what
    this.children[2].draw(ctx, x +maxWidth +symbolWidth, y);

    // sigma character
    if (this.color != null) {
      ctx.fillStyle = this.color;
    }
    ctx.font = symbolStyle;
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
    
    ctx.fillText(String.fromCharCode(parseInt(8747)), x, y +symbolMetric.descent/2);
  }

  /**
   * Draw a sum
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawSum = function(ctx, x, y) {
    symbolStyle = this.style.clone();
    symbolStyle.fontType = "Times New Roman";
    symbolStyle.Bold = "bold";
    symbolStyle = symbolStyle.toString();    

    symbolWidth = descartesJS.getTextWidth(String.fromCharCode(parseInt(8721)), symbolStyle);
    var symbolMetric = descartesJS.getFontMetrics(this.styleStr);

    maxWidth = MathMax(this.children[0].w, this.children[1].w, symbolWidth);
    
    // from
    this.children[0].draw(ctx, x +(maxWidth-this.children[0].w)/2, y +symbolMetric.descent +this.children[0].ascent);
    
    // to
    this.children[1].draw(ctx, x +(maxWidth-this.children[1].w)/2, y -symbolMetric.ascent -this.children[1].descent);
    
    // what
    this.children[2].draw(ctx, x +maxWidth, y);

    // sum character
    if (this.color != null) {
      ctx.fillStyle = this.color;
    }
    ctx.font = symbolStyle;
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
    
    ctx.fillText(String.fromCharCode(parseInt(8721)), x +MathFloor( (maxWidth-symbolWidth)/2 ), y-5);      
  }

  /**
   * Draw a matrix
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawMatrix = function(ctx, x, y) {
    var columnIndex;
    var rowIndex;
    
    for (var i=0, l=this.children.length; i<l; i++) {
      columnIndex = i%this.columns;
      rowIndex = MathFloor(i/this.columns);
            
      this.children[i].draw(ctx, 2*this.spaceW + x + columnIndex*this.childW, y-this.ascent+this.childAscent + rowIndex*this.childH);
    }
    
    ctx.linew = 1;
    if (this.color != null) {
      ctx.strokeStyle = this.color;
    }
    ctx.beginPath()
    ctx.moveTo(MathFloor(x +this.spaceW) +.5, y -this.ascent +.5);
    ctx.lineTo(MathFloor(x +this.spaceW/2) +.5, y -this.ascent +.5);
    ctx.lineTo(MathFloor(x +this.spaceW/2) +.5, y +this.descent +.5);
    ctx.lineTo(MathFloor(x +this.spaceW) +.5, y +this.descent +.5);
    
    ctx.moveTo(MathFloor(x +this.w -this.spaceW) -.5, y -this.ascent +.5);
    ctx.lineTo(MathFloor(x +this.w -this.spaceW/2) -.5, y -this.ascent +.5);
    ctx.lineTo(MathFloor(x +this.w -this.spaceW/2) -.5, y +this.descent +.5);
    ctx.lineTo(MathFloor(x +this.w -this.spaceW) -.5, y +this.descent +.5);    
    
    ctx.stroke();  
  }
  
  /**
   * Draw a def parts
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawDefparts = function(ctx, x, y) {
    for (var i=0, l=this.children.length; i<l; i++) {
      this.children[i].draw(ctx, x + this.spaceW/4, y-this.ascent+this.childAscent + (i%this.parts)*this.childH);
    }

    ctx.linew = 1;
    if (this.color != null) {
      ctx.strokeStyle = this.color;
    }
    ctx.beginPath()
    ctx.moveTo(MathFloor(x +this.spaceW/3) +.5, y -this.ascent +.5);
    ctx.lineTo(MathFloor(x +this.spaceW/6) +.5, y -this.ascent +.5 +(this.spaceW/3-this.spaceW/6));
    
    ctx.lineTo(MathFloor(x +this.spaceW/6) +.5, y +this.descent -this.h/2 -(this.spaceW/3-this.spaceW/6));
    ctx.lineTo(x +.5, y +this.descent -this.h/2);
    ctx.lineTo(MathFloor(x +this.spaceW/6) +.5, y +this.descent -this.h/2 +(this.spaceW/3-this.spaceW/6));
    
    ctx.lineTo(MathFloor(x +this.spaceW/6) +.5, y +this.descent +.5 -(this.spaceW/3-this.spaceW/6));
    ctx.lineTo(MathFloor(x +this.spaceW/3) +.5, y +this.descent +.5);
    
    ctx.stroke(); 
  }

  /**
   * Draw a math symbol
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawMathSymbol = function(ctx, x, y) {
    ctx.linew = 1;
    if (this.color != null) {
      ctx.strokeStyle = this.color;
      ctx.fillStyle = this.color;
    }
    ctx.beginPath()

    if (this.value == "(") {
      ctx.font = this.styleStr;
      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("(", x, y);
      // ctx.moveTo(x +this.spaceW +.1, y -this.parent.ascent +this.h/10);
      // ctx.quadraticCurveTo(x +this.spaceW/5, y +this.parent.descent -this.parent.h/2,
      //                      x +this.spaceW, y +this.parent.descent -this.h/10);
      // ctx.stroke();
    }
    else if (this.value == ")") {
      ctx.font = this.styleStr;
      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(")", x+this.spaceW, y);
      // ctx.moveTo(x +this.spaceW +.1, y -this.parent.ascent +this.h/10);
      // ctx.quadraticCurveTo(x +this.spaceW +4*this.spaceW/5, y +this.parent.descent -this.parent.h/2,
      //                      x +this.spaceW, y +this.parent.descent -this.h/10);
      // ctx.stroke();
    }
    else {
      ctx.font = this.styleStr;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      
      ctx.fillText(this.value, x +this.w/2, y);      
    }
  }
  
  /**
   * Draw a generic block, that do not need to modify the position of its components
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawGenericBlock = function(ctx, x, y) {
    var antChildX = 0;
    for (var i=0, l=this.children.length; i<l; i++) {
      if (i>0) {
        antChildX += this.children[i-1].w;
      }
      this.children[i].draw(ctx, x+antChildX, y);
    }  
  }  
  
  /**
   * Draw a control componet
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawComponentNumCtrl = function(ctx, x, y) {
    this.getTextMetrics();
    this.componentNumCtrl.expresion = this.evaluator.parser.parse("(" + x + "," + (y-this.parent.ascent) + "," + this.componentNumCtrl.w + "," + this.componentNumCtrl.h + ")");
  }
  
  /**
   * Draw a space component
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.drawComponentSpace = function(ctx, x, y) {
    this.getTextMetrics();
    this.componentSpace.xExpr = this.evaluator.parser.parse(x+"");
    this.componentSpace.yExpr = this.evaluator.parser.parse((y-this.parent.ascent)+"");
  }

  /**
   * Draw a unknown element
   * @param {2DContext} ctx the context to draw the text
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   */
  descartesJS.RTFNode.prototype.draw = function(ctx, x, y) {
    console.log(">>> Dibujo desconocido ", this.nodeType);
    this.children[0].draw(ctx, x, y);
  }

  /**
   * 
   */
  descartesJS.RTFNode.prototype.toHTML = function() {
    var htmlString = "";
    
    if ( (this.nodeType === "textLineBlock") || (this.nodeType === "textBlock") ) {
      for (var i=0, l=this.children.length; i<l; i++) {
        htmlString = htmlString + this.children[i].toHTML();
      }
    }
    else if (this.nodeType === "text") {
      htmlString = "<span " + this.style.toCSS() + ">" + this.value + "</span>"; 
    }
    else if (this.nodeType === "newLine") {
      htmlString = "<span " + this.style.toCSS() + ">" + this.value + "<br /></span>";
    }
    else {
      console.log(">>><<<", this);
    }
    
    return htmlString;
  }
  
  return descartesJS;
})(descartesJS || {});