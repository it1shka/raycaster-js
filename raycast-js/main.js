const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const canvas2 = document.getElementById("canvas2");
const ctx2 = canvas2.getContext("2d");
ctx.lineCap = "round";
ctx.imageSmoothingEnabled = true;
ctx2.imageSmoothingEnabled = true;
const fixedDeltaTime = .02;

var keys = new Set();
document.onkeydown = (event) => keys.add(event.code);
document.onkeyup = (event) => keys.delete(event.code);

const colors = ["red", "green", "blue", "white"];
const RGBs = {
    "red" : [255, 0, 0],
    "green" : [0, 255, 0],
    "blue" : [0, 0, 255],
    "black" : [0, 0, 0],
    "white" : [255, 255, 255]
};

function rad(deg){
    return deg * Math.PI / 180;
}
function normAng(deg){
    if(deg > 360)deg -= 360;
    else if(deg < 0)deg = 360 + deg;
    return deg;
}
function dist(point1, point2){
    return Math.sqrt(Math.pow((point1.x - point2.x), 2) + Math.pow((point1.y - point2.y), 2));
}
class Vector2{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
}


function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    if(x1 > x2){
        let swap = x2;
        x2 = x1;
        x1 = swap;

        let swap2 = y2;
        y2 = y1;
        y1 = swap2;
    }
    if(x3 > x4){
        let swap = x4;
        x4 = x3;
        x3 = swap;

        let swap2 = y4;
        y4 = y3;
        y3 = swap2;
    }

    //
      if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
          return false;
      }
  
      denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
  
      if (denominator === 0) {
          return false;
      }
  
      let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
      let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;
  
      if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
          return false;
      }
      let x = x1 + ua * (x2 - x1);
      let y = y1 + ua * (y2 - y1);
  
      return new Vector2(x, y);
  }

class Line{
    constructor(begPos, endPos, color, width){
        this.beginPosition = begPos;
        this.endPosition = endPos;
        this.color = color;
        this.width = width;
    }
    draw(){
        ctx.lineWidth = this.width;
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.beginPosition.x,
            this.beginPosition.y);
        ctx.lineTo(this.endPosition.x,
            this.endPosition.y);
        ctx.stroke();
        ctx.closePath();
    }
}

function lineTo(begPos, length, angle, color, width){
    var endPos = new Vector2(
        begPos.x + length * Math.sin(rad(angle)),
        begPos.y + length * Math.cos(rad(angle))
    );
    return new Line(begPos, endPos, color, width);
}
function findEnd(begPos, length, angle){
    return new Vector2(begPos.x + length * Math.sin(rad(angle)),
    begPos.y + length * Math.cos(rad(angle)));
}

var map = new Array();

function randInt(min, max){
    var x = Math.floor(Math.random() * Math.floor(max));
    if(x < min)x = max - min + x;
    return x;
}
function generateMap(walls){
    for(var i=0; i<walls; i++){
        var newLine = new Line(
            new Vector2(randInt(0,canvas.width), randInt(0,canvas.height)),
            new Vector2(randInt(0,canvas.width), randInt(0,canvas.height)),
            colors[randInt(0,colors.length)],
            1
        )
        console.log(newLine);
        map.push(newLine);
    }
}
generateMap(10);

class RayInfo{
    constructor(point, distance, lineColor){
        this.point = point;
        this.distance = distance;
        this.lineColor = lineColor;
    }
}

class Ray{
    constructor(position, angle, length){
        this.position = position;
        this.angle = angle;
        this.length = length;
    }
    cast(){
        var end = findEnd(this.position, this.length, this.angle);
        var retInfo = new RayInfo(
            end, dist(this.position, end), "black"
        );
        for(var line of map){
            var c = intersect(
                this.position.x, 
                this.position.y,
                end.x,
                end.y,
                line.beginPosition.x,
                line.beginPosition.y,
                line.endPosition.x,
                line.endPosition.y
            );
            if(c === false)continue;
            var currentDist = dist(this.position, c);
            if(currentDist < retInfo.distance){
                retInfo = new RayInfo(
                    c, currentDist, line.color
                );
            }
        }

        return retInfo;
    }
}

class Player{
    speed = 50;
    rotateSpeed = 90;
    rotation = 0;
    constructor(radius, colorFill, colorStroke, position, rayAmount, viewDist){
        this.radius = radius;
        this.colorFill = colorFill;
        this.colorStroke = colorStroke;
        this.position = position;
        this.rayAmount = rayAmount;
        this.viewDist = viewDist;

        this.infos = new Array(rayAmount);
    }

    draw(){
        ctx.fillStyle = this.colorFill;
        ctx.strokeStyle = this.colorStroke;
        ctx.beginPath();
        ctx.arc(
            this.position.x,
            this.position.y,
            this.radius,
            0,
            rad(360)
        );
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }

    move(){
        var x = 0;
        var y = 0;
        if(keys.has('KeyW')){
            y++;
        }
        if(keys.has('KeyS')){
            y--;
        }
        if(keys.has('KeyD')){
            x++;
        }
        if(keys.has('KeyA')){
            x--;
        }

        this.position.x += this.speed * x * fixedDeltaTime;
        this.position.y -= this.speed * y * fixedDeltaTime;
    }

    rotate(){
        var rot = 0;
        if(keys.has("ArrowRight")){
            rot++;
        }
        if(keys.has("ArrowLeft")){
            rot--;
        }
        this.rotation += this.rotateSpeed * rot * fixedDeltaTime;
        this.rotation = normAng(this.rotation);
    }

    raycast(){
        for(var i=0; i<this.rayAmount; i+=.5){
            var ray = new Ray(this.position, normAng(this.rotation + i), this.viewDist);
            var info = ray.cast();
            this.infos[i] = info;
            var line = new Line(this.position, info.point, "red", .5);
            line.draw();
        }
    }

    update(){
        this.move();
        this.rotate();
        this.raycast();
        this.draw();
    }
}

const player = new Player(
    10,
    "red",
    "black",
    new Vector2(canvas.width / 2, canvas.height / 2),
    45,
    250
);

const cellWidth = canvas2.width / player.rayAmount;
const cellHeightMult = 30;
const offset = 125;
function colorFromDist(color, distance){
    var col = RGBs[color];
    var fc = `rgb(${col[0] - col[0] * distance / player.viewDist},${col[1] - col[1] * distance / player.viewDist},${col[2] - col[2] * distance / player.viewDist})`;
    return fc;
}

function UpdateCanvas2(){
    for(var i=0; i<player.infos.length; i++){
        var inf = player.infos[i];
        ctx2.fillStyle = colorFromDist(inf.lineColor, inf.distance);
        var cellHeight = canvas2.height * cellHeightMult / inf.distance;
        ctx2.fillRect(i * cellWidth, canvas.height / 2 - cellHeight / 2 + offset, cellWidth, cellHeight);
    }
}

function Update(){
    ctx.fillStyle = 'rgb(114,114,114)';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    for(var line of map){
        line.draw();
    }

    player.update();

    ctx2.fillStyle = 'rgb(0,0,0)';
    ctx2.fillRect(0,0,canvas2.width,canvas2.height);
    UpdateCanvas2();
    requestAnimationFrame(Update);
}Update();