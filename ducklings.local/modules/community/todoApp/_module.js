/**
 * Sample todo application for module-as-App in calipso.
 */
var rootpath = process.cwd() + '/', path = require('path'), calipso = require(path.join(rootpath, "/lib/calipso"));

module.exports = _module = function () {
}

// Called only during loading of this app, to register with calipso.
_module.register = function (app, baseUrl, depends, routeOptions) {

  if (baseUrl == undefined) {
    throw "App needs baseURL '/app' to be registered.";
  }

  // Register the app with calipso, as if it is its module.
  app.init = this.init;
  app.route = this.route;
  app.depends = depends;
  app.routeOptions = routeOptions;

  // And store reference of app in the module.
  _module._app = app;
  _module._baseUrl = baseUrl;
  // And initialize some of the variables of the module from the app.
};

_module.route = function (req, res, module, calipsoApp, next) {
  module.router.route(req, res, next);
}

_module.init = function (module, calipsoApp, next) {
  _module.module_name = module.name;

  // TODO: Load app templates, which might be in separate directory.
  // The module executing this is actually our app i.e. 'this'.
  var app = this;
  app.appInit();
  calipso.lib.step(function defineRoutes() {
    var methods = ['GET', 'POST', 'PUT', 'DELETE'];
    for (i in methods) {
      var route = methods[i] + " " + _module._baseUrl + "(/:subpath(*)?)?";
      module.router.addRoute(route, _module.routeWrapper, app.routeOptions, this.parallel());
    }
    ;
  }, function done() {
    next();
  });
}


/*
 * Evaluate all blocks and add to options array.
 */
function populateBlocks(req, res, blocks, options) {
  blocks.forEach(function (item) {
    /* blocks are usually x.y within module.
     * We want it to be usable as variable within the template.
     * so, we use: _module_x_y.
     */
    var arr = item.name.split('.');
    var blockName = "_module";
    for (i in arr) {
      blockName += '_' + arr[i]
    }
    req.helpers.getBlock(item.name, function (err, output) {
      // convert names into usable names.
      debugger;
      options[blockName] = output;
    });
  });
}

/*
 * Helper for use in Views to add base Url to urls.
 * Usage: <%= appUrl('/update/', id) %>
 */
function appUrl() {
  var url = _module._baseUrl;
  for (i = 0; i < arguments.length; i++) {
    url += arguments[i];
  }
  return url;
}


/*
 * Get compiled module template, from '/templates' directory within 
 * the module.
 */
function renderCompiledTemplate(tmpl, options) {
  var output;
  var module_templates = calipso.modules[_module.module_name].templates;
  if (module_templates) {
    var template = module_templates[tmpl];
    if (typeof template === "function") {
      return template.call({}, options);
    }
  }
  return undefined;
}


/*
 * Render all sections in the layout, with their respective blocks.
 * Use 'all' to denote all blocks.
 */
function renderSections(req, res, layout, app_res, next) {
  var layoutConfig = calipso.theme.config.layouts[layout];
  if (!(layoutConfig && layoutConfig.layout && layoutConfig.layout.sections)) {
    throw("Error getting layout sections from theme layout array." + layout);
  }
  var sections = [];
  for (section in layoutConfig.layout.sections) {
    sections.push(section);
  }
  var sectionIterator = function (section, callback) {
    var content = app_res.content(section) || "<!-- [" + section + " is empty.] --!>";
    calipso.theme.renderItem(req, res, content, section, {}, callback);
  };
  calipso.lib.async.map(sections, sectionIterator, function (err, result) {
    if (err) {
      calipso.error("Error rendering sections. msg:" + err.message + " stack: " + err.stack);
      next(err);
    } else {
      next();
    }
  });
}

_module.routeWrapper = function (req, res, template, block, next) {
  var subpath = req.moduleParams.subpath || "";
  if (subpath.charAt(0) != '/') {
    subpath = '/' + subpath;
  }

  // We will retain req, but res is new type.
  var app_req = {
    url:subpath,
    method:req.method,
    headers:req.headers,
    body:req.body,
    httpVersion:req.httpVersion,
    session:req.session,
    helpers:req.helpers
  };
  var app_res = {
    _stack:[],
    _blocks:[],
    _redirectPath:undefined,
    addBlock:function (module, block) {
      // TODO: module is not used for now.
      // Register blocks for use in your templates.
      // They are populated and passed to options before call to render().
      this._blocks.push({module:module, name:block, content:''});
    },
    render:function (tmpl, options, section) {
      var output = tmpl; // By default, we assume it to be output.
      options.appUrl = appUrl;
      debugger;
      populateBlocks(req, res, this._blocks, options);
      output = renderCompiledTemplate(tmpl, options) || output;
      section = section || 'body'; // add to body by default
      this._stack.push({section:section, output:output});
    },
    content:function (section) {
      var content = "";
      section = section || 'all'; // show all contents by default.
      this._stack.forEach(function (i) {
        if ((section == 'all') || (section == i.section)) {
          content += "<div class=" + section + ">" + i.output + "</div><br/>";
        }
      });
      return(content);
    },
    writeHead:function () {
      throw("writeHead: Not yet implemented in appModule");
    },
    redirect:function (path) {
      this._redirectPath = path;
    },
    hasRedirect:function () {
      return(this._redirectPath);
    },
    end:function () {
    }
  };

  // 'this' is actually our app module.
  _module._app.appRoute(app_req, app_res, function (err) {

    var redirect = app_res.hasRedirect();
    if (err) {
      res.layout = app_res.layout || 'main';
      calipso.theme.renderItem(req, res, err, 'content', {}, next);
    } else if (redirect) {
      res.redirect(_module._baseUrl + redirect);
    } else {
      res.layout = 'main';
      // populate all sections
      renderSections(req, res, res.layout, app_res, next);
      // var content=app_res.content('body') || "No Output. :-(";
      // calipso.theme.renderItem(req, res, content, 'body', {}, next);
    }
  });
}
