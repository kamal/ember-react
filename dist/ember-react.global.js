/*!
 * @overview  Ember-React
 * @copyright Copyright 2014 Gordon L. Hempton and contributors
 * @license   Licensed under ISC license
 *            See https://raw.github.com/ghempton/ember-react/master/LICENSE
 * @version   0.0.0
 */
(function() {
var define, requireModule, require, requirejs;

(function() {
  var registry = {}, seen = {}, state = {};
  var FAILED = false;

  define = function(name, deps, callback) {
    registry[name] = {
      deps: deps,
      callback: callback
    };
  };

  function reify(deps, name, seen) {
    var length = deps.length;
    var reified = new Array(length);
    var dep;
    var exports;

    for (var i = 0, l = length; i < l; i++) {
      dep = deps[i];
      if (dep === 'exports') {
        exports = reified[i] = seen;
      } else {
        reified[i] = require(resolve(dep, name));
      }
    }

    return {
      deps: reified,
      exports: exports
    };
  }

  requirejs = require = requireModule = function(name) {
    if (state[name] !== FAILED &&
        seen.hasOwnProperty(name)) {
      return seen[name];
    }

    if (!registry[name]) {
      throw new Error('Could not find module ' + name);
    }

    var mod = registry[name];
    var reified;
    var module;
    var loaded = false;

    seen[name] = { }; // placeholder for run-time cycles

    try {
      reified = reify(mod.deps, name, seen[name]);
      module = mod.callback.apply(this, reified.deps);
      loaded = true;
    } finally {
      if (!loaded) {
        state[name] = FAILED;
      }
    }

    return reified.exports ? seen[name] : (seen[name] = module);
  };

  function resolve(child, name) {
    if (child.charAt(0) !== '.') { return child; }

    var parts = child.split('/');
    var nameParts = name.split('/');
    var parentBase;

    if (nameParts.length === 1) {
      parentBase = nameParts;
    } else {
      parentBase = nameParts.slice(0, -1);
    }

    for (var i = 0, l = parts.length; i < l; i++) {
      var part = parts[i];

      if (part === '..') { parentBase.pop(); }
      else if (part === '.') { continue; }
      else { parentBase.push(part); }
    }

    return parentBase.join('/');
  }

  requirejs.entries = requirejs._eak_seen = registry;
  requirejs.clear = function(){
    requirejs.entries = requirejs._eak_seen = registry = {};
    seen = state = {};
  };
})();

define("ember-react", ['./components/react', './helpers/react', './initializer', './ext/route'], function($__0,$__2,$__4,$__6) {
  "use strict";
  var __moduleName = "ember-react";
  if (!$__0 || !$__0.__esModule)
    $__0 = {default: $__0};
  if (!$__2 || !$__2.__esModule)
    $__2 = {default: $__2};
  if (!$__4 || !$__4.__esModule)
    $__4 = {default: $__4};
  if (!$__6 || !$__6.__esModule)
    $__6 = {default: $__6};
  var ReactComponent = $__0.default;
  var ReactHelper = $__2.default;
  var initializer = $__4.default;
  $__6;
  var EmberReact = {
    ReactComponent: ReactComponent,
    ReactHelper: ReactHelper,
    initializer: initializer
  };
  var $__default = EmberReact;
  return {
    get default() {
      return $__default;
    },
    __esModule: true
  };
});

define("ember-react/components/react", [], function() {
  "use strict";
  var __moduleName = "ember-react/components/react";
  var get = Ember.get;
  var ReactComponent = Ember.Component.extend({
    name: null,
    modulePrefix: 'outreach/react/',
    _props: null,
    _reactComponent: null,
    reactClass: Ember.computed(function() {
      var moduleName = get(this, 'modulePrefix') + get(this, 'name');
      return requireModule(moduleName)['default'];
    }).property('name'),
    renderReact: function() {
      var el = get(this, 'element'),
          reactClass = get(this, 'reactClass');
      var container = get(this, 'container');
      var props = this._props;
      props.model = props.model || this.controller.model;
      var view = this;
      while (!view.controller || !view.controller.session) {
        view = view._parentView;
      }
      var session = view.controller.session;
      var descriptor = React.withContext({
        container: container,
        session: session,
        controller: this.controller
      }, function() {
        return reactClass(this._props);
      }.bind(this));
      this._reactComponent = React.renderComponent(descriptor, el);
    },
    didInsertElement: function() {
      this.renderReact();
    },
    willDestroyElement: function() {
      var el = get(this, 'element');
      React.unmountComponentAtNode(el);
    },
    unknownProperty: function(key) {
      return this._props[key];
    },
    setUnknownProperty: function(key, value) {
      var reactComponent = this._reactComponent;
      if (!this._props) {
        this._props = {};
      }
      this._props[key] = value;
      if (reactComponent) {
        var props = {};
        props[key] = value;
        reactComponent.setProps(props);
      }
      return value;
    }
  });
  var $__default = ReactComponent;
  return {
    get default() {
      return $__default;
    },
    __esModule: true
  };
});

define("ember-react/ext/route", [], function() {
  "use strict";
  var __moduleName = "ember-react/ext/route";
  Ember.Route.reopen({render: function(name, options) {
      if (typeof name === 'object' && !options) {
        options = name;
        name = this.routeName;
      }
      if (options && options.react) {
        var container = this.container,
            containerName = 'view:' + name;
        name = name || this.routeName;
        if (!container.has(containerName)) {
          var View = ReactComponent.extend({
            reactClass: options.react,
            rootPath: this.router.generate(this.routeName)
          });
          this.container.register(containerName, View);
        }
      }
      this._super.apply(this, arguments);
    }});
  return {};
});

define("ember-react/helpers/react", ['../components/react'], function($__0) {
  "use strict";
  var __moduleName = "ember-react/helpers/react";
  if (!$__0 || !$__0.__esModule)
    $__0 = {default: $__0};
  var ReactComponent = $__0.default;
  var EmberHandlebars = Ember.Handlebars;
  var helper = function(name, options) {
    var hash = options.hash;
    hash.name = name;
    return EmberHandlebars.helpers.view.call(this, ReactComponent, options);
  };
  EmberHandlebars.registerHelper('react', helper);
  return {};
});

define("ember-react/initializer", ['../helpers/react', '../components/react'], function($__0,$__2) {
  "use strict";
  var __moduleName = "ember-react/initializer";
  if (!$__0 || !$__0.__esModule)
    $__0 = {default: $__0};
  if (!$__2 || !$__2.__esModule)
    $__2 = {default: $__2};
  var ReactHelper = $__0.default;
  var ReactComponent = $__2.default;
  var $__default = {
    name: "ember-react",
    initialize: function(container, application) {
      container.register('helper:react', ReactHelper);
      container.register('component:react', ReactComponent);
    }
  };
  return {
    get default() {
      return $__default;
    },
    __esModule: true
  };
});

define("ember-react/react/ember-link", [], function() {
  "use strict";
  var __moduleName = "ember-react/react/ember-link";
  var $__default = React.createClass({
    displayName: 'EmberLink',
    contextTypes: {container: React.PropTypes.object},
    propTypes: {
      to: React.PropTypes.string.isRequired,
      context: React.PropTypes.object,
      query: React.PropTypes.object
    },
    getRouterArgs: function() {
      var args,
          context;
      args = [this.props.to];
      context = this.props.context || this.props.params;
      if (context) {
        if (Array.isArray(context)) {
          args = args.concat(context);
        } else {
          args.push(context);
        }
      }
      if (this.props.query) {
        args.push({query: this.props.query});
      }
      return args;
    },
    getHref: function() {
      var router;
      router = this.context.container.lookup('router:main');
      return router.generate.apply(router, this.getRouterArgs());
    },
    handleClick: function(e) {
      var router;
      if (!e.defaultPrevented && !(e.button === 1 || e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        router = this.context.container.lookup('router:main');
        return router.transitionTo.apply(router, this.getRouterArgs());
      }
    },
    render: function() {
      return React.DOM.a({
        href: this.getHref(),
        onClick: this.handleClick
      }, this.props.children);
    }
  });
  return {
    get default() {
      return $__default;
    },
    __esModule: true
  };
});

this.EmberReact = requireModule("ember-react")["default"];

})();