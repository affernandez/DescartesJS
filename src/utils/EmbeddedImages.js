/**
 * @author Joel Espinosa Longi
 * @licencia LGPL - http://www.gnu.org/licenses/lgpl.html
 */

var descartesJS = (function(descartesJS) {
  if (descartesJS.loadLib) { return descartesJS; }

  // var w;
  // var h;
  // var canvas;
  // var ctx;
  // var black;
  // var white;
  // var gray;

  /**
   * Get the embedded image of the license used in Arquimedes
   * @return {Image} return the image of the license used in Arquimedes
   */
  descartesJS.getCreativeCommonsLicenseImage = function() {
    var img = new Image();

    // w = 88;
    // h = 31;
    // black = "#000";
    // white = "#fff";
    // gray = "#bebebe";

    // canvas = document.createElement("canvas");
    // canvas.setAttribute("width", w);
    // canvas.setAttribute("height", h);
    // ctx = canvas.getContext("2d");

    // ctx.lineWidth = 1;
    // ctx.fillStyle = gray;
    // ctx.fillRect(0, 0, w, h);

    // ctx.strokeStyle = black;
    // ctx.strokeRect(.5, .5, w-1, h-1);

    // ctx.fillStyle = black;
    // ctx.fillRect(0, 21, w, h)

    // ctx.fillStyle = gray;
    // ctx.beginPath();
    // ctx.arc(14, 14.5, 13.5, 0, Math.PI);
    // ctx.fill();

    // ctx.lineWidth = 2;
    // ctx.fillStyle = white;

    // // cc
    // ctx.beginPath();
    // ctx.arc(14, 14.5, 10.5, 0, 2*Math.PI);
    // ctx.fill();
    // ctx.stroke();
    // ctx.font = "bold 12px Arial";
    // ctx.fillStyle = black;
    // ctx.fillText("cc", 7.5, 18);
    // ctx.fillStyle = white;

    // // by
    // ctx.beginPath();
    // ctx.arc(40, 11, 7.5, 0, 2*Math.PI);
    // ctx.fill();
    // ctx.stroke();
    // ctx.fillStyle = black;
    // ctx.fillRect(39, 6, 2, 2);
    // ctx.fillRect(38.5, 9, 3.5, 3.5);
    // ctx.fillRect(39, 9, 2, 7);
    // ctx.fillStyle = white;

    // // nc
    // ctx.beginPath();
    // ctx.arc(58, 11, 7.5, 0, 2*Math.PI);
    // ctx.fill();
    // ctx.stroke();
    // // inside nc
    // ctx.font = "bold 11px Arial";
    // ctx.fillStyle = black;
    // ctx.fillText("$", 55.5, 15);
    // ctx.fillStyle = white;
    // ctx.beginPath();
    // ctx.moveTo(51, 9);
    // ctx.lineTo(64, 13);
    // ctx.stroke();

    // // sa
    // ctx.beginPath();
    // ctx.arc(76, 11, 7.5, 0, 2*Math.PI);
    // ctx.fill();
    // ctx.stroke();
    // // inside sa
    // ctx.beginPath();
    // ctx.arc(76, 11, 3.5, 4*Math.PI/5, Math.PI, true);
    // ctx.stroke();

    // // text
    // ctx.font = "8px Arial";
    // ctx.fillText("BY", 35, 29);
    // ctx.fillText("NC", 53, 29);
    // ctx.fillText("SA", 71, 29);

    // img.src = canvas.toDataURL();

    img.src = "data:image/png;base64,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";

    return img;
  }

  return descartesJS;
})(descartesJS || {});