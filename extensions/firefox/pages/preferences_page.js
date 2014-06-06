/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright 2014 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* jshint esnext: true */
/* globals Services, Promise, DEFAULT_PREFERENCES */

'use strict';

//#if (FIREFOX || MOZCENTRAL)
const PREF_PREFIX = 'PDFJSSCRIPT_PREF_PREFIX';
const branch = Services.prefs.getBranch(PREF_PREFIX + '.');

//#include ../../../web/default_preferences.js
//#endif

var PreferencesPage = {
  prefs: {},
  elements: [],

  initialize: function preferencesPageInitialize(options) {
//#if GENERIC
//  if (options['overlayName'] !== undefined) {
//    this.overlayName = options['overlayName'];
//    delete options['overlayName'];
//  }
//  if (options['openButton'] !== undefined) {
//    options.openButton.addEventListener('click', this.open.bind(this));
//    delete options['openButton'];
//  }
//  if (options['closeButton'] !== undefined) {
//    options.closeButton.addEventListener('click', this.close.bind(this));
//    delete options['closeButton'];
//  }
//  OverlayManager.register(this.overlayName, this.close.bind(this));
//
//#endif
    if (options['resetButton'] !== undefined) {
      options.resetButton.addEventListener('click', this.reset.bind(this));
      delete options['resetButton'];
    }

    for (var key in options) {
      var defaultPref = DEFAULT_PREFERENCES[key];
      if (defaultPref === undefined) {
        continue;
      }
      var element = options[key], type = element.type;
      var nodeName = element.nodeName.toUpperCase();

      if (nodeName === 'INPUT' && type === 'checkbox') {
        element.addEventListener('click', this.updatePrefs.bind(this));
      } else {
        element.addEventListener('change', this.updatePrefs.bind(this));
      }

      this.elements.push({ prefName: key, prefType: typeof defaultPref,
                           element: element, type: type });
    }
  },

  updatePrefs: function PreferencesPageUpdatePrefs() {
    for (var i = 0, ii = this.elements.length; i < ii; i++) {
      var entry = this.elements[i];
      var type = entry.type, element = entry.element;
      var newPrefValue;

      if (type === 'checkbox') {
        newPrefValue = element.checked;
      } else if (type === 'select-one') {
        if (element.value === 'custom') {
          for (var j = 0, jj = element.options.length; j < jj; j++) {
            var option = element.options[j];
            if (option.value === 'custom') {
              newPrefValue = option.textContent;
            }
          }
        } else {
          newPrefValue = element.value;
        }
      } else {
        newPrefValue = element.value;
      }
      switch (entry.prefType) {
        case 'boolean':
          newPrefValue = !!newPrefValue;
          break;
        case 'number':
          newPrefValue = newPrefValue | 0;
          break;
        case 'string':
          newPrefValue = newPrefValue.toString();
          break;
      }
      this.prefs[entry.prefName] = newPrefValue;
    }
    this._writePrefs();
  },

  updateUI: function PreferencesPageUpdateUI() {
    for (var i = 0, ii = this.elements.length; i < ii; i++) {
      var entry = this.elements[i];
      var type = entry.type, element = entry.element;
      var prefValue = this.prefs[entry.prefName];

      if (type === 'checkbox') {
        element.checked = prefValue;
      } else if (type === 'select-one') {
        var predefinedValueFound = false, customOption;
        var prefValueString = prefValue.toString();

        for (var j = 0, jj = element.options.length; j < jj; j++) {
          var option = element.options[j];

          if (option.value === 'custom') {
            customOption = option;
          }
          if (option.value !== prefValueString) {
            option.selected = false;
            continue;
          }
          option.selected = true;
          predefinedValueFound = true;
        }

        if (!predefinedValueFound && customOption) {
          customOption.textContent = prefValue;
          customOption.removeAttribute('hidden');
          customOption.selected = true;
        }
      } else {
        element.value = prefValue;
      }
    }
  },

  reset: function preferencesPageReset() {
    this.prefs = Object.create(DEFAULT_PREFERENCES);
    this._writePrefs().then(function () {
      this.updateUI();
    }.bind(this));
  },

  open: function PreferencesPageOpen() {
//#if GENERIC
//  Promise.all([OverlayManager.open(this.overlayName),
//               Preferences.reload()]).then(function () {
//#endif
    this._readPrefs().then(function () {
      this.updateUI();
    }.bind(this));
//#if GENERIC
//  }.bind(this));
//  SecondaryToolbar.close();
//#endif
  },

  close: function PreferencesPageClose() {
//#if GENERIC
//  OverlayManager.close(this.overlayName);
//#endif
  },

  _writePrefs: function PreferencesPage_writePrefs() {
//#if (FIREFOX || MOZCENTRAL)
    return new Promise(function (resolve) {
      for (var key in DEFAULT_PREFERENCES) {
        var newPrefValue = this.prefs[key];

        if (!branch.getPrefType(key) || newPrefValue === undefined) {
          continue;
        }
        switch (typeof newPrefValue) {
          case 'boolean':
            branch.setBoolPref(key, newPrefValue);
            break;
          case 'number':
            branch.setIntPref(key, newPrefValue);
            break;
          case 'string':
            branch.setCharPref(key, newPrefValue);
            break;
        }
      }
      resolve();
    }.bind(this));
//#endif
//#if GENERIC
//  var writtenPromises = [];
//
//  for (var key in DEFAULT_PREFERENCES) {
//    var newPrefValue = this.prefs[key];
//
//    if (newPrefValue === undefined) {
//      continue;
//    }
//    writtenPromises.push(Preferences.set(key, newPrefValue));
//  }
//  return Promise.all(writtenPromises);
//#endif
  },

  _readPrefs: function PreferencesPage_readPrefs() {
//#if (FIREFOX || MOZCENTRAL)
    return new Promise(function (resolve) {
      for (var key in DEFAULT_PREFERENCES) {
        if (!branch.getPrefType(key)) {
          continue;
        }
        switch (typeof DEFAULT_PREFERENCES[key]) {
          case 'boolean':
            this.prefs[key] = branch.getBoolPref(key);
            break;
          case 'number':
            this.prefs[key] = branch.getIntPref(key);
            break;
          case 'string':
            this.prefs[key] = branch.getCharPref(key);
            break;
        }
      }
      resolve();
    }.bind(this));
//#endif
//#if GENERIC
//  var readPromises = [];
//
//  for (var key in DEFAULT_PREFERENCES) {
//    readPromises.push(Preferences.get(key).then(function (key, value) {
//      this.prefs[key] = value;
//    }.bind(this, key)));
//  }
//  return Promise.all(readPromises);
//#endif
  }
};

//#if (FIREFOX || MOZCENTRAL)
document.addEventListener('DOMContentLoaded', function () {
  PreferencesPage.initialize({
    resetButton: document.getElementById('preferencesReset'),
    showPreviousViewOnLoad:
      document.getElementById('preferencesShowPreviousViewOnLoad'),
    defaultZoomValue: document.getElementById('preferencesDefaultZoomValue'),
    sidebarViewOnLoad: document.getElementById('preferencesSidebarViewOnLoad'),
    enableHandToolOnLoad:
      document.getElementById('preferencesEnableHandToolOnLoad'),
    enableWebGL: document.getElementById('preferencesEnableWebGL'),
    disableRange: document.getElementById('preferencesDisableRange'),
    disableAutoFetch: document.getElementById('preferencesDisableAutoFetch'),
    disableFontFace: document.getElementById('preferencesDisableFontFace'),
    disableTextLayer: document.getElementById('preferencesDisableTextLayer'),
    useOnlyCssZoom: document.getElementById('preferencesUseOnlyCssZoom')
  });

  PreferencesPage.open();
}, true);
//#endif
