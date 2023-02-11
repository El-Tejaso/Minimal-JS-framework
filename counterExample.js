function createCounterApp(mountPoint) {
    const { counterContainer, btn } = createComponent(
        mountPoint,
        `<div --id="counterContainer"></div>
        <button --id="btn">Add</button>`
    );

    const ctx = {
        counterState: createState(0)
    }

    const [getCount, setCount, _] = ctx.counterState;

    btn.addEventListener("click", () => {
        setCount(getCount() + 1);
    })

    setInterval(() => {
        setCount(getCount() + 1);
    }, 1000)

    for(let i = 0; i < 40; i++) {
        const { component:row } = createComponent(counterContainer, `<div></div>`);
        for(let j = 0; j < 40; j++) {
            createCounter(row, ctx);
        }
    }
}

function createCounter(mountPoint, ctx) {
    const { text } = createComponent(
        mountPoint,
        `<span --id="text"></span>`
    )

    const [_, __, onCountChange] = ctx.counterState;

    onCountChange(text, (count) => text.textContent = count);
}
