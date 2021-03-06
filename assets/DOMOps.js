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

	/**
	 * Temporarily applies a class to an element. The class is removed after the specified amount of time passes.
	 * @param {HTMLElement} e An element to style.
	 * @param {string} className A class name to apply temporarily.
	 * @param {number} time A time period the class should be removed after.
	 */
	tmpStyle: (e, className, time) => {
		e.classList.add(className);
		setTimeout(() => {
			e.classList.remove(className);
		}, time);
	}
};
