/**
 * Template module
 */
var rootpath = process.cwd() + '/', path = require('path'), calipso = require(path.join(rootpath, 'lib/calipso')), jsdom = require('jsdom');

var Query = require("mongoose").Query, /**
 * Exports
 * Note that any hooks must be exposed here to be seen by Calipso
 */
  exports = module.exports = {
  init:init,
  route:route,
  install:install,
  reload:reload,
  disable:disable,
  depends:["content", "contentTypes"],
  last:true,
  contentForm:contentForm
};


/**
 * Routing function, this is executed by Calipso in response to a http request (if enabled)
 */
function route(req, res, module, app, next) {

  // Router
  module.router.route(req, res, next);

};

/**
 * Initialisation function, this is executed by calipso as the application boots up
 */
function init(module, app, next) {
  calipso.lib.step(function defineRoutes(err) {
    calipso.silly(err);
    var cPerm = calipso.permission.Helper.hasPermission("content:manage:create"), uPerm = calipso.permission.Helper.hasPermission("content:manage:update"), dPerm = calipso.permission.Helper.hasPermission("content:manage:delete"), vPerm = calipso.permission.Helper.hasPermission("content:manage:view");

    // Default routes
    module.router.addRoute('GET /screens', showScreenContentList, {layout:'screen-default', template:'screenslist', block:'screenslist', permit:vPerm}, this.parallel());
    module.router.addRoute('GET /screens/list', showScreenContentList, {layout:'screen-default', template:'screenslist', block:'screenslist', permit:vPerm}, this.parallel());
    module.router.addRoute('GET /screens/view/id/:id', showScreenContentExpanded, {layout:'screen-default', template:'screenshow', block:'screencontent32', permit:vPerm}, this.parallel());
    module.router.addRoute('GET /screens/view/alias/:alias.:html', showScreenContentExpanded, {layout:'screen-default', template:'screenshow', block:'ignored', permit:vPerm}, this.parallel());
    module.router.addRoute('GET /screens/fullview/alias/:alias.:html', showScreenContentExpanded, {layout:'screen-default', template:'screenshow', block:'ignored', permit:vPerm}, this.parallel());
    // module.router.addRoute('GET /screens/edit/alias/:alias.:html', editScreenContentFromAlias, {layout:'screen-default',template: 'screenedit', block: 'screenedit', permit: vPerm}, this.parallel());
    //
    module.router.addRoute('GET /screens/edit/id/:id', editContentForm, {layout:'screen-admin', admin:true, permit:uPerm, block:'content.edit'}, this.parallel());
    module.router.addRoute('GET /screens/edit/alias/:alias.:html', editContentForm, {layout:'screen-admin', admin:true, permit:uPerm, block:'content.edit'}, this.parallel());
    module.router.addRoute('GET /screens/new', createContentForm, {layout:'screen-admin', admin:true, permit:vPerm, block:'content.create'}, this.parallel());
    // module.router.addRoute('GET /content/delete/:id',deleteContent,{layout:'screen-admin',admin:true,permit:dPerm},this.parallel());
    module.router.addRoute('POST /screens/update/id/:id', updateContent, {layout:'screen-admin', admin:true, permit:uPerm}, this.parallel());
    module.router.addRoute('POST /screens/update/alias/:alias.html', updateContent, {layout:'screen-admin', admin:true, permit:uPerm}, this.parallel());

    calipso.silly("Screenwiki: Routes initialized.");
  }, function done(err) {
    next(err);
  });
};

function showScreenViewNOTUSED(req, res, template, block, next) {
  res.layout = 'view';

  // switch the theme.
  // console.dir(screenstheme);
  calipso.theme.renderItem(req, res, template, block, {"screenstest_renderItem":"Test content  for block screens.test from Screenswiki module."}, next);
  // calipso.silly("Block "+ block + " is:" + calipso.data.getBlock(block));
  //calipso.silly("Option screentest_renderItem is: " + calipso.data.getBlock('screenstest_renderItem'));
}

function showScreenContentList(req, res, template, block, next) {
  // Extract the name of the screen and fetch content related to that.
  var format = 'html';
  res.layout = 'screen-list';
  console.log("setting layout in showScreenContentList");
  var sortBy = req.moduleParams.sortBy;
  var query = new Query();

  query.where('contentType', 'screen');
  // TODO: Perhaps few params to give different views.
  // TODO: Add taxonomy to give multiple sections.

  // Get the content list as data, by not giving 'res' object as one of the inputs.
  calipso.lib.step(function () {
    req.helpers.getContentList(query, {req:req, format:format, sortBy:sortBy}, this);
    //output contains 'contents' and 'pager', passed by step to next function.
  }, function done(err, output) {
    calipso.theme.renderItem(req, res, template, block, {contents:output.contents, pager:output.pager}, next);
  });
}

/**
 * Use the alias support of content module. When page is shown
 * through /screen/<<alias.html>>, we will show using different layout meant
 * for screen.
 *
 * WORKS, don't change! Uses:
 *   Local template: 'screenshow'. Pass from AddRoute, because it is converted to function.
 *   Exported Block name:  Defined within this function - screens.item.body.
 *   (From within theme, use getBlock() in layout 'view', section 'body', and its template helpers 'body.js'.)
 */
function showScreenContentFromAlias(req, res, template, block, next) {
  var format = 'html';
  var alias = req.moduleParams.alias;
  // var alias =  "owned_by_trinity.html";
  res.layout = 'screen-view';
  getContent(req, res, {alias:alias}, function (err, content) {
    calipso.silly("OK, Screenwiki getContent successfull.");
    // This call renders the template within the module; available as getBlock() in theme later.
    // Note that we are using new block name here.
    calipso.theme.renderItem(req, res, template, 'screens.item.body', {body:content.content}, next);
  });
}

function editScreenContentFromAlias(req, res, template, block, next) {
  var format = 'html';
  var alias = req.moduleParams.alias;
  // var alias =  "owned_by_trinity.html";
  res.layout = 'screen-view';
  getContent(req, res, {alias:alias}, function (err, content) {
    calipso.silly("OK, Screenwiki getContent successfull.");
    var dom = jsdom.jsdom(content.content);
    while (elements = dom.getElementsByTagName('textarea')) {
      if (elements.length == 0) {
        break;
      }
      element = elements.item(0);


      var div = dom.createElement('div');
      div.innerHTML = element.innerHTML;
      var attrs = element.attributes;
      for (i = 0; i < attrs.length; ++i) {
        if (attrs[i].specified) {
          div.setAttribute(attrs[i].nodeName, attrs[i].nodeValue);
        }
      }
      div.id = element.id;
      div.className = "textarea";
      div.setAttribute('contentEditable', 'true');

      var parent = element.parentNode;
      parent.appendChild(div);
      parent.removeChild(element);

      console.log("After:" + parent.toString());
    }
    content.content = dom.innerHTML;
    // This call renders the template within the module; available as getBlock() in theme later.
    // Note that we are using new block name here.
    calipso.theme.renderItem(req, res, template, 'screens.item.body', {body:content.content}, next);
  });
}

var itIsId = new RegExp("^[a-f0-9]+$", "i");
function looksLikeId(s) {
  if ((s != null) && (s.search(itIsId) == -1 )) {
    return false;
  }
  return true;
}

function showScreenContentExpanded(req, res, template, block, next) {

  // Extract the name of the screen and fetch content related to that.
  var format = 'html';
  var alias = req.moduleParams.alias;
  var id = req.moduleParams.id;
  res.layout = 'screen-view';

  // if id doesn't look like id, treat it as alias.
  if (!looksLikeId(id)) {
    alias = id.match(/^[^.]+/);
    req.moduleParams.alias = alias;
    req.moduleParams.id = null;
    id = null;
  }

  var _body;
  calipso.lib.step(function () {
    // The result is being sent to "this" which syncs with other processes being stepped, and sends that result to
    // next in line as its second param.
    getContent(req, res, {id:id, alias:alias}, this);
  }, function prepareDom(err, content) {
    if (err) {
      throw("Error received in prepareDom, and received=" + err);
    }
    if (!content || !content.content) {
      throw("Error fetching content.");
    }

    _body = content.content;
    var dom = jsdom.jsdom(_body);
    // var dom=document.createWindow();

    // window.document.getElementById()...
    // console.dir(dom);

    this.parallel()(undefined, dom);
    this.parallel()(undefined, content);
  }, function populatePartials(err, dom, content) {
    if (err) {
      throw("Error received in populatePartials, and received=" + err);
    }
    // calipso.silly("Step 3: content:" + content.content);
    // NOT getting printed:

    var partials = getPartials(dom);

    if (partials == null) {
      partials = [];
    }

    // Output should be an array: [dom, partials]
    // First result should be dom itself.
    this.parallel()(undefined, content);
    this.parallel()(undefined, dom);

    var srcList = [];
    var forked = false;
    for (var i = 0; i < partials.length; i++) {

      var partial = partials[i];
      // For each source, we fork out, and collect results back in group.
      var src = partial.source;
      if (srcList.indexOf(src) == -1) {
        // Get all partials for this source.
        forked = true;
        fetchPartialsInThisSource(src, partials, this.parallel()); // all individual partials are put into results array.
        srcList.push(src);
      }
    }
    ;
    // Wait if we did have partials, which need some time to process.

    if (!forked) {
      this.parallel()(undefined, partials);
    }
  }, function replacePartialsStep(err, content, dom, partials) {
    if (err) {
      throw("Error received in replacePartials, and received=" + err);
    }
    if ((partials != null) && partials.length != 0) {
      body = replacePartials(dom, partials);
      content.content = body;
    }
    return content;
  }, function done(err, content) {
    if (err) {
      console.log("Error received in done(), and received=" + err);
    }

    var body, alias = "";
    if (err) {
      body = "Some error while processing this content.";

    } else {
      if (content) {
        body = content.content;
        alias = content.alias;
      } else {
        body = "Some error while processing this content. (Content object was null.)";
      }
      if (body == null) {
        body = "Some error while processing this content.";
      }
    }
    calipso.theme.renderItem(req, res, template, 'screens.item.body', {body:body, alias:alias}, next);
    // Earlier: showContent(req,res, template, block, this, err, content, format);
  });
}

function logAndThrow(err) {
  console.log(err.stack);
  throw err;
}

// Get content  from backend for given alias and then call next().
function getContent(req, res, inputs, next) {
  var Content = calipso.db.model('Content');
  var contentFn = function (err, content) {
    if (err || !content) {
      calipso.silly("Screenwiki getContent: Couldn't get content for id=" + inputs.id + " alias=" + inputs.alias);
      if (res) {
        if (req && req.session && req.session.user && (inputs.alias != null)) {
          res.redirect("/screens/new?alias=" + inputs.alias + "&type=screen") // TODO - make this configurable
        } else {
          res.statusCode = 404;
        }
      }
    } else {
      // we have content here.
    }
    next(err, content);
    return;
  };
  if (inputs.id != null) {
    Content.findById(inputs.id, contentFn);
  } else {
    Content.findOne({alias:inputs.alias}, contentFn);
  }
}

// Find if there is partial in this content, and call next() for every such partial.
function getPartials(dom) {
  var partials = [];
  // Partial format: {id:"", source: "", body: "", version: ""}
  // now scan content and find partial

  var pDivs = dom.getElementsByClassName('partial');

  if (pDivs == null) {
    return partials;
  }

  calipso.silly("\nIdentified partials: " + pDivs.length);

  // live NodeList, can't use Array.forEach.
  for (var i = 0; i < pDivs.length; ++i) {

    var node = pDivs[i];
    var id = node.getAttribute("partial_id");
    var src = node.getAttribute("partial_src");
    var version = node.getAttribute("partial_version");

    calipso.silly("\nIdentified partial (id, src, version): " + id + " " + src + " " + version);
    if (src && id) {
      var v = { id:id, source:src, version:version, body:null, error:null };
      partials.push(v);
    }
    // Push only if both id and src are defined for partial.
  }
  ;
  return partials;
}

//  Replace partial in this content
function replacePartials(dom, partials) {
  var pDivs = dom.getElementsByClassName('partial');

  for (i = 0; i < partials.length; ++i) {
    var src = partials[i];
    calipso.silly("Partials Populated: id=" + src.id + " source=" + src.source + "body=" + (src.body != null));
  }
  for (var i = 0, len = pDivs.length; i < len; i++) {

    var node = pDivs[i];
    var dst = { 'id':node.getAttribute("partial_id"), 'source':node.getAttribute("partial_src"), 'version':node.getAttribute("partial_version") };

    // calipso.silly("Tryng match for: id="+dst.id+" source="+dst.source);
    // find matching partial. Source has id, and destination should have it as partial_id.
    for (j = 0; i < partials.length; ++j) {
      var src = partials[j];
      // calipso.silly("Looping through partial: j="+j);

      if ((src.id == dst.id) && (src.source == dst.source) && (src.version == dst.version)) {
        if (src.error) {
          node.innerHTML = src.error;
        } else {
          var t = utilFixInnerHTMLOutput(src.body);
          // calipso.silly("Added the div. dst="+ node.id + " contents="+t);
          node.innerHTML = t;
        }
        break;
      }
    }
  }
  // convert DOM back into content.
  var body = dom.innerHTML;
  return body;
}

function utilFixInnerHTMLOutput(text) {
  text = text.replace(/(\\r\\n|\\r|\\n|\\t)/g, "");
  return text;
}

// Populate all partials for the given source. *Only if they are not already populated.*
function fetchPartialsInThisSource(source, partials, next) {
  var pbody;

  calipso.silly("Fetching from DB: source=" + source);

  getContent(null, null, {alias:source}, function (err, text) {
    if (err || !text) {
      calipso.silly("Couldn't find content for source=" + source);
      for (var i = 0; i < partials.length; i++) {
        var partial = partials[i];
        ;
        if (partial.source != source) {
          continue;
        }
        partial.error = "Content source not found for this partial. id=" + partial.id + " source=" + partial.source;
      }
      next(null, partials);
    } else {
      var dom = jsdom.jsdom(text);

      for (i = 0; i < partials.length; i++) {
        var partial = partials[i];
        if (partial.source != source) {
          continue;
        }
        var node = dom.getElementById(partial.id);
        if (node) {
          partial.body = node.innerHTML;
          partial.error = null;
        } else {
          partial.error = "Content found, but Partial not defined in this content. id=" + partial.id + " source=" + partial.source;
        }
      }
      next(null, partials);
    }
  });
}


function getMoreContentAttrs(err, req, res, content, next) {
  calipso.modules.user.fn.userDisplay(req, content.author, function (err, userDetails) {
    if (err) {
      next(err);
    } else {
      // Add the user display details to content
      content.set('displayAuthor', userDetails);
    }
  });
}


/***
 * Show content - called by ID or Alias functions preceeding
 */
function showContent(req, res, template, block, next, err, content, format) {

  if (err || !content) {

    content = {title:"Not Found!", content:"Sorry, I couldn't find that content!", displayAuthor:{name:"Unknown"}};

  }
  if (format === "html") {
    calipso.silly("Format=html. Now calling renderItem.");
    calipso.theme.renderItem(req, res, template, block, {screencontent32:content.content}, next);
  }
}

// Content edit related code.


/**
 * Local default for the content create / edit form
 */
function contentForm() {
  return {id:'content-form', title:'Create Content ...', type:'form', method:'POST', action:'/screens/new', tabs:true,
    sections:[
      {
        id:'form-section-content-main',
        label:'Content-main',
        fields:[
          {label:'Content', name:'content[content]', type:'textarea', description:'Enter the full content text.', cls:"span10", rows:25},
          {label:'Teaser', name:'content[teaser]', type:'textarea', description:'Enter some short text that describes the content, appears in lists.', cls:'span8', rows:2},
          {label:'Tags', name:'content[tags]', type:'text', description:'Enter comma delimited tags to help manage this content.', cls:"span6"}
        ]
      },
      {
        id:'form-section-content',
        label:'Names',
        fields:[
          {label:'Title', name:'content[title]', type:'text', description:'(New) Title'},
          {label:'Permanent URL / Alias', name:'content[alias]', type:'text', description:'Permanent url (no spaces or invalid html characters), if left blank is generated from title.'},
          {label:'Type', name:'content[contentType]', type:'select', options:function () {
            return calipso.data.contentTypes
          }, description:'Select the type, this impacts custom fields and page display.'},
          {label:'Taxonomy', name:'content[taxonomy]', type:'text', description:'Enter the menu heirarchy, e.g. "welcome/about"'}
        ]
      }
    ],
    fields:[
      {label:'', name:'returnTo', type:'hidden'}
    ],
    buttons:[
      {name:'submit', type:'submit', value:'Save Content'},
      {name:'cancel', type:'button', href:'/screens', value:'Cancel'}
    ]};
}

/**
 * Create the form based on the fields defined in the content type
 * Enable switching of title etc. from create to edit
 */
function getForm(req, action, title, contentType, next) {

  // Create the form
  var form = exports.contentForm(); // Use exports as other modules may alter the form function
  form.action = action;
  form.title = title;

  // Get content type
  var ContentType = calipso.db.model('ContentType');

  ContentType.findOne({contentType:contentType}, function (err, ct) {

    // Add any fields
    if (!err && ct && ct.get("fields")) { // FIX as this added later, get is 'safer' if not existing in document

      var fields = [];

      try {
        var fields = JSON.parse(ct.fields)
      } catch (ex) {
        // Issue with our fields
        req.flash("error", req.t("The content type you are editing has invalid fields defined, please check the content type configuration." + ex.message));
      }

      // Process any additional fields
      // TODO: form = calipso.form.processFields(form,fields);
    }

    next(form);

  });

}


/**
 * Create Content Form
 * Create and render the 'New Content' page.
 * This allows some defaults to be passed through (e.g. from missing blocks).
 */
function createContentForm(req, res, template, block, next) {

  var alias = req.moduleParams.alias ? req.moduleParams.alias : "";
  var teaser = req.moduleParams.teaser ? req.moduleParams.teaser : "";
  var taxonomy = req.moduleParams.taxonomy ? req.moduleParams.taxonomy : "";
  var returnTo = req.moduleParams.returnTo ? req.moduleParams.returnTo : "";
  var type = "Article";         // Hard coded default TODO fix

  // Create the form
  var form = {id:'content-type-form', title:'Create Content ...', type:'form', method:'GET', action:'/content/new', tabs:false,
    fields:[
      {label:'Type', name:'type', type:'select', options:function () {
        return calipso.data.contentTypes
      }, description:'Select the type of content you want to create ...'},
      {label:'', name:'alias', type:'hidden'},
      {label:'', name:'teaser', type:'hidden'},
      {label:'', name:'taxonomy', type:'hidden'},
      {label:'', name:'returnTo', type:'hidden'}
    ],
    buttons:[
      {name:'submit', type:'submit', value:'Next'}
    ]};


  // Default values
  var values = {
    content:{
      contentType:type
    },
    alias:alias,
    teaser:teaser,
    taxonomy:taxonomy
  }

  res.layout = 'screen-view';
  console.log("setting layout in createContentForm");

  calipso.form.render(form, values, req, function (form) {
    calipso.theme.renderItem(req, res, form, 'screens.item.body', {}, next);
  });
}

/**
 * Edit Content Form
 * Edit an existing piece of content.
 */
function editContentForm(req, res, template, block, next) {

  var Content = calipso.db.model('Content');
  var id = req.moduleParams.id;
  var alias = req.moduleParams.alias;
  var item;
  var returnTo = req.moduleParams.returnTo ? req.moduleParams.returnTo : "";
  var cPerm = calipso.permission.Helper.hasPermission("content:manage:create"), uPerm = calipso.permission.Helper.hasPermission("content:manage:update"), dPerm = calipso.permission.Helper.hasPermission("content:manage:delete"), vPerm = calipso.permission.Helper.hasPermission("content:manage:view");

  // if id doesn't look like id, treat it as alias.
  if (!looksLikeId(id)) {
    alias = id.match(/^[^.]+/);
    req.moduleParams.alias = alias;
    req.moduleParams.id = null;
    id = null;
  }

  getContent(req, res, {id:id, alias:alias}, function (err, c) {

    if (err || c === null) {

      // TODO : REDIRECT TO 404
      res.statusCode = 404;
      next();

    } else {

      // Support both alias and id.
      var action;
      if (alias != null) {
        action = "/screens/update/alias/" + c.alias + ".html";
      } else if (id != null) {
        action = "/screens/update/id/" + c.id;
      }
      // Create the form
      getForm(req, action, req.t("Edit Content ..."), c.contentType, function (form) {

        // Default values
        var values = {content:c};

        // Fix for content type being held in meta field
        // TODO this has a bad smell
        values.contentType = values.content.contentType;
        values.returnTo = returnTo;

        res.layout = 'screen-view';

        // Test!
        calipso.e.pre_emit('CONTENT_UPDATE_FORM', form, function (form) {
          calipso.form.render(form, values, req, function (form) {
            calipso.theme.renderItem(req, res, form, 'screens.item.body', {}, next);
          });
        });

      });
    }
  });

}

/**
 * Update Content - from form submission
 */
function updateContent(req, res, template, block, next) {

  calipso.form.process(req, function (form) {

    if (form) {

      var Content = calipso.db.model('Content');
      var ContentType = calipso.db.model('ContentType');

      var returnTo = form.returnTo ? form.returnTo : "";
      var id = req.moduleParams.id;
      var alias = req.moduleParams.alias;

      // if id doesn't look like id, treat it as alias.
      if (!looksLikeId(id)) {
        alias = id.match(/^[^.]+/);
        req.moduleParams.alias = alias;
        req.moduleParams.id = null;
        id = null;
      }
      getContent(req, res, {id:id, alias:alias}, function (err, c) {
        if (c) {

          // Default mapper
          calipso.form.mapFields(form.content, c);

          // Fields that are mapped specifically
          c.updated = new Date();
          c.alias = form.content.alias ? form.content.alias : titleAlias(c.title);
          c.tags = form.content.tags ? form.content.tags.replace(/[\s]+/g, "").split(",") : [];

          // Get content type
          ContentType.findOne({contentType:form.content.contentType}, function (err, contentType) {

            if (err || !contentType) {
              req.flash('error', req.t('Could not save content as I was unable to locate content type {type}.', {type:form.content.contentType}));
              res.redirect('/screens');
              next();
            } else {

              // Copy over content type data
              c.contentType = contentType.contentType;
              c.layout = contentType.layout;
              c.ispublic = contentType.ispublic;

              // Emit pre event
              // This does not allow you to change the content
              calipso.e.pre_emit('CONTENT_UPDATE', c, function (c) {

                c.save(function (err) {
                  if (err) {

                    var errorMsg = '';
                    if (err.errors) {
                      for (var error in err.errors) {
                        errorMessage = error + " " + err.errors[error] + '\r\n';
                      }
                    } else {
                      errorMessage = err.message;
                    }
                    req.flash('error', req.t('Could not update content because {msg}', {msg:errorMessage}));
                    if (res.statusCode != 302) {  // Don't redirect if we already are, multiple errors
                      res.redirect('back');
                    }
                    next();

                  } else {

                    req.flash('info', req.t('Content saved.'));

                    // Raise CONTENT_CREATE event
                    calipso.e.post_emit('CONTENT_UPDATE', c, function (c) {
                      if (returnTo) {
                        res.redirect(returnTo);
                      } else {
                        // use the reference to the originally id deifned by req.moduleParams.id
                        var nextUrl;
                        if (c.alias != null) {
                          nextUrl = '/screens/view/alias/' + c.alias + '.html';
                        } else if (c.id != null) {
                          nextUrl = '/screens/view/id/' + c.id;
                        } else {
                          nextUrl = '/screens/'; // Some error.
                        }
                        res.redirect(nextUrl);
                      }
                      next();
                    });

                  }

                });

              });

            }

          });

        } else {
          req.flash('error', req.t('Could not locate content, it may have been deleted by another user or there has been an error.'));
          res.redirect('/screens');
          next();
        }
      });

    }

  });

}


/**
 * Template installation hook
 */
function install() {
  calipso.log("Screenswiki module installed");
}

/**
 * hook for disabling
 */
function disable() {
  calipso.log("Screenswiki module disabled");
}

/**
 * Admin hook for reloading
 */
function reload() {
  calipso.log("Screenswiki module reloaded");
}

