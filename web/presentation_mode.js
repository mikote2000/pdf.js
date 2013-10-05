/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright 2012 Mozilla Foundation
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
/* globals SecondaryToolbar, PDFView, scrollIntoView */

'use strict';

var DELAY_BEFORE_HIDING_CONTROLS = 3000; // in ms
var SELECTOR = 'presentationControls';
var MENU_PADDING = 5; // pixels

var PresentationMode = {
  active: false,
  args: null,
  menuVisible: false,
  cursorOnMenu: false,
  mouseCoords: { x: 0, y: 0 },

  initialize: function presentationModeInitialize(options) {
    this.container = options.container;
    this.menu = options.menu;

    // Define the toolbar buttons.
    this.cancelButton = options.cancelButton;
    this.firstPage = options.firstPage;
    this.lastPage = options.lastPage;
    this.pageRotateCw = options.pageRotateCw;
    this.pageRotateCcw = options.pageRotateCcw;

    // Attach the event listeners.
    this.menu.addEventListener('click',
      function presentationModeMenuClick(evt) {
        var target = evt.target;
//#if (GENERIC || CHROME)
        if (target.nodeName.toUpperCase() === 'SPAN') {
          target = target.parentNode;
        }
//#endif
        switch (target) {
          case this.cancelButton:
            this.cancel();
            break;
          case this.firstPage:
            SecondaryToolbar.firstPageClick();
            break;
          case this.lastPage:
            SecondaryToolbar.lastPageClick();
            break;
          case this.pageRotateCw:
            SecondaryToolbar.pageRotateCwClick();
            break;
          case this.pageRotateCcw:
            SecondaryToolbar.pageRotateCcwClick();
            break;
          default:
            return;
        }
        this.hideMenu();
      }.bind(this));
  },

  get isFullscreen() {
    return (document.fullscreenElement ||
            document.mozFullScreen ||
            document.webkitIsFullScreen ||
            document.msFullscreenElement);
  },

  request: function presentationModeRequest() {
    if (!PDFView.supportsFullscreen || this.isFullscreen) {
      return false;
    }

    if (this.container.requestFullscreen) {
      this.container.requestFullscreen();
    } else if (this.container.mozRequestFullScreen) {
      this.container.mozRequestFullScreen();
    } else if (this.container.webkitRequestFullScreen) {
      this.container.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (this.container.msRequestFullscreen) {
      this.container.msRequestFullscreen();
    } else {
      return false;
    }

    this.args = {
      page: PDFView.page,
      previousScale: PDFView.currentScaleValue
    };

    return true;
  },

  cancel: function presentationModeCancel() {
    if (!PDFView.supportsFullscreen || !this.isFullscreen) {
      return false;
    }

    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else {
      return false;
    }
  },

  enter: function presentationModeEnter() {
    this.active = true;

    PDFView.page = this.args.page;
    PDFView.parseScale('page-fit', true);

    window.addEventListener('mousemove', this.mouseMove, false);
    window.addEventListener('mousedown', this.mouseDown, false);
    window.addEventListener('contextmenu', this.contextMenu, false);
    window.addEventListener('keydown', this.keyDown, false);

    this.showControls();
  },

  exit: function presentationModeExit() {
    this.active = false;

    var page = PDFView.page;
    PDFView.parseScale(this.args.previousScale);
    PDFView.page = page;

    window.removeEventListener('mousemove', this.mouseMove, false);
    window.removeEventListener('mousedown', this.mouseDown, false);
    window.removeEventListener('contextmenu', this.contextMenu, false);
    window.removeEventListener('keydown', this.keyDown, false);

    this.hideControls();
    this.hideMenu();
    this.args = null;
    PDFView.clearMouseScrollState();

    // Ensure that the thumbnail of the current page is visible
    // when exiting presentation mode.
    scrollIntoView(document.getElementById('thumbnailContainer' + page));
  },

  showControls: function presentationModeShowControls() {
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    } else {
      this.container.classList.add(SELECTOR);
    }
    this.controlsTimeout = setTimeout(function hideControlsTimeout() {
      this.container.classList.remove(SELECTOR);
      delete this.controlsTimeout;
    }.bind(this), DELAY_BEFORE_HIDING_CONTROLS);
  },

  hideControls: function presentationModeHideControls() {
    if (!this.controlsTimeout) {
      return;
    }
    this.container.classList.remove(SELECTOR);
    clearTimeout(this.controlsTimeout);
    delete this.controlsTimeout;
  },

  mouseMove: function presentationModeMouseMove(evt) {
    var self = PresentationMode;
    self.cursorOnMenu = self.menuVisible ?
      self.menu.contains(evt.target) : false;
    self.mouseCoords = { x: evt.clientX, y: evt.clientY };

    self.showControls();
  },

  mouseDown: function presentationModeMouseDown(evt) {
    var self = PresentationMode;
    if (self.menuVisible) {
      if (!self.cursorOnMenu) {
        self.hideMenu();
      }
      return;
    }

    if (evt.button === 0) {
      // Enable clicking of links in presentation mode. Note:
      // Only links pointing to destinations in the current PDF document works.
      var isInternalLink = (evt.target.href &&
                            evt.target.classList.contains('internalLink'));
      if (!isInternalLink) {
        // Unless an internal link was clicked, advance one page.
        evt.preventDefault();
        PDFView.page += (evt.shiftKey ? -1 : 1);
      }
    }
  },

  contextMenu: function presentationModeContextMenu(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    PresentationMode.showMenu();
  },

  showMenu: function presentationModeShowContextMenu(mouseCoords) {
    if (this.menuVisible) {
      return;
    }
    this.menuVisible = true;

    this.menu.classList.remove('hidden');
    // Determine the menu position.
    var leftBound = MENU_PADDING, upperBound = MENU_PADDING;
    var rightBound = (this.container.clientWidth - this.menu.clientWidth -
                      2 * MENU_PADDING);
    var lowerBound = (this.container.clientHeight - this.menu.clientHeight -
                      2 * MENU_PADDING);
    var left = Math.min(Math.max(this.mouseCoords.x, leftBound), rightBound);
    var top = Math.min(Math.max(this.mouseCoords.y, upperBound), lowerBound);

    this.menu.setAttribute('style', 'left: ' + left + 'px; ' +
                                    'top: ' + top + 'px;');
  },

  hideMenu: function presentationModeHideContextMenu() {
    if (!this.menuVisible) {
      return;
    }
    this.menuVisible = false;
    this.cursorOnMenu = false;

    this.menu.classList.add('hidden');
    this.menu.removeAttribute('style');
  },

  keyDown: function presentationModeKeyDown() {
    return;
  }
};

(function presentationModeClosure() {
  function presentationModeChange(e) {
    if (PresentationMode.isFullscreen) {
      PresentationMode.enter();
    } else {
      PresentationMode.exit();
    }
  }

  window.addEventListener('fullscreenchange', presentationModeChange, false);
  window.addEventListener('mozfullscreenchange', presentationModeChange, false);
  window.addEventListener('webkitfullscreenchange', presentationModeChange,
                          false);
  window.addEventListener('MSFullscreenChange', presentationModeChange, false);
})();
