import { Component, Input } from '@angular/core';

@Component({
  selector: 'hello-<%= addExclamation(dasherize(name)) %>',
  template: `
    <h1>Hello <% if (addname) { %>{{ name }}<% } else { %>World<% } %>!</h1>
    <h2>Chosen Fruits!!!</h2>
    <ul><% for ( let fruit of toArray(fruits)) { %>
      <li><%= fruit %></li><% } %>
    </ul>

  `,
  styles: [
    `
      h1 {
        font-family: Lato;
      }
    `
  ]
})
export class Hello<%= classify(name) %>Component {
  <% if (addname) { %>@Input() name: string;<% } %>    
}
