'use strict';

const translator = require('./modules/translator');

window.overrides = window.overrides || {};

function translate(elements, type, str) {
	return elements.each(function () {
		const el = $(this);
		translator.translate(str, function (translated) {
			el[type](translated);
		});
	});
}

if (typeof window !== 'undefined') {
	(function ($) {
		$.fn.getCursorPosition = function () {
			const el = $(this).get(0);
			let pos = 0;
			if ('selectionStart' in el) {
				pos = el.selectionStart;
			} else if ('selection' in document) {
				el.focus();
				const Sel = document.selection.createRange();
				const SelLength = document.selection.createRange().text.length;
				Sel.moveStart('character', -el.value.length);
				pos = Sel.text.length - SelLength;
			}
			return pos;
		};

		$.fn.selectRange = function (start, end) {
			if (!end) {
				end = start;
			}
			return this.each(function () {
				if (this.setSelectionRange) {
					this.focus();
					this.setSelectionRange(start, end);
				} else if (this.createTextRange) {
					const range = this.createTextRange();
					range.collapse(true);
					range.moveEnd('character', end);
					range.moveStart('character', start);
					range.select();
				}
			});
		};

		// http://stackoverflow.com/questions/511088/use-javascript-to-place-cursor-at-end-of-text-in-text-input-element
		$.fn.putCursorAtEnd = function () {
			return this.each(function () {
				$(this).focus();

				if (this.setSelectionRange) {
					const len = $(this).val().length * 2;
					this.setSelectionRange(len, len);
				} else {
					$(this).val($(this).val());
				}
				this.scrollTop = 999999;
			});
		};

		$.fn.translateHtml = function (str) {
			return translate(this, 'html', str);
		};

		$.fn.translateText = function (str) {
			return translate(this, 'text', str);
		};

		$.fn.translateVal = function (str) {
			return translate(this, 'val', str);
		};

		$.fn.translateAttr = function (attr, str) {
			return this.each(function () {
				const el = $(this);
				translator.translate(str, function (translated) {
					el.attr(attr, translated);
				});
			});
		};
	}(jQuery || { fn: {} }));

	let timeagoFn;
	overrides.overrideTimeagoCutoff = function () {
		const cutoff = parseInt(ajaxify.data.timeagoCutoff || config.timeagoCutoff, 10);
		if (cutoff === 0) {
			$.timeago.settings.cutoff = 1;
		} else if (cutoff > 0) {
			$.timeago.settings.cutoff = 1000 * 60 * 60 * 24 * cutoff;
		}
	};

	overrides.overrideTimeago = function () {
		if (!timeagoFn) {
			timeagoFn = $.fn.timeago;
		}

		overrides.overrideTimeagoCutoff();

		$.timeago.settings.allowFuture = true;
		const userLang = config.userLang.replace('_', '-');
		const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
		let formatFn = function (date) {
			return date.toLocaleString(userLang, options);
		};
		try {
			if (typeof Intl !== 'undefined') {
				const dtFormat = new Intl.DateTimeFormat(userLang, options);
				formatFn = dtFormat.format;
			}
		} catch (err) {
			console.error(err);
		}

		let iso;
		let date;
		$.fn.timeago = function () {
			const els = $(this);
			// Convert "old" format to new format (#5108)
			els.each(function () {
				iso = this.getAttribute('title');
				if (!iso) {
					return;
				}
				this.setAttribute('datetime', iso);
				date = new Date(iso);
				if (!isNaN(date)) {
					this.textContent = formatFn(date);
				}
			});

			timeagoFn.apply(this, arguments);
		};
	};

	require(['composer/formatting', 'composer/controls'], function (formatting, controls) {
		function applyListOverride() {
			if (!formatting || !controls) {
				return;
			}
			const listHandler = function (textarea, selectionStart, selectionEnd) {
				if (selectionStart === selectionEnd) {
					controls.insertIntoTextarea(textarea, '* ');
					controls.updateTextareaSelection(textarea, selectionStart + 2, selectionStart + 2);
				} else {
					const selectedText = $(textarea).val().substring(selectionStart, selectionEnd);
					const newText = '* ' + selectedText.split('\n').join('\n* ');
					controls.replaceSelectionInTextareaWith(textarea, newText);
					controls.updateTextareaSelection(
						textarea, selectionStart + 2, selectionEnd + (newText.length - selectedText.length)
					);
				}
			};

			const origAddButtonDispatch = formatting.addButtonDispatch;
			formatting.addButtonDispatch = function (name, onClick) {
				if (name === 'list') {
					onClick = listHandler;
				}
				return origAddButtonDispatch.call(this, name, onClick);
			};

			const table = formatting.getDispatchTable ? formatting.getDispatchTable() : null;
			if (table) {
				table.list = listHandler;
			}
		}

		applyListOverride();
		$(window).on('action:composer.enhanced', applyListOverride);
	});

	(function initTFDForumNavbar() {
		if (window.location.pathname.startsWith('/admin')) {
			return;
		}
		if (!document.querySelector('link[href*="tfd-nav.css"]')) {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = 'https://theflyingdutchmen.games/stylesheets/tfd-nav.css';
			document.head.appendChild(link);
		}
		if (!document.getElementById('tfd-forum-nav-layout')) {
			const style = document.createElement('style');
			style.id = 'tfd-forum-nav-layout';
			style.textContent = [
				'.brand-container,',
				'[component="user/logout"],',
				'#user-control-list li.dropdown-divider:has(+ [component="user/logout"]),',
				'#logged-out-menu li:has(a[href*="/login"]),',
				'#logged-out-menu li:has(a[href*="/register"]) {',
				'  display: none !important;',
				'}',
				'@media (min-width: 992px) {',
				'  body:has(#tfd-navbar:not(.tfd-nav-hidden)) .sidebar-left.sticky-top,',
				'  body:has(#tfd-navbar:not(.tfd-nav-hidden)) .sidebar-right.sticky-top {',
				'    top: 48px !important;',
				'    height: calc(100vh - 48px) !important;',
				'  }',
				'}',
				'@media (max-width: 991.98px) {',
				'  body:has(#tfd-navbar:not(.tfd-nav-hidden)) [component="bottombar"].sticky-top {',
				'    top: 48px !important;',
				'  }',
				'}',
			].join('\n');
			document.head.appendChild(style);
		}
		function mountNavbar() {
			if (!document.getElementById('tfd-navbar')) {
				const nav = document.createElement('header');
				nav.id = 'tfd-navbar';
				nav.className = 'tfd-navbar';
				nav.setAttribute('data-active', 'forum');
				document.body.prepend(nav);
			}
			if (window.initTFDNavbar && !window.tfdNavbarInstance) {
				window.tfdNavbarInstance = window.initTFDNavbar({ active: 'forum' });
			} else if (!document.querySelector('script[src*="tfd-navbar.js"]')) {
				const script = document.createElement('script');
				script.src = 'https://theflyingdutchmen.games/javascripts/tfd-navbar.js';
				document.head.appendChild(script);
			}
		}
		if (document.body) {
			mountNavbar();
		} else {
			document.addEventListener('DOMContentLoaded', mountNavbar);
		}
	})();
}
