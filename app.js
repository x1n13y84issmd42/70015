
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
			if (! srcE) {
				srcE = document.createElement('div');
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
			console.log(`Creating a '${srcEName}' component.`);
			return Comp[srcEName](srcE, args, ctx);
		} else {
			console.warn(`Component '${srcEName}' not found.`);
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
		let v = attrE.nodeValue;
		if (v[0] === '#') {
			v = ctx.iid(v.substr(1));
		}
		return v;
	},

	id: function() {
		return Array.from(arguments).map(v=>v.value||v).filter(v=>!!v).join('-');
	}
};

/**
 * Implementation of components.
 * Basically, any custom <tag> in layout has a counterpart here in Comp with the same name,
 * which builds a piece of actual HTML DOM based on the information in the component markup.
 */
let Comp = {
	dialog: CompUtils.newConstructor('div', ['dialog', 'controls'], (dialogE, srcE, args) => {
		if (srcE.attributes.title) {
			let titleE = document.createElement('h1');
			titleE.innerHTML = srcE.attributes.title.nodeValue;
			CompUtils.applyArgs(titleE, args);
			dialogE.appendChild(titleE);
		}
	}),
	
	section: CompUtils.newConstructor('section'),
	
	input: CompUtils.newConstructor('div', [], (wrapperE, srcE, args, ctx) => {
		wrapperE.removeAttribute('id');;

		if (! srcE.attributes._id) {
			srcE.setAttribute('_id', 'in');
		}
		
		let inputE = document.createElement('input');
		inputE.type = 'text';

		if (srcE.attributes.type) {
			switch (srcE.attributes.type.nodeValue) {
				case 'area':
					inputE = document.createElement('textarea');
				break;
				
				default:
					inputE.type = 'radio';
				break;
			}
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
		ctx.set('reattachChildrenTo', controlsE);
		ctx.set('toolID', toolE.id);
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
		let data = {...this.data, reattachChildrenTo: null};
		if (E.id) {
			data.parentID = E.id;
		}
		return new CompContext(data);
	}

	/**
	 * Creates a hierarchical ID by prepending the given id with the 'parentID' value when possible.
	 * @param {string} id An ID.
	 */
	id(id) {
		if (this.data.parentID) {
			return this.data.parentID + '-' + id;
		}

		return id;
	}

	/**
	 * Input ID, i.e. ID of a section's main input field.
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
		return CompUtils.transform(srcCompE, args, new CompContext({parentID: undefined}));
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
 * and this class provides an onterface to control it.
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
	
		E.querySelector('.preview').onclick = () => {
			focus(this.ID);
		}

		this.configuration = {};
	
		let ctrls = E.querySelector(".controls");

		//	Creating a "Close" link.
		let eClose = document.createElement("a");
		eClose.innerHTML = "<i>&#x1F860</i><span>CLOSE</span>";
		eClose.classList.add("close");
		eClose.onclick = (e) => {
			unfocus(this.ID);
			e.preventDefault();
			e.cancelBubble=true;
		};

		ctrls.append(eClose);

		//	Selecting all the checkboxes & radio buttons.
		this.switches = this.$('input[type=radio],input[type=checkbox]');

		//	Wiring the "Reuse" menu.
		let eSwitches = this.$('.switch');
		for (let eSw of eSwitches) {
			let as = eSw.querySelectorAll('a');
			for (let a of as) {
				a.onclick = () => {
					let data = {...a.dataset};
					delete data.to;
					data = Object.fromEntries(Object.entries(data).map(e=>[e[0],document.getElementById(e[1]).value]))
					this.bench.switch(a.dataset.to, data)
				};
			}
		}
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



