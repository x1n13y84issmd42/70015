let CompUtils = {
	newConstructor: function(tag, classes, ctorFn, container) {
		return function(srcE, args, ctx) {
			let E = CompUtils.create(tag, classes);
			CompUtils.copyAttributes(E, srcE, ctx);
			CompUtils.applyArgs(E, args);

			ctorFn && ctorFn(E, srcE, args, ctx);
			
			//	The default undefined value means true.
			if (container !== false) {
				let ctxChild = {...ctx};
				if (E.id) {
					ctxChild.parentID = E.id;
				}

				for (let srcEChild of srcE.children) {
					E.appendChild(CompUtils.transform(srcEChild, args, ctxChild));
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
		CompUtils.applyArgs(E, args);

		for (let srcECN of srcE.children) {
			E.appendChild(CompUtils.transform(srcECN, args));
		}

		return E;
	},

	transform: function(srcE, args, ctx) {
		let srcEName = srcE.nodeName.toLowerCase();

		if (Comp[srcEName]) {
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
		if (srcE.id) {
			if (ctx.parentID) {
				E.id = ctx.parentID + '-' + srcE.id;
			} else {
				E.id = srcE.id;
			}
		}

		srcE.classList.forEach(c => E.classList.add(c));

		for (let dsI in srcE.dataset) {
			E.dataset[dsI] = srcE.dataset[dsI];
		}
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
		srcE.id = 'in';

		if (srcE.attributes.value) {
			inputE.value = srcE.attributes.value.nodeValue;
		}

		CompUtils.copyAttributes(inputE, srcE, ctx);
		CompUtils.applyArgs(inputE, args, ctx);
		wrapperE.appendChild(inputE);
		
		if (srcE.attributes.label) {
			let labelE = document.createElement('label');
			labelE.innerHTML = srcE.attributes.label.nodeValue;
			labelE.for = srcE.id;
			CompUtils.applyArgs(labelE, args);
			wrapperE.insertBefore(labelE, inputE);
		}
	}),
	
	undercontrols: CompUtils.newConstructor('div', ['undercontrols']),
	
	error: CompUtils.newConstructor('p', ['error']),
	
	copy: CompUtils.newConstructor('a', ['copy'], (aE, srcE, args, ctx) => {
		srcE.dataset.from && (aE.dataset.from = ctx.parentID + '-' + srcE.dataset.from);
		aE.innerHTML = '<span>Copy</span><i class="far fa-copy"></i>';
		aE.dataset.from = ctx.parentID + '-in';
	}),
	
	reuse: CompUtils.newConstructor('div', ['menu', 'switch'], (menuE, srcE, args) => {
		let span = document.createElement('span');
		span.innerHTML = `${srcE.attributes.title || 'Reuse'}<i class="fas fa-recycle"></i>`;

		let div = document.createElement('div');

		for (let srcChildE of srcE.children) {
			let aE = document.createElement('a');
			aE.dataset.to = srcChildE.nodeName.toLowerCase();

			
			for (let srcChildEAI = 0; srcChildEAI < srcChildE.attributes.length; srcChildEAI++) {
				let srcChildEA = srcChildE.attributes[srcChildEAI];
				aE.dataset[srcChildEA.nodeName] = srcChildEA.nodeValue;
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
	
};

let Component = {
	New: function(id, args) {
		let srcCompE = document.getElementById(id);
		return CompUtils.transform(srcCompE, args, {parentID: undefined});
	},
};
