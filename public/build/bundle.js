
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
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function empty() {
        return text('');
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
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function create_component(block) {
        block && block.c();
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

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const content = writable({});

    const defaultInvoice = {
      id: '',
      description: '',
      invoiceDate: '',
      expirationDate: '',
      addressee: {
        name: '',
        address: '',
        postcode: '',
        city: ''
      },
      tax: 21,
      items: []
    };

    const invoice = writable(defaultInvoice);

    const wizzard = writable({
      visible: true,
      step: 1,
      lastStep: 3,
      toggle: () =>
        wizzard.update((wizz) => ({
          ...wizz,
          visible: !wizz.visible
        })),
      new: () => {
        invoice.set(defaultInvoice);
        get_store_value(wizzard).toggle();
      },
      save: () => {
        // todo: save invoice to db
        get_store_value(wizzard).toggle();
      },
      previous: () =>
        wizzard.update((wizz) => ({
          ...wizz,
          step: wizz.step - 1 > 0 ? wizz.step - 1 : wizz.step
        })),
      next: () =>
        wizzard.update((wizz) => ({
          ...wizz,
          step: wizz.step + 1 <= wizz.lastStep ? wizz.step + 1 : wizz.step
        }))
    });

    function calculateTotals(items) {
      const pricesExTax = items.map((item) => calculateItemPriceExTax(item));
      const subTotalExTax = sum(pricesExTax);
      const itemPrices = items.map((item) => calculateItemPrice(item));
      const totalPrice = sum(itemPrices);
      // todo: should provide tax for each tax category (eg. 21%, 6%)
      const taxPrice = totalPrice - subTotalExTax;
      return { subTotalExTax, taxPrice, totalPrice };
    }

    const calculateItemPrice = ({ price, amount }) => price * amount;

    const calculateItemPriceExTax = ({ price, amount, tax }) => {
      const itemTotal = price * amount;
      const itemExTax = itemTotal / (1 + tax * 0.01);
      return itemExTax;
    };

    const sum = (prices) => {
      if (prices.length > 0) {
        return prices.reduce((accumulator, price) => accumulator + price);
      }
    };

    function initKeyboard(params) {
      const { container, exportAsPfd } = params;
      const actions = {
        onEscape: get_store_value(wizzard).toggle,
        onArrowLeft: get_store_value(wizzard).previous,
        onArrowRight: get_store_value(wizzard).next,
        onEnter: () => {
          if (get_store_value(wizzard).step === get_store_value(wizzard).lastStep) {
            get_store_value(wizzard).addItem();
          } else {
            get_store_value(wizzard).next();
          }
        },
        onCtrlEnter: get_store_value(wizzard).save,
        onCtrlS: () => (get_store_value(wizzard).visible ? get_store_value(wizzard).done() : exportAsPfd()),
        onCtrlO: () => load(),
        onCtrlL: () => load(),
        onCtrlN: () => get_store_value(wizzard).new()
      };

      container.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
          switch (e.key) {
            case 'Enter':
              e.stopPropagation();
              e.preventDefault();
              actions.onCtrlEnter(e);
              break;
            case 's':
              e.stopPropagation();
              e.preventDefault();
              actions.onCtrlS(e);
              break;
            case 'o':
              e.stopPropagation();
              e.preventDefault();
              actions.onCtrlO(e);
              break;
            case 'l':
              e.stopPropagation();
              e.preventDefault();
              actions.onCtrlL(e);
              break;
            case 'n':
              // can not stop browser to open new window
              e.stopPropagation();
              e.preventDefault();
              actions.onCtrlN(e);
              break;
          }
        } else {
          switch (e.key) {
            case 'Escape':
              actions.onEscape(e);
              break;
            case 'ArrowLeft':
              actions.onArrowLeft(e);
              break;
            case 'ArrowRight':
              actions.onArrowRight(e);
              break;
            case 'Enter':
              actions.onEnter(e);
              break;
          }
        }
      });
    }

    /* src/components/Contact.svelte generated by Svelte v3.31.2 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (4:2) {#if $content.contactInfo}
    function create_if_block(ctx) {
    	let each_1_anchor;
    	let each_value = /*$content*/ ctx[1].contactInfo;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*$content*/ 2) {
    				each_value = /*$content*/ ctx[1].contactInfo;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    // (5:4) {#each $content.contactInfo as entry}
    function create_each_block(ctx) {
    	let div;
    	let raw_value = /*entry*/ ctx[2] + "";

    	return {
    		c() {
    			div = element("div");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			div.innerHTML = raw_value;
    		},
    		p(ctx, dirty) {
    			if (dirty & /*$content*/ 2 && raw_value !== (raw_value = /*entry*/ ctx[2] + "")) div.innerHTML = raw_value;		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let div;
    	let if_block = /*$content*/ ctx[1].contactInfo && create_if_block(ctx);

    	return {
    		c() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr(div, "class", "contact");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p(ctx, [dirty]) {
    			if (/*$content*/ ctx[1].contactInfo) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			if (if_block) if_block.d();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let $content,
    		$$unsubscribe_content = noop,
    		$$subscribe_content = () => ($$unsubscribe_content(), $$unsubscribe_content = subscribe(content, $$value => $$invalidate(1, $content = $$value)), content);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_content());
    	var { content } = $$props;
    	$$subscribe_content();

    	$$self.$$set = $$props => {
    		if ("content" in $$props) $$subscribe_content($$invalidate(0, content = $$props.content));
    	};

    	return [content, $content];
    }

    class Contact extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, { content: 0 });
    	}
    }

    /* src/components/Invoice.svelte generated by Svelte v3.31.2 */

    function create_fragment$1(ctx) {
    	let div3;
    	let div0;
    	let t0_value = /*$invoice*/ ctx[1].addressee.name + "";
    	let t0;
    	let t1;
    	let div1;
    	let t2_value = /*$invoice*/ ctx[1].addressee.address + "";
    	let t2;
    	let t3;
    	let div2;
    	let span0;
    	let t4_value = /*$invoice*/ ctx[1].addressee.postcode + "";
    	let t4;
    	let t5;
    	let span1;
    	let t6_value = /*$invoice*/ ctx[1].addressee.city + "";
    	let t6;
    	let t7;
    	let div6;
    	let div4;
    	let span2;
    	let t9;
    	let span3;
    	let t10_value = /*$invoice*/ ctx[1].id + "";
    	let t10;
    	let t11;
    	let div5;
    	let span4;
    	let t13;
    	let span5;
    	let raw_value = /*$invoice*/ ctx[1].description + "";
    	let t14;
    	let div9;
    	let div7;
    	let span6;
    	let t16;
    	let span7;
    	let t17_value = /*$invoice*/ ctx[1].invoiceDate + "";
    	let t17;
    	let t18;
    	let div8;
    	let span8;
    	let t20;
    	let span9;
    	let t21_value = /*$invoice*/ ctx[1].expirationDate + "";
    	let t21;
    	let t22;
    	let div11;

    	return {
    		c() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			div2 = element("div");
    			span0 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			span1 = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			div6 = element("div");
    			div4 = element("div");
    			span2 = element("span");
    			span2.textContent = "Factuur";
    			t9 = space();
    			span3 = element("span");
    			t10 = text(t10_value);
    			t11 = space();
    			div5 = element("div");
    			span4 = element("span");
    			span4.textContent = "Kenmerk:";
    			t13 = space();
    			span5 = element("span");
    			t14 = space();
    			div9 = element("div");
    			div7 = element("div");
    			span6 = element("span");
    			span6.textContent = "Factuurdatum:";
    			t16 = space();
    			span7 = element("span");
    			t17 = text(t17_value);
    			t18 = space();
    			div8 = element("div");
    			span8 = element("span");
    			span8.textContent = "Vervaldatum:";
    			t20 = space();
    			span9 = element("span");
    			t21 = text(t21_value);
    			t22 = space();
    			div11 = element("div");

    			div11.innerHTML = `<div class="header"><span></span> 
      <span>Omschrijving</span> 
      <span class="text-align-right">Bedrag</span> 
      <span class="text-align-right">Totaal</span> 
      <span class="text-align-right">Btw</span></div>`;

    			attr(div3, "class", "addressee");
    			attr(div4, "class", "invoice-id");
    			attr(span4, "class", "description");
    			attr(div5, "class", "invoice-description");
    			attr(div6, "class", "invoice-info");
    			attr(div9, "class", "dates");
    			attr(div11, "class", "items");
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div0);
    			append(div0, t0);
    			append(div3, t1);
    			append(div3, div1);
    			append(div1, t2);
    			append(div3, t3);
    			append(div3, div2);
    			append(div2, span0);
    			append(span0, t4);
    			append(div2, t5);
    			append(div2, span1);
    			append(span1, t6);
    			insert(target, t7, anchor);
    			insert(target, div6, anchor);
    			append(div6, div4);
    			append(div4, span2);
    			append(div4, t9);
    			append(div4, span3);
    			append(span3, t10);
    			append(div6, t11);
    			append(div6, div5);
    			append(div5, span4);
    			append(div5, t13);
    			append(div5, span5);
    			span5.innerHTML = raw_value;
    			insert(target, t14, anchor);
    			insert(target, div9, anchor);
    			append(div9, div7);
    			append(div7, span6);
    			append(div7, t16);
    			append(div7, span7);
    			append(span7, t17);
    			append(div9, t18);
    			append(div9, div8);
    			append(div8, span8);
    			append(div8, t20);
    			append(div8, span9);
    			append(span9, t21);
    			insert(target, t22, anchor);
    			insert(target, div11, anchor);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*$invoice*/ 2 && t0_value !== (t0_value = /*$invoice*/ ctx[1].addressee.name + "")) set_data(t0, t0_value);
    			if (dirty & /*$invoice*/ 2 && t2_value !== (t2_value = /*$invoice*/ ctx[1].addressee.address + "")) set_data(t2, t2_value);
    			if (dirty & /*$invoice*/ 2 && t4_value !== (t4_value = /*$invoice*/ ctx[1].addressee.postcode + "")) set_data(t4, t4_value);
    			if (dirty & /*$invoice*/ 2 && t6_value !== (t6_value = /*$invoice*/ ctx[1].addressee.city + "")) set_data(t6, t6_value);
    			if (dirty & /*$invoice*/ 2 && t10_value !== (t10_value = /*$invoice*/ ctx[1].id + "")) set_data(t10, t10_value);
    			if (dirty & /*$invoice*/ 2 && raw_value !== (raw_value = /*$invoice*/ ctx[1].description + "")) span5.innerHTML = raw_value;			if (dirty & /*$invoice*/ 2 && t17_value !== (t17_value = /*$invoice*/ ctx[1].invoiceDate + "")) set_data(t17, t17_value);
    			if (dirty & /*$invoice*/ 2 && t21_value !== (t21_value = /*$invoice*/ ctx[1].expirationDate + "")) set_data(t21, t21_value);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div3);
    			if (detaching) detach(t7);
    			if (detaching) detach(div6);
    			if (detaching) detach(t14);
    			if (detaching) detach(div9);
    			if (detaching) detach(t22);
    			if (detaching) detach(div11);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $invoice,
    		$$unsubscribe_invoice = noop,
    		$$subscribe_invoice = () => ($$unsubscribe_invoice(), $$unsubscribe_invoice = subscribe(invoice, $$value => $$invalidate(1, $invoice = $$value)), invoice);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_invoice());
    	var { invoice } = $$props;
    	$$subscribe_invoice();

    	$$self.$$set = $$props => {
    		if ("invoice" in $$props) $$subscribe_invoice($$invalidate(0, invoice = $$props.invoice));
    	};

    	return [invoice, $invoice];
    }

    class Invoice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { invoice: 0 });
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.31.2 */

    function create_fragment$2(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "footer");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			div.innerHTML = /*htmlFooterContent*/ ctx[0];
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*htmlFooterContent*/ 1) div.innerHTML = /*htmlFooterContent*/ ctx[0];		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $content;
    	let $invoice;
    	component_subscribe($$self, content, $$value => $$invalidate(1, $content = $$value));
    	component_subscribe($$self, invoice, $$value => $$invalidate(2, $invoice = $$value));
    	var htmlFooterContent;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$content, $invoice*/ 6) {
    			 {
    				if ($content.defaults) {
    					var totals = calculateTotals($invoice.items);
    					var formattedTotal = $content.defaults.currencySign + (totals.totalPrice ? totals.totalPrice.toFixed(2) : 0);
    					$$invalidate(0, htmlFooterContent = $content.defaults.footerTemplate.replace("{total}", formattedTotal).replace("{date}", $invoice.expirationDate).replace("{id}", $invoice.id));
    				}
    			}
    		}
    	};

    	return [htmlFooterContent, $content, $invoice];
    }

    class Footer extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});
    	}
    }

    /* src/components/wizzard/StepOne.svelte generated by Svelte v3.31.2 */

    function create_fragment$3(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let label0;
    	let span0;
    	let t3;
    	let input0;
    	let t4;
    	let label1;
    	let span1;
    	let t6;
    	let input1;
    	let t7;
    	let div0;
    	let label2;
    	let span2;
    	let t9;
    	let input2;
    	let t10;
    	let label3;
    	let span3;
    	let t12;
    	let input3;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Adressee";
    			t1 = space();
    			label0 = element("label");
    			span0 = element("span");
    			span0.textContent = "Name adressee";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			label1 = element("label");
    			span1 = element("span");
    			span1.textContent = "Address";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div0 = element("div");
    			label2 = element("label");
    			span2 = element("span");
    			span2.textContent = "Postcode";
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			label3 = element("label");
    			span3 = element("span");
    			span3.textContent = "City";
    			t12 = space();
    			input3 = element("input");
    			attr(input0, "type", "text");
    			attr(input0, "placeholder", "Who should pay?");
    			attr(label0, "for", "name");
    			attr(input1, "type", "text");
    			attr(input1, "placeholder", "From where?");
    			attr(label1, "for", "address");
    			attr(input2, "type", "text");
    			attr(input2, "placeholder", "Zip code?");
    			attr(label2, "for", "postcode");
    			attr(input3, "type", "text");
    			attr(input3, "placeholder", "e.g. Rotterdam");
    			attr(label3, "for", "city");
    			attr(div0, "class", "flex");
    			toggle_class(div1, "hidden", /*$state*/ ctx[2].step !== 1);
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, h1);
    			append(div1, t1);
    			append(div1, label0);
    			append(label0, span0);
    			append(label0, t3);
    			append(label0, input0);
    			set_input_value(input0, /*$invoice*/ ctx[3].addressee.name);
    			append(div1, t4);
    			append(div1, label1);
    			append(label1, span1);
    			append(label1, t6);
    			append(label1, input1);
    			set_input_value(input1, /*$invoice*/ ctx[3].addressee.address);
    			append(div1, t7);
    			append(div1, div0);
    			append(div0, label2);
    			append(label2, span2);
    			append(label2, t9);
    			append(label2, input2);
    			set_input_value(input2, /*$invoice*/ ctx[3].addressee.postcode);
    			append(div0, t10);
    			append(div0, label3);
    			append(label3, span3);
    			append(label3, t12);
    			append(label3, input3);
    			set_input_value(input3, /*$invoice*/ ctx[3].addressee.city);

    			if (!mounted) {
    				dispose = [
    					listen(input0, "input", /*input0_input_handler*/ ctx[4]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[5]),
    					listen(input2, "input", /*input2_input_handler*/ ctx[6]),
    					listen(input3, "input", /*input3_input_handler*/ ctx[7])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*$invoice*/ 8 && input0.value !== /*$invoice*/ ctx[3].addressee.name) {
    				set_input_value(input0, /*$invoice*/ ctx[3].addressee.name);
    			}

    			if (dirty & /*$invoice*/ 8 && input1.value !== /*$invoice*/ ctx[3].addressee.address) {
    				set_input_value(input1, /*$invoice*/ ctx[3].addressee.address);
    			}

    			if (dirty & /*$invoice*/ 8 && input2.value !== /*$invoice*/ ctx[3].addressee.postcode) {
    				set_input_value(input2, /*$invoice*/ ctx[3].addressee.postcode);
    			}

    			if (dirty & /*$invoice*/ 8 && input3.value !== /*$invoice*/ ctx[3].addressee.city) {
    				set_input_value(input3, /*$invoice*/ ctx[3].addressee.city);
    			}

    			if (dirty & /*$state*/ 4) {
    				toggle_class(div1, "hidden", /*$state*/ ctx[2].step !== 1);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $state,
    		$$unsubscribe_state = noop,
    		$$subscribe_state = () => ($$unsubscribe_state(), $$unsubscribe_state = subscribe(state, $$value => $$invalidate(2, $state = $$value)), state);

    	let $invoice,
    		$$unsubscribe_invoice = noop,
    		$$subscribe_invoice = () => ($$unsubscribe_invoice(), $$unsubscribe_invoice = subscribe(invoice, $$value => $$invalidate(3, $invoice = $$value)), invoice);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_state());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_invoice());
    	var { state } = $$props;
    	$$subscribe_state();
    	var { invoice } = $$props;
    	$$subscribe_invoice();

    	function input0_input_handler() {
    		$invoice.addressee.name = this.value;
    		invoice.set($invoice);
    	}

    	function input1_input_handler() {
    		$invoice.addressee.address = this.value;
    		invoice.set($invoice);
    	}

    	function input2_input_handler() {
    		$invoice.addressee.postcode = this.value;
    		invoice.set($invoice);
    	}

    	function input3_input_handler() {
    		$invoice.addressee.city = this.value;
    		invoice.set($invoice);
    	}

    	$$self.$$set = $$props => {
    		if ("state" in $$props) $$subscribe_state($$invalidate(0, state = $$props.state));
    		if ("invoice" in $$props) $$subscribe_invoice($$invalidate(1, invoice = $$props.invoice));
    	};

    	return [
    		state,
    		invoice,
    		$state,
    		$invoice,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler
    	];
    }

    class StepOne extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { state: 0, invoice: 1 });
    	}
    }

    /* src/components/wizzard/StepTwo.svelte generated by Svelte v3.31.2 */

    function create_fragment$4(ctx) {
    	let div2;
    	let h1;
    	let t1;
    	let label0;
    	let span0;
    	let t3;
    	let input0;
    	let t4;
    	let label1;
    	let span1;
    	let t6;
    	let input1;
    	let t7;
    	let div0;
    	let label2;
    	let span2;
    	let t9;
    	let input2;
    	let t10;
    	let label3;
    	let span3;
    	let t12;
    	let input3;
    	let t13;
    	let label4;
    	let span4;
    	let t15;
    	let div1;
    	let input4;
    	let t16;
    	let span5;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div2 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Details";
    			t1 = space();
    			label0 = element("label");
    			span0 = element("span");
    			span0.textContent = "Invoice id";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			label1 = element("label");
    			span1 = element("span");
    			span1.textContent = "Description";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div0 = element("div");
    			label2 = element("label");
    			span2 = element("span");
    			span2.textContent = "Invoice date";
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			label3 = element("label");
    			span3 = element("span");
    			span3.textContent = "Expiration date";
    			t12 = space();
    			input3 = element("input");
    			t13 = space();
    			label4 = element("label");
    			span4 = element("span");
    			span4.textContent = "Tax";
    			t15 = space();
    			div1 = element("div");
    			input4 = element("input");
    			t16 = space();
    			span5 = element("span");
    			span5.textContent = "%";
    			attr(input0, "type", "text");
    			attr(input0, "placeholder", "e.g. 2020-0001");
    			attr(label0, "for", "id");
    			attr(input1, "type", "text");
    			attr(input1, "placeholder", "What is the invoice about?");
    			attr(label1, "for", "description");
    			attr(input2, "type", "text");
    			attr(input2, "placeholder", "today?");
    			attr(input2, "id", "invoice-date");
    			attr(label2, "for", "invoiceDate");
    			attr(input3, "type", "text");
    			attr(input3, "placeholder", "next month?");
    			attr(input3, "id", "expiration-date");
    			attr(label3, "for", "expirationDate");
    			attr(div0, "class", "flex");
    			attr(input4, "type", "number");
    			attr(input4, "min", "0");
    			attr(input4, "max", "100");
    			attr(label4, "for", "tax");
    			toggle_class(div2, "hidden", /*$state*/ ctx[2].step !== 2);
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, h1);
    			append(div2, t1);
    			append(div2, label0);
    			append(label0, span0);
    			append(label0, t3);
    			append(label0, input0);
    			set_input_value(input0, /*$invoice*/ ctx[3].id);
    			append(div2, t4);
    			append(div2, label1);
    			append(label1, span1);
    			append(label1, t6);
    			append(label1, input1);
    			set_input_value(input1, /*$invoice*/ ctx[3].description);
    			append(div2, t7);
    			append(div2, div0);
    			append(div0, label2);
    			append(label2, span2);
    			append(label2, t9);
    			append(label2, input2);
    			set_input_value(input2, /*$invoice*/ ctx[3].invoiceDate);
    			append(div0, t10);
    			append(div0, label3);
    			append(label3, span3);
    			append(label3, t12);
    			append(label3, input3);
    			set_input_value(input3, /*$invoice*/ ctx[3].expirationDate);
    			append(div2, t13);
    			append(div2, label4);
    			append(label4, span4);
    			append(label4, t15);
    			append(label4, div1);
    			append(div1, input4);
    			set_input_value(input4, /*$invoice*/ ctx[3].tax);
    			append(div1, t16);
    			append(div1, span5);

    			if (!mounted) {
    				dispose = [
    					listen(input0, "input", /*input0_input_handler*/ ctx[4]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[5]),
    					listen(input2, "input", /*input2_input_handler*/ ctx[6]),
    					listen(input3, "input", /*input3_input_handler*/ ctx[7]),
    					listen(input4, "input", /*input4_input_handler*/ ctx[8])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*$invoice*/ 8 && input0.value !== /*$invoice*/ ctx[3].id) {
    				set_input_value(input0, /*$invoice*/ ctx[3].id);
    			}

    			if (dirty & /*$invoice*/ 8 && input1.value !== /*$invoice*/ ctx[3].description) {
    				set_input_value(input1, /*$invoice*/ ctx[3].description);
    			}

    			if (dirty & /*$invoice*/ 8 && input2.value !== /*$invoice*/ ctx[3].invoiceDate) {
    				set_input_value(input2, /*$invoice*/ ctx[3].invoiceDate);
    			}

    			if (dirty & /*$invoice*/ 8 && input3.value !== /*$invoice*/ ctx[3].expirationDate) {
    				set_input_value(input3, /*$invoice*/ ctx[3].expirationDate);
    			}

    			if (dirty & /*$invoice*/ 8 && to_number(input4.value) !== /*$invoice*/ ctx[3].tax) {
    				set_input_value(input4, /*$invoice*/ ctx[3].tax);
    			}

    			if (dirty & /*$state*/ 4) {
    				toggle_class(div2, "hidden", /*$state*/ ctx[2].step !== 2);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $state,
    		$$unsubscribe_state = noop,
    		$$subscribe_state = () => ($$unsubscribe_state(), $$unsubscribe_state = subscribe(state, $$value => $$invalidate(2, $state = $$value)), state);

    	let $invoice,
    		$$unsubscribe_invoice = noop,
    		$$subscribe_invoice = () => ($$unsubscribe_invoice(), $$unsubscribe_invoice = subscribe(invoice, $$value => $$invalidate(3, $invoice = $$value)), invoice);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_state());
    	$$self.$$.on_destroy.push(() => $$unsubscribe_invoice());
    	var { state } = $$props;
    	$$subscribe_state();
    	var { invoice } = $$props;
    	$$subscribe_invoice();

    	function input0_input_handler() {
    		$invoice.id = this.value;
    		invoice.set($invoice);
    	}

    	function input1_input_handler() {
    		$invoice.description = this.value;
    		invoice.set($invoice);
    	}

    	function input2_input_handler() {
    		$invoice.invoiceDate = this.value;
    		invoice.set($invoice);
    	}

    	function input3_input_handler() {
    		$invoice.expirationDate = this.value;
    		invoice.set($invoice);
    	}

    	function input4_input_handler() {
    		$invoice.tax = to_number(this.value);
    		invoice.set($invoice);
    	}

    	$$self.$$set = $$props => {
    		if ("state" in $$props) $$subscribe_state($$invalidate(0, state = $$props.state));
    		if ("invoice" in $$props) $$subscribe_invoice($$invalidate(1, invoice = $$props.invoice));
    	};

    	return [
    		state,
    		invoice,
    		$state,
    		$invoice,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler
    	];
    }

    class StepTwo extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { state: 0, invoice: 1 });
    	}
    }

    /* src/components/wizzard/Wizzard.svelte generated by Svelte v3.31.2 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (62:8) {#each $invoice.items as item (item.description)}
    function create_each_block$1(key_1, ctx) {
    	let div;
    	let span0;
    	let t0_value = /*item*/ ctx[3].amount + "";
    	let t0;
    	let t1;
    	let span1;
    	let t3;
    	let span2;
    	let t4_value = /*item*/ ctx[3].description + "";
    	let t4;
    	let t5;
    	let span3;
    	let t6_value = /*item*/ ctx[3].price + "";
    	let t6;
    	let t7;
    	let span4;
    	let t8_value = /*$content*/ ctx[2].defaults.currencySign + "";
    	let t8;
    	let t9;
    	let span5;
    	let t10;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[10](/*item*/ ctx[3]);
    	}

    	return {
    		key: key_1,
    		first: null,
    		c() {
    			div = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "×";
    			t3 = space();
    			span2 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			span3 = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			span4 = element("span");
    			t8 = text(t8_value);
    			t9 = space();
    			span5 = element("span");
    			t10 = space();
    			attr(span0, "class", "amount");
    			attr(span1, "class", "times");
    			attr(span2, "class", "description");
    			attr(span3, "class", "price");
    			attr(span4, "class", "currencysign");
    			attr(span5, "class", "remove icon-trash-bin");
    			attr(div, "class", "wizzard-item-row");
    			this.first = div;
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, span0);
    			append(span0, t0);
    			append(div, t1);
    			append(div, span1);
    			append(div, t3);
    			append(div, span2);
    			append(span2, t4);
    			append(div, t5);
    			append(div, span3);
    			append(span3, t6);
    			append(div, t7);
    			append(div, span4);
    			append(span4, t8);
    			append(div, t9);
    			append(div, span5);
    			append(div, t10);

    			if (!mounted) {
    				dispose = listen(span5, "click", click_handler_1);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$invoice*/ 1 && t0_value !== (t0_value = /*item*/ ctx[3].amount + "")) set_data(t0, t0_value);
    			if (dirty & /*$invoice*/ 1 && t4_value !== (t4_value = /*item*/ ctx[3].description + "")) set_data(t4, t4_value);
    			if (dirty & /*$invoice*/ 1 && t6_value !== (t6_value = /*item*/ ctx[3].price + "")) set_data(t6, t6_value);
    			if (dirty & /*$content*/ 4 && t8_value !== (t8_value = /*$content*/ ctx[2].defaults.currencySign + "")) set_data(t8, t8_value);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$5(ctx) {
    	let wizzard$1;
    	let form;
    	let stepone;
    	let t0;
    	let steptwo;
    	let t1;
    	let div2;
    	let h1;
    	let t3;
    	let label0;
    	let span0;
    	let t5;
    	let input0;
    	let t6;
    	let label1;
    	let span1;
    	let t8;
    	let input1;
    	let t9;
    	let label2;
    	let span2;
    	let t11;
    	let div0;
    	let input2;
    	let t12;
    	let span3;
    	let t14;
    	let button0;
    	let t16;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t17;
    	let div3;
    	let button1;
    	let t19;
    	let button2;
    	let t21;
    	let div4;
    	let button3;
    	let current;
    	let mounted;
    	let dispose;
    	stepone = new StepOne({ props: { state: wizzard, invoice } });
    	steptwo = new StepTwo({ props: { state: wizzard, invoice } });
    	let each_value = /*$invoice*/ ctx[0].items;
    	const get_key = ctx => /*item*/ ctx[3].description;

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	return {
    		c() {
    			wizzard$1 = element("wizzard");
    			form = element("form");
    			create_component(stepone.$$.fragment);
    			t0 = space();
    			create_component(steptwo.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Add Item";
    			t3 = space();
    			label0 = element("label");
    			span0 = element("span");
    			span0.textContent = "Amount";
    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			label1 = element("label");
    			span1 = element("span");
    			span1.textContent = "Description";
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			label2 = element("label");
    			span2 = element("span");
    			span2.textContent = "Price per item";
    			t11 = space();
    			div0 = element("div");
    			input2 = element("input");
    			t12 = space();
    			span3 = element("span");
    			span3.textContent = "€";
    			t14 = space();
    			button0 = element("button");
    			button0.textContent = "Add Item";
    			t16 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t17 = space();
    			div3 = element("div");
    			button1 = element("button");
    			button1.textContent = "Previous";
    			t19 = space();
    			button2 = element("button");
    			button2.textContent = "Next";
    			t21 = space();
    			div4 = element("div");
    			button3 = element("button");
    			button3.textContent = "done";
    			attr(input0, "type", "number");
    			attr(input0, "min", "1");
    			attr(input0, "placeholder", "How many?");
    			attr(label0, "for", "amount");
    			attr(input1, "type", "text");
    			attr(input1, "placeholder", "What is this item about?");
    			attr(label1, "for", "description");
    			attr(input2, "type", "number");
    			attr(input2, "placeholder", "€€€");
    			attr(input2, "width", "8rem");
    			attr(button0, "type", "button");
    			attr(label2, "for", "price");
    			attr(div1, "class", "wizzard-item-container");
    			toggle_class(div2, "hidden", /*$state*/ ctx[1].step !== 3);
    			attr(button1, "type", "button");
    			toggle_class(button1, "hidden", /*$state*/ ctx[1].step === 1);
    			attr(button2, "type", "button");
    			toggle_class(button2, "hidden", /*$state*/ ctx[1].step === stepMax);
    			attr(div3, "class", "action-buttons");
    			attr(button3, "type", "button");
    			attr(div4, "class", "action-buttons");
    			attr(form, "class", "form");
    			toggle_class(wizzard$1, "hidden", !/*$state*/ ctx[1].visible);
    		},
    		m(target, anchor) {
    			insert(target, wizzard$1, anchor);
    			append(wizzard$1, form);
    			mount_component(stepone, form, null);
    			append(form, t0);
    			mount_component(steptwo, form, null);
    			append(form, t1);
    			append(form, div2);
    			append(div2, h1);
    			append(div2, t3);
    			append(div2, label0);
    			append(label0, span0);
    			append(label0, t5);
    			append(label0, input0);
    			set_input_value(input0, /*item*/ ctx[3].amount);
    			append(div2, t6);
    			append(div2, label1);
    			append(label1, span1);
    			append(label1, t8);
    			append(label1, input1);
    			set_input_value(input1, /*item*/ ctx[3].description);
    			append(div2, t9);
    			append(div2, label2);
    			append(label2, span2);
    			append(label2, t11);
    			append(label2, div0);
    			append(div0, input2);
    			set_input_value(input2, /*item*/ ctx[3].price);
    			append(div0, t12);
    			append(div0, span3);
    			append(div0, t14);
    			append(div0, button0);
    			append(div2, t16);
    			append(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append(form, t17);
    			append(form, div3);
    			append(div3, button1);
    			append(div3, t19);
    			append(div3, button2);
    			append(form, t21);
    			append(form, div4);
    			append(div4, button3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(input0, "input", /*input0_input_handler*/ ctx[6]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[7]),
    					listen(input2, "input", /*input2_input_handler*/ ctx[8]),
    					listen(button0, "click", /*click_handler*/ ctx[9]),
    					listen(button1, "click", /*click_handler_2*/ ctx[11]),
    					listen(button2, "click", /*click_handler_3*/ ctx[12]),
    					listen(button3, "click", /*click_handler_4*/ ctx[13])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*item*/ 8 && to_number(input0.value) !== /*item*/ ctx[3].amount) {
    				set_input_value(input0, /*item*/ ctx[3].amount);
    			}

    			if (dirty & /*item*/ 8 && input1.value !== /*item*/ ctx[3].description) {
    				set_input_value(input1, /*item*/ ctx[3].description);
    			}

    			if (dirty & /*item*/ 8 && to_number(input2.value) !== /*item*/ ctx[3].price) {
    				set_input_value(input2, /*item*/ ctx[3].price);
    			}

    			if (dirty & /*removeItem, $invoice, $content*/ 37) {
    				each_value = /*$invoice*/ ctx[0].items;
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div1, destroy_block, create_each_block$1, null, get_each_context$1);
    			}

    			if (dirty & /*$state*/ 2) {
    				toggle_class(div2, "hidden", /*$state*/ ctx[1].step !== 3);
    			}

    			if (dirty & /*$state*/ 2) {
    				toggle_class(button1, "hidden", /*$state*/ ctx[1].step === 1);
    			}

    			if (dirty & /*$state, stepMax*/ 2) {
    				toggle_class(button2, "hidden", /*$state*/ ctx[1].step === stepMax);
    			}

    			if (dirty & /*$state*/ 2) {
    				toggle_class(wizzard$1, "hidden", !/*$state*/ ctx[1].visible);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(stepone.$$.fragment, local);
    			transition_in(steptwo.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(stepone.$$.fragment, local);
    			transition_out(steptwo.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(wizzard$1);
    			destroy_component(stepone);
    			destroy_component(steptwo);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    var stepMax = 3;

    function instance$5($$self, $$props, $$invalidate) {
    	let items;
    	let $invoice;
    	let $state;
    	let $content;
    	component_subscribe($$self, invoice, $$value => $$invalidate(0, $invoice = $$value));
    	component_subscribe($$self, wizzard, $$value => $$invalidate(1, $state = $$value));
    	component_subscribe($$self, content, $$value => $$invalidate(2, $content = $$value));

    	function _extends() {
    		_extends = Object.assign || function (target) {
    			for (var i = 1; i < arguments.length; i++) {
    				var source = arguments[i];

    				for (var key in source) {
    					if (Object.prototype.hasOwnProperty.call(source, key)) {
    						target[key] = source[key];
    					}
    				}
    			}

    			return target;
    		};

    		return _extends.apply(this, arguments);
    	}

    	var item = {};

    	function addItem() {
    		invoice.update(invoice => _extends({}, invoice, { items: [...items, item] }));
    	}

    	function removeItem(item) {
    		var items = $invoice.items.filter(i => i !== item);
    		invoice.update(invoice => _extends({}, invoice, { items }));
    	}

    	function input0_input_handler() {
    		item.amount = to_number(this.value);
    		$$invalidate(3, item);
    	}

    	function input1_input_handler() {
    		item.description = this.value;
    		$$invalidate(3, item);
    	}

    	function input2_input_handler() {
    		item.price = to_number(this.value);
    		$$invalidate(3, item);
    	}

    	const click_handler = () => addItem();
    	const click_handler_1 = item => removeItem(item);
    	const click_handler_2 = () => $state.previous();
    	const click_handler_3 = () => $state.next();
    	const click_handler_4 = () => $state.save();

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$invoice*/ 1) {
    			 items = $invoice.items;
    		}
    	};

    	return [
    		$invoice,
    		$state,
    		$content,
    		item,
    		addItem,
    		removeItem,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class Wizzard extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.2 */

    function create_fragment$6(ctx) {
    	let main;
    	let div;
    	let t0;
    	let contact;
    	let t1;
    	let invoice_1;
    	let t2;
    	let footer;
    	let t3;
    	let nav;
    	let button0;
    	let t5;
    	let button1;
    	let t7;
    	let button2;
    	let t9;
    	let button3;
    	let t11;
    	let img1;
    	let img1_src_value;
    	let t12;
    	let wizzard_1;
    	let current;
    	let mounted;
    	let dispose;
    	contact = new Contact({ props: { content } });
    	invoice_1 = new Invoice({ props: { invoice } });
    	footer = new Footer({});
    	wizzard_1 = new Wizzard({});

    	return {
    		c() {
    			main = element("main");
    			div = element("div");
    			div.innerHTML = `<img src="images/logo.png" alt="logo"/>`;
    			t0 = space();
    			create_component(contact.$$.fragment);
    			t1 = space();
    			create_component(invoice_1.$$.fragment);
    			t2 = space();
    			create_component(footer.$$.fragment);
    			t3 = space();
    			nav = element("nav");
    			button0 = element("button");
    			button0.textContent = "New";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "Edit";
    			t7 = space();
    			button2 = element("button");
    			button2.textContent = "Load";
    			t9 = space();
    			button3 = element("button");
    			button3.textContent = "Save";
    			t11 = space();
    			img1 = element("img");
    			t12 = space();
    			create_component(wizzard_1.$$.fragment);
    			attr(div, "class", "logo");
    			if (img1.src !== (img1_src_value = "images/favicon.svg")) attr(img1, "src", img1_src_value);
    			attr(img1, "alt", "heart");
    			attr(img1, "width", "30px");
    			attr(img1, "height", "30px");
    		},
    		m(target, anchor) {
    			insert(target, main, anchor);
    			append(main, div);
    			append(main, t0);
    			mount_component(contact, main, null);
    			append(main, t1);
    			mount_component(invoice_1, main, null);
    			append(main, t2);
    			mount_component(footer, main, null);
    			insert(target, t3, anchor);
    			insert(target, nav, anchor);
    			append(nav, button0);
    			append(nav, t5);
    			append(nav, button1);
    			append(nav, t7);
    			append(nav, button2);
    			append(nav, t9);
    			append(nav, button3);
    			append(nav, t11);
    			append(nav, img1);
    			insert(target, t12, anchor);
    			mount_component(wizzard_1, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(button0, "click", /*click_handler*/ ctx[3]),
    					listen(button1, "click", /*click_handler_1*/ ctx[4]),
    					listen(button2, "click", /*click_handler_2*/ ctx[5]),
    					listen(button3, "click", /*click_handler_3*/ ctx[6])
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(contact.$$.fragment, local);
    			transition_in(invoice_1.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			transition_in(wizzard_1.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(contact.$$.fragment, local);
    			transition_out(invoice_1.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			transition_out(wizzard_1.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(main);
    			destroy_component(contact);
    			destroy_component(invoice_1);
    			destroy_component(footer);
    			if (detaching) detach(t3);
    			if (detaching) detach(nav);
    			if (detaching) detach(t12);
    			destroy_component(wizzard_1, detaching);
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

    function exportAsPfd() {
    	
    } //window.print();

    function instance$6($$self, $$props, $$invalidate) {
    	let $wizzard;
    	component_subscribe($$self, wizzard, $$value => $$invalidate(0, $wizzard = $$value));

    	onMount(/*#__PURE__*/
    	_asyncToGenerator(function* () {
    		content.set(yield fetch("./private/content.json").then(r => r.json()).then(data => {
    			return data;
    		}));

    		invoice.set(yield fetch("./private/invoice.json").then(r => r.json()).then(data => {
    			return data;
    		}));

    		initKeyboard({ container: document, exportAsPfd });
    	})); //todo: https://joshuaj.co.uk/blog/building-desktop-app-svelte-electron

    	function load() {
    		return _load.apply(this, arguments);
    	}

    	function _load() {
    		_load = _asyncToGenerator(function* () {
    			
    		});

    		return _load.apply(this, arguments);
    	}

    	function save() {
    		return _save.apply(this, arguments);
    	}

    	function _save() {
    		_save = _asyncToGenerator(function* () {
    			
    		});

    		return _save.apply(this, arguments);
    	}

    	const click_handler = () => $wizzard.new();
    	const click_handler_1 = () => $wizzard.edit();
    	const click_handler_2 = () => load();
    	const click_handler_3 = () => save();

    	return [
    		$wizzard,
    		load,
    		save,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
