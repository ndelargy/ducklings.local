todoApp
=======
This is a demo module for Calipso CMS written in node.js. The purpose is to allow you to write general applications while leveraging calipso capabilities.

Even though this is demo, it can be used as template to start a new project.
It uses director for routing, and leverages calipso's templating system. 


Usage:
======




Referencing modules from within the templates

You should do this: 
    // this refers to router object.
    this.res.addBlocks('user', 'user.login'); 
    this.render(...);

And within the template, you can reference the registered block as:
    <%- _module_user_login %> 


