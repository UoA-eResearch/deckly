# deckly

[![NPM package][npm-img]][npm-url]
[![Build Size][build-size-img]][build-size-url]
[![Dependencies][dependencies-img]][dependencies-url]

Deckly is a JavaScript library to build dashboards of integrated maps and plots.  
Uses React, deck.gl, and plotly.  
Maps and plots are automatically linked, so that when you hover over the map, the plots are dynamically adjusted. This functionality is powered by React.  

Check out the examples:

* [NZ Cancer](https://uoa-eresearch.github.io/deckly/examples/cancer) ([source](https://github.com/UoA-eResearch/deckly/blob/main/examples/cancer.html))

## Installation

### NPM module
```
npm install deckly
```
or
```
yarn add deckly
```
Then:
```
import Deckly from 'deckly';
```
or
```
var Deckly = require('deckly');
```

### UMD
```
<script src="https://unpkg.com/deckly/umd/deckly.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/deckly/umd/deckly.css">
```

## Usage
Deckly({options})


[npm-img]: https://img.shields.io/npm/v/deckly.svg
[npm-url]: https://npmjs.org/package/deckly
[build-size-img]: https://img.shields.io/bundlephobia/minzip/deckly.svg
[build-size-url]: https://bundlephobia.com/result?p=deckly
[dependencies-img]: https://img.shields.io/david/uoa-eresearch/deckly.svg
[dependencies-url]: https://david-dm.org/uoa-eresearch/deckly