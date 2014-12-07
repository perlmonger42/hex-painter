/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  This sample is based on
    http://net.tutsplus.com/tutorials/javascript-ajax/an-introduction-to-the-raphael-js-library/
  That source is a Raphael tutorial, and it does not use jQuery. I've modified
  the tutorial to include jQuery. Also, that tutorial is based on version 1.0
  of Raphael. I have changed it to work with Raphael 2.0, with help from 
    http://stackoverflow.com/questions/8115713/drag-drop-and-shape-rotation-with-raphael-js
  and the sample code that links to, at
    http://jsfiddle.net/amadanNM/3DBWM/
  and
    http://jsfiddle.net/amadanNM/Xy4zp/
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
$(document).ready(function() {
  drawRaph();
  drawRaph2();
});

function drawRaph() {
  var raph = $('#raph');
  raph.width(500).height(500).css("border", "3px solid green");
  var paper = new Raphael(raph[0], 500, 500);
  // Upper left corner of the canvas is (0,0), with x values increasing
  // rightward and y values increasing downward.
  
  /* circle args: center-x, center-y, radius */
  paper.circle(100, 100, 80);
  for (var i = 0; i < 5; ++i) {
    var multiplier = i * 5;
    paper.circle(250 + (2*multiplier), 100 + multiplier, 50 - multiplier);
  }
  /* rect args: left-x, top-y, width, height */
  paper.rect(275, 200, 200, 100);
  /* ellipse args: center-x, center-y, horizontal-radius, vertical-radius */
  paper.ellipse(200, 400, 100, 50);

  var tetronimo_draw = "l 0 -50 " +
                       "l -50 0 " +
                       "l 0 -50 " +
                       "l -50 0 " +
                       "l 0 50 " +
                       "l -50 0 " +
                       "l 0 50 " +
                       "z";
  var tetronimo1 = paper.path("M 250 250 " + tetronimo_draw);
  tetronimo1.attr({fill: '#9cf', stroke: '#ddd', 'stroke-width': 5}); 
  tetronimo1.animate({ transform: "...T-100,0" }, 2000, "bounce");
  var tetronimo2 = paper.path("M 250 400 " + tetronimo_draw);
  tetronimo2.attr(  
    {  
      gradient: '90-#526c7a-#64a0c1',  
      stroke: '#3b4449',  
      'stroke-width': 10,  
      'stroke-linejoin': 'round',  
      transform: 'r270'
    }  
  );  
  tetronimo2.animate({
    transform: "...R-355",
    stroke: '#fa0',  
    'stroke-width': 1,
  }, 1000, "<>", function () {
    this.animate({
      transform: "...+R355",
      stroke: '#3b4449',  
      'stroke-width': 10,
      transform: 'r270'
    }, 1000, "<>", function () {
      this.animate(
        {
          path: "M 250 250 l 0 -50 l -50 0 l 0 -50 " +
                "l -100 0 l 0 50 l 50 0 l 0 50 z"  
        }, 5000, 'elastic'
      );
    })
  });

  tetronimo2.mouseover(function() {
    this.attr('cursor', 'crosshair');
  });
  tetronimo1.click(function () {
    this.animate({opacity: 0}, 2000, "<>", function() { this.remove() } );
  });
}

function drawRaph2() {
  var raph = $('#raph2');
  raph.width(200).height(500).css("border", "3px solid red");
  var paper = new Raphael(raph[0], 200, 500);

  //pick a mood between 1 and 5, 1 being rubbish and 5 being positively manic  
  var my_mood = 5;

  var moods = ['Rubbish', 'Not Good', 'OK', 'Smily', 'Positively Manic'];  
  var colors = ['#cc0000', '#a97e22', '#9f9136', '#7c9a2d', '#3a9a2d'];  
  var circ = paper.circle(100, 250, 20).attr({fill: '#000'})
  var circ_label = paper.text(100, 250, 'My\nMood').attr({fill: '#fff'});
  var circles = [ ];
  var mood_text;

  var show_mood = function() {
    var do_nothing = function () { return false; };
    circ.click(do_nothing);  
    circ_label.click(do_nothing);

    mood_text = paper.text(100, 300, moods[my_mood - 1]);
    mood_text.attr({fill: colors[my_mood - 1]});  

    for(var i = 0; i < my_mood; i+=1) {  
      (function(i) {  
        setTimeout(function() {  
          var c = paper.circle(100, 250, 20);
          c.attr({  stroke: 'none',  fill: colors[my_mood - 1]  });
          c.animate({ transform: 'T0 ' + (-42 * (i+1)) }, 2000, '<>');
          c.toBack();  
          circles[i] = c;
        }, 50*i);  
      })(i);  
    }  

    var lower_my_mood = function() {
      if (my_mood > 1) {
        for (var i = 0; i < my_mood; ++i) {
          circles[i].remove();
        }
        mood_text.remove();
        --my_mood;
        show_mood();
      }
    };

    setTimeout(lower_my_mood, 3000);

  }

  circ.click(show_mood);
  circ_label.click(show_mood);
  

}

