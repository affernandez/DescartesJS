/**
 * @author Joel Espinosa Longi
 * @licencia LGPL - http://www.gnu.org/licenses/lgpl.html
 */

var descartesJS = (function(descartesJS) {
  if (descartesJS.loadLib) { return descartesJS; }

  /**
   * Una accion de limpiar de descartes
   * @constructor 
   * @param {DescartesApp} parent es la aplicacion de descartes
   * @param {string} values son los valores que definen el parametro de la accion
   */
  descartesJS.Clear = function(parent, parameter) {
    // se llama al constructor del padre
    descartesJS.Action.call(this, parent, parameter);
  }  
  
  ////////////////////////////////////////////////////////////////////////////////////
  // se crea la herencia de Action
  ////////////////////////////////////////////////////////////////////////////////////
  descartesJS.extend(descartesJS.Clear, descartesJS.Action);

  /**
   * Ejecuta la accion
   */
  descartesJS.Clear.prototype.execute = function() {
    this.parent.clear();
  }

  return descartesJS;
})(descartesJS || {});