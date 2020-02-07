class Tool extends DOMOps {
	constructor(id) {
		let E = id;

		if (typeof id == 'string') {
			E = document.getElementById(id);
		}

		super(E);

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
