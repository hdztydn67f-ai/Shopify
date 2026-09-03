/* =============================================================
   MAALSTAR BOXING — theme.js
   Step 1 scope: Ajax cart drawer, cart tools (note / shipping /
   discount), age verification, cookie consent, sticky header,
   localization dropdowns, mobile nav, search, wishlist counter.
   (Tabbed collections + Quick Add hook into MSB.cart in Step 3.)
   ============================================================= */
(function () {
  'use strict';

  var MSB = (window.MSB = window.MSB || {});
  var routes = MSB.routes || {};
  var strings = MSB.strings || {};
  var config = MSB.settings || {};

  /* ---------------------------------------------------------
     1. UTILITIES
     --------------------------------------------------------- */
  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }
  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }
  function on(el, type, handler, options) {
    if (el) el.addEventListener(type, handler, options);
  }
  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, wait);
    };
  }

  // Mirrors Shopify's money_format filter so Ajax updates match Liquid output.
  function formatMoney(cents, format) {
    if (typeof cents === 'string') cents = cents.replace('.', '');
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = format || config.moneyFormat || '${{amount}}';

    function defaultTo(number, size) {
      var s = '' + number;
      while (s.length < size) s = '0' + s;
      return s;
    }

    function thousands(number, precision, thousandSep, decimalSep) {
      thousandSep = thousandSep === undefined ? ',' : thousandSep;
      decimalSep = decimalSep === undefined ? '.' : decimalSep;
      if (isNaN(number) || number === null) return 0;

      number = (number / 100.0).toFixed(precision);
      var parts = number.split('.');
      var dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousandSep);
      var centsPart = parts[1] ? decimalSep + defaultTo(parts[1], precision) : '';
      return dollars + centsPart;
    }

    switch ((formatString.match(placeholderRegex) || [])[1]) {
      case 'amount':
        value = thousands(cents, 2);
        break;
      case 'amount_no_decimals':
        value = thousands(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = thousands(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = thousands(cents, 0, '.', ',');
        break;
      case 'amount_with_apostrophe_separator':
        value = thousands(cents, 2, "'", '.');
        break;
      default:
        value = thousands(cents, 2);
    }
    return formatString.replace(placeholderRegex, value);
  }
  MSB.formatMoney = formatMoney;

  function storage(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
      return value;
    } catch (e) {
      return null;
    }
  }

  /* ---------------------------------------------------------
     2. TOASTS
     --------------------------------------------------------- */
  var Toast = {
    stack: null,
    show: function (message, type) {
      if (!this.stack) this.stack = $('#ToastStack');
      if (!this.stack || !message) return;

      var el = document.createElement('div');
      el.className = 'toast' + (type ? ' toast--' + type : '');
      el.innerHTML =
        '<svg class="icon" width="18" height="18" aria-hidden="true"><use href="#icon-' +
        (type === 'error' ? 'alert' : 'check') +
        '"></use></svg><span></span>';
      el.querySelector('span').textContent = message;
      this.stack.appendChild(el);

      setTimeout(function () {
        el.classList.add('is-leaving');
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 300);
      }, 3200);
    }
  };
  MSB.toast = Toast;

  /* ---------------------------------------------------------
     3. FOCUS TRAP + BODY SCROLL LOCK
     --------------------------------------------------------- */
  var FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

  var trap = { el: null, handler: null, lastFocused: null };

  function trapFocus(container) {
    releaseFocus();
    trap.el = container;
    trap.lastFocused = document.activeElement;

    var focusables = $$(FOCUSABLE, container).filter(function (el) {
      return el.offsetParent !== null;
    });
    var first = focusables[0];
    var last = focusables[focusables.length - 1];

    trap.handler = function (event) {
      if (event.key !== 'Tab' || !focusables.length) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', trap.handler);
    (first || container).focus();
  }

  function releaseFocus(restore) {
    if (trap.handler) document.removeEventListener('keydown', trap.handler);
    if (restore && trap.lastFocused && trap.lastFocused.focus) trap.lastFocused.focus();
    trap.el = null;
    trap.handler = null;
    trap.lastFocused = null;
  }

  var scrollLock = {
    count: 0,
    lock: function () {
      this.count += 1;
      document.body.classList.add('drawer-open');
    },
    unlock: function () {
      this.count = Math.max(0, this.count - 1);
      if (this.count === 0) document.body.classList.remove('drawer-open');
    }
  };

  /* ---------------------------------------------------------
     4. CART DRAWER
     --------------------------------------------------------- */
  var CartDrawer = {
    el: null,
    overlay: null,
    isOpen: false,

    init: function () {
      this.el = $('[data-cart-drawer]');
      this.overlay = $('[data-overlay]');
      if (!this.el) return;

      var self = this;

      $$('[data-cart-toggle]').forEach(function (btn) {
        on(btn, 'click', function (event) {
          event.preventDefault();
          self.open();
        });
      });

      on(this.overlay, 'click', function () {
        self.close();
        MobileNav.close();
      });

      $$('[data-drawer-close]', this.el).forEach(function (btn) {
        on(btn, 'click', function () {
          self.close();
        });
      });

      on(document, 'keydown', function (event) {
        if (event.key === 'Escape' && self.isOpen) self.close();
      });

      this.bindItemEvents();
      CartTools.init();
    },

    open: function () {
      if (!this.el) return;
      this.isOpen = true;
      this.el.classList.add('is-open');
      this.el.setAttribute('aria-hidden', 'false');
      if (this.overlay) this.overlay.classList.add('is-visible');
      scrollLock.lock();
      trapFocus(this.el);
    },

    close: function () {
      if (!this.el || !this.isOpen) return;
      this.isOpen = false;
      this.el.classList.remove('is-open');
      this.el.setAttribute('aria-hidden', 'true');
      if (this.overlay && !MobileNav.isOpen) this.overlay.classList.remove('is-visible');
      scrollLock.unlock();
      releaseFocus(true);
    },

    loading: function (state) {
      var loader = $('[data-cart-loader]', this.el);
      if (loader) loader.hidden = !state;
    },

    // Delegated so re-rendered line items keep working.
    bindItemEvents: function () {
      var self = this;
      on(this.el, 'click', function (event) {
        var minus = event.target.closest('[data-quantity-minus]');
        var plus = event.target.closest('[data-quantity-plus]');
        var remove = event.target.closest('[data-cart-remove]');

        if (minus || plus) {
          var input = $('[data-quantity-input]', (minus || plus).closest('[data-quantity]'));
          var next = parseInt(input.value, 10) + (plus ? 1 : -1);
          if (next < 0) next = 0;
          input.value = next;
          Cart.change(parseInt(input.dataset.line, 10), next);
        }

        if (remove) {
          event.preventDefault();
          Cart.change(parseInt(remove.dataset.line, 10), 0);
        }
      });

      on(
        this.el,
        'change',
        debounce(function (event) {
          var input = event.target.closest('[data-quantity-input]');
          if (!input) return;
          Cart.change(parseInt(input.dataset.line, 10), parseInt(input.value, 10) || 0);
        }, 250)
      );
    }
  };
  MSB.drawer = CartDrawer;

  /* ---------------------------------------------------------
     5. CART API + RENDERING
     --------------------------------------------------------- */
  var Cart = {
    state: null,

    request: function (url, body) {
      var options = {
        method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin'
      };
      if (body) options.body = JSON.stringify(body);

      return fetch(url, options).then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) throw data;
          return data;
        });
      });
    },

    get: function () {
      return this.request(routes.cart + '.js');
    },

    /**
     * Public add-to-cart used by Quick Add buttons (Step 2/3).
     * @param {Object} payload - { id, quantity, properties, selling_plan }
     */
    add: function (payload) {
      var self = this;
      CartDrawer.loading(true);
      return this.request(routes.cartAdd + '.js', {
        items: [payload]
      })
        .then(function () {
          return self.refresh();
        })
        .then(function (cart) {
          Toast.show(strings.added || 'Added to cart', 'success');
          CartDrawer.open();
          document.dispatchEvent(new CustomEvent('cart:added', { detail: { cart: cart } }));
          return cart;
        })
        .catch(function (error) {
          Toast.show((error && error.description) || strings.error || 'Something went wrong', 'error');
          throw error;
        })
        .finally(function () {
          CartDrawer.loading(false);
        });
    },

    change: function (line, quantity) {
      var self = this;
      var row = $('[data-cart-item][data-line="' + line + '"]');
      if (row) row.classList.add('is-updating');
      CartDrawer.loading(true);

      return this.request(routes.cartChange + '.js', { line: line, quantity: quantity })
        .then(function (cart) {
          self.state = cart;
          self.render(cart);
          return cart;
        })
        .catch(function (error) {
          Toast.show((error && error.description) || strings.error, 'error');
        })
        .finally(function () {
          CartDrawer.loading(false);
        });
    },

    updateNote: function (note) {
      return this.request(routes.cartUpdate + '.js', { note: note });
    },

    refresh: function () {
      var self = this;
      return this.get().then(function (cart) {
        self.state = cart;
        self.render(cart);
        return cart;
      });
    },

    /* --- Rendering --- */
    render: function (cart) {
      this.renderCount(cart.item_count);
      this.renderItems(cart);
      this.renderTotals(cart);
      this.renderFreeShipping(cart);

      var live = $('[data-cart-live-region]');
      if (live) live.textContent = (strings.cartTitle || 'Cart') + ': ' + cart.item_count;
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: cart } }));
    },

    renderCount: function (count) {
      $$('[data-cart-count-badge]').forEach(function (badge) {
        badge.textContent = count;
        badge.hidden = count === 0;
        badge.classList.add('is-bumped');
        setTimeout(function () {
          badge.classList.remove('is-bumped');
        }, 450);
      });
      $$('[data-cart-count]').forEach(function (el) {
        el.textContent = count;
      });
    },

    renderTotals: function (cart) {
      $$('[data-cart-subtotal]').forEach(function (el) {
        el.textContent = formatMoney(cart.total_price);
      });

      var footer = $('[data-cart-footer]');
      var tools = $('[data-cart-tools]');
      var checkout = $('.button--checkout');
      var empty = cart.item_count === 0;

      if (footer) footer.hidden = empty;
      if (tools) tools.hidden = empty;
      if (checkout) checkout.disabled = empty;
    },

    renderFreeShipping: function (cart) {
      var bar = $('[data-free-shipping-bar]');
      if (!bar) return;
      var threshold = (config.freeShippingThreshold || 0) * 100;
      if (!threshold) return;

      var remaining = threshold - cart.total_price;
      var progress = Math.min(100, (cart.total_price / threshold) * 100);
      var text = bar.querySelector('.free-shipping-bar__text');
      var fill = bar.querySelector('.free-shipping-bar__fill');

      if (fill) fill.style.width = progress + '%';
      if (text) {
        text.textContent =
          remaining > 0
            ? (strings.freeShippingRemaining || 'You are {amount} away from free shipping').replace(
                '{amount}',
                formatMoney(remaining)
              )
            : strings.freeShippingUnlocked || 'Free shipping unlocked';
      }
    },

    renderItems: function (cart) {
      var container = $('[data-cart-items]');
      if (!container) return;

      if (!cart.items.length) {
        container.innerHTML =
          '<div class="cart-drawer__empty" data-cart-empty>' +
          '<span class="cart-drawer__empty-icon"><svg width="48" height="48" aria-hidden="true"><use href="#icon-cart"></use></svg></span>' +
          '<p class="cart-drawer__empty-text">' +
          (strings.cartEmpty || 'Your cart is empty') +
          '</p>' +
          '<a class="button button--primary" href="' +
          (routes.root || '/') +
          'collections/all">' +
          (strings.continueShopping || 'Continue shopping') +
          '</a></div>';
        return;
      }

      container.innerHTML = cart.items
        .map(function (item, index) {
          return Cart.itemTemplate(item, index + 1);
        })
        .join('');
    },

    itemTemplate: function (item, line) {
      var image = item.image
        ? '<img class="cart-item__image" src="' +
          item.image.replace(/(\.[^.]*)$/, '_200x$1') +
          '" alt="" width="84" height="84" loading="lazy">'
        : '';

      var variant =
        item.options_with_values && item.options_with_values.length && item.product_has_only_default_variant !== true
          ? '<p class="cart-item__variant">' +
            item.options_with_values
              .map(function (o) {
                return escapeHtml(o.name) + ': ' + escapeHtml(o.value);
              })
              .join(' / ') +
            '</p>'
          : '';

      var price =
        item.original_price > item.final_price
          ? '<s>' + formatMoney(item.original_price) + '</s> <span>' + formatMoney(item.final_price) + '</span>'
          : '<span>' + formatMoney(item.final_price) + '</span>';

      var discounts = (item.line_level_discount_allocations || [])
        .map(function (d) {
          return (
            '<p class="cart-item__discount"><svg width="13" height="13" aria-hidden="true"><use href="#icon-tag"></use></svg> ' +
            escapeHtml(d.discount_application.title) +
            ' (&minus;' +
            formatMoney(d.amount) +
            ')</p>'
          );
        })
        .join('');

      return (
        '<div class="cart-item" data-cart-item data-line="' + line + '" data-key="' + item.key + '">' +
        '<a class="cart-item__media media media--square" href="' + item.url + '" tabindex="-1" aria-hidden="true">' + image + '</a>' +
        '<div class="cart-item__details">' +
        '<a class="cart-item__title" href="' + item.url + '">' + escapeHtml(item.product_title) + '</a>' +
        variant +
        '<p class="cart-item__price">' + price + '</p>' +
        discounts +
        '<div class="cart-item__row">' +
        '<div class="quantity" data-quantity>' +
        '<button type="button" class="quantity__button" data-quantity-minus aria-label="Decrease quantity"><svg width="14" height="14" aria-hidden="true"><use href="#icon-minus"></use></svg></button>' +
        '<input class="quantity__input" type="number" name="updates[]" value="' + item.quantity + '" min="0" data-quantity-input data-line="' + line + '" aria-label="Quantity">' +
        '<button type="button" class="quantity__button" data-quantity-plus aria-label="Increase quantity"><svg width="14" height="14" aria-hidden="true"><use href="#icon-plus"></use></svg></button>' +
        '</div>' +
        '<div class="cart-item__line-price"><strong>' + formatMoney(item.final_line_price) + '</strong></div>' +
        '</div>' +
        '<button type="button" class="cart-item__remove" data-cart-remove data-line="' + line + '">' +
        (strings.remove || 'Remove') +
        '</button>' +
        '</div></div>'
      );
    }
  };
  MSB.cart = Cart;

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  /* ---------------------------------------------------------
     6. CART TOOLS — note, shipping estimator, discount
     --------------------------------------------------------- */
  var CartTools = {
    init: function () {
      this.initNote();
      this.initShipping();
      this.initDiscount();
    },

    initNote: function () {
      var note = $('[data-cart-note]');
      var status = $('[data-note-status]');
      if (!note) return;

      on(
        note,
        'input',
        debounce(function () {
          Cart.updateNote(note.value)
            .then(function () {
              if (status) {
                status.textContent = strings.noteSaved || 'Note saved';
                status.className = 'cart-tool__status is-success';
              }
            })
            .catch(function () {
              if (status) {
                status.textContent = strings.error || 'Could not save note';
                status.className = 'cart-tool__status is-error';
              }
            });
        }, 600)
      );
    },

    initShipping: function () {
      var wrapper = $('[data-shipping-calculator]');
      if (!wrapper) return;

      var countrySelect = $('[data-shipping-country]', wrapper);
      var provinceWrapper = $('[data-shipping-province-wrapper]', wrapper);
      var provinceSelect = $('[data-shipping-province]', wrapper);
      var zip = $('[data-shipping-zip]', wrapper);
      var submit = $('[data-shipping-submit]', wrapper);
      var results = $('[data-shipping-results]', wrapper);

      function syncProvinces() {
        var option = countrySelect.options[countrySelect.selectedIndex];
        var provinces = [];
        try {
          provinces = JSON.parse(option.getAttribute('data-provinces') || '[]');
        } catch (e) {
          provinces = [];
        }
        provinceSelect.innerHTML = provinces
          .map(function (p) {
            return '<option value="' + p[0] + '">' + p[1] + '</option>';
          })
          .join('');
        provinceWrapper.hidden = provinces.length === 0;
      }

      on(countrySelect, 'change', syncProvinces);
      syncProvinces();

      on(submit, 'click', function () {
        results.innerHTML = '<p class="cart-tool__status">' + (strings.calculating || 'Calculating…') + '</p>';

        var params =
          'shipping_address[country]=' + encodeURIComponent(countrySelect.value) +
          '&shipping_address[province]=' + encodeURIComponent(provinceWrapper.hidden ? '' : provinceSelect.value) +
          '&shipping_address[zip]=' + encodeURIComponent(zip.value);

        fetch(routes.cart + '/shipping_rates.json?' + params, { credentials: 'same-origin' })
          .then(function (response) {
            return response.json().then(function (data) {
              return { ok: response.ok, data: data };
            });
          })
          .then(function (result) {
            if (!result.ok) {
              var messages = [];
              var errors = result.data || {};
              Object.keys(errors).forEach(function (key) {
                messages.push([].concat(errors[key]).join(', '));
              });
              results.innerHTML =
                '<p class="cart-tool__status is-error">' + escapeHtml(messages.join(' — ')) + '</p>';
              return;
            }

            var rates = (result.data && result.data.shipping_rates) || [];
            if (!rates.length) {
              results.innerHTML =
                '<p class="cart-tool__status is-error">' +
                (strings.noShippingRates || 'No shipping rates for this address.') +
                '</p>';
              return;
            }

            results.innerHTML =
              '<p class="cart-tool__status is-success">' +
              rates.length +
              ' ' + (strings.ratesFound || 'rate(s) available') +
              '</p><ul>' +
              rates
                .map(function (rate) {
                  return '<li>' + escapeHtml(rate.name) + ' — ' + formatMoney(rate.price.replace('.', '')) + '</li>';
                })
                .join('') +
              '</ul>';
          })
          .catch(function () {
            results.innerHTML = '<p class="cart-tool__status is-error">' + (strings.error || 'Error') + '</p>';
          });
      });
    },

    initDiscount: function () {
      var input = $('[data-discount-input]');
      var apply = $('[data-discount-apply]');
      var status = $('[data-discount-status]');
      if (!input || !apply) return;

      function submitCode() {
        var code = (input.value || '').trim();
        if (!code) return;

        status.className = 'cart-tool__status';
        status.textContent = strings.applyingDiscount || 'Applying…';

        // Hitting /discount/CODE stores the code on the session, then we
        // reload cart state so totals + discount lines reflect it.
        fetch('/discount/' + encodeURIComponent(code), { credentials: 'same-origin' })
          .then(function () {
            return Cart.refresh();
          })
          .then(function (cart) {
            var applied = (cart.cart_level_discount_applications || []).some(function (d) {
              return d.title.toLowerCase() === code.toLowerCase();
            });
            if (applied) {
              status.className = 'cart-tool__status is-success';
              status.textContent = (strings.discountApplied || 'Discount applied') + ': ' + code.toUpperCase();
            } else {
              // Some codes (shipping/BXGY) only resolve at checkout.
              status.className = 'cart-tool__status';
              status.textContent =
                strings.discountAtCheckout || 'Code saved — it will be applied at checkout.';
            }
          })
          .catch(function () {
            status.className = 'cart-tool__status is-error';
            status.textContent = strings.discountError || 'That code could not be applied.';
          });
      }

      on(apply, 'click', submitCode);
      on(input, 'keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          submitCode();
        }
      });
    }
  };

  /* ---------------------------------------------------------
     7. AGE VERIFICATION
     --------------------------------------------------------- */
  var AgeGate = {
    init: function () {
      var gate = $('[data-age-gate]');
      if (!gate) return;

      if (storage('msb:age-verified') === 'true') {
        document.documentElement.classList.add('age-verified');
        gate.remove();
        return;
      }

      scrollLock.lock();
      trapFocus($('[data-age-gate-panel]', gate));

      on($('[data-age-gate-accept]', gate), 'click', function () {
        storage('msb:age-verified', 'true');
        storage('msb:age-verified-at', String(Date.now()));
        document.documentElement.classList.add('age-verified');
        scrollLock.unlock();
        releaseFocus();
        gate.remove();
        CookieBanner.reveal();
      });

      on($('[data-age-gate-decline]', gate), 'click', function () {
        gate.classList.add('is-declined');
        var msg = $('[data-age-gate-declined]', gate);
        if (msg) msg.hidden = false;
      });
    },

    // Expiry check runs on every load so the gate returns after N days.
    expireIfNeeded: function () {
      var days = parseInt(config.ageGateDays, 10);
      var at = parseInt(storage('msb:age-verified-at'), 10);
      if (!days || !at) return;
      if (Date.now() - at > days * 86400000) {
        storage('msb:age-verified', 'false');
        document.documentElement.classList.remove('age-verified');
      }
    }
  };

  /* ---------------------------------------------------------
     8. COOKIE CONSENT
     --------------------------------------------------------- */
  var CookieBanner = {
    el: null,

    init: function () {
      this.el = $('[data-cookie-banner]');
      if (!this.el) return;

      if (storage('msb:cookies-ack') === 'true') {
        document.documentElement.classList.add('cookies-ack');
        this.el.remove();
        return;
      }

      var self = this;
      var ageGateOpen = !!$('[data-age-gate]') && storage('msb:age-verified') !== 'true';
      if (!ageGateOpen) this.reveal();

      on($('[data-cookie-accept]', this.el), 'click', function () {
        self.acknowledge(true);
      });
      on($('[data-cookie-decline]', this.el), 'click', function () {
        self.acknowledge(false);
      });
    },

    reveal: function () {
      var el = this.el || $('[data-cookie-banner]');
      if (!el) return;
      setTimeout(function () {
        el.classList.add('is-visible');
      }, 700);
    },

    acknowledge: function (accepted) {
      storage('msb:cookies-ack', 'true');
      storage('msb:cookies-accepted', accepted ? 'true' : 'false');
      document.documentElement.classList.add('cookies-ack');

      // Wire into Shopify's Customer Privacy API when it is available.
      if (window.Shopify && window.Shopify.customerPrivacy) {
        try {
          window.Shopify.customerPrivacy.setTrackingConsent(accepted, function () {});
        } catch (e) {}
      }

      if (this.el) this.el.classList.remove('is-visible');
    }
  };

  /* ---------------------------------------------------------
     9. HEADER — sticky, search, announcements, localization
     --------------------------------------------------------- */
  var Header = {
    init: function () {
      this.initSticky();
      this.initSearch();
      this.initAnnouncements();
      this.initLocalization();
    },

    initSticky: function () {
      var wrapper = $('[data-header-wrapper]');
      if (!wrapper || wrapper.dataset.sticky !== 'true') return;

      var hideOnScroll = wrapper.dataset.hideOnScroll === 'true';
      var lastY = window.pageYOffset;
      var ticking = false;

      function update() {
        var y = window.pageYOffset;
        wrapper.classList.toggle('is-scrolled', y > 20);
        if (hideOnScroll) {
          wrapper.classList.toggle('is-hidden', y > lastY && y > 240);
        }
        lastY = y;
        ticking = false;
      }

      on(
        window,
        'scroll',
        function () {
          if (!ticking) {
            window.requestAnimationFrame(update);
            ticking = true;
          }
        },
        { passive: true }
      );
      update();
    },

    initSearch: function () {
      var toggle = $('[data-search-toggle]');
      var panel = $('[data-search-panel]');
      if (!toggle || !panel) return;

      function openSearch() {
        panel.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
        var input = $('[data-search-input]', panel);
        if (input) input.focus();
      }
      function closeSearch() {
        panel.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }

      on(toggle, 'click', function () {
        panel.classList.contains('is-open') ? closeSearch() : openSearch();
      });
      on($('[data-search-close]', panel), 'click', closeSearch);
      on(document, 'keydown', function (event) {
        if (event.key === 'Escape') closeSearch();
      });
      on(document, 'click', function (event) {
        if (!panel.contains(event.target) && !toggle.contains(event.target)) closeSearch();
      });
    },

    initAnnouncements: function () {
      var bar = $('[data-announcement-bar]');
      if (!bar) return;
      var items = $$('[data-announcement]', bar);
      if (items.length < 2) return;

      var speed = parseInt(bar.dataset.rotateSpeed, 10) || 5000;
      var index = 0;

      setInterval(function () {
        items[index].classList.remove('is-active');
        index = (index + 1) % items.length;
        items[index].classList.add('is-active');
      }, speed);
    },

    initLocalization: function () {
      $$('[data-localization]').forEach(function (wrapper) {
        var toggle = $('[data-localization-toggle]', wrapper);
        var list = $('[data-localization-list]', wrapper);
        if (!toggle || !list) return;

        function close() {
          list.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        }

        on(toggle, 'click', function (event) {
          event.stopPropagation();
          var open = list.classList.toggle('is-open');
          toggle.setAttribute('aria-expanded', open ? 'true' : 'false');

          // Close sibling dropdowns.
          $$('[data-localization]').forEach(function (other) {
            if (other === wrapper) return;
            var otherList = $('[data-localization-list]', other);
            var otherToggle = $('[data-localization-toggle]', other);
            if (otherList) otherList.classList.remove('is-open');
            if (otherToggle) otherToggle.setAttribute('aria-expanded', 'false');
          });
        });

        on(document, 'click', function (event) {
          if (!wrapper.contains(event.target)) close();
        });
        on(document, 'keydown', function (event) {
          if (event.key === 'Escape') close();
        });
      });
    }
  };

  /* ---------------------------------------------------------
     10. MOBILE NAVIGATION
     --------------------------------------------------------- */
  var MobileNav = {
    el: null,
    isOpen: false,

    init: function () {
      this.el = $('[data-mobile-nav]');
      var toggle = $('[data-mobile-nav-toggle]');
      if (!this.el || !toggle) return;

      var self = this;
      this.toggleEl = toggle;

      on(toggle, 'click', function () {
        self.isOpen ? self.close() : self.open();
      });
      on($('[data-mobile-nav-close]', this.el), 'click', function () {
        self.close();
      });
      on(document, 'keydown', function (event) {
        if (event.key === 'Escape' && self.isOpen) self.close();
      });
      $$('a', this.el).forEach(function (link) {
        on(link, 'click', function () {
          self.close();
        });
      });
    },

    open: function () {
      this.isOpen = true;
      this.el.classList.add('is-open');
      this.el.setAttribute('aria-hidden', 'false');
      this.toggleEl.setAttribute('aria-expanded', 'true');
      var overlay = $('[data-overlay]');
      if (overlay) overlay.classList.add('is-visible');
      scrollLock.lock();
      trapFocus(this.el);
    },

    close: function () {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.el.classList.remove('is-open');
      this.el.setAttribute('aria-hidden', 'true');
      this.toggleEl.setAttribute('aria-expanded', 'false');
      var overlay = $('[data-overlay]');
      if (overlay && !CartDrawer.isOpen) overlay.classList.remove('is-visible');
      scrollLock.unlock();
      releaseFocus(true);
    }
  };


  /* ---------------------------------------------------------
     11b. TABBED COLLECTIONS
     Panels are all in the DOM already — switching is pure
     show/hide, so there is no network round trip and crawlers
     still see every product.
     --------------------------------------------------------- */
  var Tabs = {
    init: function (scope) {
      $$('[data-tabs]', scope || document).forEach(function (root) {
        if (root.dataset.tabsBound === 'true') return;
        root.dataset.tabsBound = 'true';

        var tabs = $$('[data-tab]', root);
        var panels = $$('[data-tab-panel]', root);
        if (!tabs.length) return;

        function activate(index, setFocus) {
          tabs.forEach(function (tab, i) {
            var selected = i === index;
            tab.setAttribute('aria-selected', selected ? 'true' : 'false');
            tab.setAttribute('tabindex', selected ? '0' : '-1');
            tab.classList.toggle('is-active', selected);
          });

          panels.forEach(function (panel, i) {
            panel.hidden = i !== index;
            if (i === index) {
              panel.classList.add('is-entering');
              setTimeout(function () {
                panel.classList.remove('is-entering');
              }, 300);
            }
          });

          if (setFocus) tabs[index].focus();

          // Keep the active tab in view on narrow screens.
          if (tabs[index].scrollIntoView) {
            tabs[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
          }

          document.dispatchEvent(
            new CustomEvent('tabs:changed', { detail: { root: root, index: index } })
          );
        }

        tabs.forEach(function (tab, index) {
          on(tab, 'click', function () {
            activate(index, false);
          });

          on(tab, 'keydown', function (event) {
            var next = null;
            if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
            if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
            if (event.key === 'Home') next = 0;
            if (event.key === 'End') next = tabs.length - 1;
            if (next === null) return;
            event.preventDefault();
            activate(next, true);
          });
        });
      });
    }
  };
  MSB.tabs = Tabs;

  /* ---------------------------------------------------------
     11c. QUICK ADD (delegated, so it survives re-renders)
     --------------------------------------------------------- */
  var QuickAdd = {
    init: function () {
      if (this.bound) return;
      this.bound = true;

      on(document, 'click', function (event) {
        var button = event.target.closest('[data-quick-add]');
        if (!button) return;

        event.preventDefault();
        if (button.classList.contains('is-loading')) return;

        var variantId = button.dataset.variantId;
        if (!variantId) return;

        button.classList.add('is-loading');
        var spinner = $('.card__quick-add-spinner', button);
        if (spinner) spinner.hidden = false;

        Cart.add({ id: Number(variantId), quantity: 1 })
          .then(function () {
            button.classList.add('is-added');
            var label = $('.card__quick-add-text', button);
            var original = label ? label.textContent : '';
            if (label) label.textContent = strings.added || 'Added';
            setTimeout(function () {
              button.classList.remove('is-added');
              if (label) label.textContent = original;
            }, 1800);
          })
          .catch(function () {
            /* Cart.add already surfaced the error toast. */
          })
          .finally(function () {
            button.classList.remove('is-loading');
            if (spinner) spinner.hidden = true;
          });
      });
    }
  };

  /* ---------------------------------------------------------
     11d. QUICK VIEW
     Fetches /products/<handle>?view=quick-view — a bare fragment
     rendered by templates/product.quick-view.liquid.
     --------------------------------------------------------- */
  var QuickView = {
    modal: null,
    target: null,
    isOpen: false,
    cache: {},

    init: function () {
      this.modal = $('[data-quick-view-modal]');
      if (!this.modal || this.bound) return;
      this.bound = true;

      this.target = $('[data-quick-view-target]', this.modal);
      var self = this;

      on(document, 'click', function (event) {
        var trigger = event.target.closest('[data-quick-view]');
        if (!trigger) return;
        event.preventDefault();
        self.open(trigger.dataset.productUrl);
      });

      $$('[data-quick-view-close]', this.modal).forEach(function (el) {
        on(el, 'click', function () {
          self.close();
        });
      });

      on(document, 'keydown', function (event) {
        if (event.key === 'Escape' && self.isOpen) self.close();
      });
    },

    open: function (productUrl) {
      if (!productUrl) return;
      var self = this;

      this.isOpen = true;
      this.modal.classList.add('is-open');
      this.modal.setAttribute('aria-hidden', 'false');
      scrollLock.lock();
      this.target.innerHTML =
        '<div class="quick-view-modal__loading"><span class="spinner" aria-hidden="true"></span></div>';

      var url = productUrl + (productUrl.indexOf('?') === -1 ? '?' : '&') + 'view=quick-view';

      var request = this.cache[url]
        ? Promise.resolve(this.cache[url])
        : fetch(url, { credentials: 'same-origin' }).then(function (response) {
            if (!response.ok) throw new Error('Quick view request failed');
            return response.text();
          });

      request
        .then(function (html) {
          self.cache[url] = html;
          self.target.innerHTML = html;
          self.bindContent();
          trapFocus($('[data-quick-view-panel]', self.modal));
        })
        .catch(function () {
          Toast.show(strings.error || 'Could not load product', 'error');
          self.close();
          window.location.href = productUrl;
        });
    },

    close: function () {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.modal.classList.remove('is-open');
      this.modal.setAttribute('aria-hidden', 'true');
      scrollLock.unlock();
      releaseFocus(true);
    },

    bindContent: function () {
      var content = $('[data-quick-view-content]', this.target);
      if (!content) return;

      var variants = [];
      var json = $('[data-quick-view-variants]', content);
      try {
        variants = JSON.parse(json.textContent);
      } catch (e) {
        variants = [];
      }

      var form = $('[data-quick-view-form]', content);
      var idInput = $('[data-quick-view-variant-id]', content);
      var submit = $('[data-quick-view-submit]', content);
      var submitText = $('[data-quick-view-submit-text]', content);
      var priceHost = $('[data-quick-view-price]', content);
      var image = $('[data-quick-view-image]', content);
      var quantityInput = $('[data-quick-view-quantity]', content);
      var selects = $$('[data-quick-view-option]', content);

      function currentVariant() {
        if (!selects.length) return variants[0];
        var chosen = selects.map(function (select) {
          return select.value;
        });
        return variants.filter(function (variant) {
          return chosen.every(function (value, i) {
            return variant.options[i] === value;
          });
        })[0];
      }

      function syncVariant() {
        var variant = currentVariant();

        if (!variant) {
          submit.disabled = true;
          if (submitText) submitText.textContent = strings.unavailable || 'Unavailable';
          return;
        }

        idInput.value = variant.id;
        submit.disabled = !variant.available;
        if (submitText) {
          submitText.textContent = variant.available
            ? strings.addToCart || 'Add to cart'
            : strings.soldOut || 'Sold out';
        }

        if (priceHost) {
          var markup = '<div class="price' + (variant.compare_at_price > variant.price ? ' price--on-sale' : '') + '">';
          if (variant.compare_at_price > variant.price) {
            markup +=
              '<s class="price__compare">' + formatMoney(variant.compare_at_price) + '</s>' +
              '<span class="price__sale">' + formatMoney(variant.price) + '</span>';
          } else {
            markup += '<span class="price__regular">' + formatMoney(variant.price) + '</span>';
          }
          priceHost.innerHTML = markup + '</div>';
        }

        if (image && variant.featured_image && variant.featured_image.src) {
          image.src = variant.featured_image.src.replace(/(\.[^.?]*)(\?|$)/, '_800x$1$2');
          image.removeAttribute('srcset');
        }

        // Reflect the selection in the URL bar for shareable state.
        if (window.history && window.history.replaceState) {
          try {
            var url = new URL(window.location.href);
            url.searchParams.set('variant', variant.id);
            window.history.replaceState({}, '', url.toString());
          } catch (e) {}
        }
      }

      selects.forEach(function (select) {
        on(select, 'change', syncVariant);
      });

      on($('[data-qv-quantity-minus]', content), 'click', function () {
        quantityInput.value = Math.max(1, parseInt(quantityInput.value, 10) - 1);
      });
      on($('[data-qv-quantity-plus]', content), 'click', function () {
        quantityInput.value = parseInt(quantityInput.value, 10) + 1;
      });

      $$('[data-quick-view-thumb]', content).forEach(function (thumb) {
        on(thumb, 'click', function () {
          if (!image) return;
          image.src = thumb.dataset.image;
          image.removeAttribute('srcset');
          $$('[data-quick-view-thumb]', content).forEach(function (t) {
            t.classList.toggle('is-active', t === thumb);
          });
        });
      });

      var self = this;
      on(form, 'submit', function (event) {
        event.preventDefault();
        if (submit.disabled) return;

        submit.classList.add('is-loading');
        var spinner = $('[data-quick-view-spinner]', content);
        if (spinner) spinner.hidden = false;

        Cart.add({
          id: Number(idInput.value),
          quantity: parseInt(quantityInput.value, 10) || 1
        })
          .then(function () {
            self.close();
          })
          .catch(function () {})
          .finally(function () {
            submit.classList.remove('is-loading');
            if (spinner) spinner.hidden = true;
          });
      });

      syncVariant();
    }
  };
  MSB.quickView = QuickView;

  /* ---------------------------------------------------------
     12. WISHLIST (localStorage)
     --------------------------------------------------------- */
  var Wishlist = {
    key: 'msb:wishlist',

    read: function () {
      try {
        return JSON.parse(storage(this.key) || '[]');
      } catch (e) {
        return [];
      }
    },

    write: function (ids) {
      storage(this.key, JSON.stringify(ids));
      this.renderCount();
      document.dispatchEvent(new CustomEvent('wishlist:updated', { detail: { items: ids } }));
    },

    has: function (id) {
      return this.read().indexOf(String(id)) !== -1;
    },

    toggle: function (id) {
      id = String(id);
      var ids = this.read();
      var index = ids.indexOf(id);
      if (index === -1) {
        ids.push(id);
      } else {
        ids.splice(index, 1);
      }
      this.write(ids);
      return index === -1;
    },

    renderCount: function () {
      var count = this.read().length;
      $$('[data-wishlist-count]').forEach(function (badge) {
        badge.textContent = count;
        badge.hidden = count === 0;
      });
    },

    // Reflects saved state on every card currently in the DOM.
    syncButtons: function (scope) {
      var self = this;
      $$('[data-wishlist-toggle]', scope || document).forEach(function (button) {
        button.setAttribute('aria-pressed', self.has(button.dataset.productId) ? 'true' : 'false');
      });
    },

    init: function () {
      if (!this.bound) {
        this.bound = true;
        var self = this;

        on(document, 'click', function (event) {
          var button = event.target.closest('[data-wishlist-toggle]');
          if (!button) return;
          event.preventDefault();

          var added = self.toggle(button.dataset.productId);
          button.setAttribute('aria-pressed', added ? 'true' : 'false');
          button.classList.add('is-bumped');
          setTimeout(function () {
            button.classList.remove('is-bumped');
          }, 450);

          Toast.show(
            added ? strings.wishlistAdded || 'Added to wishlist' : strings.wishlistRemoved || 'Removed from wishlist',
            added ? 'success' : null
          );
        });
      }

      this.renderCount();
      this.syncButtons();
    }
  };
  MSB.wishlist = Wishlist;

  /* ---------------------------------------------------------
     13. BOOT
     --------------------------------------------------------- */
  function init() {
    AgeGate.expireIfNeeded();
    CartDrawer.init();
    AgeGate.init();
    CookieBanner.init();
    Header.init();
    MobileNav.init();
    Tabs.init();
    QuickAdd.init();
    QuickView.init();
    Wishlist.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Theme editor: re-bind after a section is re-rendered.
  document.addEventListener('shopify:section:load', function (event) {
    Header.init();
    MobileNav.init();
    Tabs.init(event.target);
    Wishlist.renderCount();
    Wishlist.syncButtons(event.target);
  });
})();
