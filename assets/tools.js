class Tools {
	constructor(container) {
		this.container = container;
		this.tools = {};
	}

	add(tool) {
		this.tools[tool.ID] = tool;
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
		for (let tool of this.tools) {
			if (s) {
				for (let sch of s) {
					if (tool.dataset.tag.includes(sch)) {
						tool.classList.add("matched");
						tool.classList.remove("filteredOut");
					} else {
						tool.classList.add("filteredOut");
						tool.classList.remove("matched");
						break;
					}
				}
			} else {
				tool.classList.remove("filteredOut");
				tool.classList.remove("matched");
			}
		}
	}

	render() {
		document.body.style.display = 'block';
	}
}
