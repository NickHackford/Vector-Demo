// Constants
var NUM_OF_WANDERERS = 20;
var NUM_OF_FLOCKERS = 5;
var TOO_CLOSE = 30;

var vehicles = [];
var flockers = [];
var centroid;
var container;
var renderer;

$(document).ready(function() {
    // create an new instance of a pixi container
    container = new PIXI.Container();

    // create a renderer instance
    renderer = PIXI.autoDetectRenderer($(window).width(), $(window).height());

    // add the renderer view element to the DOM
    $('#canvas-container').append(renderer.view);

    requestAnimationFrame( animate );
    
    var leader = new Leader (400, 200, 0X00FFFF);
    vehicles.push(leader);
    
    for(var i = 0; i < NUM_OF_WANDERERS; i++){
        var newCar = new Vehicle(50*i, 50*i, 0xFF0000);
        vehicles.push(newCar);
    }
    
    for(var i = 0; i < NUM_OF_FLOCKERS; i++){
        var newCar = new Flocker(50*i, 50*i, 0x00FF00);
        vehicles.push(newCar);
        flockers.push(newCar);
    }
});

function animate() {
    requestAnimationFrame( animate );

    findCentroid();

    for(var i = 0; i < vehicles.length; i++){
        vehicles[i].update();
    }

    // render the container   
    renderer.render(container);
} 

function findCentroid() {
    var temp = Victor(0,0);
    for(var i = 0; i < flockers.length; i++){
        temp.add(flockers[i].position);
    }
    centroid = temp.scalarDivide(flockers.length);
}