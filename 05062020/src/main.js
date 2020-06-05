import { mat4 } from 'gl-matrix';

import vxShaderStr from './main.vert';
import fsShaderStr from './main.frag';
import iText from '../bin/txt.png';
import gitHash from '../hash.txt';
import './styles.css';

var gl;
function initGL (canvas) {
  try {
    gl = canvas.getContext('webgl2');
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {
  }
  if (!gl) {
    alert('Could not initialize WebGL');
  }
}

function getShader (gl, type, str) {
  var shader;
  shader = gl.createShader(type);

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

var shaderProgram;

function initShaders () {
  var fragmentShader = getShader(gl, gl.FRAGMENT_SHADER, fsShaderStr);
  var vertexShader = getShader(gl, gl.VERTEX_SHADER, vxShaderStr);

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Could not initialize shaders');
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix');
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
  shaderProgram.uTime = gl.getUniformLocation(shaderProgram, 'uTime');
  shaderProgram.uSpeed = gl.getUniformLocation(shaderProgram, 'uSpeed');
  shaderProgram.CX_uniform = gl.getUniformLocation(shaderProgram, 'CY');
  shaderProgram.CY_uniform = gl.getUniformLocation(shaderProgram, 'CX');
  shaderProgram.Zoom_uniform = gl.getUniformLocation(shaderProgram, 'Zoom');
  shaderProgram.CX = 0;
  shaderProgram.CY = 0;
  shaderProgram.Zoom = 2;
}

var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var Speed = 3.0;
var timeMs = Date.now();
var startTime = Date.now();
var texture;

function setUniforms () {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  gl.uniform1f(shaderProgram.uTime, timeMs);
  gl.uniform1f(shaderProgram.uSpeed, Speed);
  gl.uniform1i(shaderProgram.uSampler, 0);
  gl.uniform1f(shaderProgram.CX_uniform, shaderProgram.CX);
  gl.uniform1f(shaderProgram.CY_uniform, shaderProgram.CY);
  gl.uniform1f(shaderProgram.Zoom_uniform, shaderProgram.Zoom);
}

var squareVertexPositionBuffer;

function initBuffers () {
  squareVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  var vertices = [
    1.0, 1.0, 0.0,
    -1.0, 1.0, 0.0,
    1.0, -1.0, 0.0,
    -1.0, -1.0, 0.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  squareVertexPositionBuffer.itemSize = 3;
  squareVertexPositionBuffer.numItems = 4;
}

function drawScene () {
  timeMs = (Date.now() - startTime) / 1000;
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  mat4.identity(mvMatrix);
  mat4.identity(pMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  setUniforms();

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}

function tick () {
  window.requestAnimationFrame(tick);
  updateSpeed();
  drawScene();
}

function webGLStart () {
  document.getElementById('inputSpeed').value = 3.0;

  var canvas = document.getElementById('webglCanvas');

  document.getElementById('hash').innerHTML += ' Git Hash: ' + gitHash;

  function getMousePos (canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  let IsMDown = 0;
  let LastPos = { x: 0, y: 0 };

  canvas.addEventListener('mousedown', function (evt) {
    if (IsMDown == 0) {
      IsMDown = 1;
      const mousePos = getMousePos(canvas, evt);
      LastPos = {
        x: mousePos.x / 400.0,
        y: mousePos.y / 400.0
      };
    }
  }, false);

  canvas.addEventListener('mouseup', function (evt) {
    IsMDown = 0;
  }, false);

  canvas.addEventListener('mousemove', function (evt) {
    const mousePos = getMousePos(canvas, evt);

    shaderProgram.CX += IsMDown * (LastPos.x - (mousePos.x / 400.0));
    shaderProgram.CY += -IsMDown * (LastPos.y - (mousePos.y / 400.0));
    LastPos.x = mousePos.x / 400.0;
    LastPos.y = mousePos.y / 400.0;
  }, false);

  canvas.addEventListener('wheel', function (evt) {
    const Z0 = shaderProgram.Zoom;
    let dY = evt.deltaY;

    if (Math.abs(dY) > 50) {
      dY /= 100;
    }

    const dZ = Z0 * (dY / 10.0);

    if (shaderProgram.Zoom + dZ > 0) {
      const mousePos = getMousePos(canvas, evt);
      const dPosX = (mousePos.x / 400.0 - 1);
      const dPosY = -(mousePos.y / 400.0 - 1);
      shaderProgram.Zoom += dZ;
      shaderProgram.CX = Z0 / (Z0 + dZ) * (shaderProgram.CX - dPosX * dZ / Z0);
      shaderProgram.CY = Z0 / (Z0 + dZ) * (shaderProgram.CY - dPosY * dZ / Z0);
    }
  }, false);

  initGL(canvas);
  initShaders();
  initBuffers();
  texture = loadTexture(iText);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  tick();
}

function updateSpeed () {
  var data = document.getElementById('inputSpeed').value;
  Speed = parseInt(data);
  if (isNaN(Speed)) Speed = 1;
}

function loadTexture (url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
    width, height, border, srcFormat, srcType,
    pixel);

  const image = new Image();
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
      srcFormat, srcType, image);

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2 (value) {
  return (value & (value - 1)) == 0;
}

document.addEventListener('DOMContentLoaded', webGLStart);
