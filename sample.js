/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  This is an attempt to create a page with a textbox, whose contents
  can be edited to create an SVG image on the same page.
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

function OnNoChange(callback, delayMilliseconds) {
  this.restart = function () {
    this.cancel();
    this.timeoutID = window.setTimeout(callback, delayMilliseconds);
  };
  this.cancel = function () {
    if (typeof this.timeoutID == 'number') {
      window.clearTimeout(this.timeoutID);
      delete this.timeoutID;
    }
  };
};

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

$(document).ready(function() {
  var drawing = $('#draw');
  var code = $('#code');

  var DrawOnNoChange = new OnNoChange(function ()
    {
      drawBoard(drawing, code[0].value);
    }, 100);

  DrawOnNoChange.restart();
  code.css("border", "3px solid green", "font-family", "monospace");
  code.keyup(function() { DrawOnNoChange.restart() });
  $('#monitor').css('border', '2px solid blue', 'font-family', 'monospace');
});

function println(s) {
  $('#monitor')[0].value += s + "\n";
}

function drawBoard(where, board_description) {
  if (typeof(board_description) == 'undefined')
    return;
  var ratio = 0.866; // minor radius is sqrt(3/4) times the major radius
  var R = 20;        // major radius of hexagons
  var r = R * ratio; // minor radius of hexagons
  var dx = Math.round(r);    // delta-x for move-to's and line-to's
  var dy = Math.round(R/2);  // delta-y for move-to's and line-to's
  var margin = 5;
  var Cx = margin + dx, Cy = margin + 2 * dy, Row = 0;

  where.children().remove();
  where.css('border', '2px solid orange');
  $('#monitor')[0].value = '';

  var drawingWidth = 500, drawingHeight = 500;
  Paper = new Raphael(where[0], drawingWidth, drawingHeight);
  var drawingElements = Paper.set();

  var tokens = tokenize(board_description);
  var maxCx = 0, maxCy = 0;
  for (var i = 0; i < tokens.length; ++i) {
    var token = tokens[i];
    var type = token.type;
    var text = token.text;

    if (type == 'newline') {
      ++Row;
      Cy += 3 * dy;
      Cx = margin + dx;
      println("Row #" + Row + " Cx:"+Cx+" Cy:"+Cy);
    } else if (type == 'hex' && /_/.test(text)) {
      Cx += 2*dx;
    } else if (type == 'hex' && /-/.test(text)) {
      Cx += dx;
    } else if (type == 'hex' && /\^/.test(text)) {
      var path = 'M ' + (Cx-dx) + ' ' + (  Cy ) + ' '
               + 'l ' + (   0 ) + ' ' + ( -dy ) + ' '
               + 'l ' + (  dx ) + ' ' + ( -dy ) + ' '
               + 'l ' + (  dx ) + ' ' + (  dy ) + ' '
               + 'l ' + (   0 ) + ' ' + (  dy ) + ' '
               + 'l ' + ( -dx ) + ' ' + ( -dy ) + ' z';
      Paper.path(path).attr({fill: 'red', stroke: 'none'});
      Cx += 2*dx;
    } else if (type == 'hex' && /\\/.test(text)) {
      var path = 'M ' + (Cx-dx/2 ) + ' ' + (Cy-3*dy/2) + ' '
               + 'l ' + ( dx/2   ) + ' ' + ( -dy/2 ) + ' '
               + 'l ' + (  dx ) + ' ' + (  dy ) + ' '
               + 'l ' + (   0 ) + ' ' + (  dy ) + ' '
               + 'l ' + ( -dx ) + ' ' + ( -dy ) + ' z';
      Paper.path(path).attr({fill: 'red', stroke: 'none'});
      Cx += 2*dx;
    } else if (type == 'hex' && /\//.test(text)) {
      var path = 'M ' + (Cx+dx/2 ) + ' ' + (Cy-3*dy/2) + ' '
               + 'l ' + ( -dx/2  ) + ' ' + ( -dy/2 ) + ' '
               + 'l ' + (  -dx   ) + ' ' + (  dy ) + ' '
               + 'l ' + (   0    ) + ' ' + (  dy ) + ' '
               + 'l ' + (   dx   ) + ' ' + ( -dy ) + ' z';
      Paper.path(path).attr({fill: 'red', stroke: 'none'});
      Cx += 2*dx;
    } else if (type == 'hex') {
      var wedge = '';
      var fill;
      var dash;

      wedge  = '';
      wedge += /u/.test(text) ? 'u' : /n/.test(text) ? 'n' : '';
      wedge += /b/.test(text) ? 'b' : /c/.test(text) ? 'c' : '';

      if (/[*]/.test(text)) {
        fill = 'red', dash = '';
      } else if (/[O]/.test(text)) {
        fill = 'white', dash = '';
      } else if (/[01]/.test(text)) {
        fill = 'yellow', dash = '';
      } else {
        fill = 'lightgray', dash = '.';
      }

      var x=Cx, y=Cy;
      draw_hex(fill, dash, wedge);
      if (/[1]/.test(text)) {
        Paper.circle(x, y, r/3).attr({fill:'red'});;
      }
    }
  }
  Paper.setSize(maxCx + dx + margin, maxCy + 2*dy + margin);
  where.width(maxCx + dx + margin).height(maxCy + 2*dy + margin);

  var s = '';
  var comma = '';
  for (var i = 0; i < tokens.length; ++i) {
    var t = tokens[i];
    if (t.type == 'newline') {
      println(s); s = ''; comma = '';
    } else {
      s += comma + '[' + t.type + ': ' + t.text + ']';
      comma = ', ';
    }
  }
  if (s != '') {
    println(s);
  }

  return;

  function draw_hex(fill, stroke, wedge) {
    if (/b/.test(wedge)) {
      Cx -= dx;
    }
    if (Cx > maxCx) maxCx = Cx;
    if (Cy > maxCy) maxCy = Cy;
    draw_hex_at(Cx, Cy, fill, stroke, wedge);
    Cx += 2*dx;
  }


  function draw_hex_at(x, y, fill, stroke, wedge) {
    var poly, line;
    if (wedge == 'b') { // draw right half
      line = 'M ' + (  x  ) + ' ' + ( y-2*dy ) + ' '
           + 'l ' + (  dx ) + ' ' + (   dy   ) + ' '
           + 'l ' + (  0  ) + ' ' + (  2*dy  ) + ' '
           + 'l ' + ( -dx ) + ' ' + (   dy   );
      poly = line + ' z';
    } else if (wedge == 'c') { // draw left half
      line = 'M ' + (  x  ) + ' ' + ( y-2*dy ) + ' '
           + 'l ' + ( -dx ) + ' ' + (   dy   ) + ' '
           + 'l ' + (  0  ) + ' ' + (  2*dy  ) + ' '
           + 'l ' + (  dx ) + ' ' + (   dy   );
      poly = line + ' z';
    } else if (wedge == 'n') { // draw top half
      line = 'M ' + ( x-dx ) + ' ' + (   y   ) + ' '
           + 'l ' + (  0   ) + ' ' + (  -dy  ) + ' '
           + 'l ' + (  dx  ) + ' ' + (  -dy  ) + ' '
           + 'l ' + (  dx  ) + ' ' + (   dy  ) + ' '
           + 'l ' + (  0   ) + ' ' + (   dy  );
      poly = line + ' z';
    } else if (wedge == 'u') { // draw bottom half
      line = 'M ' + ( x-dx ) + ' ' + (   y   ) + ' '
           + 'l ' + (  0   ) + ' ' + (   dy  ) + ' '
           + 'l ' + (  dx  ) + ' ' + (   dy  ) + ' '
           + 'l ' + (  dx  ) + ' ' + (  -dy  ) + ' '
           + 'l ' + (  0   ) + ' ' + (  -dy  );
      poly = line + ' z';
    } else if (wedge == 'ub') { // draw bottom-right quarter
      line = 'M ' + ( x+dx ) + ' ' + (   y   ) + ' '
           + 'l ' + (  0   ) + ' ' + (   dy  ) + ' '
           + 'l ' + ( -dx  ) + ' ' + (   dy  );
      poly = line + 'l ' + (  0   ) + ' ' + ( -2*dy ) + ' ' + ' z';
    } else if (wedge == 'uc') { // draw bottom-left quarter
      line = 'M ' + ( x-dx ) + ' ' + (   y   ) + ' '
           + 'l ' + (  0   ) + ' ' + (   dy  ) + ' '
           + 'l ' + (  dx  ) + ' ' + (   dy  );
      poly = line + 'l ' + (  0   ) + ' ' + ( -2*dy ) + ' ' + ' z';
    } else if (wedge == 'nb') { // draw top-right quarter
      line = 'M ' + ( x+dx ) + ' ' + (   y   ) + ' '
           + 'l ' + (  0   ) + ' ' + (  -dy  ) + ' '
           + 'l ' + ( -dx  ) + ' ' + (  -dy  );
      poly = line + 'l ' + (  0   ) + ' ' + (  2*dy ) + ' ' + ' z';
    } else if (wedge == 'nc') { // draw top-left quarter
      line = 'M ' + ( x-dx ) + ' ' + (   y   ) + ' '
           + 'l ' + (  0   ) + ' ' + (  -dy  ) + ' '
           + 'l ' + (  dx  ) + ' ' + (  -dy  );
      poly = line + 'l ' + (  0   ) + ' ' + (  2*dy ) + ' ' + ' z';
    } else {
      poly = 'M ' + ( x ) + ' ' + ( y+2*dy ) + ' '
           + 'l ' + (-dx) + ' ' + (  -dy   ) + ' '
           + 'l ' + ( 0 ) + ' ' + ( -2*dy  ) + ' '
           + 'l ' + ( dx) + ' ' + (  -dy   ) + ' '
           + 'l ' + ( dx) + ' ' + (   dy   ) + ' '
           + 'l ' + ( 0 ) + ' ' + (  2*dy  ) + ' '
           + 'z';
      Paper.path(poly).attr({fill: fill, 'stroke-dasharray': stroke});
      return;
    }
    Paper.path(poly).attr({fill: fill, stroke: 'none'});
    Paper.path(line).attr({'stroke-dasharray': stroke});
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
        return [ ];
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
      } else if (c <= ' ') {
        // Ignore whitespace.
        ++i, c = source.charAt(i);
      } else if (c == 'c') {
        str = '';
        while (c && c > ' ' && c != 'b') {
          str += c, ++i, c = source.charAt(i);
        } 
        if (c == 'b') {
          str += c, ++i, c = source.charAt(i);
        }
        result.push(make('hex', str));
      } else {
        str = '';
        while (c && c > ' ' && c != 'c' && c != 'b') {
          str += c, ++i, c = source.charAt(i);
        } 
        if (c == 'b') {
          str += c, ++i, c = source.charAt(i);
        }
        result.push(make('hex', str));
      }
    }
    return result;
  };

}

