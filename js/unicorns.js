'use strict';

var maxSpeedX = 4;
var maxSpeedY = 2;
var maxRotationSpeed = 15;
var iterationsBeforeNewSpeed = 30;
var chanceStartRotation = 0.0005;
var chanceGoLeft = 0.05;
var abroadArea = 0.3;

var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var unicorns = [];
var summon = document.getElementById('summon');
var unicornRight = document.createElement('img');
var unicornLeft = document.createElement('img');

unicornRight.src = 'unicorns/img/unicorn_right.png';
unicornLeft.src = 'unicorns/img/unicorn_left.png';

window.onresize = function () {
    var maxWidth = document.body.clientWidth;
    var maxHeight = document.body.clientHeight;
    var summonLeft = parseInt(summon.style.left);
    var summonTop = parseInt(summon.style.top);

    if (summonLeft + summon.width > maxWidth && maxWidth > summon.width) {
        summon.style.left = (maxWidth - summon.width) + 'px';
    }
    if (summonTop + summon.height > maxHeight && maxHeight > summon.height) {
        summon.style.top = (maxHeight - summon.height) + 'px';
    }

    canvas.width = maxWidth;
    canvas.height = maxHeight;
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function locateSummonBtn() {
    var maxHeight = document.body.clientHeight - summon.height;
    var maxWidth = document.body.clientWidth - summon.width;

    summon.style.top = getRandomInt(0, maxHeight) + 'px';
    summon.style.left = getRandomInt(0, maxWidth) + 'px';
    summon.style.display = 'block';
}

function render() {
    requestAnimationFrame(render);

    context.clearRect(0, 0, canvas.width, canvas.height);

    unicorns.forEach(function (unicorn) {
        var img = (unicorn.directionX > 0) ? unicornRight : unicornLeft;
        var leftBorderOut = unicorn.position.x + (img.width * (1 - abroadArea)) < 0 && unicorn.directionX < 0;
        var rightBorderOut = unicorn.position.x + (img.width * abroadArea) > canvas.width && unicorn.directionX > 0;
        var bottomBorderOut = unicorn.position.y + (img.height * abroadArea) > canvas.height;
        var changeDirection = !unicorn.rotation.enabled && Math.random() < chanceGoLeft;

        if (leftBorderOut) {
            unicorn.position.x = canvas.width - (img.width * abroadArea);
        } else if (rightBorderOut) {
            unicorn.position.x = 0 - (img.width * (1 - abroadArea));
        }
        if (bottomBorderOut) {
            unicorn.position.y = 0 - (img.height * (1 - abroadArea));
        }

        if (unicorn.speed.iterations > iterationsBeforeNewSpeed) {
            unicorn.speed.x = Math.random() * maxSpeedX;
            unicorn.speed.y = Math.random() * maxSpeedY;
            unicorn.speed.iterations = 0;
            unicorn.directionX = changeDirection ? -1 : 1;
        } else {
            unicorn.speed.iterations++;
        }

        if (!unicorn.rotation.enabled && Math.random() < chanceStartRotation) {
            unicorn.rotation.enabled = true;
            unicorn.rotation.speed = (Math.random() * maxRotationSpeed + 3) | 0;
        }

        if (unicorn.rotation.enabled) {
            drawRotatedImage(img, Math.round(unicorn.position.x), Math.round(unicorn.position.y), unicorn.rotation.angle);

            unicorn.rotation.angle += unicorn.rotation.speed;

            if (unicorn.rotation.angle >= 360) {
                unicorn.rotation.angle = 0;
                unicorn.rotation.enabled = false;
            }
        } else {
            unicorn.position.x += unicorn.directionX * unicorn.speed.x;
            unicorn.position.y += unicorn.speed.y;

            context.drawImage(img, Math.round(unicorn.position.x), Math.round(unicorn.position.y));
        }
    });
}

function drawRotatedImage(image, x, y, angle) {
    var halfImageWidth = image.width / 2;
    var halfImageHeight = image.height / 2;

    context.save();
    context.translate(x + halfImageWidth, y + halfImageHeight);
    context.rotate(angle * Math.PI / 180);
    context.drawImage(image, -halfImageWidth, -halfImageHeight);
    context.restore();
}

function firstClick() {
    document.getElementsByClassName('container')[0].style.display = 'none';
    document.body.style.height = '100vh';
    document.body.style.width = '100vw';
    canvas.style.display = 'block';
    window.onresize();
}

function addNewUnicorn(e) {
    unicorns.push({
        position: {
            x: e.clientX - summon.width,
            y: e.clientY
        },
        speed: {
            x: Math.random() * maxSpeedX,
            y: Math.random() * maxSpeedY,
            iterations: 0
        },
        rotation: {
            enabled: false,
            angle: 0,
            speed: 0
        },
        directionX: 1
    });
}

summon.addEventListener('click', function (e) {
    if (unicorns.length === 0) {
        firstClick();
    }
    if (unicorns.length > 9 && Math.random() < 0.05) {
        window.location.href = 'unicorns/';
        return;
    }
    summon.style.display = 'none';
    addNewUnicorn(e);
    setTimeout(locateSummonBtn, getRandomInt(500, 3000));
});

render();
setTimeout(locateSummonBtn, 8000);
