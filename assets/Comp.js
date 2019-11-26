let CompUtils = {
	newConstructor: function(tag, classes, ctorFn, container) {
		return function(srcE, args, ctx) {
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

	create: function(tag, classes) {
		let E = document.createElement(tag);
		
		if (classes && classes.length) {
			for (let c of classes) {
				E.classList.add(c);
			}
		}

		return E;
	},

	clone: function(srcE, args) {
		let E = srcE.cloneNode();
		E.innerText = srcE.innerText;
		CompUtils.applyArgs(E, args);

		for (let srcECN of srcE.children) {
			E.appendChild(CompUtils.transform(srcECN, args));
		}

		return E;
	},

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

	applyArgs: function(E, args) {
		// return;
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
		let inputE = document.createElement('input');
		inputE.type = 'text';

		if (srcE.attributes.type && srcE.attributes.type.nodeValue === 'area') {
			inputE = document.createElement('textarea');
		}

		srcE.setAttribute('_id', 'in');

		if (srcE.attributes.value) {
			inputE.value = srcE.attributes.value.nodeValue;
		}

		CompUtils.copyAttributes(inputE, srcE, ctx);
		CompUtils.applyArgs(inputE, args, ctx);
		wrapperE.appendChild(inputE);
		
		if (srcE.attributes.label) {
			let labelE = document.createElement('label');
			labelE.innerHTML = srcE.attributes.label.nodeValue;
			labelE.for = inputE.id;
			CompUtils.applyArgs(labelE, args);
			wrapperE.insertBefore(labelE, inputE);
		}
	}),
	
	undercontrols: CompUtils.newConstructor('div', ['undercontrols']),
	
	error: CompUtils.newConstructor('p', ['error']),
	
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

class CompContext {
	constructor(data) {
		this.data = data;
	}

	child(E) {
		let data = {...this.data, reattachChildrenTo: null};
		if (E.id) {
			data.parentID = E.id;
		}
		return new CompContext(data);
	}

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

	get(k) {
		return this.data[k];
	}

	set(k, v) {
		return this.data[k] = v;
	}
}

let Component = {
	New: function(id, args) {
		let srcCompE = id;
		if (typeof id === 'string') {
			srcCompE = document.querySelector(`[_id=${id}]`);
		}
		return CompUtils.transform(srcCompE, args, new CompContext({parentID: undefined}));
	},
};
