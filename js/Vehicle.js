function Vehicle(x, y, color){
    // Constants
    this.MASS = 50;
    this.MAX_FORCE = 5;
    this.MAX_SPEED = 2;

    // Public variables
    this.graphicsDebug = new PIXI.Graphics();
    this.position = new Victor(x, y);
    this.speed = 1;
    this.triangle = new Triangle(x, y, color);
    this.wanderAngle = 0;

    // Private variables
    var forward = new Victor(1, 0);
    var velocity = new Victor(0, 0);

    // Properties
    this.getForward = function(){
        return forward;
    };
    this.setForward = function(val){
        forward = val.normalize();
        this.triangle.graphics.rotation = forward.angle();
    };

    this.getVelocity = function(){
        return velocity;   
    };
    this.setVelocity = function(val){
        if(val > this.MAX_SPEED){
            val.normalize().scalarMultiply(this.MAX_SPEED);
        }
        velocity = val;
        forward = val.clone().normalize();
        this.triangle.graphics.rotation = forward.angle();
    };

    this.getRotation = function(){
        return this.triangle.graphics.rotation;
    };
    this.setRotation = function(val){
        this.triangle.graphics.rotation = val;
        forward = new Victor(1,0).rotate(val);
        velocity = this.getVelocity().rotate(val)
    };

    container.addChild(this.graphicsDebug);
}

Vehicle.prototype.update = function(){
    // Draw Debug Info
    this.graphicsDebug.clear();

    var steeringForce = this.calculateSteeringForce();

    // This keeps the steering force from being greater than the MAX_FORCE
    if(steeringForce.length() > this.MAX_FORCE){
        steeringForce.normalize();
        steeringForce.scalarMultiply(this.MAX_FORCE);
    }

    // Divide SteeringForce by mass to get acceleration
    var acceleration = steeringForce.clone().scalarDivide(this.MASS);

    this.setVelocity(this.getVelocity().clone().add(acceleration));

    this.move(this.getVelocity());

    // Draw velocity
    if($("#draw-velocity").is(':checked')){
        this.graphicsDebug.lineStyle(1,0x00FF00)
        this.graphicsDebug.moveTo(this.position.x, this.position.y);
        this.graphicsDebug.lineTo(this.position.x + this.getVelocity().clone().scalarMultiply(50).x, this.position.y + this.getVelocity().clone().scalarMultiply(50).y);
    }
    // Draw Forward
    if($("#draw-forward").is(':checked')){
        this.graphicsDebug.lineStyle(1,0xFFFFFF)
        this.graphicsDebug.moveTo(this.position.x, this.position.y);
        this.graphicsDebug.lineTo(this.position.x + this.getForward().x * 50, this.position.y + this.getForward().y * 50);
    }
    // Draw acceleration
    if($("#draw-acceleration").is(':checked')){
        this.graphicsDebug.lineStyle(1,0x0000FF)
        this.graphicsDebug.moveTo(this.position.x, this.position.y);
        this.graphicsDebug.lineTo(this.position.x + acceleration.clone().scalarMultiply(100).x, this.position.y + acceleration.clone().scalarMultiply(100).y);
    }
}

Vehicle.prototype.calculateSteeringForce = function(){
    var stayInBoundsForce = this.stayInBounds();
    var wanderForce = this.wander();
    var separateForce = this.separate();
    var clearForce = this.clearPath();

    var steeringForce = new Victor();
    steeringForce.add(stayInBoundsForce.scalarMultiply(100));
    steeringForce.add(wanderForce.scalarMultiply(5));
    steeringForce.add(clearForce.scalarMultiply(5));
    steeringForce.add(separateForce.scalarMultiply(100));
    return steeringForce;
}

/********** Advanced Steering Behaviors **********/
Vehicle.prototype.wander = function(){
    var center = this.position.clone().add(this.getForward().clone().scalarMultiply(100));
    this.wanderAngle += (Math.random() * .5) - .25;
    var seekPoint = new Victor(center.x + (50 * Math.cos(this.wanderAngle)), center.y + (50 * Math.sin(this.wanderAngle))); 

    // Draw Debug Information
    if($("#draw-wander").is(':checked')){
        this.graphicsDebug.lineStyle(1,0xFFFF00);
        this.graphicsDebug.drawCircle(center.x, center.y, 50);
        this.graphicsDebug.moveTo(seekPoint.x, seekPoint.y);
        this.graphicsDebug.lineTo(this.position.x, this.position.y);
    }

    return this.seek(seekPoint);
}

Vehicle.prototype.separate = function(){
    var positions = [];
    var flees = [];
    var distances = [];

    // Loop through all flockers to see if any are too close
    for(var i = 0; i < vehicles.length; i++){
        // Skip oneself
        if(this.position.isEqualTo(vehicles[i].position)){ continue; }
        var distance = this.position.distanceSq(vehicles[i].position);
        // var dist:Number = Vector2.distanceSqr(this._position,_visionArray[i]._position);
        if(distance < TOO_CLOSE * TOO_CLOSE){
            positions.push(vehicles[i].position);
            flees.push(this.flee(vehicles[i].position));
            distances.push(distance);
        }
    }

    if(flees.length == 0){ return Victor(0,0); }

    var desVel = new Victor(0,0);

    // Loop through all all flee vectors and normalize them and sum them with wieghts inversely proportional to their weights
    for(var i = 0; i < flees.length; i++){
        flees[i].normalize();
        desVel.add((flees[i].scalarMultiply(1/distances[i])));
    }

    desVel.normalize().scalarMultiply(this.MAX_SPEED);

    var steeringForce = desVel.subtract(this.getVelocity());

    // Draw Forward
    if($("#draw-separate").is(':checked')){
        this.graphicsDebug.lineStyle(1,0xFF00FF)
        for(var i = 0; i < positions.length; i++){
            this.graphicsDebug.moveTo(this.position.x, this.position.y);
            this.graphicsDebug.lineTo(positions[i].x, positions[i].y);
        }
    }

    return steeringForce;
}

Vehicle.prototype.stayInBounds = function(){
    var center = new Victor(renderer.view.width/2, renderer.view.height/2);

    var steeringForce = new Victor(0,0);
    var seekCenter = false;
    // Check top
    if (this.position.y < TOO_CLOSE)
    {
        seekCenter = true;
    }
    // Check bottom
    else if(this.position.y > renderer.view.height - TOO_CLOSE)
    {
        seekCenter = true;
    }
    // Check left
    else if(this.position.x < TOO_CLOSE)
    {
        seekCenter = true;
    }
    // Check right
    else if(this.position.x > renderer.view.width - TOO_CLOSE)
    {
        seekCenter = true;
    }

    if(seekCenter){
        steeringForce = this.seek(center);
        if($("#draw-stay-in-bounds").is(':checked')){
            this.graphicsDebug.lineStyle(1,0x00FFFF);
            this.graphicsDebug.moveTo(center.x, center.y);
            this.graphicsDebug.lineTo(this.position.x, this.position.y);
        }
    }
    return steeringForce;
}

Vehicle.prototype.clearPath = function(){
    var steeringForce = new Victor(0,0);
    var leaderPath = new Victor(0,0);
    leaderPath.add(vehicles[0].getForward().clone().scalarMultiply(100));
    var relativePosition = this.position.clone().subtract(vehicles[0].position);

    if(relativePosition.clone().dot(leaderPath < 0)){
        return steeringForce;   
    }

    var projection = relativePosition.clone().projectOnto(leaderPath);
    if(projection.magnitude() >  leaderPath.magnitude()){
        return steeringForce;
    }

    var distance = relativePosition.subtract(projection).magnitude();
    if(distance < TOO_CLOSE){
        var fleePoint = vehicles[0].position.clone().add(projection);
        steeringForce.add(this.flee(fleePoint));
        if($("#draw-clear").is(':checked')){
            this.graphicsDebug.lineStyle(1,0xFF3399);
            this.graphicsDebug.moveTo(fleePoint.x, fleePoint.y);
            this.graphicsDebug.lineTo(this.position.x, this.position.y);
        }
    }

    return steeringForce;
}

Vehicle.prototype.followLeader = function(){
    if($("#draw-follow").is(':checked')){
        this.graphicsDebug.lineStyle(1,0xFF0000);
        this.graphicsDebug.moveTo(vehicles[0].position.x, vehicles[0].position.y);
        this.graphicsDebug.lineTo(this.position.x, this.position.y);
    }
    return this.seek(vehicles[0].position.clone().add(vehicles[0].getForward().clone().scalarMultiply(-50)));
}
	
/********** Advanced Steering Behaviors **********/

/********** Basic Steering Behaviors **********/
Vehicle.prototype.seek = function(targetPos){
    var desVel = targetPos.clone().subtract(this.position);

    // scale desired velocity to max speed
    desVel.normalize().scalarMultiply(this.MAX_SPEED);

    // subtract current velocity from desired velocity to get steering force
    var steeringForce = desVel.subtract(this.getVelocity());
    return steeringForce;
}

Vehicle.prototype.flee = function(targetPos){
    var desVel = this.position.clone().subtract(targetPos);

    // scale desired velocity to max speed
    desVel.normalize().scalarMultiply(this.MAX_SPEED);

    // subtract current velocity from desired velocity to get steering force
    var steeringForce = desVel.subtract(this.getVelocity());
    return steeringForce;
}

Vehicle.prototype.move = function(moveVec){
    this.position.add(moveVec);
    this.triangle.graphics.x = this.position.x;
    this.triangle.graphics.y = this.position.y;
}
/********** Basic Steering Behaviors **********/

/********** Triangle "Class" **********/
function Triangle(x, y, color){
    this.graphics = new PIXI.Graphics();
    this.graphics.x = x;
    this.graphics.y = y;
    this.graphics.lineStyle(1,color)
    this.graphics.beginFill(color);
    this.graphics.moveTo(5,0);
    this.graphics.lineTo(-5,5);
    this.graphics.lineTo(-5,-5);
    this.graphics.lineTo(5,0);
    this.graphics.lineStyle(1,0xFFFFFF)
    this.graphics.lineTo(0,0);
    this.graphics.cacheAsBitmap = true;
    container.addChild(this.graphics);
}