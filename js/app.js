/**
 * 主应用脚本
 * 负责 3D Tilt 交互、GSAP 入场动画、移动端抽屉
 */

/* ==============================================================
 * 1. 3D Tilt 鼠标跟随效果
 * ============================================================== */
function initTilt() {
    const cardWrappers = document.querySelectorAll('.v-card-wrapper');

    cardWrappers.forEach(wrap => {
        const anchor = wrap.querySelector('.v-card-anchor');
        if (!anchor) return;

        wrap.addEventListener('mousemove', (e) => {
            const rect = wrap.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // 最大倾斜角度 15 度
            const rotateX = ((y - centerY) / centerY) * -15;
            const rotateY = ((x - centerX) / centerX) * 15;

            anchor.style.transition = 'none';
            anchor.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        wrap.addEventListener('mouseleave', () => {
            anchor.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
            anchor.style.transform = `rotateX(0deg) rotateY(0deg)`;
        });
    });
}

/* ==============================================================
 * 2. GSAP ScrollTrigger Z轴级联入场动画
 * ============================================================== */
function initScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn('[app.js] GSAP 或 ScrollTrigger 未加载');
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.gsap-reveal').forEach((card) => {
        gsap.fromTo(card, {
            opacity: 0,
            autoAlpha: 0,
            y: 100,
            z: -300,
            rotationX: 30,
            scale: 0.7
        }, {
            duration: 1.2,
            opacity: 1,
            autoAlpha: 1,
            y: 0,
            z: 0,
            rotationX: 0,
            scale: 1,
            ease: "elastic.out(1, 0.8)",
            scrollTrigger: {
                trigger: card,
                start: "top 95%",
                toggleActions: "play none none reverse"
            }
        });
    });
}

/* ==============================================================
 * 3. 移动端侧边抽屉控制
 * ============================================================== */
function initMobileDrawer() {
    const mTrig = document.getElementById('mobile-trigger');
    const mClose = document.getElementById('mobile-close');
    const mDrawer = document.getElementById('mobile-drawer');
    const mBackdrop = document.getElementById('mobile-backdrop');

    if (!mTrig || !mDrawer) return;

    const openDrawer = () => {
        mDrawer.classList.add('active');
        mBackdrop.classList.add('active');
    };

    const closeDrawer = () => {
        mDrawer.classList.remove('active');
        mBackdrop.classList.remove('active');
    };

    mTrig.addEventListener('click', openDrawer);
    if (mClose) mClose.addEventListener('click', closeDrawer);
    if (mBackdrop) mBackdrop.addEventListener('click', closeDrawer);
}

/* ==============================================================
 * 初始化所有模块
 * ============================================================== */
document.addEventListener('DOMContentLoaded', () => {
    initTilt();
    initScrollAnimations();
    initMobileDrawer();
});
