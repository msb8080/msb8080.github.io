(function () {
    'use strict';
    var copyButton = document.querySelector('[data-copy-email]');
    var message = document.querySelector('[data-contact-feedback]');
    if (copyButton) {
        copyButton.hidden = false;
        copyButton.addEventListener('click', async function () {
            copyButton.disabled = true;
            try {
                await navigator.clipboard.writeText(document.querySelector('.contact-email').textContent.trim());
                message.textContent = '邮箱已复制，可以粘贴到你的邮件应用。';
            } catch (_) {
                message.textContent = '无法自动复制，请选中上方邮箱地址复制，或点击地址打开邮件应用。';
                var range = document.createRange();
                range.selectNodeContents(document.querySelector('.contact-email'));
                var selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            } finally { copyButton.disabled = false; }
        });
    }

    var links = Array.from(document.querySelectorAll('[data-section-link]'));
    var sections = links.map(function (link) { return document.querySelector(link.getAttribute('href')); });
    var frame = 0;
    function markSection() {
        frame = 0;
        var current = -1;
        var line = document.querySelector('[data-site-nav]').getBoundingClientRect().bottom + 100;
        sections.forEach(function (section, index) {
            if (section && section.getBoundingClientRect().top <= line) current = index;
        });
        links.forEach(function (link, index) {
            if (index === current) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    }
    window.addEventListener('scroll', function () {
        if (!frame) frame = requestAnimationFrame(markSection);
    }, { passive: true });
    window.addEventListener('resize', markSection, { passive: true });
    markSection();

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (event) {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            var target = document.getElementById(link.hash.slice(1));
            if (!target) return;
            if (target instanceof HTMLDetailsElement) target.open = true;
            // Native anchor navigation keeps the URL and Back button behavior.
            if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
        });
    });
})();
