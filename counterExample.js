function createApp(mountPoint, ctx) {
    const { counterContainer } = createComponent(
        mountPoint,
        `<h1>Counter App Epic Counter App</h1>
        <div --id="counterContainer"></div>`
    );

    createCounter(counterContainer, ctx);
    createCounter(counterContainer, ctx);
}


function createCounter(mountPoint, ctx) {
    const { text, btn } = createComponent(
        mountPoint,
        `<div --id="text"></div>
        <button --id="btn">Add</button>`
    )

    const [getCount, setCount, onCountChange] = ctx.counterState;

    onCountChange(text, (count) => text.textContent = count);
    btn.addEventListener("click", () => {
        setCount(getCount() + 1);
    })
}

const appCtx = {
    counterState: createState(0)
}

createApp(document.getElementById("app"), appCtx)