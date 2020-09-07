# Genetic Programming

## Steps to install

1. Clone repo
2. run `$ npm install`

## How to use

`evolve.js` exports `evolve` and `evalTree` functions. These are used as follows

### `evolve(trainingData, options) => bestTree`

- `trainingData`: array of objects with the following schema:

```
{
    input: ArrayOf(Number),
    expected: Number
}
```
- `options`: allows the customisation of various paramters:

``` js
{
  iterations: Integer, // number of iterations before finish
  populationSize: Integer, // number of potential solutions to test per iteration
  mutationChance: Float, // chance that a single solution in a population will be mutated
  mutationAmount: Float, // chance that each node within the mutated solution will be mutated
  reportFn: Function, // executed after every iteration, schmea: { iteration, fitness }
}
```


### `evalTree(tree) => number`

