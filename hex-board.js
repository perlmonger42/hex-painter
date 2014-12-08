/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * This code uses Raphael to create an SVG image of a hex gameboard. (In older
 * versions of IE, which don't support SVG, it creates a VML image instead.)
 *  - the SVG is created as a the only child of div#draw, after removing any
 *    existing children of that div.
 *  - the hexboard description to be compiled into a picture is pulled from
 *    textarea#code
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
/*jslint indent: 2, browser: true */
/*globals Raphael */

(function () {
  'use strict';

  /**
   * Create a function-callback which will be run after a keyup event occurs on
   * {domNode}, after a delay of {responseTime} milliseconds. The delay restarts
   * if another keyup occurs before the callback is invoked.
   *
   * @constructor
   * @this {UpdateAfterInputPause}
   * @param {jQueryObject} domNode The node to monitor for keyup events.
   * @param {number} responseTime The number of milliseconds to wait before
   *   invoking the callback.
   * @param {function ()} callback The callback function.
   */
  function UpdateAfterInputPause(domNode, responseTime, callback) {
    var thisObject = this;
    this.restart = function () {
      thisObject.cancel();
      thisObject.timeoutID = window.setTimeout(callback, responseTime);
    };
    this.cancel = function () {
      if (typeof thisObject.timeoutID === 'number') {
        window.clearTimeout(thisObject.timeoutID);
        delete thisObject.timeoutID;
      }
    };
    domNode.keyup(function () { thisObject.restart(); });
    this.restart();
  }

  /*
      Possible textual representations of hex game states

      > < > < > <*> <O> < > <
      < > < > <O> <O> <O> < >
      >< ><O><O><O><O><

      >. . * O .<
      . . O O O .
      >. O O O O<
      _ _ ^ ^ ^ _

      .. . * O . .
      . . O O O ..
      .. O O O O .
         = = = =
  */


  /**
   * Add a line of output to div#monitor.
   * @param {string} s The string to print.
   */
  function println(s) {
    $('#monitor')[0].value += s + '\n';
  }


  /**
   * Convert a gameboard description into an image of a hex gameboard.
   * @param {jQueryObject} where The DOM node in which the image will be inserted.
   * @param {string} board_description The gameboard configuration string.
   */
  function drawBoard(where, board_description) {
    if (typeof board_description === 'undefined') {
      return;
    }
    /**
     * The ratio between the minor radius and the major radius of a hexagon.
     * The precise value is the square root of 3/4.
     * @const
     * @type {number}
     */
    var ratio = 0.866;
    var R = 20;        // major radius of hexagons
    var r = R * ratio; // minor radius of hexagons
    var dx = Math.round(r);    // delta-x for move-to's and line-to's
    var dy = Math.round(R / 2);  // delta-y for move-to's and line-to's
    var margin = 5;
    var Cx = margin + dx, Cy = margin, Row = 0;
    var playerColor = 'cyan';
    var hilightColor = 'yellow';
    var opponentColor = 'red';


    where.children().remove();
    $('#monitor')[0].value = '';

    var drawingWidth = 500, drawingHeight = 500;
    var paper = new Raphael(where[0], drawingWidth, drawingHeight);
    var drawingElements = paper.set();

    ratio = 2;
    var tokens = tokenize(board_description);
    var maxCx = Cx, maxCy = Cy, i;
    println("margin: " + margin + "; dx: " + dx + "; dy: " + dy);//DEBUG
    for (i = 0; i < tokens.length; ++i) {
      var token = tokens[i];
      var type = token.type;
      var text = token.text;
      var path;

      if (type == 'newline') {
        if (/SMALL-NEWLINE/.test(text)) {
          Cy -= dy;
        } else {
          ++Row;
          Cy += 3 * dy;
          Cx = margin + dx;
        }
        println('Row #' + Row + ' Cx:' + Cx + ' Cy:' + Cy);
      } else if (type == 'space') {
        if (/_/.test(text)) {
          Cx += 2 * dx;
        } else if (/-/.test(text)) {
          Cx += dx;
        }
      } else if (type == 'text') {
        paper.text(Cx, Cy, text);
        Cx += 2 * dx;
      } else if (type == 'border') {
        if (/\^/.test(text)) {
          path = 'M ' + (Cx - dx) + ' ' + (Cy) + ' ' +
                 'l ' + (0) + ' ' + (-dy) + ' ' +
                 'l ' + (dx) + ' ' + (-dy) + ' ' +
                 'l ' + (dx) + ' ' + (dy) + ' ' +
                 'l ' + (0) + ' ' + (dy) + ' ' +
                 'l ' + (-dx) + ' ' + (-dy) + ' z';
          paper.path(path).attr({fill: playerColor, stroke: 'none'});
          Cx += 2 * dx;
        } else if (/\\/.test(text)) {
          path = 'M ' + (Cx - dx / 2) + ' ' + (Cy - 3 * dy / 2) + ' ' +
                 'l ' + (dx / 2) + ' ' + (-dy / 2) + ' ' +
                 'l ' + (dx) + ' ' + (dy) + ' ' +
                 'l ' + (0) + ' ' + (dy) + ' ' +
                 'l ' + (-dx) + ' ' + (-dy) + ' z';
          paper.path(path).attr({fill: playerColor, stroke: 'none'});
          Cx += 2 * dx;
        } else if (/\//.test(text)) {
          path = 'M ' + (Cx + dx / 2) + ' ' + (Cy - 3 * dy / 2) + ' ' +
                 'l ' + (-dx / 2) + ' ' + (-dy / 2) + ' ' +
                 'l ' + (-dx) + ' ' + (dy) + ' ' +
                 'l ' + (0) + ' ' + (dy) + ' ' +
                 'l ' + (dx) + ' ' + (-dy) + ' z';
          paper.path(path).attr({fill: playerColor, stroke: 'none'});
          Cx += 2 * dx;
        }
      } else if (type == 'hex') {
        var wedge = '';
        var fill = 'lightgray';
        var dash = '';

        wedge = '';
        wedge += /[u789]/.test(text) ? 'u' : /[n123]/.test(text) ? 'n' : '';
        wedge += /[b147]/.test(text) ? 'b' : /[c369]/.test(text) ? 'c' : '';

        if (/[*]/.test(text)) {
          fill = playerColor;
        } else if (/[O]/.test(text)) {
          fill = 'white';
         } else if (/[%]/.test(text)) {
          fill = opponentColor;
        } else if (/[0@#!]/.test(text)) {
          fill = hilightColor;
        } else {
          dash = '.';
        }

        var dot = /[@]/.test(text) ? '1'
                : /[#]/.test(text) ? '2'
                : /[!]/.test(text) ? '3'
                : '';
        draw_hex(fill, dash, wedge, dot, token.label);
      }
    }
    paper.setSize(maxCx + margin, maxCy + margin);
    println("width: " + (maxCx+margin) + "; height: " + (maxCy+margin));//DEBUG
    where.width(maxCx + margin).height(maxCy + margin);

    var s = '';
    var comma = '';
    for (i = 0; i < tokens.length; ++i) {
      var t = tokens[i];
      if (t.type == 'newline') {
        println(s);
        s = '';
        comma = '';
      } else {
        s += comma + '[' + t.type + ': ' + t.text + ']';
        comma = ', ';
      }
    }
    if (s !== '') {
      println(s);
    }

    return;

    function draw_hex(fill, stroke, wedge, dot, label) {
      if (/b/.test(wedge)) {
        Cx -= dx;
      }
      draw_hex_at(Cx, Cy, fill, stroke, wedge, dot);
      if (label && label !== '') {
        paper.text(Cx, Cy, label);
      }

      var advanceX = /c/.test(wedge) ? 0 : dx;
      var advanceY = /n/.test(wedge) ? 0 : 2 * dy;

      if (Cx + advanceX > maxCx) {
        maxCx = Cx + advanceX;
        println("max x: "+maxCx);//DEBUG
      }
      if (Cy + advanceY > maxCy) {
        maxCy = Cy + advanceY;
        println("max y: "+maxCy); //DEBUG
      }

      Cx += 2 * dx;
      if (/c/.test(wedge)) {
        Cx -= dx;
      }
    }


    function draw_hex_at(x, y, fill, stroke, wedge, dot) {
      var poly, line;
      if (wedge == 'b') { // draw right half
        line = 'M ' + (x) + ' ' + (y - 2 * dy) + ' ' +
               'l ' + (dx) + ' ' + (dy) + ' ' +
               'l ' + (0) + ' ' + (2 * dy) + ' ' +
               'l ' + (-dx) + ' ' + (dy);
        poly = line + ' z';
      } else if (wedge == 'c') { // draw left half
        line = 'M ' + (x) + ' ' + (y - 2 * dy) + ' ' +
               'l ' + (-dx) + ' ' + (dy) + ' ' +
               'l ' + (0) + ' ' + (2 * dy) + ' ' +
               'l ' + (dx) + ' ' + (dy);
        poly = line + ' z';
      } else if (wedge == 'n') { // draw top half
        line = 'M ' + (x - dx) + ' ' + (y) + ' ' +
               'l ' + (0) + ' ' + (-dy) + ' ' +
               'l ' + (dx) + ' ' + (-dy) + ' ' +
               'l ' + (dx) + ' ' + (dy) + ' ' +
               'l ' + (0) + ' ' + (dy);
        poly = line + ' z';
      } else if (wedge == 'u') { // draw bottom half
        line = 'M ' + (x - dx) + ' ' + (y) + ' ' +
               'l ' + (0) + ' ' + (dy) + ' ' +
               'l ' + (dx) + ' ' + (dy) + ' ' +
               'l ' + (dx) + ' ' + (-dy) + ' ' +
               'l ' + (0) + ' ' + (-dy);
        poly = line + ' z';
      } else if (wedge == 'ub') { // draw bottom-right quarter
        line = 'M ' + (x + dx) + ' ' + (y) + ' ' +
               'l ' + (0) + ' ' + (dy) + ' ' +
               'l ' + (-dx) + ' ' + (dy);
        poly = line + 'l ' + (0) + ' ' + (-2 * dy) + ' ' + ' z';
      } else if (wedge == 'uc') { // draw bottom-left quarter
        line = 'M ' + (x - dx) + ' ' + (y) + ' ' +
               'l ' + (0) + ' ' + (dy) + ' ' +
               'l ' + (dx) + ' ' + (dy);
        poly = line + 'l ' + (0) + ' ' + (-2 * dy) + ' ' + ' z';
      } else if (wedge == 'nb') { // draw top-right quarter
        line = 'M ' + (x + dx) + ' ' + (y) + ' ' +
               'l ' + (0) + ' ' + (-dy) + ' ' +
               'l ' + (-dx) + ' ' + (-dy);
        poly = line + 'l ' + (0) + ' ' + (2 * dy) + ' ' + ' z';
      } else if (wedge == 'nc') { // draw top-left quarter
        line = 'M ' + (x - dx) + ' ' + (y) + ' ' +
               'l ' + (0) + ' ' + (-dy) + ' ' +
               'l ' + (dx) + ' ' + (-dy);
        poly = line + 'l ' + (0) + ' ' + (2 * dy) + ' ' + ' z';
      } else {
        poly = 'M ' + (x) + ' ' + (y + 2 * dy) + ' ' +
               'l ' + (-dx) + ' ' + (-dy) + ' ' +
               'l ' + (0) + ' ' + (-2 * dy) + ' ' +
               'l ' + (dx) + ' ' + (-dy) + ' ' +
               'l ' + (dx) + ' ' + (dy) + ' ' +
               'l ' + (0) + ' ' + (2 * dy) + ' ' +
               'z';
      }

      if (line) {
        paper.path(poly).attr({fill: fill, stroke: 'none'});
        paper.path(line).attr({'stroke-dasharray': stroke});
      } else {
        paper.path(poly).attr({fill: fill, 'stroke-dasharray': stroke});
      }

      if (dot === '1') {
        paper.circle(x, y, r / 3).attr({fill: playerColor});
      } else if (dot === '2') {
        paper.circle(x, y, r / 6).attr({fill: playerColor});
      } else if (dot === '3') {
        paper.circle(x, y, r / 12).attr({fill: playerColor});
      }
      //                +                      <---+
      //               / \                         |
      //              /   \                        | 1/2 R
      //             /     \                       |
      //            +       +                  <---+-+
      //            |       |                        |
      //            |   o   |    <---+               | R
      //            |       |        |               |
      //            +       +        |         <-----+-+
      //             \     /         | R               |
      //              \   /          |                 | 1/2 R
      //               \ /           |                 |
      //                +       <----+         <-------+
      //
      //            ^   ^   ^
      //            |   |   |
      //            +---+   |
      //              r +---+
      //                  r
    }

    // Break the string {source} into tokens and return the list of tokens.
    // This function is based on http://javascript.crockford.com/tdop/tokens.js
    function tokenize(source) {
      var c;                      // The current character.
      var from;                   // The index of the start of the token.
      var i = 0;                  // The index of the current character.
      var str;                    // The string value.

      var result = [];            // An array to hold the results.

      // Make a token object, like {type:_, text:_, from:_, to:_}
      var make = function (type, text) {
        return {
          type: type,
          text: text,
          from: from,
          to: i
        };
      };

      // Begin tokenization. If the source string is empty, return nothing.
      if (!source) {
        return [];
      }

      // Loop through this text, one character at a time.
      c = source.charAt(i);
      while (c) {
        from = i;

        if (c == '\r' || c == '\n') {
          // Newline
          str = c, ++i, c = source.charAt(i);
          if (str == '\r' && c == '\n') {
            str += c, ++i, c = source.charAt(i);
          }
          result.push(make('newline', str));
        } else if (c == '[' && source.substr(i, 15) == "[SMALL-NEWLINE]") {
          // A "small" newline (Cy += 2*dy rather than Cy += 3*dy)
          str = "[SMALL-NEWLINE]", i+=15, c = source.charAt(i);
          result.push(make('newline', str));
        } else if (c <= ' ') {
          // Ignore whitespace.
          ++i, c = source.charAt(i);
        } else if (c == '_' || c == '-') {
          // hex-sized-space or half-hex-sized-space
          str = c, ++i, c = source.charAt(i);
          result.push(make('space', str));
        } else if (c == '/' || c == '^' || c == '\\') {
          str = c, ++i, c = source.charAt(i);
          result.push(make('border', str));
        } else if (c == 'c' || c == 'b' || c == 'u' || c == 'n' ||
                   (c >= '1' && c <= '9') ||
                   c == 'O' || c == '0' || c == '*' || c == '.' ||
                   c == '@' || c == '#' || c == '!' ||
                   c == '%') {
          var allowUpDownModifier    = true;
          var allowLeftRightModifier = true;
          var allowFourWayModifier   = true;
          var label                  = '';
          str = '';
          do {
            if (c >= '1' && c <= '9') {
              allowFourWayModifier = false;
              allowLeftRightModifier = allowUpDownModifier = false;
            } else if (c == 'c' || c == 'b') {
              allowFourWayModifier = allowLeftRightModifier = false;
            } else if (c == 'u' || c == 'n') {
              allowFourWayModifier = allowUpDownModifier = false;
            }
            str += c, ++i, c = source.charAt(i);
          } while (allowLeftRightModifier && (c == 'c' || c == 'b') ||
                   allowUpDownModifier    && (c == 'u' || c == 'n') ||
                   allowFourWayModifier   && (c >= '1' && c <= '9'));

          /* Collect an optional label (surrounded by '{' and '}' */
          var save_i = i;
          if (c == '{') {
            ++i, c = source.charAt(i);
            while (c >= ' ' && c != '}') {
              label += c, ++i, c = source.charAt(i);
            }
            if (c == '}') {
              /* Found the closing '}' */
              ++i, c = source.charAt(i);
            } else {
              /* There was no closing '}', so this wasn't a label */
              label = ''; i = save_i, c = source.charAt(i);
            }
          }
          var tok = make('hex', str);
          if (label !== '') {
            tok.label = label;
          }
          result.push(tok);
        } else {
          str = '';
          while (c && c > ' ') {
            str += c, ++i, c = source.charAt(i);
          }
          result.push(make('text', str));
        }
      }
      return result;
    }

  }

  function renderBoards(boards) {
    var index = 0;

    // Use callbacks to render each board seperately,
    // so the browser can do it incrementally.
    window.setTimeout(renderNextBoard, 0);
    return;

    function renderNextBoard() {
      if (index < boards.length) {
        var board = $(boards[index]);
        var descr = board.context.innerText;
        board.context.innerText = '';
        drawBoard(board, descr);
        //board.css('border', '1px dashed gray');
        ++index;
        window.setTimeout(renderNextBoard, 0);
      }
    }
  }

  $(document).ready(function () {
    var drawing, program, monitor, renders, drawOnNoChange;
    drawing = $('#draw');
    program = $('#code');
    monitor = $('#monitor');
    //renders = $('pre.hex-board.hex-render');
    //renders = $('table.hex-board.hex-render pre.board');

    drawOnNoChange = new UpdateAfterInputPause(program, 100, function () {
      drawBoard(drawing, program[0].value);
      drawing.css('border', '2px solid orange');
    });

    renderBoards($('table.hex-board.hex-render pre.board'));
    renderBoards($('pre.hex-board.hex-render'));

    program.css('border', '3px solid green').css('font-family', 'monospace');
    monitor.css('border', '2px solid blue').css('font-family', 'monospace');
  });

}());
