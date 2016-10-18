// Flocker inherits Vehicle
Flocker.prototype = Object.create(Vehicle.prototype);
Flocker.prototype.constructor = Vehicle;
function Flocker(x, y, color){
    Vehicle.call(this, x, y, color);
}

Flocker.prototype.calculateSteeringForce = function(){
    var stayInBoundsForce = this.stayInBounds();
    var wanderForce = this.wander();
    var separateForce = this.separate();
    var leaderForce = this.followLeader();
    var clearForce = this.clearPath();
    
    var steeringForce = new Victor();
    steeringForce.add(stayInBoundsForce.scalarMultiply(100));
    steeringForce.add(leaderForce.scalarMultiply(5));
    steeringForce.add(wanderForce.scalarMultiply(5));
    steeringForce.add(clearForce.scalarMultiply(5));
    steeringForce.add(separateForce.scalarMultiply(100));
    return steeringForce;
}