let [countersLists, setCountersLists, countersListsChangeEvent] = createObservableState([]);

function Counter(initialCount) {
    let [count, setCount, countChangeEvent] = createObservableState(initialCount);

    const component = createComponent(
        `<div>
            <div --id="countDom">{ count() }</div>
            <button --id="addBtn">Add</button>
            <button --id="rmBtn">Remove</button>
        </div>`
    );

    const { countDom, addBtn, rmBtn } = component.selectedNodes;

    component.subscribe(countChangeEvent, () => {
        countDom.domNode.innerText = count();
    });

    addBtn.domNode.addEventListener("click", () => setCount(count() + 1));
    rmBtn.domNode.addEventListener("click", () => setCount(count() - 1));

    return component;
}


function CounterList() {
    let [counters, setCounters, countersChangeEvent] = createObservableState([0]);

    const component = createComponent(
        `<div>
            <button --id="addBtn">Add a counter</button>
            <button --id="rmBtn">Remove a counter</button>
            <div style="height: 50px;"></div>
            <div --id="listContainer"></div>
        </div>`
    );
    
    const { addBtn, rmBtn, listContainer } = component.selectedNodes;
    const listMap = new Map();

    const addCounter = () => {
        counters().push(0);
        setCounters(counters())
    }

    const removeCounter = () => {
        if (counters().length === 0) return;

        counters().splice(counters().length - 1, 1);
        setCounters(counters());
    }

    component.subscribe(countersChangeEvent, () => {
        listContainer.renderList(counters(), listMap, (el, i) => i, (el) => Counter(el));
    });

    addBtn.domNode.addEventListener("click", () => addCounter());
    rmBtn.domNode.addEventListener("click", () => removeCounter());

    return component;
}

function App() {
    const component = createComponent(
        `<div>
            <button --id="addBtn">Add a counter list</button>
            <button --id="rmBtn">Remove a counter list</button>
            <div style="height: 50px;"></div>
            <div --id="listContainer"></div>
        </div>`
    );

    const { addBtn, rmBtn, listContainer } = component.selectedNodes;
    const listMap = new Map();

    const addCounter = () => {
        countersLists().push(0);
        setCountersLists(countersLists())
    }

    const removeCounter = () => {
        if (countersLists().length === 0) return;

        countersLists().splice(countersLists().length - 1, 1);
        setCountersLists(countersLists());
    }

    component.subscribe(countersListsChangeEvent, () => {
        listContainer.renderList(countersLists(), listMap, (el, i) => i, CounterList);
    });

    addBtn.domNode.addEventListener("click", () => addCounter());
    rmBtn.domNode.addEventListener("click", () => removeCounter());

    return component;
}

const root = getElementByIdWrapped("app");
root.appendChildren(App());