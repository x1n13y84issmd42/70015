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
	newConstructor: function(tag, classes, ctorFn, container) {
		return function(srcE, args, ctx) {
			if (! srcE) {
				srcE = document.createElement('div');
			}

			let E = CompUtils.create(tag, classes);
			CompUtils.copyAttributes(E, srcE, ctx);
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
	 */
	copyAttributes: function(E, srcE, ctx) {
		if (srcE.attributes._id) {
			E.id = ctx.id(srcE.attributes._id.nodeValue);
		}

		srcE.classList.forEach(c => E.classList.add(c));

		for (let dsI in srcE.dataset) {
			E.dataset[dsI] = srcE.dataset[dsI];
		}
	},

	attributeValue: function(attrE, ctx) {
		let v = attrE.nodeValue;
		if (v[0] === '#') {
			v = ctx.iid(v.substr(1));
		}
		return v;
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
		wrapperE.id = null;
		delete wrapperE.id;

		if (! srcE.attributes._id) {
			srcE.setAttribute('_id', 'in');
		}
		
		let inputE = document.createElement('input');
		inputE.type = 'text';

		if (srcE.attributes.type && srcE.attributes.type.nodeValue === 'area') {
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
	}),
	
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
