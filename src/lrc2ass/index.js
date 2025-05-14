import convert from "./convert.js";

// webworker spower
class WorkerSpown extends EventTarget {
    constructor() {
        super();
    }
    convert = convert.bind(this);
}

export default new WorkerSpown();