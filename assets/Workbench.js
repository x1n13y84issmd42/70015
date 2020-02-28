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
			tool.E.classList.add('appearing-init');
			
			window.location.hash = id;
			this.equipped.push(tool);
			
			//	Focusing the autofocus elements.
			//TODO: fixme. This is so wrong.
			setTimeout(() => {
				tool.E.focus();
				let af = tool.E.querySelector("[autofocus]");
				if (af) {
					af.focus();
				}
			}, 0);
			
			//	Animating the tool as it's appearing.
			let tt = 100, t = -tt;
			for (let cn of tool.C.childNodes) {
				setTimeout((n) => {
					n.classList.add('appearing');
				}, t += tt, cn)
			}
			
			t += (200 - tt);	//	200ms is animation length in CSS
			
			//	Removing the classes after animation is over (they break z-index by having scale() somehow).
			setTimeout((_tool) => {
				_tool.E.classList.remove('appearing-init');
				for (let cn of _tool.C.childNodes) {
					cn.classList.remove('appearing');
				}
			}, t, tool);

			gtag('event', `tool_${id}`);
			
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

		if (this.equipped.length == 0) {
			window.location.hash = '';
			filter.focus();
		}
	}
	
	clear() {
		for (let t of this.equipped) {
			t.E.parentNode.removeChild(t.E);
		}

		this.equipped = [];
		window.location.hash = '';

		filter.focus();
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
