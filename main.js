const { range } = require("ramda");
const { evolve, evalTree } = require("./evolve");

const makeMockData = (x) => 20 + 3 * x + x * x * 2;

const trainingData = range(0, 80)
  .map(makeMockData)
  .map((expected, input) => ({ input: [input], expected }));

console.log(trainingData);
evolve(trainingData, {
  iterations: 200,
  populationSize: 2000,
  mutationChance: 0.3,
  mutationAmount: 0.6,
  reportFn: console.log,
}).then((best) => {
  console.log(best);
  for (let i = 0; i < 10; i++) {
    console.log(makeMockData(i), evalTree(best, [i]));
  }
});
