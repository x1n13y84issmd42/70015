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
			return XUI.clone(srcE, instAttrs, args, compNodes, ctx);
		}
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
	 * When a node or an attribute has a special value in braces {}, that value will be evaluated as JavaScript code,
	 * executed in a context where a couple of objects are available:
	 * 		inst: Attributes from the component instance.
	 * 		args: Values from the arguments object.
	 * @param {HTMLElement} compE A newly created component element.
	 * @param {Object} comp An object containing all the attributes from the component instance.
	 * @param {Object} args Arguments.
	 * @param {Object} compNodes An object to keep specific component nodes (those with 'xui-as' attribute) available in the ctor function later.
	 * @param {CompContext} ctx A composition context.
	 */
	enrich: function(compE, inst, args, compNodes, ctx) {
		//	Replaces occurences of {}-expressions (JS code) with their evaluated results.
		function xeval(s) {
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

	attributes: function(E) {
		return {
			... Object.fromEntries(Array.from(E.attributes).map(attr => [attr.name, attr.value])),
			$: E.innerText,
		};
	}
};

/**
 * Components live here.
 */
let XUIC = {};
