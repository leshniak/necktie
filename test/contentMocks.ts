import { JSDOM } from 'jsdom';

export const emptyDocument = () => new JSDOM('');

export const exampleDocument = () => new JSDOM(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Necktie Sandbox</title>
  </head>
  <body>
    <h1>Necktie Sandbox</h1>
    <button class="button-primary" data-add-list-item>Add list item</button>
    <p>Items:</p>
    <ul id="list">
      <li class="list-item">Item 1</li>
      <li class="list-item">Item 2</li>
      <li class="list-item">Item 3</li>
    </ul>
  </body>
</html>
`);
