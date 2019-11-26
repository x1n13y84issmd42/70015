class Tool extends DOMOps {
	constructor(id) {
		let E = id;

		if (typeof id == 'string') {
			E = document.getElementById(id);
		}

		super(E);
	
		E.querySelector('.preview').onclick = () => {
			focus(this.ID);
		}

		this.configuration = {};
	
		let ctrls = E.querySelector(".controls");

		//	Creating a "Close" link.
		let eClose = document.createElement("a");
		eClose.innerHTML = "<i>&#x1F860</i><span>CLOSE</span>";
		eClose.classList.add("close");
		eClose.onclick = (e) => {
			unfocus(this.ID);
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
					let data = {...a.dataset};
					delete data.to;
					data = Object.fromEntries(Object.entries(data).map(e=>[e[0],document.getElementById(e[1]).value]))
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
			throw new Error(`Could not find a section ${sid}.`);
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
