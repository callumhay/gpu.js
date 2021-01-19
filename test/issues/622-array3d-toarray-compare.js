const { assert, skip, test, module: describe } = require('qunit');
const { GPU } = require('../../src');

const issueStr = 'issue #622 array3d-toarray-compare';
describe(issueStr);

const gridSize = 8;
const pipelineFuncSettings = {
  output: [gridSize, gridSize, gridSize],
  pipeline: true,
  returnType: 'Array(3)',
};

function buildControlBuffer() {
  const controlBuffer = [];
  for (let x = 0; x < gridSize; x++) {
    let currXArr = [];
    controlBuffer.push(currXArr);
    for (let y = 0; y < gridSize; y++) {
      let currYArr = [];
      currXArr.push(currYArr);
      for (let z = 0; z < gridSize; z++) {
        currYArr.push(new Float32Array([x,y,z]));
      }
    }
  }
  return controlBuffer;
}

function runIssue622Test(mode) {
  const gpu = new GPU({ mode });
  const copyFBFuncImmutable = gpu.createKernel(function(framebufTex) {
    const voxelColour = framebufTex[this.thread.z][this.thread.y][this.thread.x];
    return [voxelColour[0], voxelColour[1], voxelColour[2]];
  }, {...pipelineFuncSettings, immutable: true, argumentTypes: {framebufTex: 'Array3D(3)'}});

  const controlBuf = buildControlBuffer(); // Original CPU buffer
  const bufferTex = copyFBFuncImmutable(controlBuf); // GPU representation of control buffer
  const texArray  = bufferTex.toArray(); // Copied back CPU->GPU->CPU buffer

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        const controlBufXYZ = controlBuf[x][y][z];
        const texArrayXYZ = texArray[x][y][z];
        assert.deepEqual(controlBufXYZ, texArrayXYZ);
      }
    }
  }

  gpu.destroy();
}


test(issueStr + ' - gpu', () => {
  runIssue622Test('gpu');
});
(GPU.isWebGLSupported ? test : skip)(issueStr + ' - webgl', () => {
  runIssue622Test('webgl');
});
(GPU.isWebGL2Supported ? test : skip)(issueStr + ' - webgl2', () => {
  runIssue622Test('webgl2');
});
(GPU.isHeadlessGLSupported ? test : skip)(issueStr + ' - headlessgl', () => {
  runIssue622Test('headlessgl');
});


