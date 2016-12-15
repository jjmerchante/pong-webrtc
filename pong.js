var gl = null,
    canvas = null,
    glProgram = null,
    fragmentShader = null,
    vertexShader = null;
var vertexPositionAttribute = null,
    cubeVerticeBuffer = null;
var vertexColorAttribute = null,
    cubeColorBuffer = null,
    cubeIndicesBuffer = null;
var diskIndicesBuffer = null;
var mvMatrix = mat4.create();

var playerA = {
    posX: -6.0,
    posY: 0.0,
    color: {r:1, g:0, b:0}
}

var playerB = {
    posX: 6.0,
    posY: 0.0,
    color: {r:0, g:0, b:1}
}

var disk = {
    posX: 1.0,
    posY: 0.0,
    dX: -0.02, // CHANGE
    dY: 0.0
}

function initWebGL() {
    canvas = document.getElementById("my-canvas");
    try {
        gl = canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl");
    } catch (e) {}
    if (gl) {
        initShaders();
        setupBuffers();
        getUniforms();
        $(document).keydown(handleKeyEvent);
        $(document).mousemove(handleMouseEvent);
        (function animLoop() {
            setupWebGL();
            drawScene();
            requestAnimationFrame(animLoop, canvas);
        })();
    } else {
        alert("Error: Your browser does not appear to support WebGL.");
    }
}

function handleKeyEvent(ev) {
    var ymov = 0.3;
    if (ev.which == 38){
        playerB.posY += ymov;
        if (playerB.posY > 4) playerB.posY = 4;
    }else if (ev.which == 87) {
        playerA.posY += ymov;
        if (playerA.posY > 4) playerA.posY = 4;
    }else if (ev.which == 40) {
        playerB.posY -= ymov;
        if (playerB.posY < -4) playerB.posY = -4;
    }else if (ev.which == 83) {
        playerA.posY -= ymov;
        if (playerA.posY < -4) playerA.posY = -4;
    }
}

function handleMouseEvent(event) {
  // http://stackoverflow.com/a/18053642
  var rect = canvas.getBoundingClientRect();
  var x = event.clientX - rect.left;
  var y = event.clientY - rect.top;

  playerA.posY = 4 * (1- y/(canvas.height/2))

  if (playerA.posY > 4) playerA.posY = 4;
  if (playerA.posY < -4) playerA.posY = -4;

}

function setupWebGL() {
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    //set the clear color to a shade of green
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.viewport(0, 0, canvas.width, canvas.height);

}

function initShaders() {
    //get shader source
    var fs_source = document.getElementById('shader-fs').innerHTML,
        vs_source = document.getElementById('shader-vs').innerHTML;
    //compile shaders
    vertexShader = makeShader(vs_source, gl.VERTEX_SHADER);
    fragmentShader = makeShader(fs_source, gl.FRAGMENT_SHADER);
    //create program
    glProgram = gl.createProgram();
    //attach and link shaders to the program
    gl.attachShader(glProgram, vertexShader);
    gl.attachShader(glProgram, fragmentShader);
    gl.linkProgram(glProgram);
    if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
    }
    //use program
    gl.useProgram(glProgram);
}

function makeShader(src, type) {
    //compile the vertex shader
    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Error compiling shader: " + gl.getShaderInfoLog(shader));
    }
    return shader;
}

function getDiskAttrAndIndices(slices) {
    var attrs = [];
    var indices = [];
    var colorDown = {r:0.2, g:0.2, b:0.9};
    var colorUp = {r:0.9, g:0.9, b:0.9};

    attrs.push(0.0, 0.0, 1.0, colorUp.r, colorUp.g, colorUp.b); //top center
    attrs.push(0.0, 0.0,-1.0, colorDown.r, colorDown.g, colorDown.b); //bottom center
    for (var i = 0; i<slices; i++) {
        var angle = i*2*Math.PI/slices;
        var x = Math.cos(angle);
        var y = Math.sin(angle);
        attrs.push(x, y, 1, colorUp.r, colorUp.g, colorUp.b);//top
        attrs.push(x, y, -1, colorDown.r, colorDown.g, colorDown.b);//bottom
        if (i > 0) {
            //prevPoints =>   t: 2+(i-1)*2, b: 3+(i-1)*2
            //actualPoints => t: 2+ i   *2, b: 3+ i   *2
            indices.push(0, 2+(i-1)*2, 2+i*2); //top
            indices.push(2+(i-1)*2, 3+(i-1)*2, 2+i*2); //ext1
            indices.push(3+(i-1)*2, 2+i*2, 3+i*2); //ext2
            indices.push(1, 3+(i-1)*2, 3+i*2); //bottom
        }
        if (i == slices-1) {
            //connect begining with end
            indices.push(0, 2, 2+i*2); //top
            indices.push(2, 3, 2+i*2); //ext1
            indices.push(3, 2+i*2, 3+i*2); //ext2
            indices.push(1, 3, 3+i*2); //bottom
        }
    }
    return {'indices': indices, 'attr': attrs}
}

function setupBuffers() {
    var cubeAttributes = [
        //bottom
        -1.0,-1.0,-1.0,     0.0,0.0,0.0,
         1.0,-1.0,-1.0,     0.0,0.0,0.0,
         1.0, 1.0,-1.0,     0.0,0.0,0.0,
        -1.0, 1.0,-1.0,     0.0,0.0,0.0,
        //top
        -1.0,-1.0, 1.0,     1.0,1.0,1.0,
         1.0,-1.0, 1.0,     1.0,1.0,1.0,
         1.0, 1.0, 1.0,     1.0,1.0,1.0,
        -1.0, 1.0, 1.0,     1.0,1.0,1.0,
        //left
        -1.0,-1.0,-1.0,     0.5,0.5,0.5,
        -1.0, 1.0,-1.0,     0.5,0.5,0.5,
        -1.0, 1.0, 1.0,     0.5,0.5,0.5,
        -1.0,-1.0, 1.0,     0.5,0.5,0.5,
        //right
         1.0,-1.0,-1.0,     0.5,0.5,0.5,
         1.0, 1.0,-1.0,     0.5,0.5,0.5,
         1.0, 1.0, 1.0,     0.5,0.5,0.5,
         1.0,-1.0, 1.0,     0.5,0.5,0.5,
         //behind
        -1.0,-1.0,-1.0,     0.5,0.5,0.5,
        -1.0,-1.0, 1.0,     0.5,0.5,0.5,
         1.0,-1.0, 1.0,     0.5,0.5,0.5,
         1.0,-1.0,-1.0,     0.5,0.5,0.5,
         //front
        -1.0, 1.0,-1.0,     0.5,0.5,0.5,
        -1.0, 1.0, 1.0,     0.5,0.5,0.5,
         1.0, 1.0, 1.0,     0.5,0.5,0.5,
         1.0, 1.0,-1.0,     0.5,0.5,0.5,
    ];
    cubeAttributesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeAttributesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeAttributes), gl.STATIC_DRAW);

    var cubeIndices = [
        0, 1, 2,
        0, 2, 3,

        4, 5, 6,
        4, 6, 7,

        8, 9, 10,
        8, 10, 11,

        12, 13, 14,
        12, 14, 15,

        16, 17, 18,
        16, 18, 19,

        20, 21, 22,
        20, 22 ,23
    ];
    cubeIndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);

    var disk = getDiskAttrAndIndices(15);
    diskAttributesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, diskAttributesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(disk.attr), gl.STATIC_DRAW);
    diskIndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, diskIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(disk.indices), gl.STATIC_DRAW);

    vertexPositionAttribute = gl.getAttribLocation(glProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);

    vertexColorAttribute = gl.getAttribLocation(glProgram, "aVertexColor");
    gl.enableVertexAttribArray(vertexColorAttribute);
}

function calculateDiskPosition() {
    disk.posX += disk.dX;
    disk.posY += disk.dY;
    if (disk.posX > 7) {
        disk.posX = 0;
        disk.posY = 0;
        disk.dY = 0;
        disk.dX = -disk.dX;
    }else if (disk.posX < -7) {
        disk.posX = 0;
        disk.posY = 0;
        disk.dY = 0;
        disk.dX = -disk.dX;
    }
    if (disk.posY > 5 || disk.posY < -5) {
        disk.posY -= disk.dY;
        disk.dY = -disk.dY;
    }
    //6-0.4-0.4 = 5.2
    if (disk.posX > 5.2 && disk.posX < 6 && (playerB.posY+1.5)>(disk.posY-0.4) && (playerB.posY-1.5)<(disk.posY+0.4)){
        disk.dX = -Math.abs(disk.dX);
        disk.posX += disk.dX;
        disk.dY += (disk.posY-playerB.posY)*0.02;
        if (disk.dY > 0.05) disk.dY = 0.05;
        if (disk.dY < -0.05) disk.dY = -0.05;
    }
    if (disk.posX < -5.2 && disk.posX > -6 && (playerA.posY+1.5)>(disk.posY-0.4) && (playerA.posY-1.5)<(disk.posY+0.4)){
        disk.dX = Math.abs(disk.dX);
        disk.posX += disk.dX;
        disk.dY += (disk.posY-playerA.posY)*0.02;
        if (disk.dY > 0.05) disk.dY = 0.05;
        if (disk.dY < -0.05) disk.dY = -0.05;
    }
}

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    calculateDiskPosition();
    drawDisk();
    drawBarPlayer(playerA);
    drawBarPlayer(playerB);
    drawBoard();
}

var angleBoard = 0.0;
function drawBoard() {
    //angleBoard+=0.05;
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0, 0, -12.0]);
    //mat4.rotate(mvMatrix, angle, [1, 2, 3]);
    mat4.scale(mvMatrix, [7, 5.6, 1.8]);

    gl.uniformMatrix4fv(glProgram.uMVMatrix, false, mvMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeAttributesBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 4*(3+3), 0);
    gl.vertexAttribPointer(vertexColorAttribute, 3, gl.FLOAT, false, 4*(3+3), 4*3);

    gl.uniform3f(glProgram.ucolor, 0, 0.8, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndicesBuffer);
    gl.drawElements(gl.TRIANGLES, 6*6, gl.UNSIGNED_SHORT, 0);
}

//var angleBar = 0.0;
function drawBarPlayer(player) {
    //angle+=0.05;
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [player.posX, player.posY, -10.0]);
    //mat4.rotate(mvMatrix, angle, [1, 2, 3]);
    mat4.scale(mvMatrix, [0.2, 1.5, 0.4]);
    gl.uniformMatrix4fv(glProgram.uMVMatrix, false, mvMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeAttributesBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 4*(3+3), 0);
    gl.vertexAttribPointer(vertexColorAttribute, 3, gl.FLOAT, false, 4*(3+3), 3*4);

    gl.uniform3f(glProgram.ucolor, player.color.r, player.color.g, player.color.b);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndicesBuffer);
    gl.drawElements(gl.TRIANGLES, 6*6, gl.UNSIGNED_SHORT, 0);
}

//var angleDisk = 0.0;
function drawDisk() {
    //angleDisk+=0.001;
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [disk.posX, disk.posY, -10.0]);
    //mat4.rotate(mvMatrix, angle, [0.5, 0.5, 0.5]);
    mat4.scale(mvMatrix, [0.4, 0.4, 0.15]);
    gl.uniformMatrix4fv(glProgram.uMVMatrix, false, mvMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, diskAttributesBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 4*(3+3), 0);
    gl.vertexAttribPointer(vertexColorAttribute, 3, gl.FLOAT, false, 4*(3+3), 3*4);

    gl.uniform3f(glProgram.ucolor, 1, 1, 1);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, diskIndicesBuffer);
    gl.drawElements(gl.TRIANGLES, 180, gl.UNSIGNED_SHORT, 0);
}

function getUniforms() {
    glProgram.uMVMatrix = gl.getUniformLocation(glProgram, "uMVMatrix");
    glProgram.uPMatrix = gl.getUniformLocation(glProgram, "uPMatrix");
    //uniform for color
    glProgram.ucolor = gl.getUniformLocation(glProgram, "uColor");
    var pMatrix = mat4.create();
    var ratio = canvas.width / canvas.height;
    mat4.perspective(60, ratio, 0.1, 100, pMatrix);
    mat4.translate(pMatrix, [0.0, 7.0, -3.0]);
    mat4.rotate(pMatrix, 0.7, [-1.0, 0.0, 0.0]);
    //--mat4.ortho(-ratio, ratio, -1.0, 1.0, -10.0, 10.0, pMatrix);
    gl.uniformMatrix4fv(glProgram.uPMatrix, false, pMatrix);
}
