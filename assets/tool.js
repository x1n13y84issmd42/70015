class Tool extends DOMOps {
	constructor(id) {
		let E = id;

		if (typeof id == 'string') {
			E = document.getElementById(id);
		}

		super(E);

		this.C = this.$('.controls')[0];
	
		// E.querySelector('.preview').onclick = () => {
		// 	focus(this.ID);
		// }

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

	/**
	 * Creates a component by copying a DOM subtree specified by it's ID attribute
	 * and setting values into specific places.
	 * @param {string} cid Component id. An element with that id will be copied and used as a component. 
	 * The rest of arguments will be used to fill the component template tructure with content.
	 */
	Component(compID, args) {
		let compE = this.$(`.components .${compID}`)[0];

		if (! compE) {
			compE = document.querySelector(`#components > .${compID}`)
		}
	
		if (compE) {
			compE = Component.New(compE, args);
			compE.querySelectorAll('.copy').forEach((v, k, p) => {v.onclick = onclickCopyToClipboard});
			return compE;
		} else {
			throw new Error(`Could not find a '${compID}' component.`);
		}
	}

	importSchema() {
		throw new Error('importSchema() is not implemented.')
	}
	
	import(data) {
		// throw new Error('import() is not implemented.')
	}
}
