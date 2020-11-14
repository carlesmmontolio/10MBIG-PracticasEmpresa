

var toggler = $(".caret");
var i;

for (i = 0; i < toggler.length; i++) {
  toggler[i].addEventListener("click", function() {
    this.parentElement.querySelector(".nested").classList.toggle("active");
    this.classList.toggle("caret-down");
  });
} 

/*$('#myUL').jstree().is_draggable;*/


document.addEventListener("DOMContentLoaded",function () {

    var routerToUse =new draw2d.layout.connection.SplineConnectionRouter();
    var app  = new example.Application();
    app.view.installEditPolicy(  new draw2d.policy.connection.DragConnectionCreatePolicy({
        createConnection: function(){
            var connection = new draw2d.Connection({
                stroke:1,
                outlineStroke:1,
                outlineColor:"#141517",
                color:"#828282",
                router:routerToUse
            });

            connection.setTargetDecorator(new draw2d.decoration.connection.ArrowDecorator()); 
            return connection;
        }
    }));

});

