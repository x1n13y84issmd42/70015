class Tool {
	constructor(id) {
		let E = this.E = document.getElementById(id);
	
		E.querySelector('.preview').onclick = () => {
			focus(id);
		}

		this.ID = id;
		this._autoinput = false;
		this.configuration = {};
	
		let ctrls = E.querySelector(".controls");

		let eClose = document.createElement("a");
		eClose.innerHTML = "<i>&#x1F860</i><span>CLOSE</span>";
		eClose.classList.add("close");
		eClose.onclick = (e) => {
			unfocus(id);
			e.preventDefault();
			e.cancelBubble=true;
		};

		ctrls.append(eClose);

		this.switches = this.$('input[type=radio],input[type=checkbox]');

		let eSwitches = this.$('.switch');
		for (let eSw of eSwitches) {
			let as = eSw.querySelectorAll('a');
			for (let a of as) {
				a.onclick = () => {
					let data = {};
					data[a.dataset.valueAs] = this.Section(a.dataset.valueFrom).Input().value;
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

	Section(sid) {
		let n = this.$$(sid);
		if (n) {
			return new Section(n);
		} else {
			throw new Error(`Could not find a section ${this.sid}.`);
		}
	}

	autoinput(ai) {
		if (ai) {
			this._autoinput = !!ai;
		} else {
			return this._autoinput;
		}
	}

	removeChildren(e) {
		while (e.firstChild)
			e.removeChild(e.firstChild);
	}

	T(nodes, v) {
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

	Component(s) {
		let args = Array.prototype.slice.apply(arguments);
		let compID = args.shift();
		let compE = this.$(`.components .${compID}`)[0];
	
		if (compE) {
			compE = compE.cloneNode(true);
	
			for (let aI in args) {
				if (compE.dataset.arg == aI) {
					this.T([compE], args[aI])
				}

				let nodes = compE.querySelectorAll(`[data-arg="${aI}"]`);
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
