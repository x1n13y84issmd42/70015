class Section {
	constructor(node) {
		this.E = node;
		this.ID = node.id;
	}

	$(s) {
		return this.E.querySelectorAll(s);
	}

	$$(id, v) {
		if (v) {
			this.T([document.getElementById(`${this.ID}-${id}`)], v);
		} else {
			return document.getElementById(`${this.ID}-${id}`);
		}
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
	
	Disable() {
		this.E.classList.add('disabled');
		return this;
	}
	
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

	Input() {
		let input = this.$$(`in`);
		if (! input) {
			throw new Error(`Could not find the input in the ${this.ID} section.`);
		}
		return input;
	}
}