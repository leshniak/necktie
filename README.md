# 👔 Necktie – a simple DOM binding tool

`Necktie` is a library that binds your logic to the **Document Object Model** elements in an easy way. It has only `~3 kB` (UMD, minified).

## How it works

`Necktie` takes its powers from `document.querySelector` and `MutationObserver` capabilities. This tool allows you to register a function or a class that will be called with a proper `HTMLElement` as an argument, even if it's created or removed dynamically.

For example:
```javascript
import { Necktie } from 'necktie';

const necktie = new Necktie();

necktie.startListening();

necktie.bind('.form-component input[data-name]', (node) => {
  console.log(node, 'has been found in the DOM');

  return (destroyedNode) => {
    console.log(destroyedNode, 'has been removed from the DOM');
  };
});
```

## Documentation

It's recommended to include `Necktie` in the `<head>` section of the document.

The library comes with CJS, ESM and UMD modules. **TypeScript** types are also available.

## TO DO
- [x] Initial release
- [ ] Add unit tests

## License

[MIT](LICENSE).
