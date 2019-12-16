let XUI = {
	register: function(compName, ctor) {
		XUIC[compName] = function(instE, args, ctx) {
			if (arguments.length < 1) {
				args = instE || {};
				instE = document.createElement('div');
			}

			if (!ctx) {
				ctx = new CompContext({});
			}

			let compNodes = {};
			let srcE = document.querySelector(`[_comp=${compName}]`);
			let instAttrs = Object.fromEntries(Array.from(instE.attributes).map(attr => [attr.name, attr.value]))

			//	Building the component itself from the component source markup.
			let compE = XUI.transform(srcE, instAttrs, args, compNodes, ctx);
			XUI.enrich(compE, instAttrs, args, compNodes, ctx);
			
			ctor && ctor(compE, compNodes, instAttrs, args);
			
			//	Appending possible child nodes of the component instance.
			for (let instEChild of instE.children) {
				(ctx.get('root') || compE).appendChild(XUI.transform(instEChild, instAttrs, args, compNodes, ctx.child(compE)));
			}
			
			return compE;
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
	
	clone: function(srcE, instAttrs, args, compNodes, ctx) {
		let compE = srcE.cloneNode();
		
		if (srcE.children && srcE.children.length) {
			for (let srcECN of srcE.children) {
				compE.appendChild(XUI.transform(srcECN, instAttrs, args, compNodes, ctx));
			}
		} else {
			compE.innerHTML = srcE.innerHTML;
		}

		XUI.enrich(compE, instAttrs, args, compNodes, ctx);
		
		return compE;
	},
	
	/**
	 * Enrichment is when we put various values from either the instance attributes or from the args object into the new component.
	 * When a node or an attribute has a special value in braces {}, that value will be evaluated as JavaScript code,
	 * executed in a context where a couple of objects are available:
	 * 		comp: Attributes from the component instance.
	 * 		args: Values from the arguments object.
	 * @param {HTMLElement} compE A newly created component element.
	 * @param {Object} comp An object containing all the attributes from the component instance.
	 * @param {Object} args Arguments.
	 * @param {Object} compNodes An object to keep specific component nodes (those with 'xui-as' attribute) available in the ctor function later.
	 * @param {CompContext} ctx A composition context.
	 */
	enrich: function(compE, comp, args, compNodes, ctx) {
		function xeval(s) {
			function repl() {
				return s.replace(/\{(.*?)\}/gi, (a, g1) => eval(g1));
			}

			//	Doing it in a loop for transitive evaluations.
			let s1 = repl(s);
			while (s1 != s) {
				s = s1;
				s1 = repl(s);
			}

			return s1;
		}

		//	Replacing text content
		if (compE.innerText && !compE.children.length) {
			compE.innerText = xeval(compE.innerText, args);
		}

		if (compE.value) {
			compE.value = xeval(compE.value, args);
		}

		for (let EAttr of compE.attributes) {
			EAttr.nodeValue = xeval(EAttr.nodeValue, args);
		}

		//	Saving the node for later if requested
		if (compE.hasAttribute('xui-as')) {
			compNodes[compE.getAttribute('xui-as')] = compE;
		}

		//	Saving the node as root for the possible instance children.
		if (compE.hasAttribute('xui-root')) {
			ctx.set('root', compE);
		}

		compE.removeAttribute('_comp');
	}
};

let XUIC = {};
