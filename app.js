
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
		let data = {...this.data, root: null};
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
		// return [...(this.data.stack || []), id].join('-');
		return [this.data.parentID, id].filter(v=>!!v).join('-');
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
		let e = this.E.querySelector(`#${this.ID}-${id}`);

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

let DOM = {
	remove: (e) => {
		e && e.parentNode && e.parentNode.removeChild(e);
	},
};


/**
 * Keystroke is a sequence of keys which triggers some function.
 */
class KeyStroke {
	with = [];
	keys = [];
	handler = () => {};

	/**
	 * Specifies the keys you need to hold before starting the keystroke (think shifts, ctrls & alts).
	 * @param {*} keys A keys to hold.
	 */
	with(keys) {
		this.with = keys.slice(0);
	}
	
	/**
	 * Specifies a sequence of keys making a keystroke.
	 * @param {*} keys A sequence of keys in a keystroke.
	 * @param {Function} fn A function to invoke when a keystroke is performed.
	 */
	on(keys) {
		this.keys = keys.slice(0);
	}
	
	/**
	 * Specifies a function to execute on the keystroke.
	 * @param {Function} fn A function to invoke.
	 */
	do(fn) {
		this.handler = fn;
	}

	/**
	 * Specifies a time span during which a keystroke must be executed.
	 * @param {number} t A time span in ms.
	 */
	during(t) {}

	/**
	 * Checks if the given keystroke matches. Called by KeyStrokeHandler.
	 * @param {Array} withKeys A list of keys to hold.
	 * @param {Array} keys A sequence of pressed keys.
	 */
	match(withKeys, keys) {}

}

/**
 * KeyStrokeHandler is a collection of keystrokes.
 */
class KeyStrokeHandler {
	strokes = [];
	
	add(ks) {
		this.strokes.push(ks);
	}

	handleEvent(evt) {
		//TODO:
		//	Store the current sequence here
		//	Count matched strokes (there may be multiple)
		//	If none has matched - reset
	}

	onKeyDown() {

	}

	onKeyUp() {

	}
}

/**
 * The main keyboard input handler. Stores input handlers in a stack,
 * only the last pushed item handles input.
 */
class Input {
	handlers = [];

	push(h) {
		this.handlers.push(h)
	}

	pop() {
		return this.handlers.pop();
	}

	handleEvent(e) {
		if (this.handlers.length) {
			this.handlers[this.handlers.length].handleEvent(e);
		}
	}
}

/*
let ihGlobal = new KeyStrokeHandler();
ihShare.on(['esc']).do(() => bench.back());
ihShare.on(['esc', 'esc', 'esc']).during(200).do(() => bench.closeAll());

let ihShare = new KeyStrokeHandler();
ihShare.with('shift').on(['j', '1']).during(200).do(() => {   });

input.push(ihGlobal);
input.push(ihShare);
input.pop();

[J, C]

let km = {
	J: {
		C: () => {}
	}
};
*/


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
	constructor(id, data) {
		let tt = XUIC.tool(id, data);
		super(tt);

		this.C = this.$('.controls')[0];
	
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

	importSchema() {
		throw new Error('importSchema() is not implemented.')
	}

	import(data) {
		// throw new Error('import() is not implemented.')
	}
}


/**
 * Workbench controls all the tools.
 */
class Workbench {
	constructor(config) {
		this.config = config;
		this.tools = {};
		this.toolCtors = {};
		this.equipped = [];
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
	
	register(id, ctor) {
		this.toolCtors[id] = ctor;
	}
	
	equip(id, data) {
		let ctor = this.toolCtors[id];
		if (ctor) {
			data = {
				...data,
				onback: this.equipped.length && 'bench.back()',
				onclose: 'bench.clear()',
				onshare: 'window.share()',
			};

			let tool = new ctor(id, data);
			this.toolsE.appendChild(tool.E);
			tool.import(data);
			tool.setBench(this);
			tool.reconfigure(this.config.get(tool.ID));
			tool.E.classList.replace("unfocused", "focused");
			
			window.location.hash = id;
			this.equipped.push(tool);
			
			//TODO: fixme. This is so wrong.
			setTimeout(() => {
				tool.E.focus();
				let af = tool.E.querySelector("[autofocus]");
				if (af) {
					af.focus();
				}
            }, 0);

			return tool;
		}
	}

	back() {
		let tUnequipped = this.equipped.pop();

		function remove() {
			tUnequipped.E.parentNode.removeChild(tUnequipped.E);
		}
		
		if (this.equipped.length) {
			let tNext = this.equipped[this.equipped.length - 1];
			window.location.hash = tNext.ID;
			this.slide(tUnequipped, tNext, 'right', remove)
		} else {
			window.location.hash = '';
			remove();
		}

		if (this.equipped.length == 0) {
			filter.focus();
		}
	}
	
	clear() {
		for (let t of this.equipped) {
			t.E.parentNode.removeChild(t.E);
		}

		this.equipped = [];

		filter.focus();
	}

	currentlyEquipped() {
		return this.equipped[this.equipped.length - 1];
	}

	/**
	 * Plays a sliding animation for switching tools.
	 * @param {Tool} t1 A tool to animate.
	 * @param {Tool} t2 A tool to animate.
	 * @param {string} dir "left" or "right"
	 * @param {Function} cb A callback function to invoke on animation end.
	 */
	slide(t1, t2, dir, cb) {
		t1.E.classList.add('switching');
		t2.E.classList.add('switching', `slide-${dir}-init`);
		t1.E.classList.add(`slide-${dir}-transit`);
		t2.E.classList.add(`slide-${dir}-transit`);
		
		setTimeout((_t1, _t2) => {
			_t1.E.classList.remove('switching', `slide-${dir}-transit`);
			_t2.E.classList.remove('switching', `slide-${dir}-init`, `slide-${dir}-transit`);
			cb && cb();
		},
		400,	//	This must be the same as in CSS.
		t1, t2);
	}

	render() {
		document.body.style.display = 'block';
	}

	switch(toID, data) {
		console.log(`Switching to ${toID}.`, data);

		let t1 = this.equipped[this.equipped.length - 1];
		let t2 = this.equip(toID, data);

		if (t1 && t2) {
			this.slide(t1, t2, "left");
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
		compName = compName.toLowerCase();
		container === undefined && (container = true);

		XUIC[compName] = function(instE, args, ctx) {
			if (arguments.length < 2) {
				args = instE || {};
				instE = document.createElement('div');
			}

			if (!ctx) {
				ctx = new CompContext({});
			}

			if (typeof instE == 'string') {
				instE = document.querySelector(`[_id=${instE}]`)
			}

			let elements = {};
			let srcE = document.querySelector(`[_comp=${compName}]`);
			let instAttrs = XUI.attributes(instE, args, ctx);

			//	Building the component itself from the component source markup.
			let compE = XUI.transform(srcE, instAttrs, args, elements, ctx);
			XUI.enrich(compE, instAttrs, args, elements, ctx);

			elements.$comp = compE;
			elements.$inst = instE;

			//	Constructor
			ctor && ctor(elements, instAttrs, args, ctx);

			//	Appending possible child nodes of the component instance.
			if (container) {
				for (let instEChild of instE.children) {
					let compEChild = XUI.transform(instEChild, instAttrs, args, elements, ctx.child(compE));
					compEChild && (ctx.get('root') || compE).appendChild(compEChild);
				}
			}

			elements.$root || (elements.$root = compE);

			return XUI.condition(compE, instAttrs, args);
		};
	},

	/**
	 * Either creates a new component from the given srcE node, or clones it.
	 * @param {HTMLElement} srcE A source HTML element to create a component from.
	 * @param {Object} args Arguments.
	 * @param {CompContext} ctx A context.
	 */
	transform: function(srcE, instAttrs, args, elements, ctx) {
		let srcEName = srcE.nodeName.toLowerCase();

		if (XUIC[srcEName]) {
			return XUIC[srcEName](srcE, args, ctx);
		} else {
			if (XUI.isHTML5Tag(srcE)) {
				return XUI.clone(srcE, instAttrs, args, elements, ctx);
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
		return (e.nodeType === Node.TEXT_NODE) || (e.nodeType === Node.COMMENT_NODE) || [
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
	clone: function(srcE, instAttrs, args, elements, ctx) {
		let compE = srcE.cloneNode();

		if (srcE.childNodes && srcE.childNodes.length) {
			for (let srcECN of srcE.childNodes) {
				let compECN = XUI.transform(srcECN, instAttrs, args, elements, ctx);
				compECN && compE.appendChild(compECN);
			}
		}

		XUI.enrich(compE, instAttrs, args, elements, ctx);
		
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
	 * @param {Object} elements An object to keep specific component nodes (those with 'xui-as' attribute) available in the ctor function later.
	 * @param {CompContext} ctx A composition context.
	 */
	enrich: function(compE, inst, args, elements, ctx) {
		switch (compE.nodeType) {
			case Node.TEXT_NODE:
				compE.nodeValue = XUI.eval(compE.nodeValue, inst, args, ctx);
			break;

			case Node.ELEMENT_NODE:
				//	Replacing text content
				if (compE.innerText && !compE.children.length) {
					compE.innerText = XUI.eval(compE.innerText, inst, args, ctx);
				}
		
				if (compE.value) {
					compE.value = XUI.eval(compE.value, inst, args, ctx);
				}
		
				//	Attributes
				for (let EAttr of compE.attributes) {
					EAttr.nodeValue = XUI.eval(EAttr.nodeValue, inst, args, ctx);
				}

				//TODO: enrich dataset

				//	Saving the node for later if requested
				if (compE.hasAttribute('xui-as')) {
					elements[compE.getAttribute('xui-as')] = compE;
					compE.removeAttribute('xui-as');
				}
				
				//	Saving the node as root for the possible instance children.
				if (compE.hasAttribute('xui-root')) {
					ctx.set('root', compE);
					elements.$root = compE;
					compE.removeAttribute('xui-root');
				}
		
				compE.removeAttribute('_comp');
			break;
		}
	},

	/**
	 * Replaces occurences of {}-expressions (JS code) with their evaluated results.
	 * @param {*} exp An expression to evaluate.
	 */
	eval(exp, inst, args, ctx) {
		//	These are available in components to generate ids.
		//	Other cool symbols to use: 𐐏 𐐍 𐐝 𐐦 𝛺 𝜴 𝝙 Δ 𝝣 𝝨 𝝮 Ω Σ 
		let Σ = (v) => ctx.id(v);
		let Δ = (v) => ctx.iid(v);
		
		if (! ctx) {
			Σ = (v) => v;
			Δ = (v) => v;
		}

		function repl(s) {
			let wasFunction = false;

			if (typeof s == 'string') {
				s = s.replace(/\{(.*?)\}/gi, (a, g1) => {
					let replacement = eval(g1) || '';
					if (typeof replacement == 'function') {
						wasFunction = replacement;
					}
					return replacement;
				});
			}

			//	This allows correct closures in args.
			return wasFunction || s;
		}

		//	Doing it in a loop for transitive evaluations, i.e. when a replacement value is a {}-expression itself.
		let s1 = repl(exp);
		while (s1 != exp) {
			exp = s1;
			s1 = repl(exp);
		}

		return s1;
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
	 * @param {Object} args Arguments.
	 */
	attributes: function(E, args, ctx) {
		return {
			...Object.fromEntries(Array.from(E.attributes).map(attr => [attr.name, XUI.eval(attr.value, {}, args, ctx)])),
			$: E.innerText,
		};
	},

	/**
	 * Performs an inplace rendering of a DOM subtree. Replaces the given element with a newly created one.
	 * @param {HTMLElement} E An element to render.
	 * @param {Object} args Arguments.
	 */
	render: function(E, args) {
		let pE = E.parentNode;
		let nsE = E.nextSibling;
		pE.removeChild(E);
		pE.insertBefore(
			XUI.transform(E, XUI.attributes(E, args), args || {}, {}, new CompContext({})),
			nsE
		);
	}
};

/**
 * Components live here.
 */
let XUIC = {};


