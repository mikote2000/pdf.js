/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright 2015 Mozilla Foundation
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

'use strict';

/**
 * @typedef {Object} PDFHistoryOptions
 * @property {string} fingerprint - The PDF document's unique fingerprint.
 */

/**
 * @class
 */
var PDFHistory = (function PDFHistoryClosure() {
  /**
   * @constructs PDFHistory
   * @param {PDFHistoryOptions} options
   */
  function PDFHistory(options) {
    this.fingerprint = options.fingerprint;

    var url = document.URL;
    var hashIndex = url.lastIndexOf('#'), hasHash = (hashIndex !== -1);
    this.baseHref = (hasHash ? url.substring(0, hashIndex) : url);
    this.isFileUrl = (url.indexOf('file://') === 0);

    this.isViewerInPresentationMode = false;
    this.shouldUpdateLastLocation = hasHash;
    this.currentId = this.id = 0;

    this.currentLocation = null;
    this.lastLocation = null;

    this._addWindowListeners();
  }

  PDFHistory.prototype = /** @lends PDFHistory.prototype */ {
    /**
     * @param {string} url
     */
    push: function PDFHistory_push(url) {
      var hash = url.substring(url.lastIndexOf('#'));
      if (!hash || hash === this.currentHash) {
        return;
      }
      this._tryPushCurrentLocation();
      this._pushOrReplaceState(hash, false);
      this.shouldUpdateLastLocation = true;
    },

    destroy: function PDFHistory_destroy() {
      this._removeWindowListeners();
    },

    back: function PDFHistory_back() {
      var stateObj = window.history.state;
      // Comment here...
      if (stateObj && stateObj.id > 0) {
        window.history.back();
      }
    },

    forward: function PDFHistory_forward() {
      var stateObj = window.history.state;
      // Comment here...
      if (stateObj && stateObj.id < this.id - 1) {
        window.history.forward();
      }
    },

    get currentHash() {
      return document.location.hash;
    },

    /**
     * @param {string} hash
     * @param {boolean} forceReplace
     * @private
     */
    _pushOrReplaceState: function PDFHistory_pushOrReplaceState(hash,
                                                                forceReplace) {
      var url = this.baseHref + hash;
      var stateObj = { fingerprint: this.fingerprint, id: this.id };

      if (forceReplace || !this.currentHash) {
        window.history.replaceState(stateObj, '', url);
      } else {
        window.history.pushState(stateObj, '', url);
      }
      this.currentId = this.id++;
//#if CHROME
//    if (top === window) {
//      chrome.runtime.sendMessage('showPageAction');
//    }
//#endif
    },

    /**
     * @private
     */
    _tryPushCurrentLocation: function PDFHistory_tryPushCurrentLocation() {
      if (!this.currentLocation) {
        return;
      }
      if (this.lastLocation && (this.currentLocation.pdfOpenParams ===
                                this.lastLocation.pdfOpenParams)) {
        // Comment here...
        return;
      }
      if (this.currentLocation.pdfOpenParams === this.currentHash) {
        // Comment here...
        return;
      }
      this.lastLocation = this.currentLocation;
      var hash = (this.isViewerInPresentationMode ?
                  '#page=' + this.currentLocation.pageNumber :
                  this.currentLocation.pdfOpenParams);
      this._pushOrReplaceState(hash, false);
    },

    /**
     * @private
     */
    _tryUpdateLastLocation: function PDFHistory_tryUpdateLastLocation() {
      if (!this.shouldUpdateLastLocation) {
        return;
      }
      if (this.lastLocation &&
          (this.currentLocation.pageNumber === this.lastLocation.pageNumber &&
           this.currentLocation.scale !== this.lastLocation.scale)) {
        // Comment here...
        return;
      }
      this.lastLocation = this.currentLocation;
      this.shouldUpdateLastLocation = false;
    },

    /**
     * @private
     */
    _updateViewArea: function PDFHistory_updateViewArea(evt) {
      this.currentLocation = evt.location;
      this._tryUpdateLastLocation();
    },

    /**
     * @private
     */
    _presentationModeChanged: function PDFHistory_presentationModeChanged(evt) {
      this.isViewerInPresentationMode = !!evt.detail.active;
    },

    /**
     * @private
     */
    _popState: function PDFHistory_popState(evt) {
      var stateObj = evt.state, id;
      if (!stateObj) {
        // Comment here...
        this.shouldUpdateLastLocation = true;
        return;
      }
//#if GENERIC
      if (stateObj.fingerprint !== this.fingerprint) {
        // Comment here...
        return;
      }
//#endif
      if ((id = stateObj.id) === this.currentId - 1) {
        // Comment here...
        if (this.currentLocation && this.lastLocation &&
            this.currentLocation.pageNumber !== this.lastLocation.pageNumber) {
          // Comment here...
          window.history.forward();
          this._tryPushCurrentLocation();
          window.history.back();
        }
      }
      this.currentId = id;
      if (id > this.id) {
        // Comment here...
        this.id = id;
      }
      this.shouldUpdateLastLocation = true;
    },

    /**
     * @private
     */
    _pageHide: function PDFHistory_pageHide(evt) {
    },

    /**
     * @private
     */
    _addWindowListeners: function PDFHistory_addWindowListeners() {
      this.updateViewAreaBound = this._updateViewArea.bind(this);
      this.presentationModeChangedBound =
        this._presentationModeChanged.bind(this);
      this.popStateBound = this._popState.bind(this);
      this.pageHideBound = this._pageHide.bind(this);

      window.addEventListener('updateviewarea', this.updateViewAreaBound);
      window.addEventListener('presentationmodechanged',
                              this.presentationModeChangedBound);
      window.addEventListener('popstate', this.popStateBound);
      window.addEventListener('pagehide', this.pageHideBound);
    },

    /**
     * @private
     */
    _removeWindowListeners: function PDFHistory_removeWindowListeners() {
      window.removeEventListener('updateviewarea', this.updateViewAreaBound);
      window.removeEventListener('presentationmodechanged',
                                 this.presentationModeChangedBound);
      window.removeEventListener('popstate', this.popStateBound);
      window.removeEventListener('pagehide', this.pageHideBound);

      delete this.updateViewAreaBound;
      delete this.presentationModeChangedBound;
      delete this.popStateBound;
      delete this.pageHideBound;
    }
  };

  return PDFHistory;
})();
