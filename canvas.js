function createFillScreen(mountPoint) {
    const { component } = createComponent(
        mountPoint,
        `<div class="fill-screen">
            <style scoped>
                .fill-screen {
                    position:fixed;top:0;left:0;bottom:0;right:0;
                }
            </style>
        </div>`
    )

    return component;
}

function createPhysicsSimApp(mountPoint) {
    // program constants
    const MAX_RADIUS = 30;
    const MAX_SPEED = 400;
    const NUM_BALLS = 100;
    const FIXED_DT = 1 / 240000;
    const GRAVITY = 50;
    const GRAVITY_HORIZON = 100;
    const BOUNCINESS = 1.0;

    // program state
    const screen = {
        width:500, height:500
    }
    const balls = [];
    const makeBall = (ball = {size : 10, velX: 0, velY: 0, posX: 0, posY: 0}) => ({
        ...ball,
        dvX : 0,
        dvY : 0,
        mass: function() { 
            return sphereVolume(this.size); 
            // return this.size;
            // return Math.pow(this.size, 5);
        }
    });

    function init1() {
        balls.push(
            makeBall({
                size: 100,
                velX: 50, 
                velY: 0,
                posX: 500,
                posY: 200,
            }),
            makeBall({
                size: 10,
                velX: 100, 
                velY: 0,
                posX: 300, 
                posY: 200,
            })
        )
    }

    function init() {
        for(let i = 0; i < NUM_BALLS; i++) {
            const ball = makeBall({
                size: 1 + Math.pow(Math.random(), 2) * MAX_RADIUS,
                velX: 0,// -50 + Math.random() * MAX_SPEED, 
                velY: 0,// -50 + Math.random() * MAX_SPEED,
                posX: MAX_RADIUS + Math.random() * (screen.width - MAX_RADIUS), 
                posY: Math.random() * (screen.height - MAX_RADIUS),
            })

            balls.push(ball);
        }
    }

    let paused = false;

    /** @param { CanvasRenderingContext2D } ctx */
    function draw(ctx, dt) {
        if (paused) return;

        // alpha less that 1.0 creates a motion blur effect
        const alpha = 10 / 255;
        ctx.fillStyle = `rgb(255,255,255, ${alpha})`;
        ctx.fillRect(0, 0, screen.width, screen.height);

        let maxMass = 0;
        for(const ball of balls) {
            maxMass = max(maxMass, ball.mass());
        }
        
        for(const ball of balls) {
            const r = Math.floor(255 * (1 - ball.mass() / maxMass));
            ctx.fillStyle = `rgb(${255 - r},0,${r},1)`;
            ctx.beginPath();
            ctx.ellipse(ball.posX, ball.posY, ball.size, ball.size, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function update(dt) {
        if (paused) return;
        
        // collide balls with each other
        for(const ball1 of balls) {
            for(const ball2 of balls) {
                if (ball1 === ball2) continue;
            
                if (
                    // sqrMag(ball1.posX - ball2.posX, ball1.posY - ball2.posY) > Math.pow((ball1.size + ball2.size) / 10, 2)
                    sqrMag(ball1.posX - ball2.posX, ball1.posY - ball2.posY) > (ball1.size + ball2.size) * (ball1.size + ball2.size)
                    // mag(ball1.posX - ball2.posX, ball1.posY - ball2.posY) > ball1.size + ball2.size
                ) {
                    continue;
                }

                
                // find hit normal on ball1, and relative velocity so we can see if they are moving towards each other
                const normalX = ball1.posX - ball2.posX;
                const normalY = ball1.posY - ball2.posY;
                
                const rvX = ball1.velX - ball2.velX;
                const rvY = ball1.velY - ball2.velY;
                const ball1IsMovingTowardsBall2 = dot(normalX, normalY, rvX, rvY) < 0;
                if (!ball1IsMovingTowardsBall2) {
                    continue;
                }

                const normalMag = mag(normalX, normalY);
                const normalXNormalized = normalX / normalMag;
                const normalYNormalized = normalY / normalMag;

                // reflect just ball 1. ball 2 will be reflected when this double-for loop comes back round.
                const vInNormal = dot(normalXNormalized, normalYNormalized, rvX, rvY);

                // TODO: need to conserve momentum properly.
                // This is the closest to something decent I was able to come up with
                let massRatio = ball2.mass() / (ball1.mass() + ball2.mass());
                // massRatio = massRatio * massRatio;
                // const massRatio = 1;

                ball1.dvX += (-2 * vInNormal * normalXNormalized) * massRatio * BOUNCINESS;
                ball1.dvY += (-2 * vInNormal * normalYNormalized) * massRatio * BOUNCINESS;
            }
        }

        
        // each ball adds a gravitational pull to each other ball
        for(const ball1 of balls) {
            for(const ball2 of balls) {
                if (ball1 === ball2) continue;
                
                const b1ToB2X = ball1.posX - ball2.posX;
                const b1ToB2Y = ball1.posY - ball2.posY;
                const r = mag(b1ToB2X, b1ToB2Y);
                if (r < max(0 , ball1.size + ball2.size - GRAVITY_HORIZON)) continue;


                // const forceAmount = GRAVITY * (ball1.mass() * ball2.mass())  / (r * r); // doesn't look as cool
                const forceAmount = GRAVITY * (ball1.mass() * ball2.mass())  / (r);
                const forceDirX = b1ToB2X / r;
                const forceDirY = b1ToB2Y / r;

                ball2.dvX += forceAmount * forceDirX;
                ball2.dvY += forceAmount * forceDirY;
            }
        }
        
        // apply forces
        let totalMomentum = 0;
        for(const ball of balls) {
            ball.velX += ball.dvX;
            ball.velY += ball.dvY;
            ball.dvX = 0;
            ball.dvY = 0;

            totalMomentum += mag(ball.velX, ball.velY) * ball.mass();
        }
        // console.log("totalMomentum: ", totalMomentum)

        // collide balls with walls
        for(const ball of balls) {
            if ((ball.posX + ball.size > screen.width && ball.velX > 0) || 
                (ball.posX - ball.size < 0 && ball.velX < 0)) {
                ball.velX = -ball.velX;
            }
            if ((ball.posY + ball.size > screen.height && ball.velY > 0) || 
                (ball.posY - ball.size < 0 && ball.velY < 0)) {
                ball.velY = -ball.velY;
            }
        }

        // update ball position based on velocity
        for(const ball of balls) {
            ball.posX += ball.velX * dt;
            ball.posY += ball.velY * dt;
        }

        
        // console.log("total: ", totalMomentum);
    }

    const { component, canvas } = createComponent(
        mountPoint,
        `<div style="position:absolute;top:0;left:0;right:0;bottom:0;">
            <canvas --id="canvas">
        </div>`
    );

    /** @type { CanvasRenderingContext2D } */
    const ctx = canvas.getContext('2d');

    onResize(component, (width, height) => {
        screen.width = width;
        screen.height = height;
        canvas.width = width;
        canvas.height = height;
    });

    let timeLeftToProcess = 0;
    const startRenderLoop = createAnimation((dt) => {
        draw(ctx, dt);
        update(FIXED_DT);   // sim is slower, but more fps
        // timeLeftToProcess += dt;
        // while(timeLeftToProcess > FIXED_DT) {
        //     if (timeLeftToProcess > FIXED_DT * 4) {
        //         timeLeftToProcess = FIXED_DT;
        //     }

        //     update(FIXED_DT);
        //     // draw(ctx, dt);  // this is so that multiple physics updates can get rendered, but it is a lot slower
        //     timeLeftToProcess -= FIXED_DT;
        // }

        return false
    })

    init();
    startRenderLoop();

    canvas.addEventListener("click", () => paused = !paused);

    return canvas;
}

// helpers
function mag(x,y) { return Math.sqrt(x * x + y * y); }
function sqrMag(x, y) { return x * x + y * y; }
function lerp(a, b, t) { return a + (b - a) * t; }
function dot(x1, y1, x2, y2) { return x1 * x2 + y1 * y2; }
function reflect(v1, v2, n1, n2) {
    const vInN = dot(v1, v2, n1, n2);
    return [
        v1 - 2 * vInN * n1, 
        v2 - 2 * vInN * n2, 
    ];
}
function sphereVolume(rad) {
    return rad;
    return (4 / 3) * Math.PI * (rad * rad * rad);
}
function max(a, b) { return a > b ? a : b; }