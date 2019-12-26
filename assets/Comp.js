let CompUtils = {
	/**
	 * Creates a default consuctor function which allows to create a standard HTML tag, which will be the component's root element
	 * (often the only one, though). The created element gets it's attributes copied from the source component element,
	 * and data from the arguments object.
	 * The additionally supplied constructor function is there to additionally configure the created element and create some extra elements.
	 * @param {string} tag An HTML element name to create.
	 * @param {string[]} classes A list of CSS classes to apply to the new element.
	 * @param {Function} ctorFn A constructor function to fine tune the element's internals.
	 * @param {boolean} container When set to true, then entire component subtree will be processed automatically.
	 */
	newConstructor: function(tag, classes, ctorFn, container, ignoredAttributes) {
		return function(srcE, args, ctx) {
			if (!srcE) {
				srcE = document.createElement('div');
			} else if (arguments.length === 1) {
				//	When calling Comp.someComp({...args...})
				args = srcE;
				srcE = document.createElement('div');
				ctx = new CompContext({})
			}

			let E = CompUtils.create(tag, classes);
			CompUtils.copyAttributes(E, srcE, ctx, ignoredAttributes);
			CompUtils.applyArgs(E, args);

			ctorFn && ctorFn(E, srcE, args, ctx);
			
			//	The default undefined value means true.
			if (container !== false) {
				for (let srcEChild of srcE.children) {
					(ctx.get('reattachChildrenTo') || E).appendChild(CompUtils.transform(srcEChild, args, ctx.child(E)));
				}
			}
			
			return E;
		};
	},

	/**
	 * A generic function to create HTML DOM elements.
	 * @param {string} tag An HTML element name to create.
	 * @param {string[]} classes A list of class names to apply. 
	 */
	create: function(tag, classes) {
		let E = document.createElement(tag);
		
		if (classes && classes.length) {
			for (let c of classes) {
				E.classList.add(c);
			}
		}

		return E;
	},

	/**
	 * Performs a shallow copy of the given srcE element. Used as a pass-through function for standard HTML elements.
	 * The child elements of those still get processed and transformed as usual.
	 * @param {HTMLElement} srcE An element to clone.
	 * @param {Object} args Arguments.
	 */
	clone: function(srcE, args, ctx) {
		let E = srcE.cloneNode();

		if (srcE.children && srcE.children.length) {
			for (let srcECN of srcE.children) {
				E.appendChild(CompUtils.transform(srcECN, args, ctx));
			}
		} else {
			E.innerText = srcE.innerText;
			CompUtils.applyArgs(E, args);
		}

		return E;
	},

	/**
	 * Either creates a new component from the given srcE node, or clones it.
	 * @param {HTMLElement} srcE A source HTML element to create a component from.
	 * @param {Object} args Arguments.
	 * @param {CompContext} ctx A context.
	 */
	transform: function(srcE, args, ctx) {
		let srcEName = srcE.nodeName.toLowerCase();

		if (Comp[srcEName]) {
			// console.log(`Creating a '${srcEName}' component.`);
			return Comp[srcEName](srcE, args, ctx);
		} else {
			// console.warn(`Component '${srcEName}' not found.`);
			return CompUtils.clone(srcE, args, ctx);
		}
	},

	/**
	 * Replaces occurences of variables ${} in a DOM object's attributes,
	 * and replaces them with values from the corresponding fields in args. 
	 * @param {HTMLElement} E A subject HTML DOM element.
	 * @param {Object} args An arguments object.
	 */
	applyArgs: function(E, args) {
		function applyArgsToString(s) {
			if (args) {
				for (let aN in args) {
					s = s.replace('${' + aN + "}", args[aN]);
				}
			}
			return s;
		}

		if (E.innerText) {
			E.innerText = applyArgsToString(E.innerText, args);
		}

		if (E.value) {
			E.value = applyArgsToString(E.value, args);
		}

		for (let EAttr of E.attributes) {
			EAttr.nodeValue = applyArgsToString(EAttr.nodeValue, args);
		}
	},

	/**
	 * Copies various attributes from the source component element to the new DOM element, such as _id, CSS classes, data-* and others.
	 * @param {HTMLElement} E An HTML element, corresponding to the source element of the component template (srcE).
	 * @param {HTMLElement} srcE A source root element of a component template.
	 * @param {CompContext} ctx A context.
	 * @param {string[]} ignoredAttributes A list of tag attributes to not include in copy.
	 */
	copyAttributes: function(E, srcE, ctx, ignoredAttributes) {
		ignoredAttributes = [].concat(ignoredAttributes, ['_id']);

		if (srcE.attributes._id) {
			E.id = ctx.id(srcE.attributes._id.nodeValue);
		}

		srcE.classList.forEach(c => E.classList.add(c));

		for (let dsI in srcE.dataset) {
			E.dataset[dsI] = srcE.dataset[dsI];
		}

		for (let aI = 0; aI < srcE.attributes.length; aI++) {
			let attr = srcE.attributes[aI];
			if (ignoredAttributes && ignoredAttributes.includes(attr.name)) {
				//
			} else {
				E.setAttribute(attr.name, attr.value);
			}
		}
	},

	attributeValue: function(attrE, ctx) {
		if (attrE) {
			let v = attrE.nodeValue;
			if (v[0] === '#') {
				v = ctx.iid(v.substr(1));
			}
			return v;
		}
		return '';
	},

	id: function() {
		return Array.from(arguments).map(v=>v.value||v).filter(v=>!!v).join('-');
	},

	chooseHandler: function(E, args, n) {
		if (args[n] && typeof args[n] === 'function') {
			return args[n];
		} else if (E.attributes[n]) {
			let hn = E.attributes[n].value;
			if (window[hn] && typeof window[hn] === 'function') {
				return window[hn];
			} else {
				throw new Error(`The handler '${hn}' from attributes does not exist in the window object or is not a function.`);
			}
		}
	}
};

/**
 * Implementation of components.
 * Basically, any custom <tag> in layout has a counterpart here in Comp with the same name,
 * which builds a piece of actual HTML DOM based on the information in the component markup.
 */
let Comp = {
	dialog: CompUtils.newConstructor('div', ['dialog', 'controls'], (dialogE, srcE, args, ctx) => {
		if (srcE.attributes.title) {
			let titleE = document.createElement('h1');
			titleE.innerHTML = srcE.attributes.title.nodeValue;
			CompUtils.applyArgs(titleE, args);
			dialogE.appendChild(titleE);
		}
		ctx.set('toolID', dialogE.id);
	}),
	
	section: CompUtils.newConstructor('section'),
	
	input: CompUtils.newConstructor('div', [], (wrapperE, srcE, args, ctx) => {
		wrapperE.removeAttribute('id');;

		if (! srcE.attributes._id) {
			srcE.setAttribute('_id', 'in');
		}
		
		let inputE = document.createElement('input');
		inputE.type = 'text';

		if (srcE.getAttribute('type') === 'area') {
			inputE = document.createElement('textarea');
		}

		if (srcE.attributes.value) {
			inputE.value = srcE.attributes.value.nodeValue;
		}

		CompUtils.copyAttributes(inputE, srcE, ctx);
		CompUtils.applyArgs(inputE, args, ctx);
		wrapperE.appendChild(inputE);
		
		if (srcE.attributes.label) {
			let labelE = document.createElement('label');
			labelE.innerHTML = srcE.attributes.label.nodeValue;
			labelE.htmlFor = inputE.id;
			CompUtils.applyArgs(labelE, args);
			wrapperE.insertBefore(labelE, inputE);
		}
	}, false, ['type', 'rows', 'cols', 'spellcheck', 'disabled', 'autofocus', 'tabindex', 'label']),

	radio: CompUtils.newConstructor('label', [], (labelE, srcE, args, ctx) => {
		let radioE = document.createElement("input");
		radioE.type = "radio";
		srcE.attributes.name && (radioE.name = CompUtils.id(ctx.get('parentID'), srcE.attributes.name));
		radioE.value = srcE.attributes.value.value;
		labelE.appendChild(radioE);
		labelE.appendChild(document.createTextNode(srcE.innerText));
		radioE.id = labelE.htmlFor = CompUtils.id(ctx.get('parentID'), srcE.attributes.name, srcE.attributes._id);
		labelE.removeAttribute('id');
	}, false, ['name', 'value']),

	checkbox: CompUtils.newConstructor('label', [], (labelE, srcE, args, ctx) => {
		let checkE = document.createElement("input");
		checkE.type = "checkbox";
		srcE.attributes.name && (checkE.name = CompUtils.id(ctx.get('parentID'), srcE.attributes.name.value));
		srcE.attributes.value && (checkE.value = srcE.attributes.value.value);
		labelE.appendChild(checkE);
		labelE.appendChild(document.createTextNode(srcE.innerText));
		checkE.id = labelE.htmlFor = CompUtils.id(ctx.get('parentID'), srcE.attributes._id);
		labelE.removeAttribute('id');
	}, false, ['name', 'value']),

	overcontrols: CompUtils.newConstructor('div', ['overcontrols']),

	undercontrols: CompUtils.newConstructor('div', ['undercontrols'], (ucE, srcE, args, ctx) => {
		if (srcE.attributes.error) {
			ucE.appendChild(Comp.error(undefined, args, ctx));
		}
	}),
	
	error: CompUtils.newConstructor('p', ['error'], (errorE, srcE, args, ctx) => {
		errorE.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>&nbsp;</span>';
	}),
	
	copy: CompUtils.newConstructor('a', ['copy'], (aE, srcE, args, ctx) => {
		srcE.attributes.from && (aE.dataset.from = CompUtils.attributeValue(srcE.attributes.from, ctx));
		aE.innerHTML = '<span>Copy</span><i class="far fa-copy"></i>';
		aE.onclick = (e) => {
			let handler = srcE.getAttribute('handler');
			handler && eval(handler);
		}
	}),
	
	reuse: CompUtils.newConstructor('div', ['menu', 'switch'], (menuE, srcE, args, ctx) => {
		let span = document.createElement('span');
		span.innerHTML = `${srcE.attributes.title || 'Reuse'}<i class="fas fa-recycle"></i>`;

		let div = document.createElement('div');

		for (let srcChildE of srcE.children) {
			let aE = document.createElement('a');
			aE.dataset.to = srcChildE.nodeName.toLowerCase();

			
			for (let srcChildEAI = 0; srcChildEAI < srcChildE.attributes.length; srcChildEAI++) {
				let srcChildEA = srcChildE.attributes[srcChildEAI];
				aE.dataset[srcChildEA.nodeName] = CompUtils.attributeValue(srcChildEA, ctx);
			}
			
			aE.innerText = srcChildE.innerText;
			
			aE.onclick = (e) => {
				let aSwitchData = {};
				for (let eDN in e.target.dataset) {
					aSwitchData[eDN] = e.target.dataset[eDN];

					//	May be a reference by id
					if (window[aSwitchData[eDN]]) {
						aSwitchData[eDN] = window[aSwitchData[eDN]].value;
					}
				}

				bench.switch(aE.dataset.to, aSwitchData);
			}

			div.appendChild(aE);
		}

		menuE.appendChild(span);
		menuE.appendChild(div);
	}, false),

	tool: CompUtils.newConstructor('div', ['tool', 'unfocused'], (toolE, srcE, args, ctx) => {
		let previewE = CompUtils.create('div', ['preview']);
		previewE.innerHTML = `<h1>${srcE.attributes.name.nodeValue}</h1>`;
		toolE.appendChild(previewE);
		
		let controlsE = CompUtils.create('div', ['controls', 'smaller']);
		toolE.appendChild(controlsE);

		let sidebarE = CompUtils.create('div', ['sidebar']);
		let onclose = CompUtils.chooseHandler(srcE, args, 'onclose');
		let onshare = CompUtils.chooseHandler(srcE, args, 'onshare');

		if (onclose) {
			sidebarE.appendChild(Comp.close(undefined, {id: toolE.id, handler: onclose}, ctx));
		}

		if (onshare) {
			sidebarE.appendChild(Comp.share(undefined, {id: toolE.id, handler: onshare}, ctx));
		}
		
		toolE.appendChild(sidebarE);

		ctx.set('reattachChildrenTo', controlsE);
		ctx.set('toolID', toolE.id);
	}),

	closeIcon: CompUtils.newConstructor('a', ['close'], (closeE, srcE, args, ctx) => {
		closeE.innerHTML = '<i class="far fa-times-circle"></i><span>CLOSE</span>';
		closeE.onclick = (e) => {
			args.handler(args.id);
			
			e.preventDefault();
			e.cancelBubble=true;
		};
	}),
	
	shareIcon: CompUtils.newConstructor('a', ['share'], (shareE, srcE, args, ctx) => {
		shareE.innerHTML = '<i class="far fa-share-square"></i><span>SHARE</span>';
		shareE.onclick = (e) => {
			args.handler(args.id);
			
			e.preventDefault();
			e.cancelBubble=true;
		};
	}),

	back: CompUtils.newConstructor('a', ['close'], (closeE, srcE, args, ctx) => {
		closeE.innerHTML = "<i>&#x1F860;</i><span>BACK</span>";
		closeE.onclick = (e) => {
			args.handler(args.id);
			
			e.preventDefault();
			e.cancelBubble=true;
		};
	}),

	close: CompUtils.newConstructor('a', ['close'], (closeE, srcE, args, ctx) => {
		closeE.innerHTML = "<i>&#x1f7a9;</i><span>CLOSE</span>";
		closeE.onclick = (e) => {
			args.handler(args.id);
			
			e.preventDefault();
			e.cancelBubble=true;
		};
	}),
	
	share: CompUtils.newConstructor('a', ['share'], (shareE, srcE, args, ctx) => {
		// shareE.innerHTML = "<i>&#x1f861;</i><i>&#x2610;</i><span>CLOSE</span>";
		// shareE.innerHTML = "<i>&#x1f861;</i><i>&#x2423;</i><span>SHARE</span>";
		shareE.innerHTML = "<i>#</i><span>SHARE</span>";
		shareE.onclick = (e) => {
			args.handler(args.id, e);
			
			e.preventDefault();
			e.cancelBubble=true;
		};
	}),

	kvPair: CompUtils.newConstructor('div', ['kvpair', 'kv'], (kvE, srcE, args, ctx) => {
		let kE = CompUtils.create('span', ['key']);
		let vE = CompUtils.create('span', ['value']);
		kE.innerHTML = args.k;
		vE.innerHTML = args.v;
		kvE.appendChild(kE);
		kvE.appendChild(vE);

		vE.onclick = (e) => {
			let from = e.currentTarget;
			if (from) {
				Clipboard.copy(from.innerHTML);
				tmpStyle(from, 'copied', 200);
				copiedFloater(e.pageX, e.pageY);
			}
		}
	}),
	
	kvSection: CompUtils.newConstructor('div', ['kvpair', 'kvsection'], (kvsE, srcE, args, ctx) => {
		let kE = CompUtils.create('span', ['key']);
		kE.innerHTML = args.label;
		kvsE.appendChild(kE);
	}),
};

/**
 * A composition context. Keeps track of some useful bits of data during construction of a Component.
 */
class CompContext {
	constructor(data) {
		this.data = data;
	}

	/**
	 * Creates a child context, keeps parent ID.
	 * @param {HTMLElement} E A parent element, corresponding to the child context being created.
	 */
	child(E) {
		let data = {...this.data, reattachChildrenTo: null, root: null};
		if (E.id) {
			data.parentID = E.id;
			data.stack = [...(this.data.stack || []), E.id];
		}
		return new CompContext(data);
	}

	/**
	 * Creates a hierarchical ID by joining whatever is in the data.stack array.
	 * @param {string} id An ID.
	 */
	id(id) {
		return [...(this.data.stack || []), id].join('-');
	}

	/**
	 * Input ID, i.e. ID of a section's main input field. Contains a tool ID, a section ID, and a special input "in" ID.
	 * @param {string} id A section id.
	 */
	iid(id) {
		return [this.data.toolID, id, 'in'].filter(v=>!!v).join('-');
	}

	/**
	 * A data getter.
	 * @param {string} k A key.
	 */
	get(k) {
		return this.data[k];
	}

	/**
	 * A data setter.
	 * @param {string} k A key.
	 * @param {*} v A value to set.
	 */
	set(k, v) {
		return this.data[k] = v;
	}
}

let Component = {
	/**
	 * Creates a new component from the given ID of an HTML DOM node.
	 * @param {string | HTMLElement} id Either a string ID or an HTML element.
	 * @param {Object} args Arguments.
	 */
	New: function(id, args) {
		let srcCompE = id;
		if (typeof id === 'string') {
			srcCompE = document.querySelector(`[_id=${id}]`);
		}
		return CompUtils.transform(srcCompE, args || {}, new CompContext({}));
	},

	NewElement: function(tag, classes, args) {
		return CompUtils.create(tag, classes);
	},
};
