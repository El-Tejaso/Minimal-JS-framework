let initialColors = [...new Array(5000)].map((x, i) => [
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255),
]);
const [getColors, setColors, onColorsChange] = createObservableState(initialColors);
const colorsMap = new Map();

function ColorList() {
    const component = createComponent(
        `<div>
            <button --id="shuffleBtn">Shuffle</button>
            <button --id="sortBtn">Sort</button>
            <div --id="colorsList"></div>
        </div>`
    );

    const { colorsList, shuffleBtn, sortBtn } = component.selectedNodes;

    shuffleBtn.domNode.addEventListener("click", () => {
        const colors = getColors();
        for(let i = 0; i < colors.length; i++) {
            const idx = Math.floor(Math.random() * colors.length);
            [colors[i], colors[idx]] = [colors[idx], colors[i]];
        }
        setColors(colors);
    });

    const sortVal = el => el[0] + el[1] + el[2];
    sortBtn.domNode.addEventListener("click", () => {
        getColors().sort((a, b) => {
            return sortVal(a) - sortVal(b);
        });
        setColors(getColors());
    })

    const keyOf = (el) => `${el[0]},${el[1]},${el[2]}`;
    component.subscribe(onColorsChange, () => {
        colorsList.renderList(getColors(), colorsMap, keyOf, (el) => createComponent(
            `<div style="background-color:rgb(${keyOf(el)});color: #FFF; display:inline-block; padding:10px;">${keyOf(el)}</div>`
        ));
    })

    return component;
}

function ColorsListSum() { 
    const component = createComponent(`<div></div>`)
    component.subscribe(onColorsChange, () => {
        const colors = getColors();
        component.domNode.innerText = JSON.stringify(colors[0]);
    });

    return component;
};

getElementByIdWrapped("app").appendChildren(
    ColorsListSum(),
    ColorList()
)