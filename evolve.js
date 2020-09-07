const fs = require("fs");
const chance = require("chance").Chance();
const { range, flatten, sortBy, prop, isNil, clone } = require("ramda");

const {
  generateSubtree,
  makeRootNode,
  evalTree,
  makeRandomNode,
  display,
} = require("./tree-maker");

// const logObj = (text, item) => console.log(text, JSON.stringify(item, null, 2));
// const log = console.log;

const makePopulation = (size, inputWidth) => {
  return range(0, size).map(() => {
    const root = makeRootNode();
    const size = generateSubtree(root, inputWidth);
    root.size = size;
    return { tree: root };
  });
};

const testTree = ({ tree }, testSet) => {
  const results = testSet.map(({ input, expected }) => ({
    expected,
    actual: evalTree(tree, input),
  }));
  return getRMSE(results);
};

const sortTestedProp = sortBy(prop("error"));

const testPopulation = (population, testSet) => {
  let totalFitness = 0;
  let max = 0;
  const tested = population.map((tree) => {
    const error = testTree(tree, testSet);
    const size = tree.tree.size;
    const sizeThreshold = 80;
    const treeSizeAdd =
      size < sizeThreshold
        ? 0
        : (size - sizeThreshold) * (size - sizeThreshold);
    const fitness =
      isNil(error) || isNaN(error) ? 0 : 1 / (error + treeSizeAdd);
    if (fitness > max) {
      max = fitness;
    }
    totalFitness += fitness;
    return {
      tree: tree.tree,
      fitness: fitness + 0.0001,
    };
  });
  let previous = 0;
  const sorted = tested
    .sort((a, b) => b.fitness - a.fitness)
    .map(({ tree, fitness }) => {
      previous += fitness;
      return { tree, fitness, cumulativeFitness: previous };
    });
  return [sorted, totalFitness, max];
};

const getRMSE = (results) => {
  let sumSquareDiff = 0;
  for (let i = 0, l = results.length; i < l; i++) {
    sumSquareDiff += Math.pow(results[i].expected - results[i].actual, 2);
  }
  const averageDiff = sumSquareDiff / results.length;
  return Math.sqrt(averageDiff);
};

// const nan = results.filter(({ error }) => isNaN(error)).map(({ tree }) => tree);

const selectFitIndividual = (results, sumFitness) => {
  let failsafe = 0;
  const r = chance.floating({ min: 0, max: sumFitness });
  let index = 0;
  while (true) {
    failsafe++;
    const potential = results[index];
    if (r < potential.cumulativeFitness) {
      return clone(potential);
    }
    index++;
    if (failsafe > 10000) {
      return null;
    }
  }
};

const selectFittest = ([results, totalFitness, maxFitness], number) => {
  return range(0, number).map(() => selectFitIndividual(results, totalFitness));
};

/**
 * Get the children of the last set of parents until "place" is reached
 **/
const getNode = (tree, place) => {
  // All the children of the last stack will be pushed on to the stack
  let stack = [[tree]];
  let found;
  let i = 0;
  while (true) {
    const nextStackItem = [];
    const lastStackItem = stack.length - 1;
    stack[lastStackItem].forEach((item) =>
      item.children.forEach((child) => {
        if (i === place) {
          found = child;
        }
        nextStackItem.push(child);
        i++;
      })
    );
    stack.push(nextStackItem);
    if (found) break;
  }
  return found;
};

const getTreeSize = (node, size = 0) => {
  const thisSize = size + 1;
  if (node.width === 0) {
    return thisSize;
  }
  const childrenSize = node.children.reduce((childSize, child) => {
    return childSize + getTreeSize(child);
  }, 0);
  return thisSize + childrenSize;
};

const mutateNode = (node) => {
  const inputWidth = node.inputWidth;
  const newNode = makeRandomNode(inputWidth);
  node.name = newNode.name;
  node.payload = newNode.payload;
  if (newNode.width > node.width) {
    const diff = newNode.width - node.width;
    node.width = newNode.width;
    range(0, diff).forEach(() => {
      const childNode = makeRandomNode(inputWidth);
      node.children.push(childNode);
      generateSubtree(childNode, inputWidth);
    });
  }
};

const mutateTree = (tree, amount) => {
  // console.log("size", tree.tree.size);
  for (let i = 1, l = tree.tree.size - 1; i < l; i++) {
    const r = Math.random();
    // log(r, amount);
    if (r < amount) {
      const nodeToMutate = getNode(tree.tree, i);
      mutateNode(nodeToMutate);
    }
  }
};

const mutatePopulation = ([population], chance, amount) => {
  for (let i = 0, l = population.length; i < l; i++) {
    const r = Math.random();
    if (r < chance) {
      mutateTree(population[i], amount);
      population[i].tree.size = getTreeSize(population[i].tree);
    }
  }
};

/**
 * Evolves a tree for a set number of iterations, and produces the best result
 **/
const evolve = (
  trainingData,
  {
    iterations = 100,
    populationSize = 100,
    mutationChance = 0.4,
    mutationAmount = 0.3,
    reportFn,
  }
) => {
  return new Promise((accept) => {
    console.log(trainingData[0].input.length);
    const initialPopulation = makePopulation(
      populationSize,
      trainingData[0].input.length
    );
    let best;
    let iteration = 0;
    let currentPopulation = testPopulation(initialPopulation, trainingData);
    const interval = setInterval(() => {
      const fittest = selectFittest(currentPopulation, populationSize);
      currentPopulation = testPopulation(fittest, trainingData);
      if (reportFn) {
        reportFn({ iteration, fitness: currentPopulation[2] });
      }
      if (iteration >= iterations) {
        clearInterval(interval);
        best = currentPopulation[0][0];
        accept(best.tree);
      }
      mutatePopulation(currentPopulation, 0.6, 0.3);
      iteration++;
    }, 0);
  });
};

module.exports = { evolve, evalTree };
