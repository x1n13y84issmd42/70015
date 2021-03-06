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
		this.E.querySelectorAll('input').forEach(e => e.disabled = false);
		this.E.querySelectorAll('textarea').forEach(e => e.disabled = false);
		return this;
	}
	
	/**
	 * Disabled sections have their children controls disabled as well.
	 * "Reuse" menus (via CSS) and "Copy" buttons (in the global click handler).
	 */
	Disable() {
		this.E.classList.add('disabled');
		this.E.querySelectorAll('input').forEach(e => e.disabled = true);
		this.E.querySelectorAll('textarea').forEach(e => e.disabled = true);
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
				errE.firstElementChild.nextElementSibling.innerHTML = err;
			} else {
				errE.classList.remove('shown');
				errE.firstElementChild.nextElementSibling.innerHTML = '&nbsp;';
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