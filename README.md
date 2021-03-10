# 👔 Necktie – a simple DOM binding tool

`Necktie` is a library that binds your logic to the **Document Object Model** elements in an easy way. It has only `~3 kB` (UMD, minified).


## How it works

`Necktie` takes its powers from `document.querySelector` and `MutationObserver` capabilities. This tool allows you to register a function or a class that will be called with a proper `HTMLElement` as an argument, even if it's created or removed dynamically.

For example:
```javascript
import { Necktie } from '@lesniewski.pro/necktie';

const necktie = new Necktie();

necktie.startListening();

necktie.bind('.form-component input[data-name]', (node) => {
  console.log(node, 'has been found in the DOM');

  return (destroyedNode) => {
    console.log(destroyedNode, 'has been removed from the DOM');
  };
});
```

`Necktie` is meant for mostly static pages, but should work also in SPA model, although it might be CPU-expensive, especially using `observeAttributes()`.


## Installation

Using npm: `npm install @lesniewski.pro/necktie`.
Using yarn: `yarn add @lesniewski.pro/necktie`.


## Documentation

It's recommended to include `Necktie` in the `<head>` section of the document.

The library comes with CJS, ESM and UMD modules. **TypeScript** types are also available.

### Components

#### `Necktie` class 
| Method                                                                 | Description                                             |
| ---------------------------------------------------------------------- | ---                                                     |
| `constructor(): this`                                                  | Creates a new Necktie instance.                         |
|                                                                        |                                                         |
| `bind(selector: string, callback: Callback): this`                     | Binds a callback function with a given selector.        |
| `bindClass(selector: string, BindableComponent: Bindable): this`       | Binds a `Bindable` class with a given selector.         |
| `observeAttributes(isEnabled?: boolean): this`                         | Looks for attributes changes, for example `class` or `data-*`. Rebinds registered functions if necessary. **WARNING!** Use with caution, this might be expensive. |
| `startListening(): this`                                               | Runs callbacks or Bindable classes on registered selectors, starts listening for DOM changes. |

#### `Bindable` class
| Method                                                                | Description                                             |
| --------------------------------------------------------------------- | ---                                                     |
| `constructor(node?: Node): this`                                      | Creates a new Bindable instance                         |
|                                                                       |                                                         |
| `destroy(destroyedNode? Node): void`                                  | A clean up method, called when a DOM element has been removed. |

#### `Callback` function
`(node?: Node) => ((destroyedNode?: Node) => void) | void` – a function fired when a proper `HTMLElement` has been found. Optionally it can return a clean up function that will be fired when an element will disappear from the DOM.


## TO DO
- [x] Initial release
- [ ] Unit tests
- [ ] CI automation


## License

[MIT](LICENSE).
