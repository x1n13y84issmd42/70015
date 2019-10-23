class Tools {
	constructor(container) {
		this.container = container;
		this.tools = [];
	}

	add(toolID) {
		let eTool = document.getElementById(toolID);
		this.tools.push(eTool);
	}
	
	unfocus(id) {
		let eTool = document.getElementById(id);
		if (eTool) {
			eTool.classList.replace('focused', 'unfocused')
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
}
