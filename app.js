
let Clipboard = {
	fallbackCopy: (s) => {
		var textArea = document.createElement("textarea");
		textArea.value = s;
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();

		try {
			var successful = document.execCommand('copy');
			var msg = successful ? 'successful' : 'unsuccessful';
			console.log('Fallback: Copying text command was ' + msg);
		} catch (err) {
			console.error('Fallback: Oops, unable to copy', err);
		}

		document.body.removeChild(textArea);
	},

	copy: (s) => {
		if (!navigator.clipboard) {
			Clipboard.fallbackCopy(s);
			return;
		}
		navigator.clipboard.writeText(s).then(function() {
			console.log('Async: Copying to clipboard was successful!');
		}, function(err) {
			console.error('Async: Could not copy text: ', err);
		});
	}
}


class Config {
	constructor() {
		this.data = {};
		this.load();
	}

	config(id, k, v) {
		this.data[id] || (this.data[id] = {});
		this.data[id][k] = v;
	}

	get(id) {
		return this.data[id];
	}

	load() {
		throw new Error("Not Implemented Yet");
	}
	
	save() {
		throw new Error("Not Implemented Yet");
	}
}

class LSConfig extends Config {
	load() {
		console.log("//TODO: load it from local storage");
	}
	
	save() {
		console.log("//TODO: load it from local storage");
	}

	config(id, k, v) {
		super.config(id, k, v);
		this.save();
	}
}



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
					data[a.dataset.valueAs] = this.$$(a.dataset.valueFrom).value;
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

	Error(id, err) {
		let errEs = this.$(`.${id}`);
		for (let errE of errEs) {
			if (err) {
				errE.classList.add('shown');
				errE.firstChild.nextSibling.innerHTML = err;
			} else {
				errE.classList.remove('shown');
				errE.firstChild.nextSibling.innerHTML = '&nbsp;';
			}
		}
	}

	importSchema() {
		throw new Error('importSchema() is not implemented.')
	}
	
	import(data) {
		throw new Error('import() is not implemented.')
	}
}



class Workbench {
	constructor(config) {
		this.config = config;
		this.tools = {};
		this.currentlyFocusedID = undefined;
	}

	add(tool) {
		this.tools[tool.ID] = tool;
		tool.setBench(this);
		tool.reconfigure(this.config.get(tool.ID));
	}
	
	focus(id) {
		let tool = this.tools[id];
		if (tool && tool.E) {
			tool.E.classList.replace('unfocused', 'focused');
			tool.E.focus();
			window.location.hash = id;
			let af = tool.E.querySelector("[autofocus]");
			if (af) {
				af.focus();
			}

			this.currentlyFocusedID = id;
		}

		document.body.onkeydown = (e) => {
			if (e.key == 'Escape') {
				unfocus(id);
			}
		}
	}

	unfocus(id) {
		let eTool = document.getElementById(id);
		if (eTool) {
			eTool.classList.replace('focused', 'unfocused');
		}
	}

	filter(s) {
		for (let tI in this.tools) {
			let tool = this.tools[tI];
			if (s) {
				for (let sch of s) {
					if (tool.E.dataset.tag && tool.E.dataset.tag.includes(sch)) {
						tool.E.classList.add("matched");
						tool.E.classList.remove("filteredOut");
					} else {
						tool.E.classList.add("filteredOut");
						tool.E.classList.remove("matched");
						break;
					}
				}
			} else {
				tool.E.classList.remove("filteredOut");
				tool.E.classList.remove("matched");
			}
		}
	}

	render() {
		document.body.style.display = 'block';
	}

	switch(toID, data) {
		console.log(`Switching to ${toID}.`, data);
		// this.unfocus(this.currentlyFocusedID);
		let t1 = this.tools[this.currentlyFocusedID];
		let t2 = this.tools[toID];
		let cfid = this.currentlyFocusedID;
		this.tools[toID].import(data);
		this.focus(toID);

		if (t1 && t2) {
			t1.E.classList.add('switching');
			t2.E.classList.add('switching', 'slide-left-r');
			t1.E.classList.add('slide-left-transit');
			t2.E.classList.add('slide-left-transit');
			
			setTimeout((id, _t1, _t2) => {
				_t1.E.classList.remove('switching', 'slide-left-transit');
				_t2.E.classList.remove('switching', 'slide-left-r', 'slide-left-transit');
				this.unfocus(id);
			}, 400, cfid, t1, t2);
		} else {
			throw new Error(`One of the tools not found while switching.`);
		}
	}
}



