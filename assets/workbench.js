/**
 * Workbench controls all the tools.
 */
class Workbench {
	constructor(config) {
		this.config = config;
		this.tools = {};
		this.toolCtors = {};
		this.equipped = [];
		this.currentlyFocusedID = undefined;
		this.toolsE = document.getElementById('tools');
	}

	add(tool) {
		this.tools[tool.ID] = tool;
		tool.setBench(this);
		tool.reconfigure(this.config.get(tool.ID));
		this.toolsE.appendChild(tool.E);
	}
	
	get(id) {
		return this.tools[id];
	}
	
	register(id, ctor) {
		this.toolCtors[id] = ctor;
	}
	
	equip(id, data) {
		let ctor = this.toolCtors[id];
		if (ctor) {
			data = {
				...data,
				onback: this.equipped.length && 'bench.back()',
				onclose: 'bench.clear()',
				onshare: 'window.share()',
			};

			let tool = new ctor(id, data);
			this.toolsE.appendChild(tool.E);
			tool.import(data);
			tool.setBench(this);
			tool.reconfigure(this.config.get(tool.ID));
			tool.E.classList.replace("unfocused", "focused");
			tool.E.focus();

			let af = tool.E.querySelector("[autofocus]");
			if (af) {
				af.focus();
			}

			window.location.hash = id;
			this.equipped.push(tool);

			return tool;
		}
	}

	back() {
		let tUnequipped = this.equipped.pop();

		function remove() {
			tUnequipped.E.parentNode.removeChild(tUnequipped.E);
		}
		
		if (this.equipped.length) {
			let tNext = this.equipped[this.equipped.length - 1];
			window.location.hash = tNext.ID;
			this.slide(tUnequipped, tNext, 'right', remove)
		} else {
			window.location.hash = '';
			remove();
		}
	}
	
	clear() {
		for (let t of this.equipped) {
			t.E.parentNode.removeChild(t.E);
		}

		this.equipped = [];
	}

	currentlyEquipped() {
		return this.equipped[this.equipped.length - 1];
	}

	/**
	 * Plays a sliding animation for switching tools.
	 * @param {Tool} t1 A tool to animate.
	 * @param {Tool} t2 A tool to animate.
	 * @param {string} dir "left" or "right"
	 * @param {Function} cb A callback function to invoke on animation end.
	 */
	slide(t1, t2, dir, cb) {
		t1.E.classList.add('switching');
		t2.E.classList.add('switching', `slide-${dir}-init`);
		t1.E.classList.add(`slide-${dir}-transit`);
		t2.E.classList.add(`slide-${dir}-transit`);
		
		setTimeout((_t1, _t2) => {
			_t1.E.classList.remove('switching', `slide-${dir}-transit`);
			_t2.E.classList.remove('switching', `slide-${dir}-init`, `slide-${dir}-transit`);
			cb && cb();
		},
		400,	//	This must be the same as in CSS.
		t1, t2);
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

		let t1 = this.equipped[this.equipped.length - 1];
		let t2 = this.equip(toID, data);

		if (t1 && t2) {
			this.slide(t1, t2, "left");
		} else {
			throw new Error(`One of the tools was not found while switching.`);
		}
	}
}
