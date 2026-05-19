import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import { Landmark, ShieldCheck, Activity, ScrollText, KeyRound, Shield } from "lucide-react";
import { createTimeline, stagger } from "animejs";
import { PublicHeader } from "../App";

function shouldReduceMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useAuthAnimations() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".auth-page-modern");
    if (!root || shouldReduceMotion()) return;

    const intro = createTimeline({
      defaults: {
        duration: 680,
        ease: "out(3)",
      },
    });

    intro
      .add(root.querySelectorAll(".auth-brand-side"), {
        opacity: [0, 1],
        translateX: [-20, 0],
      })
      .add(
        root.querySelectorAll(
          ".auth-logo, .auth-brand-message h2, .auth-brand-message p, .feature-item",
        ),
        {
          opacity: [0, 1],
          translateY: [18, 0],
          delay: stagger(60),
        },
        "-=400",
      )
      .add(
        root.querySelectorAll(
          ".auth-header h1, .auth-header p, .input-group, .form-actions, .form-footer",
        ),
        {
          opacity: [0, 1],
          translateY: [18, 0],
          delay: stagger(58),
        },
        "-=500",
      );

    return () => {
      intro.revert();
    };
  }, []);
}

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  useAuthAnimations();

  return (
    <div className="auth-page-modern">
      <div className="auth-split">
        {/* Left Branding Side */}
        <div className="auth-brand-side">
          <div className="auth-brand-content">
            <Link to="/" className="auth-logo">
              <div className="logo-icon">
                <Landmark size={20} aria-hidden="true" color="white" />
              </div>
              <span style={{ color: 'white', fontSize: '1.4rem', fontWeight: 800 }}>SmartBank</span>
            </Link>
            
            <div className="auth-brand-message">
              <h2>Banking Cerdas untuk UMKM.</h2>
              <p>Platform finansial terintegrasi yang memberdayakan bisnis Anda dengan transaksi real-time, ledger transparan, dan akses instan ke ekosistem.</p>
            </div>

            <div className="auth-features">
              <div className="feature-item">
                <div className="f-icon"><ShieldCheck size={18} /></div>
                <div>
                  <strong>Aman & Terenkripsi</strong>
                  <span>Setiap transaksi dilindungi bank-grade security.</span>
                </div>
              </div>
              <div className="feature-item">
                <div className="f-icon"><Activity size={18} /></div>
                <div>
                  <strong>Real-time Analytics</strong>
                  <span>Pantau cashflow dan metrik secara instan.</span>
                </div>
              </div>
              <div className="feature-item">
                <div className="f-icon"><ScrollText size={18} /></div>
                <div>
                  <strong>Immutable Ledger</strong>
                  <span>Audit trail untuk setiap perubahan saldo.</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="auth-brand-bg">
            <div className="bg-circle c1"></div>
            <div className="bg-circle c2"></div>
            <div className="bg-glass-layer"></div>
          </div>
        </div>

        {/* Right Form Side */}
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="auth-header">
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            
            <div className="auth-form-content">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
