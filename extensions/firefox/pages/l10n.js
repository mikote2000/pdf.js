/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* jshint esnext: true */
/* globals Components, Services */

'use strict';

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');

function getLocale() {
  try {
    return Services.prefs.getCharPref('general.useragent.locale');
  } catch (ex) {
    return 'en-US';
  }
}

function _getLocalizedStrings(path) {
  var stringBundle = Cc['@mozilla.org/intl/stringbundle;1'].
                     getService(Ci.nsIStringBundleService).
                     createBundle('chrome://pdf.js/locale/' + path);
  var map = {};
  var enumerator = stringBundle.getSimpleEnumeration();
  while (enumerator.hasMoreElements()) {
    var string = enumerator.getNext().QueryInterface(Ci.nsIPropertyElement);
    var key = string.key, property = 'textContent';
    var i = key.lastIndexOf('.');
    if (i >= 0) {
      property = key.substring(i + 1);
      key = key.substring(0, i);
    }
    if (!(key in map)) {
      map[key] = {};
    }
    map[key][property] = string.value;
  }
  return map;
}

var localizedStrings;

function getStrings(data) {
  try {
    // Lazy initialization of localizedStrings
    if (!localizedStrings) {
      localizedStrings = _getLocalizedStrings('pages.properties');
    }
    var result = localizedStrings[data];
    return JSON.stringify(result || null);
  } catch (e) {
    console.log('Unable to retrive localized strings: ' + e);
    return 'null';
  }
}

// Small subset of the webL10n API by Fabien Cazenave for pdf.js extension.
(function(window) {
  var gLanguage = '';

  // fetch an l10n objects
  function getL10nData(key) {
    var response = getStrings(key);
    var data = JSON.parse(response);
    if (!data) {
      console.warn('[l10n] #' + key + ' missing for [' + gLanguage + ']');
    }
    return data;
  }

  // replace {{arguments}} with their values
  function substArguments(text, args) {
    if (!args) {
      return text;
    }
    return text.replace(/\{\{\s*(\w+)\s*\}\}/g, function(all, name) {
      return (name in args ? args[name] : '{{' + name + '}}');
    });
  }

  // translate a string
  function translateString(key, args, fallback) {
    var i = key.lastIndexOf('.');
    var name, property;
    if (i >= 0) {
      name = key.substring(0, i);
      property = key.substring(i + 1);
    } else {
      name = key;
      property = 'textContent';
    }
    var data = getL10nData(name);
    var value = (data && data[property]) || fallback;
    if (!value) {
      return '{{' + key + '}}';
    }
    return substArguments(value, args);
  }

  // translate an HTML element
  function translateElement(element) {
    if (!element || !element.dataset) {
      return;
    }

    // get the related l10n object
    var key = element.dataset.l10nId;
    var data = getL10nData(key);
    if (!data) {
      return;
    }

    // get arguments (if any)
    // TODO: more flexible parser?
    var args;
    if (element.dataset.l10nArgs) {
      try {
        args = JSON.parse(element.dataset.l10nArgs);
      } catch (e) {
        console.warn('[l10n] could not parse arguments for #' + key + '');
      }
    }

    // translate element
    // TODO: security check?
    for (var k in data) {
      element[k] = substArguments(data[k], args);
    }
  }

  // translate an HTML subtree
  function translateFragment(element) {
    element = element || document.querySelector('html');

    // check all translatable children (= w/ a `data-l10n-id' attribute)
    var children = element.querySelectorAll('*[data-l10n-id]');
    var elementCount = children.length;
    for (var i = 0; i < elementCount; i++) {
      translateElement(children[i]);
    }

    // translate element itself if necessary
    if (element.dataset.l10nId) {
      translateElement(element);
    }
  }

  window.addEventListener('DOMContentLoaded', function() {
    gLanguage = getLocale();

    translateFragment();

    // fire a 'localized' DOM event
    var evtObject = document.createEvent('Event');
    evtObject.initEvent('localized', false, false);
    evtObject.language = gLanguage;
    window.dispatchEvent(evtObject);
  });

  // Public API
  document.mozL10n = {
    // get a localized string
    get: translateString,

    // get the document language
    getLanguage: function() {
      return gLanguage;
    },

    // get the direction (ltr|rtl) of the current language
    getDirection: function() {
      // http://www.w3.org/International/questions/qa-scripts
      // Arabic, Hebrew, Farsi, Pashto, Urdu
      var rtlList = ['ar', 'he', 'fa', 'ps', 'ur'];
      return (rtlList.indexOf(gLanguage) >= 0 ? 'rtl' : 'ltr');
    },

    // translate an element or document fragment
    translate: translateFragment
  };
})(this);

