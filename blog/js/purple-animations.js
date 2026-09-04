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

    /* ----- 首页内容枢纽：让新访客先理解主题，再进入文章流 ----- */
    function initHomeHub() {
        var path = window.location.pathname.replace(/\/+$/, '');
        if (path !== '' && path !== '/blog') return;
        if (document.querySelector('.home-hub')) return;

        var stream = document.querySelector('#board > .container > .row > .col-12');
        var firstCard = stream && stream.querySelector('.index-card');
        if (!stream || !firstCard) return;

        var articleCount = stream.querySelectorAll('.index-card').length;
        var hub = document.createElement('section');
        hub.className = 'home-hub';
        hub.setAttribute('aria-labelledby', 'home-hub-title');
        hub.innerHTML = [
            '<div class="home-hub__intro">',
            '  <div class="home-hub__copy">',
            '    <span class="home-hub__eyebrow">BUILD LOG · JAVA × AI</span>',
            '    <h1 id="home-hub-title">把复杂技术，拆成能运行的工程。</h1>',
            '    <p>这里记录 AI 应用开发、Java 后端与工程复盘。少一点概念堆叠，多一点真实代码、验证过程和取舍依据。</p>',
            '    <div class="home-hub__actions">',
            '      <a class="home-hub__primary" href="/blog/2026/05/09/大模型应用开发技术路线清单/">查看 AI 开发路线 <span aria-hidden="true">↗</span></a>',
            '      <a class="home-hub__secondary" href="https://github.com/msb8080" target="_blank" rel="noopener">GitHub</a>',
            '    </div>',
            '  </div>',
            '  <div class="home-hub__signal" aria-label="当前关注方向">',
            '    <span class="home-hub__status"><i></i> NOW BUILDING</span>',
            '    <strong>AI Dev Copilot</strong>',
            '    <p>模型流式对话、上下文工程、Agent Skills 与安全工具调用。</p>',
            '    <div class="home-hub__metrics">',
            '      <span><b>' + articleCount + '</b> 篇精选</span>',
            '      <span><b>4</b> 个方向</span>',
            '      <span><b>∞</b> 持续迭代</span>',
            '    </div>',
            '  </div>',
            '</div>',
            '<nav class="home-hub__topics" aria-label="内容主题">',
            '  <a href="/blog/tags/AI-工程化/" class="home-topic home-topic--featured"><span>01</span><strong>AI 应用工程</strong><small>LLM · Agent · Skills</small></a>',
            '  <a href="/blog/categories/后端架构/" class="home-topic"><span>02</span><strong>Java 后端</strong><small>架构 · 稳定性 · 复盘</small></a>',
            '  <a href="/blog/tags/Skills/" class="home-topic"><span>03</span><strong>Agent Skills</strong><small>上下文 · 工具 · 工作流</small></a>',
            '  <a href="/blog/about/" class="home-topic"><span>04</span><strong>关于作者</strong><small>经历 · 方向 · 联系</small></a>',
            '</nav>',
            '<div class="home-stream-title"><span>RECENT WRITING</span><h2>最近更新</h2><p>按时间阅读正在发生的思考与实践。</p></div>'
        ].join('');

        stream.insertBefore(hub, firstCard);
    }

    /* ========================================= */
    function init() {
        initAmbientOrbs();
        initThemeTransition();
        initHomeHub();
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
