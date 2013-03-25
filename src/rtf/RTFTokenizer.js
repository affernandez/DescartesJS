/**
 * @author Joel Espinosa Longi
 * @licencia LGPL - http://www.gnu.org/licenses/lgpl.html
 */

var descartesJS = (function(descartesJS) {
  if (descartesJS.loadLib) { return descartesJS; }

  var StringFromCharCode = String.fromCharCode;
  var tokens;
  var inputLenght;
  var tokens;
  var tokenType;
  var tokenValue;
  var pos;
  var blockNumber;
  var currentChar;
  var nextChar;
  var insideControlWord;
  var lastTokenType;
  var tmpMatch;
  var tmpText;

  /**
   * A rtf tokenizer
   * @constructor 
   */
  descartesJS.RTFTokenizer = function() { };
  
  /**
   * Get a rtf parse tree from an input
   * @param {String} input the rtf text to tokenize
   */
  descartesJS.RTFTokenizer.prototype.tokenize = function(input) {
    if (input) {
      // input = input.replace(/\\'(\w{2})/g, function(str, m1){ return StringFromCharCode(parseInt(m1, 16)); });
      input = input.replace(/\\rquote /g, "'").replace(/\\endash /g, "-").replace(/\n/g, " ").replace(/\r/g, "").replace(/\\uc(\d+) /g, "").replace(/\\uc(\d+)/g, "");
    } 
    else {
      return [];
    }

    tokens = [];
    inputLenght = input.length;
    tokens = [];
    tokenValue = "";
    pos = 0;
    blockNumber = 0;
    nextChar = input.charAt(0);
    insideControlWord = false;
    lastTokenType = "text";

    while (pos < inputLenght) {
      currentChar = nextChar;
      nextChar = input.charAt(pos+1);

      // outside a controlWord, maybe a text or init of the input
      if (!insideControlWord) {
        // found a controlWord
        if (currentChar === "\\") {
          insideControlWord = true;

          if (tokenValue !== "") {
            tokens.push({ type: "text", value: tokenValue });
            lastTokenType = "text";
          }

          tokenValue = "";
        }
        // open block
        else if (currentChar === "{") {
          blockNumber++;

          if (tokenValue !== "") {
            tokens.push({ type: "text", value: tokenValue });
            lastTokenType = "text";
          }

          tokenValue = "";

          tokens.push({ type: "openBlock", value: blockNumber });
          lastTokenType = "openBlock";
        }
        // close block
        else if (currentChar === "}") {
          if (tokenValue !== "") {
            tokens.push({ type: "text", value: tokenValue })
            lastTokenType = "text";
          }

          tokenValue = "";

          tokens.push({ type: "closeBlock", value: blockNumber });
          lastTokenType = "closeBlock";
          blockNumber--;
        }
        // control word
        else {
          if ((tokenValue === "") && (currentChar === " ") && (lastTokenType === "controlWord")) {
            lastTokenType = "text";
          }
          else {
            tokenValue += currentChar;
          }
        }
      }
      // inside a controlWord
      else {
        if ((nextChar === "\\") || (nextChar === "{") || (nextChar === "}") || (nextChar === " ") || (nextChar === ";")) {
          insideControlWord = false;
          tokenValue += currentChar;

          // controlWord of the form \'##
          tmpMatch = tokenValue.match(/^\'([0-9a-f]{2})/);
          if (tmpMatch) {
            tmpText = "";
            if (lastTokenType === "text") {
              tmpText = tokens.pop().value;
            }

            tmpText += StringFromCharCode(parseInt(tmpMatch[1], 16)) + tokenValue.substring(3);
            tokens.push({ type: "text", value: tmpText });
            lastTokenType = "text";

            tokenValue = "";
          }
          else {
            // controlWord of the form \u###
            tmpMatch = tokenValue.match(/^u[0-9]+/);
            if (tmpMatch) {
              tmpText = "";
              if (lastTokenType === "text") {
                tmpText = tokens.pop().value;
              }

              tmpText += StringFromCharCode(tmpMatch[0].substring(1));
              tokens.push({ type: "text", value: tmpText });
              lastTokenType = "controlWord";

              tokenValue = "";
            }
            // generic controlWord
            else {
              tokens.push({ type: "controlWord", value: tokenValue });
              lastTokenType = "controlWord";

              tokenValue = "";            
            }
          }
        }
        else {
          tokenValue += currentChar;
        }
      }

      pos++;
    }

    // if the last text token is not added
    if (tokenValue !== "") {
      console.log(tokenValue)
      tokens.push({ type: "text", value: tokenValue })
    }

    return tokens;
  }  

  return descartesJS;
})(descartesJS || {});