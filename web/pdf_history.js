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
 * @property {IPDFLinkService} linkService - The navigation/linking service.
 */

/**
 * @class
 * @implements {IPDFHistory}
 */
var PDFHistory = (function PDFHistoryClosure() {
  /**
   * @contructs PDFHistory
   * @param {PDFHistoryOptions} options
   */
  function PDFHistory(options) {
    this.linkService = options.linkService;

    this.initialized = false;
  }

  PDFHistory.prototype = /** @lends PDFHistory.prototype */ {
    /**
     * @param {string} fingerprint - The PDF document's unique fingerprint.
     * @param {boolean} resetHistory - (optional) Reset the browsing history.
     * @returns {string} The current history state hash value.
     */
    initialize: function PDFHistory_initialize(fingerprint, resetHistory) {
      this.fingerprint = fingerprint;

      this.initialized = true;

      return '';
    },

    /**
     * @param {string} url
     */
    push: function PDFHistory_push(url) {
      if (!this.initialized) {
        return;
      }
    },

    /**
     *
     */
    back: function PDFHistory_back() {
      if (!this.initialized) {
        return;
      }
    },

    /**
     *
     */
    forward: function PDFHistory_forward() {
      if (!this.initialized) {
        return;
      }
    },

    /**
     * @param {string} hash
     * @param {boolean} forceReplace
     * @private
     */
    _pushOrReplaceState: function PDFHistory_pushOrReplaceState(hash,
                                                                forceReplace) {
    }
  };

  return PDFHistory;
})();
