const { stdout } = require("process");
const { range, toPairs } = require("ramda");

const rand = (min, max) => min + Math.random() * (max - min);

const nodeTypes = {
  constant: { weight: 20, name: "constant" },
  operation: { weight: 5, name: "operation" },
  input: { weight: 7, name: "input" },
  conditional: { weight: 5, name: "conditional" },
};

const operators = {
  add: { weight: 10, width: 2, name: "add", fn: (a, b) => a + b },
  subtract: { weight: 10, width: 2, name: "subtract", fn: (a, b) => a - b },
  divide: { weight: 10, width: 2, name: "divide", fn: (a, b) => a / b },
  multiply: { weight: 10, width: 2, name: "multiply", fn: (a, b) => a * b },
  log: { weight: 10, width: 1, name: "log", fn: (a) => Math.log(a) },
  sqrt: { weight: 10, width: 1, name: "sqrt", fn: (a) => Math.sqrt(a) },
  sqr: { weight: 10, width: 1, name: "sqr", fn: (a) => a * a },
};

const conditionals = {
  gt: { width: 2, name: "gt", fn: (a, b) => (a > b ? a : b) },
  lt: { width: 2, name: "lt", fn: (a, b) => (a < b ? a : b) },
};

const conditionalPairs = toPairs(conditionals);
const chooseConditional = () =>
  conditionalPairs[Math.floor(Math.random() * 2)][1];

const weightReducer = (acc, [name, { weight }]) => [
  ...acc,
  ...range(0, weight).map(() => name),
];

const weights = toPairs(nodeTypes).reduce(weightReducer, []);

const weightsLength = weights.length;

const opWeights = toPairs(operators).reduce(weightReducer, []);

const chooseOp = () =>
  operators[opWeights[Math.floor(Math.random() * opWeights.length)]];

const chooseNode = () => weights[Math.floor(Math.random() * weightsLength)];

const constants = {
  inputs: 5,
};

const params = {
  constMin: 0,
  constMax: 10,
};

const eval = (node, inputs) => {
  let evaluatedChildren;
  let ret;
  switch (node.name) {
    case "constant": {
      ret = node.payload;
      break;
    }
    case "input": {
      ret = inputs[node.payload];
      break;
    }
    case "conditional":
    case "operation": {
      evaluatedChildren = node.children.map((child) => eval(child, inputs));
      ret = node.payload.fn.apply(null, evaluatedChildren);
      break;
    }
  }
  return ret;
};

const makeNode = (nodeName, inputWidth) => {
  switch (nodeName) {
    case "constant": {
      return {
        name: nodeName,
        payload: rand(params.constMin, params.constMax),
        width: 0,
        inputWidth,
      };
    }
    case "input": {
      const inputKey =
        inputWidth - 1 === 0 ? 0 : Math.floor(Math.random() * inputWidth);
      // console.log(inputWidth, inputKey);
      return {
        name: nodeName,
        payload: inputKey,
        width: 0,
        inputWidth,
      };
    }
    case "operation": {
      const op = chooseOp();
      return {
        name: nodeName,
        payload: op,
        width: op.width,
        inputWidth,
      };
    }
    case "conditional": {
      return {
        name: nodeName,
        payload: chooseConditional(),
        width: 2,
        inputWidth,
      };
    }
  }
};

const makeRootNode = () => {
  const randomOp = chooseOp();
  const rootNode = {
    name: "operation",
    payload: randomOp,
    width: randomOp.width,
  };
  return rootNode;
};

const makeRandomNode = (inputWidth) => {
  const nodeName = chooseNode();
  return makeNode(nodeName, inputWidth);
};

const generateSubtree = (parent, inputWidth, size = 0) => {
  let adjustedSize = size + 1;
  parent.children = range(0, parent.width).map(() => {
    return makeRandomNode(inputWidth);
  });
  parent.children.forEach(
    (child) => (adjustedSize += generateSubtree(child, inputWidth, size))
  );
  return adjustedSize;
};

const display = (node) => {
  let str = "(";
  str += node.name;
  if (node.children.length > 0) {
    str += " " + node.children.map(display).join(" ");
  }
  str += ")";
  return str;
};

// const tree = makeRootNode();
// console.log(generateSubtree(tree));

// console.log(display(tree));

module.exports = {
  makeRootNode,
  generateSubtree,
  makeRandomNode,
  evalTree: eval,
  display,
};
