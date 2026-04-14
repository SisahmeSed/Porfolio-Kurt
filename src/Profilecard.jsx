// ProfileCard.jsx
import React, { useEffect, useRef, useCallback, useMemo } from 'react';

const ANIMATION_CONFIG = {
  INITIAL_DURATION: 1200,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
  DEVICE_BETA_OFFSET: 20,
  ENTER_TRANSITION_MS: 180
};

const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v, precision = 3) => parseFloat(v.toFixed(precision));
const adjust = (v, fMin, fMax, tMin, tMax) => round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

const ProfileCardComponent = ({
  avatarUrl = '/public/PICKO.png',
  name = 'KURT RUSSEL',
  title = 'Full Stack Developer',
  handle = 'kurtdev',
  status = 'Available for Work',
  contactText = 'Contact Me',
  showUserInfo = false,
  enableTilt = true,
  enableMobileTilt = false,
  mobileTiltSensitivity = 5,
  behindGlowColor = 'rgba(125, 190, 255, 0.67)',
  behindGlowSize = '50%',
  innerGradient = 'linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)',
  className = '',
  onContactClick
}) => {
  const wrapRef = useRef(null);
  const shellRef = useRef(null);
  const enterTimerRef = useRef(null);
  const leaveRafRef = useRef(null);

  const tiltEngine = useMemo(() => {
    if (!enableTilt) return null;

    let rafId = null;
    let running = false;
    let lastTs = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const DEFAULT_TAU = 0.14;
    const INITIAL_TAU = 0.6;
    let initialUntil = 0;

    const setVarsFromXY = (x, y) => {
      const shell = shellRef.current;
      const wrap = wrapRef.current;
      if (!shell || !wrap) return;

      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;

      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);

      const centerX = percentX - 50;
      const centerY = percentY - 50;

      const properties = {
        '--pointer-x': `${percentX}%`,
        '--pointer-y': `${percentY}%`,
        '--background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
        '--background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
        '--pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        '--pointer-from-top': `${percentY / 100}`,
        '--pointer-from-left': `${percentX / 100}`,
        '--rotate-x': `${round(-(centerX / 5))}deg`,
        '--rotate-y': `${round(centerY / 4)}deg`
      };

      for (const [k, v] of Object.entries(properties)) wrap.style.setProperty(k, v);
    };

    const step = ts => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
      const k = 1 - Math.exp(-dt / tau);

      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;

      setVarsFromXY(currentX, currentY);

      const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;

      if (stillFar || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTs = 0;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTs = 0;
      rafId = requestAnimationFrame(step);
    };

    return {
      setImmediate(x, y) {
        currentX = x;
        currentY = y;
        setVarsFromXY(currentX, currentY);
      },
      setTarget(x, y) {
        targetX = x;
        targetY = y;
        start();
      },
      toCenter() {
        const shell = shellRef.current;
        if (!shell) return;
        this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
      },
      beginInitial(durationMs) {
        initialUntil = performance.now() + durationMs;
        start();
      },
      getCurrent() {
        return { x: currentX, y: currentY, tx: targetX, ty: targetY };
      },
      cancel() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        running = false;
        lastTs = 0;
      }
    };
  }, [enableTilt]);

  const getOffsets = (evt, el) => {
    const rect = el.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  };

  const handlePointerMove = useCallback(
    event => {
      const shell = shellRef.current;
      if (!shell || !tiltEngine) return;
      const { x, y } = getOffsets(event, shell);
      tiltEngine.setTarget(x, y);
    },
    [tiltEngine]
  );

  const handlePointerEnter = useCallback(
    event => {
      const shell = shellRef.current;
      if (!shell || !tiltEngine) return;

      shell.classList.add('card-active');
      shell.classList.add('card-entering');
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = window.setTimeout(() => {
        shell.classList.remove('card-entering');
      }, ANIMATION_CONFIG.ENTER_TRANSITION_MS);

      const { x, y } = getOffsets(event, shell);
      tiltEngine.setTarget(x, y);
    },
    [tiltEngine]
  );

  const handlePointerLeave = useCallback(() => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;

    tiltEngine.toCenter();

    const checkSettle = () => {
      const { x, y, tx, ty } = tiltEngine.getCurrent();
      const settled = Math.hypot(tx - x, ty - y) < 0.6;
      if (settled) {
        shell.classList.remove('card-active');
        leaveRafRef.current = null;
      } else {
        leaveRafRef.current = requestAnimationFrame(checkSettle);
      }
    };
    if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
    leaveRafRef.current = requestAnimationFrame(checkSettle);
  }, [tiltEngine]);

  useEffect(() => {
    if (!enableTilt || !tiltEngine) return;

    const shell = shellRef.current;
    if (!shell) return;

    shell.addEventListener('pointerenter', handlePointerEnter);
    shell.addEventListener('pointermove', handlePointerMove);
    shell.addEventListener('pointerleave', handlePointerLeave);

    const initialX = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    tiltEngine.setImmediate(initialX, initialY);
    tiltEngine.toCenter();
    tiltEngine.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);

    return () => {
      shell.removeEventListener('pointerenter', handlePointerEnter);
      shell.removeEventListener('pointermove', handlePointerMove);
      shell.removeEventListener('pointerleave', handlePointerLeave);
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
      tiltEngine.cancel();
    };
  }, [enableTilt, tiltEngine, handlePointerMove, handlePointerEnter, handlePointerLeave]);

  const cardStyle = {
    '--behind-glow-color': behindGlowColor,
    '--behind-glow-size': behindGlowSize,
    '--inner-gradient': innerGradient,
    '--card-opacity': 0,
    '--rotate-x': '0deg',
    '--rotate-y': '0deg',
    '--pointer-x': '50%',
    '--pointer-y': '50%',
    '--pointer-from-center': 0,
    '--pointer-from-top': 0.5,
    '--pointer-from-left': 0.5,
  };

  return (
    <div 
      ref={wrapRef} 
      className={`profile-card-wrapper ${className}`.trim()} 
      style={cardStyle}
    >
      {/* Behind Glow */}
      <div 
        className="profile-card-glow absolute inset-0 pointer-events-none blur-[50px] opacity-0 transition-opacity duration-200"
        style={{
          background: `radial-gradient(circle at var(--pointer-x) var(--pointer-y), var(--behind-glow-color) 0%, transparent var(--behind-glow-size))`
        }}
      />
      
      {/* Card Shell */}
      <div ref={shellRef} className="profile-card-shell relative z-10 touch-none">
        <div 
          className="profile-card relative w-full h-[80vh] max-h-[540px] aspect-[0.718] rounded-[30px] overflow-hidden bg-black/90 transition-transform duration-1000 ease-out"
          style={{
            transform: 'translateZ(0) rotateX(0deg) rotateY(0deg)',
            backfaceVisibility: 'hidden',
            boxShadow: `rgba(0, 0, 0, 0.8) calc((var(--pointer-from-left) * 10px) - 3px) calc((var(--pointer-from-top) * 20px) - 6px) 20px -5px`
          }}
        >
          {/* Inner Background */}
          <div 
            className="absolute inset-0 rounded-[30px]"
            style={{ background: innerGradient }}
          />
          
          {/* Holographic Shine Effect */}
          <div 
            className="absolute inset-0 rounded-[30px] pointer-events-none mix-blend-color-dodge opacity-50 transition-all duration-800"
            style={{
              background: `
                repeating-linear-gradient(
                  0deg,
                  hsl(2, 100%, 73%) 5%,
                  hsl(53, 100%, 69%) 10%,
                  hsl(93, 100%, 69%) 15%,
                  hsl(176, 100%, 76%) 20%,
                  hsl(228, 100%, 74%) 25%,
                  hsl(283, 100%, 73%) 30%,
                  hsl(2, 100%, 73%) 35%
                ),
                repeating-linear-gradient(
                  -45deg,
                  #0e152e 0%,
                  hsl(180, 10%, 60%) 3.8%,
                  hsl(180, 29%, 66%) 4.5%,
                  hsl(180, 10%, 60%) 5.2%,
                  #0e152e 10%,
                  #0e152e 12%
                )
              `,
              backgroundSize: '500% 500%, 300% 300%',
              backgroundPosition: '0 var(--background-y), var(--background-x) var(--background-y)',
              filter: 'brightness(0.66) contrast(1.33) saturate(0.33)',
            }}
          />
          
          {/* Glare Effect */}
          <div 
            className="absolute inset-0 rounded-[30px] pointer-events-none mix-blend-overlay"
            style={{
              background: `radial-gradient(
                farthest-corner circle at var(--pointer-x) var(--pointer-y),
                hsl(248, 25%, 80%) 12%,
                hsla(207, 40%, 30%, 0.8) 90%
              )`,
              filter: 'brightness(0.8) contrast(1.2)',
            }}
          />
          
          {/* Avatar Content */}
          <div className="absolute inset-0 mix-blend-luminosity">
            <img
              className="absolute w-full bottom-0 left-1/2 grayscale hover:grayscale-0 transition-all duration-700"
              src={avatarUrl}
              alt={`${name} avatar`}
              loading="lazy"
              style={{
                transform: `
                  translateX(calc(-50% + (var(--pointer-from-left) - 0.5) * 6px))
                  translateZ(0)
                  scaleY(calc(1 + (var(--pointer-from-top) - 0.5) * 0.02))
                  scaleX(calc(1 + (var(--pointer-from-left) - 0.5) * 0.01))
                `,
                transformOrigin: '50% 100%',
                backfaceVisibility: 'hidden',
              }}
            />
            
            {/* User Info Overlay */}
            {showUserInfo && (
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between bg-white/10 backdrop-blur-[30px] border border-white/10 rounded-[20px] p-3 pointer-events-auto">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                    <img
                      src={avatarUrl}
                      alt={`${name} mini avatar`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="text-sm font-medium text-white/90 leading-none">@{handle}</div>
                    <div className="text-sm text-white/70 leading-none">{status}</div>
                  </div>
                </div>
                <button
                  className="border border-white/10 rounded-lg px-4 py-3 text-xs font-semibold text-white/90 hover:border-white/40 hover:-translate-y-0.5 transition-all duration-200 backdrop-blur-[10px]"
                  onClick={onContactClick}
                  type="button"
                >
                  {contactText}
                </button>
              </div>
            )}
          </div>
          
          {/* Text Content */}
          <div 
            className="absolute inset-0 text-center flex flex-col items-center pt-12 mix-blend-luminosity pointer-events-none"
            style={{
              transform: `translate3d(
                calc(var(--pointer-from-left) * -6px + 3px),
                calc(var(--pointer-from-top) * -6px + 3px),
                0.1px
              )`
            }}
          >
            <h3 
              className="text-5xl md:text-6xl font-bold bg-gradient-to-b from-white to-[#6f6fbe] bg-clip-text text-transparent"
              style={{ 
                backgroundSize: '1em 1.5em',
                WebkitTextFillColor: 'transparent',
                WebkitBackgroundClip: 'text'
              }}
            >
              {name}
            </h3>
            <p 
              className="text-base font-semibold bg-gradient-to-b from-white to-[#4a4ac0] bg-clip-text text-transparent -mt-3"
              style={{ 
                backgroundSize: '1em 1.5em',
                WebkitTextFillColor: 'transparent',
                WebkitBackgroundClip: 'text'
              }}
            >
              {title}
            </p>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .profile-card-wrapper {
          perspective: 500px;
          transform: translate3d(0, 0, 0.1px);
        }
        
        .profile-card-wrapper:hover .profile-card-glow,
        .profile-card-wrapper.card-active .profile-card-glow {
          opacity: 0.8;
        }
        
        .card-active .profile-card {
          transition: none;
          transform: translateZ(0) rotateX(var(--rotate-y)) rotateY(var(--rotate-x)) !important;
        }
        
        .card-entering .profile-card {
          transition: transform 180ms ease-out !important;
        }
        
        @media (max-width: 768px) {
          .profile-card {
            height: 70vh !important;
            max-height: 450px !important;
          }
        }
        
        @media (max-width: 480px) {
          .profile-card {
            height: 60vh !important;
            max-height: 380px !important;
          }
        }
      `}</style>
    </div>
  );
};

const ProfileCard = React.memo(ProfileCardComponent);
export default ProfileCard;