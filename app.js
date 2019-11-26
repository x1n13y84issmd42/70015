
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
		let E = document.getElementById(id);

		super(E);
	
		E.querySelector('.preview').onclick = () => {
			focus(id);
		}

		this.ID = id;
		this.configuration = {};
	
		let ctrls = E.querySelector(".controls");

		//	Creating a "Close" link.
		let eClose = document.createElement("a");
		eClose.innerHTML = "<i>&#x1F860</i><span>CLOSE</span>";
		eClose.classList.add("close");
		eClose.onclick = (e) => {
			unfocus(id);
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
					let data = {};
					data[a.dataset.valueAs] = this.Section(a.dataset.valueFrom).Input().value;
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
			throw new Error(`Could not find a section ${this.sid}.`);
		}
	}

	/**
	 * Creates a component by copying a DOM subtree specified by it's ID attribute
	 * and setting values into specific places.
	 * @param {string} cid Component id. An element with that id will be copied and used as a component. 
	 * The rest of arguments will be used to fill the component template tructure with content.
	 */
	Component() {
		let args = Array.prototype.slice.apply(arguments);
		let compID = args.shift();
		let compE = this.$(`.components .${compID}`)[0];
	
		if (compE) {
			compE = compE.cloneNode(true);
	
			for (let aI in args) {
				if (compE.dataset.arg == aI) {
					this.T(compE, args[aI])
				}

				let nodes = Array.from(compE.querySelectorAll(`[data-arg="${aI}"]`));
				this.T(nodes, args[aI])
			}

			compE.querySelectorAll('.copy').forEach((v, k, p) => {v.onclick = onclickCopyToClipboard});
	
			return compE;
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
	}

	add(tool) {
		this.tools[tool.ID] = tool;
		tool.setBench(this);
		tool.reconfigure(this.config.get(tool.ID));
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
		// this.unfocus(this.currentlyFocusedID);
		let t1 = this.tools[this.currentlyFocusedID];
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
			throw new Error(`One of the tools not found while switching.`);
		}
	}
}



