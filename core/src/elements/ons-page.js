/*
Copyright 2013-2015 ASIAL CORPORATION

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

import util from 'ons/util';
import ons from 'ons/ons';
import internal from 'ons/internal';
import ModifierUtil from 'ons/internal/modifier-util';
import BaseElement from 'ons/base-element';
import DeviceBackButtonDispatcher from 'ons/device-back-button-dispatcher';

const scheme = {
  '': 'page--*',
  '.page__content': 'page--*__content',
  '.page__background': 'page--*__background'
};

const nullToolbarElement = document.createElement('ons-toolbar');

/**
 * @element ons-page
 * @category page
 * @description
 *   [en]Should be used as root component of each page. The content inside page component is scrollable.[/en]
 *   [ja]ページ定義のためのコンポーネントです。このコンポーネントの内容はスクロールが許可されます。[/ja]
 * @guide ManagingMultiplePages
 *   [en]Managing multiple pages[/en]
 *   [ja]複数のページを管理する[/ja]
 * @guide Pagelifecycle
 *   [en]Page life cycle events[/en]
 *   [ja]ページライフサイクルイベント[/ja]
 * @guide HandlingBackButton
 *   [en]Handling back button[/en]
 *   [ja]バックボタンに対応する[/ja]
 * @guide OverridingCSSstyles
 *   [en]Overriding CSS styles[/en]
 *   [ja]CSSスタイルのオーバーライド[/ja]
 * @guide DefiningMultiplePagesinSingleHTML
 *   [en]Defining multiple pages in single html[/en]
 *   [ja]複数のページを1つのHTMLに記述する[/ja]
 * @example
 * <ons-page>
 *   <ons-toolbar>
 *     <div class="center">Title</div>
 *   </ons-toolbar>
 *
 *   ...
 * </ons-page>
 */
class PageElement extends BaseElement {

  /**
   * @event init
   * @description
   *   [en]Fired right after the page is attached.[/en]
   *   [ja]ページがアタッチされた後に発火します。[/ja]
   * @param {Object} event [en]Event object.[/en]
   * @param {Object} event.page
   *   [en]Page object.[/en]
   *   [ja]ページのオブジェクト。[/ja]
   */

  /**
   * @event show
   * @description
   *   [en]Fired right after the page is shown.[/en]
   *   [ja]ページが表示された後に発火します。[/ja]
   * @param {Object} event [en]Event object.[/en]
   * @param {Object} event.page
   *   [en]Page object.[/en]
   *   [ja]ページのオブジェクト。[/ja]
   */

  /**
   * @event hide
   * @description
   *   [en]Fired right after the page is hidden.[/en]
   *   [ja]ページが隠れた後に発火します。[/ja]
   * @param {Object} event [en]Event object.[/en]
   * @param {Object} event.page
   *   [en]Page object.[/en]
   *   [ja]ページのオブジェクト。[/ja]
   */

  /**
   * @event destroy
   * @description
   *   [en]Fired right before the page is destroyed.[/en]
   *   [ja]ページが破棄される前に発火します。[/ja]
   * @param {Object} event [en]Event object.[/en]
   * @param {Object} event.page
   *   [en]Page object.[/en]
   *   [ja]ページのオブジェクト。[/ja]
   */

  /**
   * @attribute modifier
   * @type {String}
   * @description
   *   [en]Specify modifier name to specify custom styles.[/en]
   *   [ja]スタイル定義をカスタマイズするための名前を指定します。[/ja]
   */

  createdCallback() {
    this.classList.add('page');

    if (!this.hasAttribute('_compiled')) {
      this._compile();
    }

    this._isShown = false;
    this._contentElement = this._getContentElement();
    this._isMuted = this.hasAttribute('_muted');
    this._skipInit = this.hasAttribute('_skipinit');
    this.eventDetail = {
      page: this
    };
  }

  attachedCallback() {
    if (!this._isMuted) {
      if (this._skipInit) {
        this.removeAttribute('_skipinit');
      } else {
        util.triggerElementEvent(this, 'init', this.eventDetail);
      }
    }

    if (!util.hasAnyComponentAsParent(this)) {
      setImmediate(() => this._show());
    }

    this._tryToFillStatusBar();
  }

  /**
   * @return {boolean}
   */
  get isShown() {
    return this._isShown;
  }

  /**
   * @param {boolean}
   */
  set isShown(value) {
    this._isShown = value;
  }

  /**
   * @method getDeviceBackButtonHandler
   * @signature getDeviceBackButtonHandler()
   * @return {Object/null}
   *   [en]Device back button handler.[/en]
   *   [ja]デバイスのバックボタンハンドラを返します。[/ja]
   * @description
   *   [en]Get the associated back button handler. This method may return null if no handler is assigned.[/en]
   *   [ja]バックボタンハンドラを取得します。このメソッドはnullを返す場合があります。[/ja]
   */
  getDeviceBackButtonHandler() {
    return this._deviceBackButtonHandler || null;
  }

  /**
   * @param {Function} callback
   */
  setDeviceBackButtonHandler(callback) {
    if (this._deviceBackButtonHandler) {
      this._deviceBackButtonHandler.destroy();
    }

    this._deviceBackButtonHandler = DeviceBackButtonDispatcher.createHandler(this, callback);
  }

  /**
   * @return {HTMLElement}
   */
  _getContentElement() {
    const result = util.findChild(this, '.page__content');
    if (result) {
      return result;
    }
    throw Error('fail to get ".page__content" element.');
  }

  /**
   * @return {Boolean}
   */
  _hasToolbarElement() {
    return !!util.findChild(this, 'ons-toolbar');
  }

  /**
   * @return {Boolean}
   */
  _canAnimateToolbar() {
    const toolbar = util.findChild(this, 'ons-toolbar');
    if (toolbar) {
      return true;
    }

    const elements = this._contentElement.children;
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].nodeName.toLowerCase() === 'ons-toolbar' && !elements[i].hasAttribute('inline')) {
        return true;
      }
    }

    return false;
  }

  /**
   * @return {HTMLElement}
   */
  _getBackgroundElement() {
    const result = util.findChild(this, '.page__background');
    if (result) {
      return result;
    }
    throw Error('fail to get ".page__background" element.');
  }

  /**
   * @return {HTMLElement}
   */
  _getBottomToolbarElement() {
    return util.findChild(this, 'ons-bottom-toolbar') || internal.nullElement;
  }


  /**
   * @return {HTMLElement}
   */
  _getToolbarElement() {
    return util.findChild(this, 'ons-toolbar') || nullToolbarElement;
  }

  /**
   * Register toolbar element to this page.
   *
   * @param {HTMLElement} element
   */
  _registerToolbar(element) {
    this._contentElement.setAttribute('no-status-bar-fill', '');

    if (util.findChild(this, '.page__status-bar-fill')) {
      this.insertBefore(element, this.children[1]);
    } else {
      this.insertBefore(element, this.children[0]);
    }
  }

  /**
   * Register toolbar element to this page.
   *
   * @param {HTMLElement} element
   */
  _registerBottomToolbar(element) {
    if (!util.findChild(this, '.page__status-bar-fill')) {
      const fill = document.createElement('div');
      fill.classList.add('page__bottom-bar-fill');
      fill.style.width = '0px';
      fill.style.height = '0px';

      this.insertBefore(fill, this.children[0]);
      this.insertBefore(element, null);
    }
  }

  attributeChangedCallback(name, last, current) {
    if (name === 'modifier') {
      return ModifierUtil.onModifierChanged(last, current, this, scheme);
    } else if (name === '_muted') {
      this._isMuted = this.hasAttribute('_muted');
    } else if (name === '_skipinit') {
      this._skipInit = this.hasAttribute('_skipinit');
    }
  }

  _compile() {
    ons._autoStyle.prepare(this);

    const background = document.createElement('div');
    background.classList.add('page__background');

    const content = document.createElement('div');
    content.classList.add('page__content');

    while (this.childNodes[0]) {
      content.appendChild(this.childNodes[0]);
    }

    if (this.hasAttribute('style')) {
      background.setAttribute('style', this.getAttribute('style'));
      this.removeAttribute('style', null);
    }

    const fragment = document.createDocumentFragment();
    fragment.appendChild(background);
    fragment.appendChild(content);

    this.appendChild(fragment);

    ModifierUtil.initModifier(this, scheme);

    this.setAttribute('_compiled', '');
  }

  _registerExtraElement(element) {
    let extra = util.findChild(this, '.page__extra');
    if (!extra) {
      extra = document.createElement('div');
      extra.classList.add('page__extra');
      extra.style.zIndex = '10001';
      this.insertBefore(extra, null);
    }

    extra.insertBefore(element, null);
  }

  _tryToFillStatusBar() {
    return internal.shouldFillStatusBar(this)
      .then(() => {
        let fill = this.querySelector('.page__status-bar-fill');

        if (fill instanceof HTMLElement) {
          return fill;
        }

        fill = document.createElement('div');
        fill.classList.add('page__status-bar-fill');
        fill.style.width = '0px';
        fill.style.height = '0px';

        let bottomBarFill;

        for (let i = 0; i < this.children.length; i++) {
          if (this.children[i].classList.contains('page__bottom-bar-fill')) {
            bottomBarFill = this.children[i];
            break;
          }
        }

        if (bottomBarFill) {
          this.insertBefore(fill, bottomBarFill.nextSibling);
        }
        else {
          this.insertBefore(fill, this.children[0]);
        }

        return fill;
      })
      .catch(() => {
        const el = this.querySelector('.page__status-bar-fill');
        if (el instanceof HTMLElement) {
          el.remove();
        }
      });
  }

  _show() {
    if (!this.isShown && util.isAttached(this)) {
      this.isShown = true;

      if (!this._isMuted) {
        util.triggerElementEvent(this, 'show', this.eventDetail);
      }

      util.propagateAction(this._contentElement, '_show');
    }
  }

  _hide() {
    if (this.isShown) {
      this.isShown = false;

      if (!this._isMuted) {
        util.triggerElementEvent(this, 'hide', this.eventDetail);
      }

      util.propagateAction(this._contentElement, '_hide');
    }
  }

  _destroy() {
    this._hide();

    if (!this._isMuted) {
      util.triggerElementEvent(this, 'destroy', this.eventDetail);
    }

    if (this.getDeviceBackButtonHandler()) {
      this.getDeviceBackButtonHandler().destroy();
    }

    util.propagateAction(this._contentElement, '_destroy');

    this.remove();
  }
}

window.OnsPageElement = document.registerElement('ons-page', {
  prototype: PageElement.prototype
});
