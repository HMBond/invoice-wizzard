
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    class State {
      constructor(contentData, { contactId, itemsId, addresseeId, footerId }) {
        this.invoice = {};
        this.defaults = contentData.defaults;
        this.contactInfo = contentData.contactInfo;
        this.contactContainer = this.getContainerById(contactId);
        this.itemsContainer = this.getContainerById(itemsId);
        this.addresseeContainer = this.getContainerById(addresseeId);
        this.footerContainer = this.getContainerById(footerId);
      }

      getContainerById(id) {
        const container = document.getElementById(id);
        return container
          ? container
          : console.error('could not find html container with id: ' + id);
      }

      render(invoice) {
        this.invoice = invoice;
        this.fillContactInfo(invoice);
        this.fillInvoice(invoice);
        this.fillAddressee(invoice);
        this.fillInvoiceDetails(invoice);
        this.fillFooter(invoice);
      }

      fillContactInfo() {
        if (!this.contactContainer) return;
        this.contactContainer.innerHTML = null;
        this.contactInfo.forEach((line) => {
          let element = document.createElement('div');
          element.innerHTML = line;
          this.contactContainer.appendChild(element);
        });
      }

      fillInvoice(invoice) {
        if (!this.itemsContainer) return;
        this.itemsContainer.innerHTML = '';
        this.fillItems(invoice);
        this.fillTotals(invoice);
      }

      fillAddressee(invoice) {
        if (!this.addresseeContainer) return;
        Object.keys(invoice.addressee).map((subKey) => {
          this.fillElement(
            subKey,
            this.addresseeContainer,
            invoice.addressee[subKey]
          );
        });
      }

      fillInvoiceDetails(invoice) {
        Object.keys(invoice).map((key) => {
          if (key != 'items' && key != 'addressee') {
            this.fillElementById(key, invoice[key], document);
          }
        });
      }

      getPopulatedItems(invoice) {
        return invoice.items.map((item) => {
          item.amount = item.amount ? item.amount : this.defaults.itemAmount;
          item.tax = invoice.tax;
          return item;
        });
      }

      fillItems(invoice) {
        const items = this.getPopulatedItems(invoice);
        items.forEach((item) => {
          const price = parseInt(item.price)
            ? parseInt(item.price).toFixed(2)
            : '0';
          this.itemsContainer.appendChild(this.createItemRow(item, price));
        });
      }

      fillTotals(invoice) {
        const items = this.getPopulatedItems(invoice);
        const { subTotalExTax, taxPrice, totalPrice } = this.calculateTotals(items);
        this.itemsContainer.appendChild(this.createSubTotalExTaxRow(subTotalExTax));
        this.itemsContainer.appendChild(
          this.createTaxTotalRow(taxPrice, invoice.tax)
        );
        this.itemsContainer.appendChild(this.createPriceTotalRow(totalPrice));
      }

      fillFooter(invoice) {
        const totals = this.calculateTotals(invoice.items);
        const formattedTotal =
          this.defaults.currencySign +
          (totals.totalPrice ? totals.totalPrice.toFixed(2) : 0);
        this.footerContainer.innerHTML = this.defaults.footerTemplate
          .replace('{total}', formattedTotal)
          .replace('{date}', invoice.expirationDate)
          .replace('{id}', invoice.id);
      }

      fillElement(id, container, value) {
        if (container) {
          this.fillElementById(id, value, container);
        } else {
          console.log('please fix the container with id: ' + parentId);
        }
      }

      fillElementById(id, value, parent) {
        const element = parent.querySelector('#' + id);
        if (parent && element) {
          element.innerHTML = value;
        } else {
          console.log('please fix the slot with id: ' + id);
        }
      }

      createCellElement({ className, classList = [], innerHTML, price }) {
        const element = document.createElement('span');
        classList.unshift(className);
        for (const className of classList) {
          if (className) element.classList.add(className);
        }
        element.innerHTML = innerHTML
          ? innerHTML
          : this.defaults.currencySign + price;
        return element;
      }

      createRowElement({ className = '', classList = [], cells }) {
        const element = document.createElement('div');
        if (className) classList.unshift(className);
        for (const className of classList) {
          element.classList.add(className);
        }
        for (const cell of cells) {
          element.appendChild(cell);
        }
        return element;
      }

      calculateTotals(items) {
        const pricesExTax = items.map((item) => this.calculateItemPriceExTax(item));
        const subTotalExTax = this.sum(pricesExTax);
        const itemPrices = items.map((item) => this.calculateItemPrice(item));
        const totalPrice = this.sum(itemPrices);
        // todo: should provide tax for each tax category (eg. 21%, 6%)
        const taxPrice = totalPrice - subTotalExTax;
        return { subTotalExTax, taxPrice, totalPrice };
      }

      calculateItemPrice({ price, amount }) {
        return price * amount;
      }

      calculateItemPriceExTax({ price, amount, tax }) {
        const itemTotal = price * amount;
        const itemExTax = itemTotal / (1 + tax * 0.01);
        return itemExTax;
      }

      sum(prices) {
        if (prices.length > 0) {
          return prices.reduce((accumulator, price) => accumulator + price);
        }
      }

      createItemRow(item, price) {
        return this.createRowElement({
          className: 'item',
          cells: [
            this.createCellElement({
              innerHTML: item.amount + ' ×'
            }),
            this.createCellElement({
              innerHTML: item.description
            }),
            this.createCellElement({
              className: 'text-align-right',
              price: price
            }),
            this.createCellElement({
              className: 'text-align-right',
              price: this.calculateItemPrice(item).toFixed(2)
            }),
            this.createCellElement({
              className: 'text-align-right',
              innerHTML: item.tax + '%'
            })
          ]
        });
      }

      createPriceTotalRow(totalPrice) {
        return this.createRowElement({
          classList: ['totals', 'text-align-right'],
          cells: [
            this.createCellElement({
              classList: ['header', 'border-top', 'total'],
              innerHTML: this.defaults.lblTotal
            }),
            this.createCellElement({
              classList: ['header', 'border-top'],
              price: totalPrice ? totalPrice.toFixed(2) : 0
            })
          ]
        });
      }

      createTaxTotalRow(taxPrice, tax) {
        return this.createRowElement({
          classList: ['totals', 'text-align-right'],
          cells: [
            this.createCellElement({
              innerHTML: tax + this.defaults.lblTax
            }),
            this.createCellElement({
              price: taxPrice ? taxPrice.toFixed(2) : 0
            })
          ]
        });
      }

      createSubTotalExTaxRow(subTotalExTax) {
        return this.createRowElement({
          classList: ['totals', 'border-top', 'text-align-right'],
          cells: [
            this.createCellElement({
              class: 'header',
              innerHTML: this.defaults.lblSubTotal
            }),
            this.createCellElement({
              price: subTotalExTax ? subTotalExTax.toFixed(2) : 0
            })
          ]
        });
      }
    }

    class Wizzard {
      constructor(
        onFinish,
        contentData,
        {
          wizzardId,
          invoideDateInputId,
          expirationDateInputId,
          wizzardItemContainerId
        }
      ) {
        this.visible = true;
        this.step = 1;
        this.items = [];
        this.onFinish = onFinish;
        this.wizzardId = wizzardId;
        this.invoideDateInput = document.getElementById(invoideDateInputId);
        this.expirationDateInput = document.getElementById(expirationDateInputId);
        this.wizzardItemContainer = document.getElementById(wizzardItemContainerId);
        this.firstStep = document.querySelector('*[wizzard="1"]');
        this.secondStep = document.querySelector('*[wizzard="2"]');
        this.thirdStepLabels = document
          .querySelector('*[wizzard="3"]')
          .querySelectorAll('label[for]');
        this.lastStep = this.getLastStep();
        this.defaults = contentData.defaults;
        this.show(this.step);
      }

      new() {
        this.items = [];
        this.wizzardItemContainer.innerHTML = '';
        document.querySelectorAll('input').forEach((input) => {
          input.value = '';
        });
        this.setDates();
        this.step = 1;
        this.show(this.step);
        this.showWizzard();
      }

      edit(invoice) {
        this.firstStep.querySelectorAll('label[for]').forEach((label) => {
          const key = label.htmlFor;
          label.querySelector('input').value = invoice.addressee[key];
        });
        this.secondStep.querySelectorAll('label[for]').forEach((label) => {
          const key = label.htmlFor;
          label.querySelector('input').value = invoice[key];
        });
        this.items = [];
        this.wizzardItemContainer.innerHTML = '';
        invoice.items.forEach((item) => {
          this.addItem(item);
        });
        this.showWizzard();
      }

      done() {
        const addressee = {};
        const invoice = {};
        this.firstStep.querySelectorAll('label[for]').forEach((label) => {
          addressee[label.htmlFor] = label.querySelector('input').value;
        });
        this.secondStep.querySelectorAll('label[for]').forEach((label) => {
          invoice[label.htmlFor] = label.querySelector('input').value;
        });
        invoice.items = this.items;
        invoice.addressee = addressee;
        this.onFinish(invoice);
        this.hideWizzard();
        return false;
      }

      addItem(item) {
        const newItem = item ? item : this.getItemFromInputFields();
        if (Object.values(newItem).some((value) => !value)) return;
        const itemRow = this.createItemRow(newItem);
        const idForDelete = this.getNewId('xxxx');
        newItem.id = idForDelete;
        itemRow.id = idForDelete;
        this.items.push(newItem);
        this.wizzardItemContainer.appendChild(itemRow);
      }

      getItemFromInputFields() {
        return [...this.thirdStepLabels].reduce(
          (object, label) => ({
            ...object,
            [label.htmlFor]: label.querySelector('input').value
          }),
          {}
        );
      }

      removeItem(event) {
        const itemRow = event.target.parentElement;
        this.items = this.items.filter((item) => item.id != itemRow.id);
        itemRow.remove();
      }

      createItemRow(item) {
        const itemCells = this.createItemCells(item);
        const cells = this.withPresentationalCells(itemCells);
        const itemRow = document.createElement('div');
        for (const [key, cell] of Object.entries(cells)) {
          if (key) cell.classList.add(key);
          itemRow.append(cell);
        }
        itemRow.classList.add('wizzard-item-row');
        return itemRow;
      }

      createItemCells(item) {
        return Object.entries(item).reduce((cells, [key, value]) => {
          const cell = document.createElement('span');
          cell.innerHTML = value;
          return {
            ...cells,
            [key]: cell
          };
        }, {});
      }

      withPresentationalCells(cells) {
        const times = document.createElement('span');
        times.innerText = '×';
        const remove = document.createElement('span');
        remove.classList.add('icon-trash-bin');
        remove.onclick = this.removeItem;
        const currency = document.createElement('span');
        currency.innerText = this.defaults.currencySign;
        return {
          ...cells,
          times,
          remove,
          currency
        };
      }

      previous() {
        if (this.step === 1) return;
        this.step--;
        this.show(this.step);
        return false;
      }

      next() {
        if (this.step === this.lastStep) return;
        this.step++;
        this.show(this.step);
        return false;
      }

      getLastStep() {
        return Math.max(
          ...[...document.querySelectorAll('[wizzard]')]
            .map((element) => parseInt(element.getAttribute('wizzard')))
            .filter((n) => n)
        );
      }

      show(index) {
        document.querySelectorAll(`[wizzard]`).forEach((element) => {
          element.classList.add('hidden');
        });
        document.querySelectorAll(`[wizzard="${index}"]`).forEach((element) => {
          element.classList.remove('hidden');
          element.querySelector('input').focus();
        });
        document.querySelectorAll(`[wizzard^="!"]`).forEach((element) => {
          element.classList.remove('hidden');
        });
        document.querySelectorAll(`[wizzard="!${index}"]`).forEach((element) => {
          element.classList.add('hidden');
        });
      }

      showWizzard() {
        this.visible = true;
        document.querySelector(this.wizzardId).classList.remove('hidden');
      }

      hideWizzard() {
        this.visible = false;
        document.querySelector(this.wizzardId).classList.add('hidden');
      }

      setDates() {
        const today = new Date();
        this.invoideDateInput.value = today.toLocaleDateString(
          this.defaults.dateCulture
        );
        this.expirationDateInput.value = new Date(
          today.setMonth(today.getMonth() + 1)
        ).toLocaleDateString('nl');
      }

      //https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
      getNewId(template) {
        return template.replace(/[xy]/g, (c) => {
          let r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
    }

    class Keyboard {
      constructor(
        container,
        {
          onEscape,
          onArrowLeft,
          onArrowRight,
          onEnter,
          onCtrlEnter,
          onCtrlS,
          onCtrlO,
          onCtrlN,
          onCtrlL
        }
      ) {
        container.addEventListener('keydown', (e) => {
          if (e.ctrlKey) {
            switch (e.key) {
              case 'Enter':
                e.stopPropagation();
                e.preventDefault();
                onCtrlEnter(e);
                break;
              case 's':
                e.stopPropagation();
                e.preventDefault();
                onCtrlS(e);
                break;
              case 'o':
                e.stopPropagation();
                e.preventDefault();
                onCtrlO(e);
                break;
              case 'l':
                e.stopPropagation();
                e.preventDefault();
                onCtrlL(e);
                break;
              case 'n':
                // can not stop browser to open new window
                e.stopPropagation();
                e.preventDefault();
                onCtrlN(e);
                break;
            }
          } else {
            switch (e.key) {
              case 'Escape':
                onEscape(e);
                break;
              case 'ArrowLeft':
                onArrowLeft(e);
                break;
              case 'ArrowRight':
                onArrowRight(e);
                break;
              case 'Enter':
                onEnter(e);
                break;
            }
          }
        });
      }
    }

    /* src\App.svelte generated by Svelte v3.31.2 */

    function create_fragment(ctx) {
    	let main;
    	let t28;
    	let nav;
    	let button0;
    	let t30;
    	let button1;
    	let t32;
    	let button2;
    	let t34;
    	let button3;
    	let t36;
    	let img1;
    	let img1_src_value;
    	let t37;
    	let wizzard_1;
    	let form;
    	let div17;
    	let t51;
    	let div20;
    	let t70;
    	let div23;
    	let h12;
    	let t72;
    	let label9;
    	let t75;
    	let label10;
    	let t78;
    	let label11;
    	let span27;
    	let t80;
    	let div21;
    	let input11;
    	let t81;
    	let span28;
    	let t83;
    	let button4;
    	let t85;
    	let div22;
    	let t86;
    	let div24;
    	let button5;
    	let t88;
    	let button6;
    	let t90;
    	let div25;
    	let button7;
    	let t92;
    	let input12;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			main = element("main");

    			main.innerHTML = `<div class="logo"><img src="images/logo.png" alt="logo"/></div> 
  <div id="contact"></div> 
  <div id="addressee"><div id="name"></div> 
    <div id="address"></div> 
    <div><span id="postcode"></span> 
      <span id="city"></span></div></div> 
  <div class="invoice-info"><div class="invoice-id"><span>Factuur</span> 
      <span id="id"></span></div> 
    <div class="invoice-description"><span class="description">Kenmerk:</span> 
      <span id="description"></span></div></div> 
  <div class="dates"><div><span>Factuurdatum:</span> 
      <span id="invoiceDate"></span></div> 
    <div><span>Vervaldatum:</span> 
      <span id="expirationDate"></span></div></div> 
  <div id="items"><div class="header"><span></span> 
      <span>Omschrijving</span> 
      <span class="text-align-right">Bedrag</span> 
      <span class="text-align-right">Totaal</span> 
      <span class="text-align-right">Btw</span></div></div> 
  <div id="footer"></div> 
  <div class="hidden" id="tax"></div>`;

    			t28 = space();
    			nav = element("nav");
    			button0 = element("button");
    			button0.textContent = "New";
    			t30 = space();
    			button1 = element("button");
    			button1.textContent = "Edit";
    			t32 = space();
    			button2 = element("button");
    			button2.textContent = "Load";
    			t34 = space();
    			button3 = element("button");
    			button3.textContent = "Save";
    			t36 = space();
    			img1 = element("img");
    			t37 = space();
    			wizzard_1 = element("wizzard");
    			form = element("form");
    			div17 = element("div");

    			div17.innerHTML = `<h1>Adressee</h1> 
      <label for="name"><span>Name adressee</span> 
        <input type="text" placeholder="Who should pay?"/></label> 
      <label for="address"><span>Address</span> 
        <input type="text" placeholder="From where?"/></label> 
      <div class="flex"><label for="postcode"><span>Postcode</span> 
          <input type="text" placeholder="Zip code?"/></label> 
        <label for="city"><span>City</span> 
          <input type="text" placeholder="e.g. Rotterdam"/></label></div>`;

    			t51 = space();
    			div20 = element("div");

    			div20.innerHTML = `<h1>Details</h1> 
      <label for="id"><span>Invoice id</span> 
        <input type="text" placeholder="e.g. 2020-0001"/></label> 
      <label for="description"><span>Description</span> 
        <input type="text" placeholder="What is the invoice about?"/></label> 
      <div class="flex"><label for="invoiceDate"><span>Invoice date</span> 
          <input type="text" placeholder="today?" id="invoice-date"/></label> 
        <label for="expirationDate"><span>Expiration date</span> 
          <input type="text" placeholder="next month?" id="expiration-date"/></label></div> 
      <label for="tax"><span>Tax</span> 
        <div><input type="number" min="0" max="100"/> 
          <span>%</span></div></label>`;

    			t70 = space();
    			div23 = element("div");
    			h12 = element("h1");
    			h12.textContent = "Add Item";
    			t72 = space();
    			label9 = element("label");

    			label9.innerHTML = `<span>Amount</span> 
        <input type="number" min="1" value="1" placeholder="How many?"/>`;

    			t75 = space();
    			label10 = element("label");

    			label10.innerHTML = `<span>Description</span> 
        <input type="text" placeholder="What is this item about?"/>`;

    			t78 = space();
    			label11 = element("label");
    			span27 = element("span");
    			span27.textContent = "Price per item";
    			t80 = space();
    			div21 = element("div");
    			input11 = element("input");
    			t81 = space();
    			span28 = element("span");
    			span28.textContent = "€";
    			t83 = space();
    			button4 = element("button");
    			button4.textContent = "Add Item";
    			t85 = space();
    			div22 = element("div");
    			t86 = space();
    			div24 = element("div");
    			button5 = element("button");
    			button5.textContent = "Previous";
    			t88 = space();
    			button6 = element("button");
    			button6.textContent = "Next";
    			t90 = space();
    			div25 = element("div");
    			button7 = element("button");
    			button7.textContent = "done";
    			t92 = space();
    			input12 = element("input");
    			if (img1.src !== (img1_src_value = "images/favicon.svg")) attr(img1, "src", img1_src_value);
    			attr(img1, "alt", "heart");
    			attr(img1, "width", "30px");
    			attr(img1, "height", "30px");
    			attr(div17, "class", "hidden");
    			attr(div17, "wizzard", "1");
    			attr(div20, "class", "hidden");
    			attr(div20, "wizzard", "2");
    			attr(label9, "for", "amount");
    			attr(label10, "for", "description");
    			attr(input11, "class", "");
    			attr(input11, "type", "number");
    			attr(input11, "placeholder", "€€€");
    			attr(input11, "width", "8rem");
    			attr(button4, "type", "button");
    			attr(label11, "for", "price");
    			attr(div22, "id", "wizzard-item-container");
    			attr(div23, "class", "hidden");
    			attr(div23, "wizzard", "3");
    			attr(button5, "type", "button");
    			attr(button5, "wizzard", "!1");
    			attr(button6, "type", "button");
    			attr(button6, "wizzard", "!3");
    			attr(div24, "class", "action-buttons");
    			attr(button7, "type", "button");
    			attr(div25, "class", "action-buttons");
    			attr(form, "class", "form");
    			attr(input12, "type", "file");
    			attr(input12, "id", "invoice-file-load");
    			attr(input12, "accept", "application/JSON");
    		},
    		m(target, anchor) {
    			insert(target, main, anchor);
    			insert(target, t28, anchor);
    			insert(target, nav, anchor);
    			append(nav, button0);
    			append(nav, t30);
    			append(nav, button1);
    			append(nav, t32);
    			append(nav, button2);
    			append(nav, t34);
    			append(nav, button3);
    			append(nav, t36);
    			append(nav, img1);
    			insert(target, t37, anchor);
    			insert(target, wizzard_1, anchor);
    			append(wizzard_1, form);
    			append(form, div17);
    			append(form, t51);
    			append(form, div20);
    			append(form, t70);
    			append(form, div23);
    			append(div23, h12);
    			append(div23, t72);
    			append(div23, label9);
    			append(div23, t75);
    			append(div23, label10);
    			append(div23, t78);
    			append(div23, label11);
    			append(label11, span27);
    			append(label11, t80);
    			append(label11, div21);
    			append(div21, input11);
    			append(div21, t81);
    			append(div21, span28);
    			append(div21, t83);
    			append(div21, button4);
    			append(div23, t85);
    			append(div23, div22);
    			append(form, t86);
    			append(form, div24);
    			append(div24, button5);
    			append(div24, t88);
    			append(div24, button6);
    			append(form, t90);
    			append(form, div25);
    			append(div25, button7);
    			insert(target, t92, anchor);
    			insert(target, input12, anchor);

    			if (!mounted) {
    				dispose = [
    					listen(button0, "click", /*click_handler*/ ctx[6]),
    					listen(button1, "click", /*click_handler_1*/ ctx[7]),
    					listen(button2, "click", /*click_handler_2*/ ctx[8]),
    					listen(button3, "click", /*click_handler_3*/ ctx[9]),
    					listen(button4, "click", /*click_handler_4*/ ctx[10]),
    					listen(button5, "click", /*click_handler_5*/ ctx[11]),
    					listen(button6, "click", /*click_handler_6*/ ctx[12]),
    					listen(button7, "click", /*click_handler_7*/ ctx[13]),
    					listen(input12, "change", /*input12_change_handler*/ ctx[14]),
    					listen(input12, "change", /*change_handler*/ ctx[15])
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(main);
    			if (detaching) detach(t28);
    			if (detaching) detach(nav);
    			if (detaching) detach(t37);
    			if (detaching) detach(wizzard_1);
    			if (detaching) detach(t92);
    			if (detaching) detach(input12);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    	try {
    		var info = gen[key](arg);
    		var value = info.value;
    	} catch(error) {
    		reject(error);
    		return;
    	}

    	if (info.done) {
    		resolve(value);
    	} else {
    		Promise.resolve(value).then(_next, _throw);
    	}
    }

    function _asyncToGenerator(fn) {
    	return function () {
    		var self = this, args = arguments;

    		return new Promise(function (resolve, reject) {
    				var gen = fn.apply(self, args);

    				function _next(value) {
    					asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
    				}

    				function _throw(err) {
    					asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
    				}

    				_next(undefined);
    			});
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	var electron = require("electron");
    	var fs = require("fs");
    	var path = require("path");
    	var os = require("os"); // Importing BrowserWindow from Main
    	var BrowserWindow = electron.remote.BrowserWindow;

    	function print() {
    		var win = BrowserWindow.getFocusedWindow();

    		win.webContents.printToPDF({
    			marginsType: 0,
    			printBackground: false,
    			printSelectionOnly: false,
    			landscape: false,
    			pageSize: "A4",
    			scaleFactor: 100
    		}).then(data => {
    			var pdfPath = path.join(os.homedir(), "Desktop", state.invoice.id + ".pdf");

    			fs.writeFile(pdfPath, data, error => {
    				if (error) throw error;
    				console.log("Wrote PDF successfully to " + pdfPath);
    			});
    		}).catch(error => {
    			console.log("Failed to write PDF to " + pdfPath + ": ", error);
    		});
    	}

    	var state;
    	var wizzard;

    	onMount(/*#__PURE__*/
    	_asyncToGenerator(function* () {
    		var content = yield fetch("./private/content.json").then(r => r.json()).then(data => {
    			return data;
    		});

    		$$invalidate(0, state = new State(content,
    		{
    				contactId: "contact",
    				itemsId: "items",
    				addresseeId: "addressee",
    				footerId: "footer"
    			}));

    		var invoice =  yield fetch("./private/invoice.json").then(r => r.json()).then(data => {
    				return data;
    			});

    		state.render(invoice);

    		$$invalidate(1, wizzard = new Wizzard(onFinishWizzard,
    		content,
    		{
    				wizzardId: "wizzard",
    				invoideDateInputId: "invoice-date",
    				expirationDateInputId: "expiration-date",
    				wizzardItemContainerId: "wizzard-item-container"
    			}));

    		wizzard.setDates();
    		new Keyboard(document, keyboardFunctions);
    	}));

    	var keyboardFunctions = {
    		onEscape: () => wizzard.visible
    		? wizzard.done()
    		: wizzard.edit(state.invoice),
    		onArrowLeft: () => wizzard.previous(),
    		onArrowRight: () => wizzard.next(),
    		onEnter: e => {
    			if (wizzard.step === wizzard.lastStep) {
    				if (e.target.innerText.toLowerCase().includes("add")) return;
    				wizzard.addItem();
    			} else {
    				wizzard.next();
    			}
    		},
    		onCtrlEnter: () => wizzard.visible
    		? wizzard.done()
    		: wizzard.edit(state.invoice),
    		onCtrlS: () => wizzard.visible ? wizzard.done() : window.print(),
    		onCtrlO: () => load(),
    		onCtrlL: () => load(),
    		onCtrlN: () => wizzard.new()
    	};

    	var onFinishWizzard = /*#__PURE__*/
    	(function () {
    		var _ref2 = _asyncToGenerator(function* (invoice) {
    			if (!invoice) localStorage.setItem(invoice.id, JSON.stringify(invoice));
    			state.render(invoice);
    			var success = saveFile(invoice, invoice.id);
    			if (success) console.log("file saved");
    		});

    		return function onFinishWizzard(_x) {
    			return _ref2.apply(this, arguments);
    		};
    	})();

    	var save = /*#__PURE__*/
    	(function () {
    		var _ref3 = _asyncToGenerator(function* () {
    			saveFile(state.invoice, yield prompt("file name:"));
    		});

    		return function save() {
    			return _ref3.apply(this, arguments);
    		};
    	})();

    	var saveFile = /*#__PURE__*/
    	(function () {
    		var _ref4 = _asyncToGenerator(function* (invoice, fileName) {
    			print(); // todo: use fs
    		}); // if (!invoice || !fileName) return;
    		// const headers = new Headers();
    		// headers.append('Content-Type', 'application/json');
    		// return await fetch(`http://localhost:8888/save`, {
    		//   method: 'POST',

    		//   headers: headers,
    		//   body: JSON.stringify({ invoice: invoice, fileName: fileName }),
    		//   redirect: 'follow'
    		// })
    		//   .then((res) => res.ok)
    		//   .catch((err) => console.log('save: ', err));
    		return function saveFile(_x2, _x3) {
    			return _ref4.apply(this, arguments);
    		};
    	})();

    	var load = () => {
    		document.getElementById("invoice-file-load").click();
    	};

    	var loadInputFiles;

    	var loadFile = /*#__PURE__*/
    	(function () {
    		var _ref5 = _asyncToGenerator(function* () {
    			
    		}); // todo: use fs
    		// if (!loadInputFiles) return;
    		// const invoice = await fetch(
    		//   `../public/private/${loadInputFiles[0].name}`
    		// ).then((res) => (res.ok ? res.json() : null));

    		// if (!invoice)
    		//   return alert(
    		//     "The *.invoice.json file can only be loaded from the app's private folder."
    		//   );
    		// state.render(invoice);
    		// wizzard.edit(invoice);
    		return function loadFile() {
    			return _ref5.apply(this, arguments);
    		};
    	})();

    	const click_handler = () => wizzard.new();
    	const click_handler_1 = () => wizzard.edit(state.invoice);
    	const click_handler_2 = () => load();
    	const click_handler_3 = () => save();
    	const click_handler_4 = () => wizzard.addItem();
    	const click_handler_5 = () => wizzard.previous();
    	const click_handler_6 = () => wizzard.next();
    	const click_handler_7 = () => wizzard.done();

    	function input12_change_handler() {
    		loadInputFiles = this.files;
    		$$invalidate(2, loadInputFiles);
    	}

    	const change_handler = () => loadFile();

    	return [
    		state,
    		wizzard,
    		loadInputFiles,
    		save,
    		load,
    		loadFile,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		input12_change_handler,
    		change_handler
    	];
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, {});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
