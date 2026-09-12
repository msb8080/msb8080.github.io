/* =========================================
 * Hexo-Blog Purple Animations v3
 * 主题过渡动画 + 交互动效
 * ========================================= */

(function () {
    'use strict';

    /* ----- 主题切换过渡动画 ----- */
    function initThemeTransition() {
        var toggleBtn = document.querySelector('#color-toggle-btn .nav-link, #mobile-color-toggle-btn a');
        if (!toggleBtn) return;

        // 点击时添加过渡类，切换完成后移除
        toggleBtn.addEventListener('click', function () {
            document.documentElement.classList.add('theme-transitioning');

            // 监听属性变化，在主题切换完成后移除过渡类
            var observer = new MutationObserver(function (mutations) {
                for (var i = 0; i < mutations.length; i++) {
                    if (mutations[i].attributeName === 'data-user-color-scheme') {
                        // 延迟移除，让过渡动画完成
                        setTimeout(function () {
                            document.documentElement.classList.remove('theme-transitioning');
                        }, 450);
                        observer.disconnect();
                        return;
                    }
                }
            });

            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['data-user-color-scheme']
            });

            // 安全超时：防止某些情况下 observer 不触发
            setTimeout(function () {
                document.documentElement.classList.remove('theme-transitioning');
                observer.disconnect();
            }, 1000);
        });
    }

    /* ----- IntersectionObserver 滚动入场 ----- */
    function initScrollReveal() {
        var targets = document.querySelectorAll('.index-card, .card, .widget');
        if (!targets.length) return;

        targets.forEach(function (el, i) {
            el.classList.add('gsap-reveal');
            el.style.transitionDelay = (i * 0.07) + 's';
        });

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.08,
            rootMargin: '0px 0px -50px 0px'
        });

        /* 先检查已在视口中的元素，再观察其他元素 */
        targets.forEach(function (el) {
            var rect = el.getBoundingClientRect();
            var isInView = rect.top < window.innerHeight && rect.bottom > 0;
            if (isInView) {
                el.classList.add('is-visible');
            } else {
                observer.observe(el);
            }
        });

        /* 文章/页面内容 — 立即显示，不做入场动画（防止直接访问时文字不可见） */
        var immediateTargets = document.querySelectorAll('.post-content, .post-block, .page-content');
        immediateTargets.forEach(function (el) {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }

    /* ----- Banner 标题淡入 ----- */
    function initBannerAnimation() {
        var banner = document.querySelector('.index-header');
        if (!banner) return;
        banner.style.opacity = '0';
        banner.style.transform = 'translateY(25px)';
        banner.style.transition = 'opacity 0.9s cubic-bezier(0.23,1,0.32,1), transform 0.9s cubic-bezier(0.23,1,0.32,1)';
        setTimeout(function () {
            banner.style.opacity = '1';
            banner.style.transform = 'translateY(0)';
        }, 150);
    }

    /* ----- 导航栏滚动效果 ----- */
    function initNavbarScroll() {
        var navbar = document.querySelector('.navbar');
        if (!navbar) return;
        window.addEventListener('scroll', function () {
            if (window.pageYOffset > 80) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    /* ----- 注入浮动 Orb 容器 (lishenghua.com 风格) ----- */
    function initAmbientOrbs() {
        if (document.querySelector('.ambient-orbs')) return;
        var container = document.createElement('div');
        container.className = 'ambient-orbs';
        container.innerHTML = '<div class="orb orb-1"></div><div class="orb orb-2"></div><div class="orb orb-3"></div><div class="orb orb-4"></div>';
        document.body.insertBefore(container, document.body.firstChild);
    }

    /* ----- 卡片光晕跟随 (增强版) ----- */
    function initCardGlow() {
        var style = document.createElement('style');
        style.textContent = [
            '.index-card { position: relative; overflow: hidden; }',
            '.index-card .card-glow {',
            '  position: absolute;',
            '  width: 300px; height: 300px;',
            '  background: radial-gradient(circle, rgba(126,90,220,0.2) 0%, rgba(109,40,217,0.08) 40%, transparent 70%);',
            '  border-radius: 50%;',
            '  transform: translate(-50%, -50%);',
            '  pointer-events: none;',
            '  z-index: 0;',
            '  opacity: 0;',
            '  transition: opacity 0.4s ease;',
            '  filter: blur(20px);',
            '}',
            '.index-card:hover .card-glow { opacity: 1; }'
        ].join('\n');
        document.head.appendChild(style);

        document.querySelectorAll('.index-card').forEach(function (card) {
            var glow = document.createElement('div');
            glow.className = 'card-glow';
            card.appendChild(glow);

            card.addEventListener('mousemove', function (e) {
                var rect = card.getBoundingClientRect();
                glow.style.left = (e.clientX - rect.left) + 'px';
                glow.style.top = (e.clientY - rect.top) + 'px';
            });
        });
    }

    /* ----- 返回顶部按钮 ----- */
    function initScrollTop() {
        var btn = document.querySelector('#go-up, .scroll-top-btn, .go-up-btn, [class*="back-to-top"]');
        if (!btn) return;
        window.addEventListener('scroll', function () {
            if (window.pageYOffset > 300) {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
            } else {
                btn.style.opacity = '0';
                btn.style.pointerEvents = 'none';
            }
        }, { passive: true });
        btn.style.transition = 'opacity 0.3s ease, transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease';
        btn.style.opacity = '0';
        btn.style.pointerEvents = 'none';
    }

    /* ----- 平滑锚点滚动 ----- */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                var target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    /* ========================================= */
    function init() {
        initAmbientOrbs();
        initThemeTransition();
        initScrollReveal();
        initBannerAnimation();
        initNavbarScroll();
        initCardGlow();
        initScrollTop();
        initSmoothScroll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* PJAX 兼容 */
    if (typeof window.pjax !== 'undefined' || document.querySelector('[data-pjax]')) {
        document.addEventListener('pjax:complete', init);
    }
})();
