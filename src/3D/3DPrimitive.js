/**
 * @author i Espinosa Longi
 * @licencia LGPL - http://www.gnu.org/licenses/lgpl.html
 */

var descartesJS = (function(descartesJS) {
  if (descartesJS.loadLib) { return descartesJS; }

  var MathFloor = Math.floor;
  var Math2PI = 2*Math.PI;
  var lineCap = "round";
  var lineJoin = "round";

  var v1;
  var v2;
  var evaluator;
  var verticalDisplace;
  var theText;

  var tempParam;

  var epsilon = 0.00000001;

  /**
   * 3D primitive (vertex, face, text, edge)
   * @constructor
   */
  descartesJS.Primitive3D = function (values, space) {
    this.space = space;

    // traverse the values to replace the defaults values of the object
    for (var propName in values) {
      // verify the own properties of the object
      if (values.hasOwnProperty(propName)) {
        this[propName] = values[propName];
      }
    }

    this.projVert = [];
    this.spaceVertices = [];

    // asign the corresponding drawing function
    if (this.type === "vertex") {
      this.draw = drawVertex;
    }
    else if (this.type === "face") {
      this.normal = getNormal(this.vertices[0], this.vertices[1], this.vertices[2]);
      this.draw = drawFace;
    }
    else if (this.type === "text") {
      // get the font size
      this.fontSize = this.font.match(/(\d+)px/);
      if (this.fontSize) {
        this.fontSize = parseInt(this.fontSize[1]);
      } else {
        this.fontSize = 10;
      }

      this.draw = drawPrimitiveText;
    }
    else if (this.type === "edge") {
      this.draw = drawEdge;
    }

    // overwrite the computeDepth function if the primitive is a text
    if (this.isText) {
      this.computeDepth = function() {
        this.projVert = this.vertices;
        this.depth = this.vertices[0].z;
        this.average = this.vertices[0];
        this.passDraw = 1;
      }
    }

  }

  /**
   * Compute a transformation to the vertices
   * @param
   */
  descartesJS.Primitive3D.prototype.computeDepth = function(space) {
    this.space = space;

    this.average = { x: 0, y: 0, z: 0 };

    // remove repeated vertices
    this.removeDoubles();

    this.normal = { x: 0, y: 1, z: 0 };
    this.direction = { x: 1, y: 0, z: 0 };

    // apply the camera rotation
    for (var i=0, l=this.vertices.length; i<l; i++) {
      this.spaceVertices[i] = space.rotateVertex(this.vertices[i]);
      this.average.x += this.spaceVertices[i].x;
      this.average.y += this.spaceVertices[i].y;
      this.average.z += this.spaceVertices[i].z;
    }
    this.average = descartesJS.scalarProduct3D(this.average, 1/l);
    this.depth = descartesJS.norm3D(descartesJS.subtract3D(space.eye, this.average));

    // triangles and faces
    if (this.vertices.length > 2) {
      this.normal = getNormal(this.spaceVertices[0], this.spaceVertices[1], this.spaceVertices[2]);
      this.direction = descartesJS.dotProduct3D( this.normal, descartesJS.normalize3D(space.eye) );
    }
    this.passDraw = 1;

    // project the vertices and store it in the projVert array
    for (var i=0, l=this.vertices.length; i<l; i++) {
      this.projVert[i] = space.project(this.spaceVertices[i]);
      this.passDraw = this.passDraw && (this.projVert[i].z > 0);
    }

    //////////////////////////////////////////////////
    this.minDistanceToEye = Math.Inifinity;
    this.maxDistanceToEye = -Math.Inifinity;
    this.minx =  Math.Inifinity;
    this.miny =  Math.Inifinity;
    this.maxx = -Math.Inifinity;
    this.maxy = -Math.Inifinity;

    for (var i=0, l=this.vertices.length; i<l; i++) {
      var d = descartesJS.norm3D(descartesJS.subtract3D(this.spaceVertices[i], space.eye));
      this.minDistanceToEye = Math.min(this.minDistanceToEye, d);
      this.maxDistanceToEye = Math.max(this.maxDistanceToEye, d);
    }
    for (var i=0, l=this.vertices.length; i<l; i++) {
      if (this.minx > this.projVert[i].x) {
        minx = this.projVert[i].x;
      }
      if (this.maxx < this.projVert[i].x) {
        maxx = this.projVert[i].x;
      }
      if (this.miny > this.projVert[i].y) {
        miny = this.projVert[i].y;
      }
      if (this.mixy < this.projVert[i].y) {
        mixy = this.projVert[i].y;
      }
    }
    //////////////////////////////////////////////////

    // dibujar la cara en el sistema viejo
    if (!space.new3D) {
      this.passDraw = 1;
    }
  }

  var tmpVertices;
  /**
   *
   */
  descartesJS.Primitive3D.prototype.removeDoubles = function() {
    if (this.type !== "edge") {

      tmpVertices = [];
      for (var i=0, l=this.vertices.length; i<l; i++) {
        if ( (this.vertices[i].x !== this.vertices[(i+1)%l].x) ||
             (this.vertices[i].y !== this.vertices[(i+1)%l].y) ||
             (this.vertices[i].z !== this.vertices[(i+1)%l].z) ||
             (this.vertices[i].w !== this.vertices[(i+1)%l].w)
           ) {
          tmpVertices.push(this.vertices[i]);
        }
      }

      if (tmpVertices.length === 0) {
        tmpVertices.push(this.vertices[0]);
      }

      this.vertices = tmpVertices;
    }
  }

  /**
   *
   */
  function drawVertex(ctx) {
    ctx.textNode = null;

    if (parseInt(this.size) !== 0) {
      ctx.lineWidth = 1;
      ctx.fillStyle = this.backColor;
      ctx.strokeStyle = this.frontColor;

      ctx.beginPath();
      ctx.arc(this.projVert[0].x, this.projVert[0].y, this.size+.5, 0, Math2PI);
      ctx.fill();
      ctx.stroke();
    }
  }

  /**
   *
   */
  function drawFace(ctx, space) {
    ctx.textNode = null;

    ctx.lineCap = lineCap;
    ctx.lineJoin = lineJoin;
    ctx.lineWidth = ((this.backColor.charAt(0) == "#") || (this.frontColor.charAt(0) == "#")) ? 1 : 0.1;

    // set the path to draw
    ctx.beginPath();
    ctx.moveTo(this.projVert[0].x, this.projVert[0].y);
    for (var i=1, l=this.projVert.length; i<l; i++) {
      ctx.lineTo(this.projVert[i].x, this.projVert[i].y);
    }
    ctx.closePath();

    // color render
    if (this.model === "color") {
      if (this.direction >= 0) {
        ctx.fillStyle = this.backColor;
      }
      else {
        ctx.fillStyle = this.frontColor;
      }
      ctx.strokeStyle = ctx.fillStyle;

      ctx.stroke();
      ctx.fill();
    }
    // light and metal render
    else if ( (this.model === "light") || (this.model === "metal") ) {
      if (this.direction >= 0) {
        ctx.fillStyle = space.computeColor(this.backColor, this, (this.model === "metal"));
      }
      else {
        ctx.fillStyle = space.computeColor(this.frontColor, this, (this.model === "metal"));
      }
      ctx.strokeStyle = ctx.fillStyle;

      ctx.stroke();
      ctx.fill();
    }
    // wireframe render
    else if (this.model === "wire") {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = this.frontColor;
      ctx.stroke();
    }

    // draw the edges
    if ((this.edges) && (this.model !== "wire")) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#808080"
      ctx.stroke();
    }
  }

  /**
   *
   */
  function drawPrimitiveText(ctx) {
    ctx.textNode = null;

    tempParam = this.evaluator.getVariable(this.family);
    this.evaluator.setVariable(this.family, this.familyValue);

    this.drawText(ctx, this.text, this.projVert[0].x, this.projVert[0].y +this.displace, this.frontColor, this.font, "left", "alphabetic", this.decimals, this.fixed, true);

    this.evaluator.setVariable(this.family, tempParam);
  }

  /**
   *
   */
  function drawEdge(ctx) {
    ctx.textNode = null;

    ctx.lineCap = lineCap;
    ctx.lineJoin = lineJoin;
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.frontColor;

    // set the path to draw
    ctx.beginPath();
    ctx.moveTo(this.projVert[0].x, this.projVert[0].y);
    ctx.lineTo(this.projVert[1].x, this.projVert[1].y);

    ctx.stroke();
  }

  /**
   * Draw the text of the graphic
   * @param {CanvasRenderingContext2D} ctx the context render to draw
   * @param {String} text the text to draw
   * @param {Number} x the x position of the text
   * @param {Number} y the y position of the text
   * @param {String} fill the fill color of the graphic
   * @param {String} font the font of the text
   * @param {String} align the alignment of the text
   * @param {String} baseline the baseline of the text
   * @param {Number} decimals the number of decimals of the text
   * @param {Boolean} fixed the number of significant digits of the number in the text
   * @param {Boolean} displaceY a flag to indicate if the text needs a displace in the y position
   */
  descartesJS.Primitive3D.prototype.drawText = function(ctx, text, x, y, fill, font, align, baseline, decimals, fixed, displaceY) {
    ctx.textNode = text;

    // rtf text
    if (text.type == "rtfNode") {
      ctx.fillStyle = fill;
      ctx.strokeStyle = fill;
      ctx.textBaseline = "alphabetic";
      ctx.textNode.pos = { x:x, y:y };
      text.draw(ctx, x, y, decimals, fixed, align, displaceY);

      return;
    }

    // simple text (none rtf text)
    if (text.type === "simpleText") {
      text = text.toString(decimals, fixed).split("\\n");
    }

    x = x + ((/Arial|Times/i).test(font) ? -2 : 0);

    evaluator = this.evaluator;
    ctx.fillStyle = descartesJS.getColor(evaluator, fill);
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;

    verticalDisplace = this.fontSize*1.2 || 0;

    for (var i=0, l=text.length; i<l; i++) {
      theText = text[i];

      if (this.border) {
        ctx.strokeText(theText, x, y+(verticalDisplace*i));
      }
      ctx.fillText(theText, x, y+(verticalDisplace*i));
    }
  }

  /**
   *
   */
  descartesJS.Primitive3D.prototype.splitFace = function(p) {
    if (this.intersects(p)) {
      var i1 = null;
      var i2 = null;
      var ix1 = 0;
      var ix2 = 0;
      var oneIsInterior;
      var j1;
      var j2;
      var inter;
      var J;
      var j;
      var k;
      var P = this.vertices;
      var pP = p.vertices;

      for (var i=0, l=pP.length; i<l; i++) {
        inter = this.intersection( pP[i], pP[(i+1)%l] );

        if (inter !== null) {
          if (i1 === null) {
            i1 = inter;
            ix1 = i;
            if (pP.length === 2) {
              i2 = i1;
              break;
            }
          }
          else if (!descartesJS.equals3DEpsilon(inter, i1, epsilon)) {
            i2 = inter;
            ix2 = i;
            break;
          }
        }
      }

      if ((i1 !== null) && (i2 !== null)) {
        oneIsInterior = this.isInterior(i1) || this.isInterior(i2);
        j1 = null;
        j2 = null;

        if ((!oneIsInterior) && (pP.length >= 3)) {
          for (var j=0, k=P.length; j<k; j++) {
            inter = p.intersection( this.vertices[j], this.vertices[(j+1)%k] );
            if (inter !== null) {
              if (j1 === null) {
                j1 = inter;
              }
              else if (!descartesJS.equals3DEpsilon(inter, j1, epsilon)) {
                j2 = inter;
                break;
              }
            }
          }
        }

        if ( (oneIsInterior) || ((j1 !== null) && (j2 !== null) && (p.isInterior(j1)) && (p.isInterior(j2))) ) {
          var splitted = true;
          var P0 = pP;
          var V = null;
          var v = null;

          if (P0.length === 2) {
            if (descartesJS.equals3DEpsilon(i1, P0[0], epsilon) || descartesJS.equals3DEpsilon(i1, P0[1], epsilon)) {
              splitted = false;
            }
            else {
              V = [];
              V[0] = P0[0];
              V[1] = i1;
              v = [];
              v[0] = i1;
              v[1] = P0[1]
            }
          }
          else {
            V = [];
            v = [];
            J=0;
            j=0;
            k=0;

            for (var i=0; i<P0.length; i++) {
              if (i < ix1) {
                V[J++] = P0[i];
              }
              else if (i == ix1) {
                V[J++] = P0[i];
                V[J++] = i1;
                v[j++] = i1;
              }
              else if (i < ix2) {
                v[j++] = P0[i];
              }
              else if (i == ix2) {
                v[j++] = P0[i];
                v[j++] = i2;
                V[J++] = i2;
              }
              else {
                V[J++] = P0[i];
              }
            }
          }

          if (splitted) {
            var fa = [];

            fa[0] = new descartesJS.Primitive3D( { vertices: V,
                                                   type: "face",
                                                   frontColor: p.frontColor,
                                                   backColor: p.backColor,
                                                   edges: p.edges,
                                                   model: p.model
                                                  },
                                                  this.space );
            fa[0].normal = p.normal;

            fa[1] = new descartesJS.Primitive3D( { vertices: v,
                                                   type: "face",
                                                   frontColor: p.frontColor,
                                                   backColor: p.backColor,
                                                   edges: p.edges,
                                                   model: p.model
                                                  },
                                                  this.space );
            fa[1].normal = p.normal;

            return fa;
          }
        }
      }
    }

    return [p];
  }

  /**
   * check if two faces has an intersection
   */
  descartesJS.Primitive3D.prototype.intersects = function(p) {
    return this.intersectsPlane(p) && p.intersectsPlane(this);
  }

  /**
   * check if two planes intersects
   */
  descartesJS.Primitive3D.prototype.intersectsPlane = function(p) {
    var di;
    var d;
    var d0;
    var P = this.vertices;
    var pP = p.vertices;

    if (pP.length > 0) {
      d = descartesJS.dotProduct3D(pP[0], p.normal);
      d0 = descartesJS.dotProduct3D(P[0], p.normal);

      if (Math.abs(d-d0) < epsilon) {
        return true;
      }
      for (var i=1, l=P.length; i<l; i++) {
        di = descartesJS.dotProduct3D(P[i], p.normal);

        if ( (Math.abs(d-di) < epsilon) || (di>d && d0<d) || (di<d && d0>d) ) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   *
   */
  descartesJS.Primitive3D.prototype.intersection = function(p1, p2) {
    var P = this.vertices;

    if (P.length > 0) {
      var p12 = descartesJS.subtract3D(p2, p1);
      var den = descartesJS.dotProduct3D(p12, this.normal);
      if (den !== 0) {
        var t = descartesJS.dotProduct3D( descartesJS.subtract3D(P[0], p1), this.normal ) / den;

        if ((-epsilon < t) && (t < 1+epsilon)) {
          return descartesJS.add3D(p1, descartesJS.scalarProduct3D(p12, t));
        }
      }
    }

    return null;
  }

  /**
   *
   */
  descartesJS.Primitive3D.prototype.isInterior = function(r) {
    var P = this.vertices;

    if (P.length > 0) {
      var D = 0;
      var u = descartesJS.subtract3D(P[0], r);

      for (var i=0, l=P.length; i<l; i++) {
        var v = descartesJS.subtract3D(P[(i+1)%l], r);
        var D1 = descartesJS.dotProduct3D( descartesJS.crossProduct3D(u, v), this.normal );

        if (Math.abs(D1) < epsilon) {
          if (descartesJS.dotProduct3D(u, v) < 0) {
            return true;
          }
        }
        else {
          if (((D < 0) && (D1 > 0)) || ((D > 0) && (D1 < 0))) {
            return false;
          }
          u = v;
          D = D1;
        }
      }
    }

    return true;
  }

  /**
   *
   */
  function getNormal(u1, u2, u3) {
    return descartesJS.normalize3D( 
      descartesJS.crossProduct3D(
        descartesJS.subtract3D(u1, u2), 
        descartesJS.subtract3D(u1, u3)
      ) 
    );
  }

//********************************************************************************************************************

  /**
   *
   */
  descartesJS.Primitive3D.prototype.inFrontOf = function(V, F, epsilon) {
    var v;
    var p;
    var ray;

    if (this.maxx<=F.minx || this.minx>=F.maxx || this.maxy<=F.miny || this.miny>=F.maxy) {
      return false;
    }
    if (this.minDistanceToEye >= F.maxDistanceToEye) {
      return false;
    }

    for (var state=0; state<3; state++) {
      v = null;

      switch (state) {
        case 0: 
          v = this.intersections(F);
          break;
        case 1:
          v = F.verticesContainedIn(this);
          break;
        case 2:
          v = this.verticesContainedIn(F);
          break;
      }

      if ((v != null) && (v != [])) {
        for (var k=0; k<v.length; k++) {
          V.push(v[k]);
        }

        for (var i=0, l=v.length; i<l; i++) {
          p = v[i];
          ray = this.space.rayFromEye(p.x, p.y);
          try {
            t = this.distanceToEyeAlong(ray) - F.distanceToEyeAlong(ray);
            if (t <= -epsilon) {
              return true;
            }
            else if (t >= epsilon) {
              return false;
            }
          }
          catch(e) {
            console.log("Error: inFrontOf");
            // return false;
          }
        }
      }
    }
    return false;
  }

  /**
   *
   */
  descartesJS.Primitive3D.prototype.intersections = function(F) {
    var V = [];
    var pi;
    var qi;
    var pj;
    var qj;
    var ip;
    var newIP = new descartesJS.R2();

    var P = this.spaceVertices;
    var FP = F.spaceVertices;
    var pr = this.projVert;
    var Fpr = F.projVert;

    for (var i=0, l=P.length; i<l; i++) {
      pi = P[i];
      qi = P[(i+1)%l];
      for (var j=0, Fl=FP.length; j<Fl; j++) {
        pj = FP[j];
        qj = FP[(j+1)%Fl];

        if ( (pi!=pj) && (pi!=qj)  && (qi!=pj) && (qi!=qj) ) {
          ip = newIP.intersection(pr[i], pr[(i+1)%l], Fpr[j], Fpr[(j+1)%Fl]);
          if (ip != null) {
            V.push(ip);
          }
        }
      }
    }

    return V;
  }

  /**
   *
   */
  descartesJS.Primitive3D.prototype.distanceToEyeAlong = function(ray) {
    var den = descartesJS.dotProduct3D(this.normal, ray);

    if (Math.abs(den) > 0.000001) {
      var normalToEye = descartesJS.dotProduct3D( descartesJS.subtract3D(this.average, this.space.eye), this.normal );
      return normalToEye/den;
    }
//    throw new Exception("Face is invisible");
  }

  /**
   *
   */
  descartesJS.Primitive3D.prototype.verticesContainedIn = function(F) {
    var V = [];
    var P = this.spaceVertices;
    var pr = this.projVert;

    for (var i=0, l=P.length; i<l; i++) { 
      if (!F.isVertex(P[i]) && F.appearsToContain(pr[i])) {
        V.push(pr[i]);
      }
    }
    return V;
  }

  /**
   *
   */
  descartesJS.Primitive3D.prototype.appearsToContain = function(p) {
    var D = 0;
    var D1;
    var P = this.spaceVertices;
    var pr = this.projVert;

    for (var i=0, l=P.length; i<l; i++) {
      D1 = ((pr[i].x-p.x)*(pr[(i+1)%l].y-p.y))-((pr[(i+1)%l].x-p.x)*(pr[i].y-p.y));

      if (D != 0) {
        if (Math.abs(D1)<epsilon) {
          if (Math.abs(pr[i].x-pr[(i+1)%l].x)>epsilon) {
            return (Math.min(pr[i].x,pr[(i+1)%l].x)<=p.x+epsilon && p.x<=Math.max(pr[i].x,pr[(i+1)%l].x)+epsilon);
          } else if (Math.abs(pr[i].y-pr[(i+1)%l].y)>epsilon) {
            return (Math.min(pr[i].y,pr[(i+1)%l].y)<=p.y+epsilon && p.y<=Math.max(pr[i].y,pr[(i+1)%l].y)+epsilon);
          }
        }
        else if ( (D>0 && D1<0) || (D<0 && D1>0) ) {
          return false;
        }
      }
      D=D1;
    }
    return true;
  }

  /**
   *
   */
  descartesJS.Primitive3D.prototype.isVertex = function(p) {
    var P = this.spaceVertices;

    for (var i=0, l=P.length; i<l; i++) {
      if (descartesJS.equals3DEpsilon(p, P[i], epsilon)) {
        return true;
      }
    }
    return false;
  }

  return descartesJS;
})(descartesJS || {});
