
let Clipboard = {
	fallbackCopy: (s) => {
		var textArea = document.createElement("textarea");
		textArea.value = s;
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();

		try {
			var successful = document.execCommand('copy');
			var msg = successful ? 'successful' : 'unsuccessful';
			console.log('Fallback: Copying text command was ' + msg);
		} catch (err) {
			console.error('Fallback: Oops, unable to copy', err);
		}

		document.body.removeChild(textArea);
	},

	copy: (s) => {
		if (!navigator.clipboard) {
			Clipboard.fallbackCopy(s);
			return;
		}
		navigator.clipboard.writeText(s).then(function() {
			console.log('Async: Copying to clipboard was successful!');
		}, function(err) {
			console.error('Async: Could not copy text: ', err);
		});
	}
}


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



class Config {
	constructor() {
		this.data = {};
		this.load();
	}

	config(id, k, v) {
		this.data[id] || (this.data[id] = {});
		this.data[id][k] = v;
	}

	get(id) {
		return this.data[id];
	}

	load() {
		throw new Error("Not Implemented Yet");
	}
	
	save() {
		throw new Error("Not Implemented Yet");
	}
}

class LSConfig extends Config {
	load() {
		console.log("//TODO: load it from local storage");
	}
	
	save() {
		console.log("//TODO: load it from local storage");
	}

	config(id, k, v) {
		super.config(id, k, v);
		this.save();
	}
}



class DOMOps {
	constructor(E) {
		this.E = E;
		this.ID = E.id;
	}

	/**
	 * A document.querySelectorAll shortcut.
	 * @param {string} s A selector.
	 */
	$(s) {
		return Array.from(this.E.querySelectorAll(s));
	}

	/**
	 * Retrieves an alement by it's hierarchical ID.
	 * Hierarchical means here that actual HTML tags have both parent ID and it's own ID, separate by dash.
	 * So a "cc" section of a "cards" tools has id="cards-cc" in HTML, and accessible as (new Tool('cards')).$$('cc')
	 * @param {string} id An ID.
	 * @param {any} v A value to set.
	 */
	$$(id, v) {
		let e = document.getElementById(`${this.ID}-${id}`);

		if (e && v) {
			this.T(e, v);
		}
		
		return e;
	}

	/**
	 * Just removed all the child nodes of the given element.
	 * @param {HTMLElement} e An element being spared of paternal rights.
	 */
	removeChildren(e) {
		while (e.firstChild)
			e.removeChild(e.firstChild);
	}

	/**
	 * Set a value to nodes.
	 * @param {HTMLElement} nodes A list of HTML DOM nodes.
	 * @param {any} v A values to set to the nodes.
	 */
	T(nodes, v) {
		if (! (nodes instanceof Array)) {
			if (nodes.length) {
				nodes = Array.from(nodes);
			} else {
				nodes = [nodes];
			}
		}

		for (let e of nodes) {
			switch (e.tagName) {
				case "INPUT":
				case "TEXTAREA":
					e.value = v;
				break;
	
				default:
					e.innerHTML = v;
				break;
			}
		}
	}
}


/**
 * Gives general control over a UI section.
 * A UI section usually includes an input field and few associated extra controls, has some kind of state,
 * and this class provides an interface to control it.
 */
class Section extends DOMOps {
	constructor(node) {
		super(node);
	}

	Show() {
		this.E.classList.remove('hidden');
		return this;
	}
	
	Hide() {
		this.E.classList.add('hidden');
		return this;
	}
	
	Enable() {
		this.E.classList.remove('disabled');
		return this;
	}
	
	/**
	 * Disabled sections have their children controls disabled as well.
	 * "Reuse" menus (via CSS) and "Copy" buttons (in the global click handler).
	 */
	Disable() {
		this.E.classList.add('disabled');
		return this;
	}

	/**
	 * Show an error message.
	 * @param {string} err An error message.
	 */
	Error(err) {
		let errEs = this.$(`.error`);
		for (let errE of errEs) {
			if (err) {
				errE.classList.add('shown');
				errE.firstChild.nextSibling.innerHTML = err;
			} else {
				errE.classList.remove('shown');
				errE.firstChild.nextSibling.innerHTML = '&nbsp;';
			}
		}
		
		if (err) {
			this.E.classList.add('has-error');
		} else {
			this.E.classList.remove('has-error');
		}

		return this;
	}

	/**
	 * Retrieves the main input field of the section.
	 */
	Input() {
		let input = this.$$(`in`);
		if (! input) {
			throw new Error(`Could not find the input in the ${this.ID} section.`);
		}
		return input;
	}
}


class Tool extends DOMOps {
	constructor(id) {
		let E = id;

		if (typeof id == 'string') {
			E = document.getElementById(id);
		}

		super(E);

		this.C = this.$('.controls')[0];
	
		E.querySelector('.preview').onclick = () => {
			focus(this.ID);
		}

		this.configuration = {};
	
		//	Selecting all the checkboxes & radio buttons.
		this.switches = this.$('input[type=radio],input[type=checkbox]');
	}

	config(k, v) {
		this.configuration[k] = v;
	}

	reconfigure(config) {
		this.configuration = config || {};
	}

	setBench(b) {
		this.bench = b;
	}

	/**
	 * Creates a Section object to control a UI section with the specified sid.
	 * @param {string} sid Section ID.
	 */
	Section(sid) {
		let n = this.$$(sid);
		if (n) {
			return new Section(n);
		} else {
			throw new Error(`Could not find a section ${sid}.`);
		}
	}

	/**
	 * Creates a component by copying a DOM subtree specified by it's ID attribute
	 * and setting values into specific places.
	 * @param {string} cid Component id. An element with that id will be copied and used as a component. 
	 * The rest of arguments will be used to fill the component template tructure with content.
	 */
	Component(compID, args) {
		let compE = this.$(`.components .${compID}`)[0];

		if (! compE) {
			compE = document.querySelector(`#components > .${compID}`)
		}
	
		if (compE) {
			compE = Component.New(compE, args);
			compE.querySelectorAll('.copy').forEach((v, k, p) => {v.onclick = onclickCopyToClipboard});
			return compE;
		} else {
			throw new Error(`Could not find a '${compID}' component.`);
		}
	}

	importSchema() {
		throw new Error('importSchema() is not implemented.')
	}
	
	import(data) {
		throw new Error('import() is not implemented.')
	}
}



/**
 * Workbench controls all the tools.
 */
class Workbench {
	constructor(config) {
		this.config = config;
		this.tools = {};
		this.currentlyFocusedID = undefined;
		this.toolsE = document.getElementById('tools');
	}

	add(tool) {
		this.tools[tool.ID] = tool;
		tool.setBench(this);
		tool.reconfigure(this.config.get(tool.ID));
		this.toolsE.appendChild(tool.E);
	}

	get(id) {
		return this.tools[id];
	}
	
	focus(id) {
		let tool = this.tools[id];
		if (tool && tool.E) {
			tool.E.classList.replace('unfocused', 'focused');
			tool.E.focus();
			window.location.hash = id;
			let af = tool.E.querySelector("[autofocus]");
			if (af) {
				af.focus();
			}

			this.currentlyFocusedID = id;
		}

		document.body.onkeydown = (e) => {
			if (e.key == 'Escape') {
				unfocus(id);
			}
		}
	}

	unfocus(id) {
		let eTool = document.getElementById(id);
		if (eTool) {
			eTool.classList.replace('focused', 'unfocused');
		}
	}

	filter(s) {
		for (let tI in this.tools) {
			let tool = this.tools[tI];
			if (s) {
				for (let sch of s) {
					if (tool.E.dataset.tag && tool.E.dataset.tag.includes(sch)) {
						tool.E.classList.add("matched");
						tool.E.classList.remove("filteredOut");
					} else {
						tool.E.classList.add("filteredOut");
						tool.E.classList.remove("matched");
						break;
					}
				}
			} else {
				tool.E.classList.remove("filteredOut");
				tool.E.classList.remove("matched");
			}
		}
	}

	render() {
		document.body.style.display = 'block';
	}

	switch(toID, data) {
		console.log(`Switching to ${toID}.`, data);
		if (!this.tools[toID]) {
			throw new Error(`The tool #${toID} does not exist.`);
		}

		let t1 = (this.currentlyFocusedID !== undefined) && this.tools[this.currentlyFocusedID];
		let t2 = this.tools[toID];
		let cfid = this.currentlyFocusedID;
		this.tools[toID].import(data);
		this.focus(toID);

		if (t1 && t2) {
			t1.E.classList.add('switching');
			t2.E.classList.add('switching', 'slide-left-r');
			t1.E.classList.add('slide-left-transit');
			t2.E.classList.add('slide-left-transit');
			
			setTimeout((id, _t1, _t2) => {
				_t1.E.classList.remove('switching', 'slide-left-transit');
				_t2.E.classList.remove('switching', 'slide-left-r', 'slide-left-transit');
				this.unfocus(id);
			}, 400, cfid, t1, t2);
		} else {
			throw new Error(`One of the tools was not found while switching.`);
		}
	}
}



/**
 * An exercise in component UI frameworks. Inspired by React, based on XHTML.
 */
let XUI = {
	/**
	 * Registers a component and makes it available for use.
	 * There is must be an element in the DOM with a _comp attribute value the same as the passed compValue,
	 * which will be used as a component structure markup.
	 * @param {string} compName A component name.
	 * @param {Function} ctor A constructor function (compE, elements, inst, args)
	 * @param {boolean} container Set to true if you want child nodes of an instance to be autoappended to the root.
	 */
	register: function(compName, ctor, container) {
		container === undefined && (container = true);

		XUIC[compName] = function(instE, args, ctx) {
			if (arguments.length < 2) {
				args = instE || {};
				instE = document.createElement('div');
			}

			if (!ctx) {
				ctx = new CompContext({});
			}

			let compNodes = {};
			let srcE = document.querySelector(`[_comp=${compName}]`);
			let instAttrs = XUI.attributes(instE);

			//	Building the component itself from the component source markup.
			let compE = XUI.transform(srcE, instAttrs, args, compNodes, ctx);
			XUI.enrich(compE, instAttrs, args, compNodes, ctx);
			// compNodes.$root = compNodes.$comp = compE;
			compNodes.$comp = compE;

			//	Constructor
			ctor && ctor(compE, compNodes, instAttrs, args, instE);

			//	Appending possible child nodes of the component instance.
			if (container) {
				for (let instEChild of instE.children) {
					let compEChild = XUI.transform(instEChild, instAttrs, args, compNodes, ctx.child(compE));
					compEChild && (ctx.get('root') || compE).appendChild(compEChild);
				}
			}

			compNodes.$root || (compNodes.$root = compE);

			return XUI.condition(compE, instAttrs, args);
		};
	},

	/**
	 * Either creates a new component from the given srcE node, or clones it.
	 * @param {HTMLElement} srcE A source HTML element to create a component from.
	 * @param {Object} args Arguments.
	 * @param {CompContext} ctx A context.
	 */
	transform: function(srcE, instAttrs, args, compNodes, ctx) {
		let srcEName = srcE.nodeName.toLowerCase();

		if (XUIC[srcEName]) {
			return XUIC[srcEName](srcE, args, ctx);
		} else {
			if (XUI.isHTML5Tag(srcE)) {
				return XUI.clone(srcE, instAttrs, args, compNodes, ctx);
			} else {
				throw new Error(`The element <${srcEName}> is undefined and is not standard.`);
			}
		}
	},

	/**
	 * Checks if a given element name is a standard HTML5 tag.
	 * @param {HTMLElement} e A DOM node to check.
	 */
	isHTML5Tag: function(e) {
		return (e.nodeType === Node.TEXT_NODE) || [
			"a", "abbr", "acronym", "address", "applet", "area", "article", "aside", "audio",
			"b", "base", "basefont", "bdi", "bdo", "big", "blockquote", "body", "br", "button",
			"canvas", "caption", "center", "cite", "code", "col", "colgroup",
			"data", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt",
			"em", "embed",
			"fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset",
			"h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hr", "html",
			"i", "iframe", "img", "input", "ins",
			"kbd",
			"label", "legend", "li", "link",
			"main", "map", "mark", "meta", "meter",
			"nav", "noframes", "noscript",
			"object", "ol", "optgroup", "option", "output",
			"p", "param", "picture", "pre", "progress",
			"q",
			"rp", "rt", "ruby",
			"s", "samp", "script", "section", "select", "small", "source", "span", "strike", "strong", "style", "sub", "summary", "sup", "svg",
			"table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt",
			"u", "ul",
			"var", "video", "wbr"
		].includes(e.nodeName.toLowerCase());
	},

	/**
	 * Performs a deep copy & transformation of the given srcE element.
	 * @param {HTMLElement} srcE An element to clone.
	 * @param {Object} args Arguments.
	 */
	clone: function(srcE, instAttrs, args, compNodes, ctx) {
		let compE = srcE.cloneNode();

		if (srcE.childNodes && srcE.childNodes.length) {
			for (let srcECN of srcE.childNodes) {
				let compECN = XUI.transform(srcECN, instAttrs, args, compNodes, ctx);
				compECN && compE.appendChild(compECN);
			}
		}

		XUI.enrich(compE, instAttrs, args, compNodes, ctx);
		
		return XUI.condition(compE, instAttrs, args);
	},
	
	/**
	 * Enrichment is when we put various values from either the instance attributes or from the args object into the new component.
	 * When a node or an attribute has a special value in braces {}, that value will be evaluated as a JavaScript code,
	 * executed in a context where a couple of objects are available:
	 * 		inst: Attributes from the component instance.
	 * 		args: Values from the arguments object.
	 * @param {HTMLElement} compE A newly created component element.
	 * @param {Object} inst An object containing all the attributes from the component instance.
	 * @param {Object} args Arguments.
	 * @param {Object} compNodes An object to keep specific component nodes (those with 'xui-as' attribute) available in the ctor function later.
	 * @param {CompContext} ctx A composition context.
	 */
	enrich: function(compE, inst, args, compNodes, ctx) {
		//	Replaces occurences of {}-expressions (JS code) with their evaluated results.
		function xeval(s) {
			//	This is available in components to generate hierarchical ids.
			//	Other cool symbols to use: 𐐏 𐐍 𐐝 𐐦 𝛺 𝜴 𝝙 Δ 𝝣 𝝨 𝝮 Ω Σ 
			let Σ = (v) => ctx.id(v);

			function repl() {
				return s.replace(/\{(.*?)\}/gi, (a, g1) => eval(g1));
			}

			//	Doing it in a loop for transitive evaluations, i.e. when a replacement value is a {}-expression itself.
			let s1 = repl(s);
			while (s1 != s) {
				s = s1;
				s1 = repl(s);
			}

			return s1;
		}

		switch (compE.nodeType) {
			case Node.TEXT_NODE:
				compE.nodeValue = xeval(compE.nodeValue);
			break;

			case Node.ELEMENT_NODE:
				//	Replacing text content
				if (compE.innerText && !compE.children.length) {
					compE.innerText = xeval(compE.innerText);
				}
		
				if (compE.value) {
					compE.value = xeval(compE.value);
				}
		
				//	Attributes
				for (let EAttr of compE.attributes) {
					EAttr.nodeValue = xeval(EAttr.nodeValue);
				}

				//TODO: enrich dataset

				//	Saving the node for later if requested
				if (compE.hasAttribute('xui-as')) {
					compNodes[compE.getAttribute('xui-as')] = compE;
					compE.removeAttribute('xui-as');
				}
				
				//	Saving the node as root for the possible instance children.
				if (compE.hasAttribute('xui-root')) {
					ctx.set('root', compE);
					compNodes.$root = compE;
					compE.removeAttribute('xui-root');
				}
		
				compE.removeAttribute('_comp');
			break;
		}
	},

	/**
	 * Evaluates the 'xui-if' attribute and discards the compE in case it's false.
	 * @param {HTMLElement} compE A component DOM node.
	 * @param {Object} inst Instance attributes.
	 * @param {Object} args Arguments.
	 */
	condition: function(compE, inst, args) {
		if (compE.nodeType === Node.ELEMENT_NODE && compE.hasAttribute('xui-if')) {
			let cond = compE.getAttribute('xui-if');
			compE.removeAttribute('xui-if');
			if (!!eval(cond)) {
				return compE;
			}

			return undefined;
		}

		return compE;
	},

	/**
	 * Collects attributes from a DOM node into an objet.
	 * Puts the element's innerText value under the '$' key.
	 * @param {HTMLElement} E An HTML element to grab attributes from.
	 */
	attributes: function(E) {
		return {
			...Object.fromEntries(Array.from(E.attributes).map(attr => [attr.name, attr.value])),
			$: E.innerText,
		};
	}
};

/**
 * Components live here.
 */
let XUIC = {};



