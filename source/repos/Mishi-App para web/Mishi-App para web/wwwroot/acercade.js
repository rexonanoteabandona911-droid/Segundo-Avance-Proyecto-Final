// acercade.js
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    /** @type {NodeListOf<HTMLElement>} */
    var tabs = document.querySelectorAll('.tab-btn');
    /** @type {NodeListOf<HTMLElement>} */
    var panels = document.querySelectorAll('.panel');
    /** @type {NodeListOf<HTMLElement>} */
    var botones = document.querySelectorAll('.btn-action');

    var ind = /** @type {HTMLElement | null} */ (document.getElementById('indicator'));
    var avatar = /** @type {HTMLElement | null} */ (document.getElementById('avatar'));
    var card = /** @type {HTMLElement | null} */ (document.getElementById('card'));
    var glow = /** @type {HTMLElement | null} */ (document.getElementById('glow'));
    var btnCerrar = /** @type {HTMLElement | null} */ (document.getElementById('btnCerrar'));
    function pestanaActiva() {
        return /** @type {HTMLElement | null} */ (document.querySelector('.tab-btn.active'));
    }

    /** @param {HTMLElement | null} btn */
    function moverIndicador(btn) {
        if (!btn || !ind) return;
        ind.style.width = btn.offsetWidth + 'px';
        ind.style.transform = 'translateX(' + (btn.offsetLeft - 5) + 'px)';
    }

    /** @param {HTMLElement | null} panel */
    function animarContadores(panel) {
        if (!panel) return;
        /** @type {NodeListOf<HTMLElement>} */
        var items = panel.querySelectorAll('[data-count]');
        items.forEach(function (el) {
            var fin = Number(el.getAttribute('data-count') || 0);
            var sufijo = el.getAttribute('data-suffix') || '';
            var inicio = performance.now();

            /** @param {number} ahora */
            function paso(ahora) {
                var p = Math.min((ahora - inicio) / 900, 1);
                el.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3))) + sufijo;
                if (p < 1) requestAnimationFrame(paso);
            }
            requestAnimationFrame(paso);
        });
    }

    tabs.forEach(function (btn) {
        btn.addEventListener('click', function () {
            tabs.forEach(function (b) { b.classList.remove('active'); });
            panels.forEach(function (p) { p.classList.remove('show'); });

            btn.classList.add('active');
            var panel = document.getElementById(btn.getAttribute('data-tab') || '');
            if (panel) panel.classList.add('show');

            moverIndicador(btn);
            animarContadores(panel);
        });
    });

    moverIndicador(pestanaActiva());
    animarContadores(document.getElementById('sobre'));
    window.addEventListener('load', function () { moverIndicador(pestanaActiva()); });
    window.addEventListener('resize', function () { moverIndicador(pestanaActiva()); });

    if (avatar) {
        avatar.addEventListener('click', function () {
            avatar.classList.remove('purr');
            void avatar.offsetWidth;
            avatar.classList.add('purr');
        });
    }
    var hayMouse = window.matchMedia('(hover: hover)').matches;
    var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (card && glow && hayMouse && !reducir) {
        document.addEventListener('mousemove', /** @param {MouseEvent} e */ function (e) {
            glow.style.left = e.clientX + 'px';
            glow.style.top = e.clientY + 'px';

            var r = card.getBoundingClientRect();
            var x = (e.clientX - r.left) / r.width - 0.5;
            var y = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform =
                'perspective(900px) rotateY(' + (x * 4) + 'deg) rotateX(' + (-y * 4) + 'deg)';
        });

        card.addEventListener('mouseleave', function () {
            card.style.transform = '';
        });
    }
    botones.forEach(function (b) {
        b.addEventListener('click', /** @param {MouseEvent} e */ function (e) {
            var r = b.getBoundingClientRect();
            var tam = Math.max(r.width, r.height);
            var onda = document.createElement('span');
            onda.className = 'ripple';
            onda.style.cssText =
                'width:' + tam + 'px;height:' + tam + 'px;' +
                'left:' + (e.clientX - r.left - tam / 2) + 'px;' +
                'top:' + (e.clientY - r.top - tam / 2) + 'px';
            b.appendChild(onda);
            setTimeout(function () { onda.remove(); }, 600);
        });
    });
    if (btnCerrar) {
        btnCerrar.addEventListener('click', function () {
            window.close();
            setTimeout(function () {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = 'gatos.html';
                }
            }, 200);
        });
    }
});