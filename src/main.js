// Text Animation Hero Section 
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!?';

function decryptText(el, delay = 0) {
  const original = el.textContent.trim();
  const duration = 60;
  const iterations = 8;

  setTimeout(() => {
    let frame = 0;
    const interval = setInterval(() => {
      el.textContent = original
        .split('')
        .map((char, i) => {
          if (char === ' ') return ' ';
          if (i < Math.floor((frame / (iterations * original.length)) * original.length)) {
            return char;
          }
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join('');

      frame++;
      if (frame >= iterations * original.length) {
        el.textContent = original;
        clearInterval(interval);
      }
    }, duration);
  }, delay);
}

// Hide the Navbar When Scrolling Down and Show it When Scrolling Up
let lastScrollTop = 0;
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', function () {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop) {
        gsap.to(navbar, { opacity: 0, duration: 0.3, ease: 'power2.out', pointerEvents: 'none' });
    } else {
        gsap.to(navbar, { opacity: 1, duration: 0.3, ease: 'power2.out', pointerEvents: 'auto' });
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

// 1. Initialize Lenis
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
});
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
gsap.registerPlugin(ScrollTrigger, TextPlugin);

// 2. Custom Cursor Logic
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');
let mouseX = 0, mouseY = 0;
let cursorX = 0, cursorY = 0;
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    gsap.to(cursorDot, { x: mouseX, y: mouseY, duration: 0 });
});
function animateCursor() {
    let dt = 0.2;
    cursorX += (mouseX - cursorX) * dt;
    cursorY += (mouseY - cursorY) * dt;
    cursorOutline.style.left = cursorX + "px";
    cursorOutline.style.top = cursorY + "px";
    requestAnimationFrame(animateCursor);
}
animateCursor();
const magneticBtns = document.querySelectorAll('.magnetic-btn');
magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.3 });
        gsap.to(cursorOutline, { scale: 1.5, opacity: 0.5, duration: 0.3 });
    });
    btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.3 });
        gsap.to(cursorOutline, { scale: 1, opacity: 1, duration: 0.3 });
    });
});

// 3. Loader Sequence & Initialization
window.addEventListener("load", () => {
    gsap.set("body", { autoAlpha: 1 });
    gsap.set(".hero-reveal", { y: 100, autoAlpha: 0 });
    gsap.set(".hero-img-container", { scale: 0.9, autoAlpha: 0, y: 40 });
    gsap.set(".hero-img", { autoAlpha: 0, y: 30 });
    gsap.set("#navbar", { autoAlpha: 0 });

    const tl = gsap.timeline({
        onComplete: () => {
            gsap.set("#loader", { display: "none" });
            gsap.set("#loader-curtain", { display: "none" });
            ScrollTrigger.refresh();

            // ✅ Run decrypt AFTER hero-reveal animations finish
            document.querySelectorAll('[data-decrypt]').forEach((el, i) => {
                decryptText(el, i * 300);
            });
        }
    });

    let count = { val: 0 };
    tl.to(count, {
        val: 100,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
            const el = document.getElementById('loader-percent');
            if (el) el.innerText = Math.floor(count.val) + "%";
        }
    })
    .to('#loader', { yPercent: -100, duration: 0.8, ease: "power4.inOut" })
    .to('#loader-curtain', { yPercent: -100, duration: 0.2, ease: "power4.inOut" }, "-=0.2")
    .to('#navbar', { autoAlpha: 1, duration: 0.5 })
    .to('.hero-reveal', {
        y: 0,
        autoAlpha: 1,
        scale: 1,
        stagger: 0.1,
        duration: 1,
        ease: "power3.out"
    }, "-=0.5")
    // ✅ Image fade in — slides up from slightly below with a scale
.to('.hero-img-container', {
    autoAlpha: 1,
    scale: 1,
    y: 0,
    duration: 1.4,
    ease: "power3.out"
}, "-=0.8")
.to('.hero-img', {
    autoAlpha: 1,
    y: 0,
    duration: 1.2,
    ease: "power3.out"
}, "-=1.0")
    .add(() => {
        gsap.to('#typewriter', {
            text: "Coding | UX UI | Graphic Design",
            duration: 3,
            ease: "none"
        });
    }, "-=0.5");
});

// Add this to your gsap.set block so the image starts offset
// gsap.set(".hero-img-container", { scale: 0.9, autoAlpha: 0, y: 40 }); ← update this line above

setTimeout(() => {
    if (document.querySelector('.loader-overlay').style.display !== 'none') {
        gsap.set("body", { autoAlpha: 1 });
        gsap.to('#loader', { yPercent: -100, duration: 0.5 });
        gsap.set(".hero-reveal", { y: 0, autoAlpha: 1 });
        gsap.set("#navbar", { autoAlpha: 1 });
    }
}, 5000);

// 4. Parallax Elements
gsap.utils.toArray('.parallax-element').forEach(el => {
    const speed = el.getAttribute('data-speed');
    gsap.to(el, {
        y: (i, target) => ScrollTrigger.maxScroll(window) * speed,
        scrollTrigger: {
            trigger: "body",
            start: "top top",
            end: "bottom bottom",
            scrub: 0
        }
    });
});

// 5. Marquee Animation
gsap.to(".marquee-track", {
    xPercent: -50,
    ease: "none",
    duration: 20,
    repeat: -1
});

// 6. Map Pin Drop
const mapTl = gsap.timeline({
    scrollTrigger: {
        trigger: "#map-container",
        start: "top 75%",
        end: "bottom top",
        toggleActions: "play reverse play reverse"
    }
});
mapTl.from("#map-container", { scale: 0.8, opacity: 0, duration: 0.8, ease: "back.out(1.7)" })
     .to("#map-pin", { y: 0, opacity: 1, duration: 0.5, ease: "bounce.out" }, "-=0.3");

// 7. General Reveal Animations
gsap.utils.toArray('[data-gsap="fade"]').forEach(el => {
    gsap.from(el, {
        scrollTrigger: {
            trigger: el,
            start: "top 90%",
            end: "bottom top",
            toggleActions: "play reverse play reverse"
        },
        opacity: 0, y: 20, duration: 0.8
    });
});
gsap.utils.toArray('[data-gsap="slide-up"]').forEach(el => {
    gsap.from(el, {
        scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: "bottom top",
            toggleActions: "play reverse play reverse"
        },
        y: 100, opacity: 0, duration: 1, ease: "power3.out"
    });
});

// 9. Horizontal Scroll
const worksSection   = document.querySelector("#works");
const worksContainer = document.querySelector("#works-container");
const worksWrapper   = document.querySelector("#works-wrapper");

let hScrollTrigger = null;
let hTween = null;

function initHorizontalScroll() {
    if (hScrollTrigger) { hScrollTrigger.kill(); hScrollTrigger = null; }
    if (hTween)         { hTween.kill();         hTween = null; }

    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        gsap.set(worksWrapper, { x: 0, clearProps: "x" });
        worksSection.style.height     = "auto";
        worksContainer.style.height   = "auto";
        worksContainer.style.position = "relative";
        worksContainer.style.overflow = "visible";
        return;
    }

    worksSection.style.height     = "";
    worksContainer.style.height   = "";
    worksContainer.style.position = "";
    worksContainer.style.overflow = "";

    requestAnimationFrame(() => {
        const scrollAmount = worksWrapper.scrollWidth - window.innerWidth;
        const getScrollAmount = () => -(worksWrapper.scrollWidth - window.innerWidth);
        worksSection.style.height = `${window.innerHeight + scrollAmount}px`;

        hTween = gsap.to(worksWrapper, { x: getScrollAmount, ease: "none" });
        hScrollTrigger = ScrollTrigger.create({
            trigger: worksContainer,
            start: "top top",
            end: () => `+=${worksWrapper.scrollWidth - window.innerWidth}`,
            pin: true,
            animation: hTween,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
        });
    });
}

window.addEventListener("load", () => { initHorizontalScroll(); });

let resizeTimer;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        initHorizontalScroll();
        ScrollTrigger.refresh();
    }, 300);
});

// 10. Timeline Line Drawing
gsap.to("#scroll-line", {
    height: "100%",
    ease: "none",
    scrollTrigger: {
        trigger: ".timeline-line",
        start: "top center",
        end: "bottom center",
        scrub: 0.5
    }
});

window.addEventListener("load", () => { ScrollTrigger.refresh(); });

gsap.utils.toArray('[data-gsap="service-item"]').forEach((item, i) => {
    gsap.from(item, {
        scrollTrigger: {
            trigger: item,
            start: "top 90%",
            end: "bottom top",
            toggleActions: "play reverse play reverse"
        },
        y: 50, opacity: 0, duration: 0.8, delay: i * 0.1
    });
});

// 10. Education Section
function animateEducationCounter(element, target, decimals = 0) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                let current = 0;
                const increment = target / 50;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        element.textContent = decimals ? target.toFixed(1) : target + '+';
                        clearInterval(timer);
                    } else {
                        element.textContent = decimals ? current.toFixed(1) : Math.floor(current) + '+';
                    }
                }, 30);
                observer.unobserve(element);
            }
        });
    }, { threshold: 0.5 });
    observer.observe(element);
}

document.addEventListener('DOMContentLoaded', () => {
    const degreeEl = document.getElementById('edu-degree');
    const gpaEl = document.getElementById('edu-gpa');
    if (degreeEl) animateEducationCounter(degreeEl, 3);
    if (gpaEl) animateEducationCounter(gpaEl, 3.6, 1);
});

gsap.from('.education-block', {
    scrollTrigger: { trigger: '.education-visual', start: 'top 80%' },
    opacity: 0, y: 50, duration: 0.6, stagger: 0.2, ease: 'power2.out'
});
gsap.from('.education-cap', {
    scrollTrigger: { trigger: '.education-visual', start: 'top 80%' },
    opacity: 0, y: -30, duration: 0.8, delay: 0.8, ease: 'bounce.out'
});
gsap.from('.connection-line', {
    scrollTrigger: { trigger: '.education-visual', start: 'top 80%' },
    scaleY: 0, transformOrigin: 'bottom', duration: 0.4, stagger: 0.2, delay: 0.3, ease: 'power2.out'
});
gsap.from('[data-gsap="float-1"]', {
    scrollTrigger: { trigger: '.education-visual', start: 'top 80%' },
    opacity: 0, x: -50, duration: 0.8, delay: 1, ease: 'back.out(1.7)'
});
gsap.from('[data-gsap="float-2"]', {
    scrollTrigger: { trigger: '.education-visual', start: 'top 80%' },
    opacity: 0, x: 50, duration: 0.8, delay: 1.2, ease: 'back.out(1.7)'
});
gsap.from('[data-gsap="float-3"]', {
    scrollTrigger: { trigger: '.education-visual', start: 'top 80%' },
    opacity: 0, y: 50, duration: 0.8, delay: 1.4, ease: 'back.out(1.7)'
});
gsap.to('[data-gsap="float-1"]', { y: -10, duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
gsap.to('[data-gsap="float-2"]', { y: -15, duration: 2.5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.5 });
gsap.to('[data-gsap="float-3"]', { y: -12, duration: 2.2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1 });

const timelineItems = document.querySelectorAll('.timeline-item');
const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => { entry.target.classList.add('visible'); }, index * 200);
        }
    });
}, { threshold: 0.2 });
timelineItems.forEach(item => { timelineObserver.observe(item); });

// Video Observer
const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) { video.play(); } else { video.pause(); }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.work-item video').forEach(video => {
    videoObserver.observe(video);
    video.addEventListener('ended', function() { this.currentTime = 0; this.play(); });
});

// Modal Logic
const projects = [
  {
    num: "01", title: "Besh Kape", badge: "WebApp", video: null, image: "/public/Beshkape.png",
    desc: "A full stack e-commerce solution with advanced filtering, cart management, and real-time inventory tracking.",
    stackLabel: "Tech Stack", tags: ["React", "Node.js", "MongoDB", "Tailwind"],
    details: [{ label: "Type", value: "E-Commerce" }, { label: "Year", value: "2024" }, { label: "Role", value: "Full Stack Dev" }, { label: "Status", value: "Live" }],
    link: "https://yourlink.com"
  },
  {
    num: "02", title: "Movie Website", badge: "WebApp", video: null, image: "/public/Kbox.png",
    desc: "Modern movie website design with responsive layout and dynamic content browsing experience.",
    stackLabel: "Design Tools", tags: ["Figma", "Adobe XD", "Framer"],
    details: [{ label: "Type", value: "UI Design" }, { label: "Year", value: "2024" }, { label: "Role", value: "UI/UX Designer" }, { label: "Status", value: "Design" }],
    link: "https://yourlink.com"
  },
  {
    num: "03", title: "ESPYREAL", badge: "APP", video: "/public/ESPYREAL.mp4", image: "/neon-identity-brand-logo.jpg",
    desc: "A multi-currency identifier mobile app using machine learning and computer vision to recognize banknotes in real time.",
    stackLabel: "Tools Used", tags: ["React Native", "TensorFlow.js", "Python"],
    details: [{ label: "Type", value: "Mobile App" }, { label: "Year", value: "2023" }, { label: "Role", value: "Developer" }, { label: "Status", value: "Beta" }],
    link: "https://yourlink.com"
  },
  {
    num: "04", title: "ShoeFlips", badge: "UI/UX", video: null, image: "/your-shoeflips-image.jpg",
    desc: "A shoe inventory system built to easily track shoe quantity and availability for resellers.",
    stackLabel: "Design Tools", tags: ["Laravel", "Spring Boot", "CSS"],
    details: [{ label: "Type", value: "Dashboard UI" }, { label: "Year", value: "2024" }, { label: "Role", value: "UI Designer" }, { label: "Status", value: "Design" }],
    link: "https://yourlink.com"
  },
  {
    num: "05", title: "Najmat Cleaning", badge: "WebApp", video: null, image: "/your-najmat-image.jpg",
    desc: "A minimalist service management dashboard for a cleaning business with booking, staff assignment, and job tracking.",
    stackLabel: "Design Tools", tags: ["React", "Node.js", "Tailwind"],
    details: [{ label: "Type", value: "Dashboard UI" }, { label: "Year", value: "2024" }, { label: "Role", value: "UI Designer" }, { label: "Status", value: "Design" }],
    link: "https://yourlink.com"
  },
];

const logoMap = {
  "React": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  "Node.js": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
  "MongoDB": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg",
  "Tailwind": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg",
  "Figma": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg",
  "Python": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
  "React Native": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  "TensorFlow.js": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg",
  "Adobe XD": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/xd/xd-original.svg",
  "Framer": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/framermotion/framermotion-original.svg",
  "Laravel": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg",
  "Spring Boot": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg",
  "CSS": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
};

function openModal(index) {
  const p = projects[index];
  const modal = document.getElementById("project-modal");
  const box = document.getElementById("modal-box");
  const modalImage = document.getElementById("modal-image");

  document.getElementById("modal-num").textContent = p.num;
  document.getElementById("modal-title").textContent = p.title;
  document.getElementById("modal-badge").textContent = p.badge;
  document.getElementById("modal-desc").textContent = p.desc;
  document.getElementById("modal-link").href = p.link;
  if (modalImage) modalImage.src = p.image;

  document.getElementById("detail-type").textContent = p.details[0].value;
  document.getElementById("detail-year").textContent = p.details[1].value;
  document.getElementById("detail-role").textContent = p.details[2].value;
  document.getElementById("detail-status").textContent = p.details[3].value;

  document.getElementById("modal-stack-label").innerHTML =
    `<span style="width:3px;height:3px;background:#000;border-radius:50%;"></span>${p.stackLabel}`;

  document.getElementById("modal-tags").innerHTML = p.tags.map(t => `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:10px;background:rgba(0,0,0,0.02);border:0.5px solid rgba(0,0,0,0.08);border-radius:8px;transition:all 0.2s;cursor:pointer;">
      ${logoMap[t]
        ? `<img src="${logoMap[t]}" alt="${t}" style="width:24px;height:24px;object-fit:contain;opacity:0.75;">`
        : `<span style="font-size:16px;">${t.split(' ')[0]}</span>`}
      <span style="font-size:10px;font-weight:500;color:#333333;text-align:center;line-height:1;">${t}</span>
    </div>`).join("");

  modal.style.opacity = "1";
  modal.style.pointerEvents = "auto";
  box.style.transform = "translateY(0)";
}

function closeModal() {
  const modal = document.getElementById("project-modal");
  const box = document.getElementById("modal-box");
  const modalImage = document.getElementById("modal-image");

  modal.style.opacity = "0";
  modal.style.pointerEvents = "none";
  box.style.transform = "translateY(20px)";
  if (modalImage) modalImage.src = "";
}

document.getElementById("modal-close-btn")?.addEventListener("click", closeModal);
document.getElementById("project-modal")?.addEventListener("click", function(e) {
  if (e.target.id === "project-modal") closeModal();
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
document.querySelectorAll(".work-item").forEach((card, index) => {
  card.addEventListener("click", () => openModal(index));
});


const certs = [
    {
      tag: 'TESDA',
      title: 'Programming (Java) NC III',
      issuer: 'TESDA · Joysis Tech Voc Inc.',
      date: 'Oct 11, 2023 · 296 hrs',
      desc: 'Full qualification covering object-oriented programming, Java application development, workplace communication, and critical thinking skills.',
      img: '/public/certificate/tesda.jpg'
    },
    {
      tag: 'Recognition',
      title: 'Parallel Speaker — Espyreal CNN Research',
      issuer: 'ICPEVE 2025 · Univ. of the Philippines',
      date: 'Nov 28–30, 2025',
      desc: 'Served as Parallel Speaker presenting Espyreal: A Mobile-Based Multi-Currency Identifier Using CNN at an international research conference.',
      img: '/public/certificate/espyreal.jpg'
    },
    {
      tag: 'IBM',
      title: 'Artificial Intelligence Fundamentals',
      issuer: 'IBM SkillsBuild',
      date: 'Apr 6, 2026',
      desc: 'Verified credential for completing AI Fundamentals requirements via IBM SkillsBuild, covering machine learning, neural networks, and AI ethics.',
      img: '/public/certificate/IBM.png'
    },
    {
      tag: 'Cisco',
      title: 'Introduction to Modern AI',
      issuer: 'Cisco NetAcad · DICT-ITU DTC',
      date: 'Apr 6, 2026',
      desc: 'Completed via Cisco Networking Academy through the DICT-ITU DTC Initiative, covering modern AI tools and practical applications.',
      img: '/public/certificate/modernai.jpg'
    },
    {
      tag: 'Cisco',
      title: 'Digital Safety & Security Awareness',
      issuer: 'Cisco NetAcad · DICT-ITU DTC',
      date: 'Apr 8, 2026',
      desc: 'Cybersecurity awareness and safe digital practices, covering threats, privacy, and responsible digital behavior.',
      img: '/public/certificate/awareness.jpg'
    },
    {
      tag: 'Cisco',
      title: 'Intro to IoT & Digital Transformation',
      issuer: 'Cisco NetAcad · DICT-ITU DTC',
      date: 'Apr 8, 2026',
      desc: 'Internet of Things fundamentals and digital transformation concepts, exploring connected devices and real-world applications.',
      img: '/public/certificate/transformation.jpg'
    },
    {
      tag: 'Webinar',
      title: 'AI & Machine Learning: Future of IT',
      issuer: 'West Visayas State Univ. · CICT',
      date: 'Oct 4, 2024',
      desc: 'Active participation in WVSU-CICT webinar exploring how AI and ML are reshaping the IT landscape and future careers.',
      img: '/public/certificate/webinar.png'
    },
    {
      tag: 'Webinar',
      title: 'Getting Informed Consent in Research',
      issuer: 'UP Cebu · KUAN Webinar Series',
      date: 'Aug 28, 2024',
      desc: 'Attended KUAN webinar on ethical research practices, focusing on obtaining and documenting informed consent.',
      img: '/public/certificate/informed.png'
    },
    {
      tag: 'Cisco',
      title: 'Apply AI: Analyze Customer Reviews',
      issuer: 'Cisco NetAcad · DICT-ITU DTC',
      date: 'Apr 6, 2026',
      desc: 'Used AI tools to process tabular customer data via large language models and spreadsheet apps for sentiment analysis.',
      img: '/public/certificate/apply.jpg'
    },
    {
      tag: 'Webinar',
      title: 'How to Prepare for Microsoft Certifications',
      issuer: 'Styava.dev',
      date: 'Sep 12, 2024',
      desc: "Participated in Styava's event on strategies and resources for preparing and passing Microsoft certification exams.",
      img: '/public/certificate/howto.jpg'
    },
  ];

  const featImg    = document.getElementById('feat-img');
  const featTag    = document.getElementById('feat-tag');
  const featTitle  = document.getElementById('feat-title');
  const featIssuer = document.getElementById('feat-issuer');
  const featDate   = document.getElementById('feat-date');
  const featDesc   = document.getElementById('feat-desc');
  const listEl     = document.getElementById('cert-list');

  function switchCert(i) {
    featImg.style.opacity = '0';
    setTimeout(() => {
      const c = certs[i];
      featImg.src            = c.img;
      featTag.textContent    = c.tag;
      featTitle.textContent  = c.title;
      featIssuer.textContent = c.issuer;
      featDate.textContent   = c.date;
      featDesc.textContent   = c.desc;
      featImg.style.opacity  = '1';
    }, 220);
    document.querySelectorAll('.cert-item').forEach((el, j) => {
      el.classList.toggle('active', j === i);
      el.querySelector('.item-title').style.color   = j === i ? '#fff'  : '';
      el.querySelector('.item-title').style.fontWeight = j === i ? '700' : '';
      el.querySelector('.item-bar').style.opacity   = j === i ? '1'    : '0';
    });
  }

  certs.forEach((c, i) => {
    const li = document.createElement('li');
    li.className = 'cert-item flex items-stretch border-b border-[#1a1a1a] cursor-pointer group' + (i === 0 ? ' border-t active' : '');
    li.innerHTML = `
      <div class="item-bar w-[2px] bg-white mr-4 flex-shrink-0 transition-opacity duration-200" style="opacity:${i===0?1:0}"></div>
      <div class="py-4 flex-1">
        <p class="text-[8px] font-bold tracking-[1.5px] uppercase text-[#444] mb-1">${c.tag}</p>
        <p class="item-title text-[12.5px] leading-snug transition-colors duration-200 group-hover:text-[#999]"
           style="color:${i===0?'#fff':'#555'};font-weight:${i===0?'700':'400'}">${c.title}</p>
        <p class="text-[10px] text-[#333] mt-1">${c.date}</p>
      </div>
    `;
    li.addEventListener('click', () => switchCert(i));
    listEl.appendChild(li);
  });


   