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
