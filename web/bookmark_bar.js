/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright 2013 Mozilla Foundation
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
/* globals  */

'use strict';

var BookmarkBar = {
  currentUrl: null,
  opened: false,

  initialize: function bookmarkBarInitialize(options) {
    this.bar = options.bar;
    this.toggleButton = options.toggleButton;

    this.copyField = options.copyField;
    this.openButton = options.openButton;
    this.secondaryOpenButton = options.secondaryOpenButton;

    this.toggleButton.addEventListener('click', this.toggle.bind(this));
    this.updateUrl();
  },

  updateUrl: function bookmarkBarUpdateUrl(url) {
    this.toggleButton.disabled = !url;
    this.currentUrl = url || '#';

    this.openButton.href = this.currentUrl;
    this.secondaryOpenButton.href = this.currentUrl;

    this.copyField.value = this.currentUrl;
    this.copyField.title = this.currentUrl;
  },

  open: function bookmarkBarToolbarOpen() {
    if (this.opened) {
      return;
    }
    this.opened = true;

    this.toggleButton.classList.add('toggled');
    this.bar.classList.remove('hidden');
    this.copyField.select();
  },

  close: function bookmarkBarClose() {
    if (!this.opened) {
      return;
    }
    this.opened = false;

    this.bar.classList.add('hidden');
    this.toggleButton.classList.remove('toggled');
  },

  toggle: function bookmarkBarToggle(evt) {
    if (this.opened) {
      this.close();
    } else {
      this.open();
    }
    evt.stopPropagation();
  },

  hide: function bookmarkBarHide() {
    if (this.toggleButton && !this.toggleButton.clientWidth) {
      this.close();
    }
  }
};
