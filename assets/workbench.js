/**
 * Workbench controls all the tools.
 */
class Workbench {
	constructor(config) {
		this.config = config;
		this.tools = {};
		this.currentlyFocusedID = undefined;
		this.toolsE = document.getElementById('tools');
	}

	add(tool) {
		this.tools[tool.ID] = tool;
		tool.setBench(this);
		tool.reconfigure(this.config.get(tool.ID));
		this.toolsE.appendChild(tool.E);
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
		let t1 = (this.currentlyFocusedID !== undefined) && this.tools[this.currentlyFocusedID];
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
			throw new Error(`One of the tools was not found while switching.`);
		}
	}
}
