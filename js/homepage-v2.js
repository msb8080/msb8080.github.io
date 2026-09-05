(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function initReveal() {
        var items = Array.from(document.querySelectorAll('.gsap-reveal'));
        if (!items.length || reduceMotion || !('IntersectionObserver' in window)) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px' });

        items.forEach(function (item, index) {
            item.classList.add('reveal-ready');
            if (item.getBoundingClientRect().top < window.innerHeight * 0.96) {
                item.classList.add('is-visible');
            } else {
                item.style.transitionDelay = Math.min(index * 55, 220) + 'ms';
                observer.observe(item);
            }
        });
    }

    function initTilt() {
        if (!finePointer || reduceMotion) return;

        document.querySelectorAll('.card-wrapper').forEach(function (wrapper) {
            if (wrapper.closest('.card-disabled')) return;
            var anchor = wrapper.querySelector('.card-anchor');
            if (!anchor) return;
            var pendingFrame = 0;

            wrapper.addEventListener('pointermove', function (event) {
                if (pendingFrame) return;
                pendingFrame = requestAnimationFrame(function () {
                    var rect = wrapper.getBoundingClientRect();
                    var rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -10;
                    var rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
                    anchor.style.transition = 'none';
                    anchor.style.transform = 'rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg)';
                    pendingFrame = 0;
                });
            }, { passive: true });

            wrapper.addEventListener('pointerleave', function () {
                if (pendingFrame) cancelAnimationFrame(pendingFrame);
                pendingFrame = 0;
                anchor.style.transition = 'transform 0.4s cubic-bezier(0.23,1,0.32,1)';
                anchor.style.transform = '';
            });
        });
    }

    function initAgentTraceLab() {
        var canvas = document.getElementById('agent-trace-canvas');
        if (!canvas) return;
        var context = canvas.getContext('2d');
        if (!context) return;

        var stateLabel = document.querySelector('[data-trace-state]');
        var countLabel = document.querySelector('[data-trace-count]');
        var modeButtons = Array.from(document.querySelectorAll('[data-trace-mode]'));
        var pulseButton = document.querySelector('[data-trace-pulse]');
        var resetButton = document.querySelector('[data-trace-reset]');
        var width = 900;
        var height = 520;
        var mode = 'cruise';
        var elapsed = 0;
        var previousTime = 0;
        var frameId = 0;
        var visible = true;
        var pointer = { x: 0, y: 0, active: false };

        var nodes = [
            { label: 'AGENT', x: 0.50, y: 0.48, color: '#b986ff', core: true },
            { label: 'PLAN', x: 0.20, y: 0.23, color: '#7be7ff' },
            { label: 'CONTEXT', x: 0.78, y: 0.20, color: '#77a6ff' },
            { label: 'TOOLS', x: 0.17, y: 0.75, color: '#62f2bd' },
            { label: 'MEMORY', x: 0.80, y: 0.74, color: '#ffd06f' },
            { label: 'VERIFY', x: 0.51, y: 0.86, color: '#ff83c7' }
        ];
        var edges = [[0, 1], [1, 2], [2, 0], [0, 3], [3, 4], [4, 5], [5, 0], [2, 4], [1, 3]];
        var initialPulses = [
            { edge: 0, progress: 0.12, speed: 0.12 },
            { edge: 3, progress: 0.47, speed: 0.10 },
            { edge: 5, progress: 0.75, speed: 0.13 },
            { edge: 7, progress: 0.31, speed: 0.09 }
        ];
        var pulses = [];

        function resetPulses() {
            pulses = initialPulses.map(function (pulse) { return Object.assign({}, pulse); });
            updateCount();
        }

        function updateCount() {
            if (countLabel) countLabel.textContent = String(pulses.length).padStart(2, '0');
        }

        function setMode(nextMode) {
            mode = nextMode === 'focus' ? 'focus' : 'cruise';
            modeButtons.forEach(function (button) {
                var active = button.getAttribute('data-trace-mode') === mode;
                button.classList.toggle('is-active', active);
                button.setAttribute('aria-pressed', String(active));
            });
            if (stateLabel) stateLabel.textContent = mode === 'focus' ? '聚焦中' : '巡航中';
            if (reduceMotion) draw(0);
        }

        function addPulse(originIndex) {
            var candidateEdges = edges
                .map(function (edge, index) { return { edge: edge, index: index }; })
                .filter(function (item) { return item.edge[0] === originIndex || item.edge[1] === originIndex; });
            var selection = candidateEdges.length
                ? candidateEdges[pulses.length % candidateEdges.length].index
                : pulses.length % edges.length;
            pulses.push({ edge: selection, progress: 0, speed: 0.15, fresh: true });
            if (pulses.length > 9) pulses.shift();
            updateCount();
            if (reduceMotion) draw(0);
        }

        function resize() {
            var rect = canvas.getBoundingClientRect();
            var ratio = Math.min(window.devicePixelRatio || 1, 2);
            width = Math.max(280, rect.width);
            height = Math.max(220, rect.height);
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            draw(0);
        }

        function getNodePosition(node, index, time) {
            var focusScale = mode === 'focus' && !node.core ? 0.82 : 1;
            var baseX = width * (0.5 + (node.x - 0.5) * focusScale);
            var baseY = height * (0.5 + (node.y - 0.5) * focusScale);
            var drift = node.core || reduceMotion ? 0 : Math.min(width, height) * 0.018;
            var x = baseX + Math.sin(time * 0.00055 + index * 1.7) * drift;
            var y = baseY + Math.cos(time * 0.00046 + index * 1.3) * drift;

            if (pointer.active && !node.core) {
                var dx = pointer.x - x;
                var dy = pointer.y - y;
                var distance = Math.sqrt(dx * dx + dy * dy) || 1;
                var influence = Math.max(0, 1 - distance / 190) * 0.16;
                x += dx * influence;
                y += dy * influence;
            }
            return { x: x, y: y };
        }

        function drawGrid() {
            context.save();
            context.strokeStyle = 'rgba(157, 130, 220, 0.055)';
            context.lineWidth = 1;
            var size = Math.max(28, Math.round(width / 18));
            for (var x = 0; x <= width; x += size) {
                context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
            }
            for (var y = 0; y <= height; y += size) {
                context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
            }
            context.restore();
        }

        function drawNode(node, position) {
            var radius = node.core ? Math.max(29, width * 0.047) : Math.max(17, width * 0.025);
            context.save();
            context.shadowColor = node.color;
            context.shadowBlur = node.core ? 30 : 18;
            context.fillStyle = node.core ? 'rgba(30, 18, 62, 0.96)' : 'rgba(15, 13, 35, 0.96)';
            context.strokeStyle = node.color;
            context.lineWidth = node.core ? 2.4 : 1.5;
            context.beginPath();
            context.arc(position.x, position.y, radius, 0, Math.PI * 2);
            context.fill();
            context.stroke();
            context.shadowBlur = 0;
            context.fillStyle = node.core ? '#ffffff' : node.color;
            context.font = (node.core ? '700 ' : '600 ') + Math.max(9, Math.min(13, width / 64)) + 'px "Space Mono", monospace';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(node.label, position.x, position.y);
            context.restore();
        }

        function draw(time) {
            var positions = nodes.map(function (node, index) { return getNodePosition(node, index, time); });
            context.clearRect(0, 0, width, height);
            context.fillStyle = '#0b0919';
            context.fillRect(0, 0, width, height);
            drawGrid();

            if (pointer.active) {
                var halo = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 110);
                halo.addColorStop(0, 'rgba(115, 225, 255, 0.13)');
                halo.addColorStop(1, 'rgba(115, 225, 255, 0)');
                context.fillStyle = halo;
                context.fillRect(pointer.x - 110, pointer.y - 110, 220, 220);
            }

            edges.forEach(function (edge, index) {
                var start = positions[edge[0]];
                var end = positions[edge[1]];
                context.save();
                context.strokeStyle = index % 2 ? 'rgba(113, 223, 255, 0.16)' : 'rgba(190, 139, 255, 0.18)';
                context.lineWidth = mode === 'focus' ? 1.6 : 1.15;
                context.setLineDash(index % 3 === 0 ? [6, 9] : []);
                context.beginPath();
                context.moveTo(start.x, start.y);
                context.lineTo(end.x, end.y);
                context.stroke();
                context.restore();
            });

            pulses.forEach(function (pulse) {
                var edge = edges[pulse.edge % edges.length];
                var start = positions[edge[0]];
                var end = positions[edge[1]];
                var x = start.x + (end.x - start.x) * pulse.progress;
                var y = start.y + (end.y - start.y) * pulse.progress;
                context.save();
                context.shadowColor = pulse.fresh ? '#ffffff' : '#9c72ff';
                context.shadowBlur = pulse.fresh ? 22 : 15;
                context.fillStyle = pulse.fresh ? '#ffffff' : '#bda2ff';
                context.beginPath();
                context.arc(x, y, pulse.fresh ? 4.2 : 3.2, 0, Math.PI * 2);
                context.fill();
                context.restore();
            });

            nodes.forEach(function (node, index) { drawNode(node, positions[index]); });
        }

        function animate(time) {
            if (!visible || document.hidden || reduceMotion) {
                frameId = 0;
                return;
            }
            var delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
            previousTime = time;
            elapsed += delta;
            pulses.forEach(function (pulse) {
                pulse.progress += delta * pulse.speed * (mode === 'focus' ? 1.65 : 1);
                if (pulse.progress > 1) {
                    pulse.progress = 0;
                    pulse.edge = (pulse.edge + 2) % edges.length;
                    pulse.fresh = false;
                }
            });
            draw(time + elapsed * 300);
            frameId = requestAnimationFrame(animate);
        }

        function ensureAnimation() {
            if (!frameId && visible && !document.hidden && !reduceMotion) {
                previousTime = 0;
                frameId = requestAnimationFrame(animate);
            }
        }

        function canvasPoint(event) {
            var rect = canvas.getBoundingClientRect();
            return { x: event.clientX - rect.left, y: event.clientY - rect.top };
        }

        canvas.addEventListener('pointermove', function (event) {
            pointer = Object.assign(canvasPoint(event), { active: true });
        }, { passive: true });
        canvas.addEventListener('pointerleave', function () { pointer.active = false; });
        canvas.addEventListener('pointerdown', function (event) {
            var point = canvasPoint(event);
            var positions = nodes.map(function (node, index) { return getNodePosition(node, index, performance.now()); });
            var nearest = 0;
            var nearestDistance = Infinity;
            positions.forEach(function (position, index) {
                var dx = position.x - point.x;
                var dy = position.y - point.y;
                var distance = dx * dx + dy * dy;
                if (distance < nearestDistance) { nearest = index; nearestDistance = distance; }
            });
            addPulse(nearest);
        });
        canvas.addEventListener('keydown', function (event) {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            addPulse(0);
        });

        modeButtons.forEach(function (button) {
            button.addEventListener('click', function () { setMode(button.getAttribute('data-trace-mode')); });
        });
        if (pulseButton) pulseButton.addEventListener('click', function () { addPulse(0); });
        if (resetButton) resetButton.addEventListener('click', function () {
            elapsed = 0;
            pointer.active = false;
            resetPulses();
            setMode('cruise');
        });

        if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
        else window.addEventListener('resize', resize, { passive: true });

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                visible = entries[0].isIntersecting;
                if (visible) ensureAnimation();
            }, { rootMargin: '120px' }).observe(canvas);
        }
        document.addEventListener('visibilitychange', ensureAnimation);

        resetPulses();
        resize();
        setMode('cruise');
        ensureAnimation();
    }

    initReveal();
    initTilt();
    initAgentTraceLab();
})();
