/**
 * 国际化引擎
 * 负责中英文切换、字符扰动动画
 */

/* ==============================================================
 * 国际化字典
 * ============================================================== */
const DICT = {
    // 导航
    'nav_home': { zh: '主页', en: 'HOME' },
    'nav_blog': { zh: '博客', en: 'BLOG' },
    'nav_auth': { zh: '关于我', en: 'ABOUT' },

    // 大卡片
    'c1_tit': { zh: '视频聚合平台', en: 'VIDEO HUB' },
    'c2_tit': { zh: '视频下载', en: 'Video Download' },
    'c22_tit': { zh: '有机科技商城', en: 'ORGANIC TECH STORE' },
    'c23_tit': { zh: '实时AI渲染', en: 'AI RENDER' },
    'c24_tit': { zh: '无水印下载', en: 'NO-WATERMARK DL' },
    'c25_tit': { zh: '灵魂棱镜', en: 'SOUL PRISM' },
    'c26_tit': { zh: 'AI 去水印', en: 'AI WATERMARK REMOVER' },
    'c_blog_tit': { zh: '宁静生活随笔', en: 'Notes on a Quieter Life' },

    // 小卡片
    'c3_tit': { zh: '拓扑粘压', en: 'TOPOLOGY' },
    'c3_sub': { zh: '高弹物理碰撞模型', en: 'Elastic Physics Collision' },
    'c4_tit': { zh: '引力场堆栈', en: 'GRAVITY STACK' },
    'c4_sub': { zh: '全维度数据隔离存储终端，保障视觉不发生干涉。基于加密。', en: 'Full-dimensional isolation vault. No visual crossover.' },
    'c5_tit': { zh: '全息指纹', en: 'HOLO PRINT' },
    'c5_sub': { zh: '空间波动捕捉', en: 'Spatial Wave Capture' },
    'c6_tit': { zh: '流媒体协议', en: 'MEDIA PROTOCOL' },
    'c6_sub': { zh: '保证分离的三维卡片维持极快的信息推流同步。', en: 'Millisecond data feed sync across all floating layers.' },
    'c7_tit': { zh: '量子加密阵列', en: 'QUANTUM ARRAY' },
    'c7_sub': { zh: '反破译安全锁柜', en: 'Anti-decryption Vault' },
    'c8_tit': { zh: '音频脉冲合成', en: 'AUDIO PULSE' },
    'c8_sub': { zh: '声学震动放大器', en: 'Acoustic Amplifier' },
    'c9_tit': { zh: '模型重塑仪', en: '3D RESHAPER' },
    'c9_sub': { zh: '用于构建三维数字拓扑实体阵列。', en: 'Build digital topological polygon arrays.' },
    'c10_tit': { zh: '神经网络桥接', en: 'NEURAL BRIDGE' },
    'c10_sub': { zh: '链接远端跨宇宙集群节点', en: 'Link remote universe clusters.' },
    'c11_tit': { zh: '像素坍缩引擎', en: 'PIXEL COLLAPSE' },
    'c11_sub': { zh: '超密集位图压缩', en: 'Ultra-dense bitmap compression' },
    'c12_tit': { zh: '时光回溯归档', en: 'TIME ARCHIVE' },
    'c12_sub': { zh: '捕获系统运行期间的每一次时空残影，进行超高频的数据库容错比对。', en: 'Capture continuous temporal system echoes for fault-tolerant comparisons.' },
    'c13_tit': { zh: '零重力实验室', en: 'ZERO GRAVITY' },
    'c13_sub': { zh: '物理阻力减半区', en: 'Halved Physics Dampening' },
    'c14_tit': { zh: '微米级游标', en: 'MICRO RULER' },
    'c14_sub': { zh: '精准的排版度量尺', en: 'Precision Layout Calipers' },
    'c15_tit': { zh: '动态张量分析', en: 'TENSOR ANALYTICS' },
    'c15_sub': { zh: '数据可视化处理气泡。', en: 'Advanced data viz bubbles.' },
    'c16_tit': { zh: '几何光场追踪', en: 'RAY TRACKING' },
    'c16_sub': { zh: '全局光影折射', en: 'Global Light Refraction' },
    'c17_tit': { zh: '深网节点嗅探', en: 'NODE SNIFFER' },
    'c17_sub': { zh: '数据包声纳雷达', en: 'Data Packet Sonar' },
    'c20_tit': { zh: '无底动能引擎', en: 'KINETIC ENGINE' },
    'c20_sub': { zh: '持续输出过载张量数据', en: 'Sustained overload data.' },
    'c21_tit': { zh: '灾难级容灾舱', en: 'DISASTER POD' },
    'c21_sub': { zh: '在网络崩溃时提供亚秒级的数据切面备份。', en: 'Sub-second backups during network collapse parameters.' },
};

/* ==============================================================
 * 字符扰动动画（科幻风格文字切换）
 * ============================================================== */
let lang = 'zh';

const scrambleText = (node, newText) => {
    const chars = "▓▒░ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$";
    let frame = 0;
    const targetLen = newText.length;
    const h = setInterval(() => {
        let disp = '';
        let done = 0;
        for (let i = 0; i < targetLen; i++) {
            if (frame > i * 2) { disp += newText[i]; done++; }
            else if (newText[i] === ' ') { disp += ' '; done++; }
            else disp += chars[Math.floor(Math.random() * chars.length)];
        }
        node.innerText = disp;
        if (done === targetLen) clearInterval(h);
        frame++;
    }, 30);
};

/* ==============================================================
 * 语言切换核心
 * ============================================================== */
const changeLang = (immed) => {
    document.querySelectorAll('[data-i18n-key]').forEach(el => {
        const k = el.getAttribute('data-i18n-key');
        if (DICT[k]) {
            if (immed) el.innerText = DICT[k][lang];
            else scrambleText(el, DICT[k][lang]);
        }
    });
};

/* ==============================================================
 * 初始化语言切换按钮
 * ============================================================== */
function initI18n() {
    const langBtn = document.getElementById('lang-switch-btn');
    if (!langBtn) return;

    langBtn.addEventListener('click', () => {
        lang = lang === 'zh' ? 'en' : 'zh';
        langBtn.classList.toggle('is-en', lang === 'en');
        changeLang(false);
    });

    // 首次加载时立即填充文本
    changeLang(true);
}

// 执行初始化
document.addEventListener('DOMContentLoaded', initI18n);
