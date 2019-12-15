let XUI = {
	register: function(compName, ctor) {
		XUIC[compName] = function(instE, args, ctx) {
			if (arguments.length === 1) {
				args = instE;
				instE = document.createElement('div');
			}

			if (!ctx) {
				ctx = new CompContext({});
			}

			let nodes = {};
			let srcE = document.querySelector(`[_comp=${compName}]`);
			let instAttrs = Object.fromEntries(Array.from(instE.attributes).map(attr => [attr.name, attr.value]))

			//	Building the component itself from component source markup.
			let compE = XUI.transform(srcE, instAttrs, args, nodes, ctx);
			XUI.enrich(compE, instAttrs, args, nodes, ctx);
			
			ctor && ctor(compE, nodes, args);
			
			//	Appending possible child nodes of the component instance.
			for (let instEChild of instE.children) {
				(ctx.get('root') || compE).appendChild(XUI.transform(instEChild, instAttrs, args, nodes, ctx.child(compE)));
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
	transform: function(srcE, instAttrs, args, nodes, ctx) {
		let srcEName = srcE.nodeName.toLowerCase();

		if (XUIC[srcEName]) {
			return XUIC[srcEName](srcE, args, ctx);
		} else {
			return XUI.clone(srcE, instAttrs, args, nodes, ctx);
		}
	},
	
	clone: function(srcE, instAttrs, args, nodes, ctx) {
		let compE = srcE.cloneNode();
		
		if (srcE.children && srcE.children.length) {
			for (let srcECN of srcE.children) {
				compE.appendChild(XUI.transform(srcECN, instAttrs, args, nodes, ctx));
			}
		} else {
			compE.innerHTML = srcE.innerHTML;
		}

		XUI.enrich(compE, instAttrs, args, nodes, ctx);
		
		return compE;
	},
	
	enrich: function(compE, comp, args, nodes, ctx) {
		function xeval(s) {
			return s.replace(/\{(.*?)\}/, (a, g1) => {
				comp;
				args;
				return eval(g1);
			});
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
			nodes[compE.getAttribute('xui-as')] = compE;
		}

		//	Saving the node as root for the possible instance children.
		if (compE.hasAttribute('xui-root')) {
			ctx.set('root', compE);
		}
	}
};

let XUIC = {};
