// Leader inherits Vehicle
Leader.prototype = Object.create(Vehicle.prototype);
Leader.prototype.constructor = Leader;
function Leader(x, y, color){
    Vehicle.call(this, x, y, color);
}

Leader.prototype.calculateSteeringForce = function(){
    this.MASS = 100;
    
    var stayInBoundsForce = this.stayInBounds();
    var wanderForce = this.wander();
    
    var steeringForce = new Victor();
    steeringForce.add(stayInBoundsForce.scalarMultiply(100));
    steeringForce.add(wanderForce.scalarMultiply(5));
    return steeringForce;
}